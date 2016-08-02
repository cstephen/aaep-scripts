var turf = require('turf');
var wellknown = require('wellknown');
var pgp = require('pg-promise')();
var async = require('async');
var drupal = require('./agents/drupal.js');

var drupalBaseUrl = 'http://arcticadaptationexchange.com';
var drupalApiUrl = drupalBaseUrl + '/api';
var drupalAgent = new drupal(drupalApiUrl);

var pgConnection = {
  host: 'localhost',
  port: 5432,
  database: 'cache',
  user: 'postgres'
};

var items = [];

var drupalInitPromise = drupalAgent.initialize({
  'username': 'AAEP Script User',
  'password': ''
});

// Get items of the Share content type from Drupal and format the
// fields as needed for the map system's cache database.
var sharePromise = drupalInitPromise
  .then(function () {
    return drupalAgent.get('/views/map_data_export.json');
  })
  .then(function (results) {
    return new Promise(function (resolve, reject) {
      async.each(results, function (result, callback) {
        var geoJson = JSON.parse(result.geofield);

        // The map system requires geometry in WKT format.
        var geometryWkt = wellknown.stringify(geoJson);

        // A point is needed for the marker, whether the geometry is
        // a point already, a line, or a polygon.
        var point;
        if(geoJson.type === 'Point') {
          point = geoJson;
        } else {
          point = turf.pointOnSurface(geoJson).geometry;
        }

        // The map system requires a separate database row for each theme.
        var themeArray = result.theme.split(':');
        themeArray.forEach(function (theme, index) {
          items.push({
            id: result.nid,
            title: result.node_title,
            snippet: result.description,
            link: drupalBaseUrl + result.link,
            url: result.url,
            lat: point.coordinates[1],
            lng: point.coordinates[0],
            geometry: geometryWkt,
            geometry_type: 'ST_' + geoJson.type,
            ordinal: index,
            theme: theme,
            image: drupalBaseUrl + result.image
          });
        });
        callback();
      }, function (err) {
        if(err) {
          console.log(err.message);
          reject(err.message);
        }
        resolve();
      });
    });
  });

var db = pgp(pgConnection);

// Data is imported into a new database table, then the new table is swapped
// into production when the data is finished loading. This prevents small
// downtime blips every time the cache script runs. This function creates the
// new table as a PostgreSQL transaction sequence.
function createTable(index) {
  switch (index) {
    case 0:
      return this.query('DROP TABLE IF EXISTS aaep_cache_new');
    case 1:
      return this.query('DROP INDEX IF EXISTS theme_idx_new');
    case 2:
      return this.query('CREATE TABLE aaep_cache_new (' +
                        '  id integer,' +
                        '  title character varying(255),' +
                        '  snippet text,' +
                        '  link character varying(2048),' +
                        '  url character varying(2048),' +
                        '  lat double precision,' +
                        '  lng double precision,'+
                        '  geometry_type text,' +
                        '  geometry text,' +
                        '  ordinal bigint,' +
                        '  theme character varying(255),' +
                        '  image character varying(2048)' +
                        ')');
    case 3:
      return this.query('CREATE INDEX theme_idx_new ON aaep_cache_new (theme)');
    case 4:
      return this.query('GRANT SELECT ON aaep_cache_new TO scott');
  }
}

// This PostgreSQL transaction sequence swaps the new table into production.
// It is called only after all of the rows have been imported and verified
// to exist in the new table.
function swapTable(index) {
  switch (index) {
    case 0:
      return this.query('DROP TABLE IF EXISTS aaep_cache');
    case 1:
      return this.query('ALTER TABLE aaep_cache_new RENAME TO aaep_cache');
    case 2:
      return this.query('ALTER INDEX theme_idx_new RENAME TO theme_idx');
  }
}

// Once the Share items have been downloaded and processed, insert each
// row into the new database table.
var insertPromise = sharePromise
  .then(function (results) {
    return db.tx(function (t) {
      return this.sequence(createTable);
    });
  })
  .then(function () {
    return db.tx(function (t) {
      var queries = items.map(function (item) {
        return t.none('INSERT INTO aaep_cache_new VALUES (' +
                    '  ${id},' +
                    '  ${title},' +
                    '  ${snippet},' +
                    '  ${link},' +
                    '  ${url},' +
                    '  ${lat},' +
                    '  ${lng},' +
                    '  ${geometry_type},' +
                    '  ${geometry},' +
                    '  ${ordinal},' +
                    '  ${theme},' +
                    '  ${image}' +
                    ')', item);
      });
      return t.batch(queries);
    });
  })
  .catch(function (err) {
    console.log(err);
  });

// Check that the number of rows in the new database table agrees
// with the number of rows we attempted to insert. If and only if
// the numbers agree, swap the new database table into production.
insertPromise
  .then(function () {
    return db.one('SELECT COUNT(*) FROM aaep_cache_new');
  })
  .then(function (result) {
    if(result.count != items.length) {
      throw new Error(items.length + ' expected in database, but found only ' + result.count);
    }
    return db.tx(function (t) {
      return this.sequence(swapTable);
    });
  })
  .then(function () {
    pgp.end();
  })
  .catch(function (err) {
    console.log(err);
  });
