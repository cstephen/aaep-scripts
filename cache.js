var turf = require('turf');
var wellknown = require('wellknown');
var pgp = require('pg-promise')();
var async = require('async');
var fs = require('fs');
var underscore = require('underscore');
var aceDrupal = require('./ace_drupal.js');

var drupalBaseUrl = 'http://localhost:9090';
var drupalAgent = new aceDrupal('http://localhost/api');

var pgConnection = {
  host: 'localhost',
  port: 5432,
  database: 'cache',
  user: 'postgres'
};

var items = [];

var drupalInitPromise = drupalAgent.initialize({
  'username': 'ACE Import User',
  'password': 'password'
});

var sharePromise = drupalInitPromise
  .then(function () {
    return drupalAgent.get('/views/map_data_export.json');
  })
  .then(function (results) {
    return new Promise(function (resolve, reject) {
      async.each(results, function (result, callback) {
        var geoJson = JSON.parse(result.geofield);
        var geometryWkt = wellknown.stringify(geoJson);

        var point;
        if(geoJson.type === 'Point') {
          point = geoJson;
        } else {
          point = turf.pointOnSurface(geoJson).geometry;
        }

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

var aceWeatherPromise = drupalInitPromise
  .then(function () {
    return drupalAgent.get('/views/export_ace_weather_reports.json');
  })
  .then(function (results) {
    return new Promise(function (resolve, reject) {
      async.each(results, function (result, callback) {
        var content = fs.readFileSync('./templates/map_description/ace_weather_reports.tpl', 'utf8');
        var template = underscore.template(content);
        var description = template(result);

        var pointWkt = wellknown.stringify(turf.point([result.longitude, result.latitude]));

        items.push({
          id: result.nid,
          title: result.node_title,
          snippet: description,
          link: drupalBaseUrl + result.link,
          url: drupalBaseUrl + result.link,
          lat: result.latitude,
          lng: result.longitude,
          geometry: pointWkt,
          geometry_type: 'ST_Point',
          ordinal: 0,
          theme: null,
          image: null
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

var insertPromise = Promise.all([sharePromise, aceWeatherPromise])
  .then(function (results) {
    return db.tx(function (t) {
      return this.sequence(createTable);
    });
  })
  .then(function () {
    return new Promise(function (resolve, reject) {
      async.eachSeries(items, function (item, callback) {
        var query = 'INSERT INTO aaep_cache_new VALUES (' +
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
                    ')';
        db.none(query, item)
        .then(function () {
          callback();
        })
        .catch(function (err) {
          reject(err);
        });
      }, function (err) {
        if(err) {
          reject(err.message);
        }
        resolve();
      });
    });
  });

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