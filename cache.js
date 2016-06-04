var turf = require('turf');
var wellknown = require('wellknown');
var pgp = require('pg-promise')();
var async = require('async');
var aceDrupal = require('./ace_drupal.js');

var drupalBaseUrl = 'http://localhost:9090';
var drupalAgent = new aceDrupal('http://localhost/api');

var db;
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
}).then(function() {
  return drupalAgent.get('/views/map_data_export.json');
}).then(function(results) {
  return new Promise(function(resolve, reject) {
    async.each(results, function(result, callback) {
      var geoJson = JSON.parse(result.geofield);
      var point;

      if(geoJson['type'] === 'Point') {
        point = geoJson;
      } else {
        point = turf.pointOnSurface(geoJson).geometry;
      }

      geometryWkt = wellknown.stringify(geoJson);
      var themeArray = result.theme.split(':');
      for(var i = 0; i < themeArray.length; i++) {
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
          ordinal: i,
          theme: themeArray[i],
          image: drupalBaseUrl + result.image
        })
      }
      callback();
    }, function(err) {
      if(err) {
        console.log(err.message);
        reject(err.message);
      }
      resolve();
    });
  });
})
.then(function() {
  db = pgp(pgConnection);
  return db.none('BEGIN')
})
.then(function() {
  return db.none('DROP TABLE IF EXISTS aaep_cache_new');
})
.then(function() {
  return db.none('DROP INDEX IF EXISTS theme_idx_new');
})
.then(function() {
  return db.none('CREATE TABLE aaep_cache_new (' +
    'id integer,' +
    'title character varying(255),' +
    'snippet text,' +
    'link character varying(2048),' +
    'url character varying(2048),' +
    'lat double precision,' +
    'lng double precision,'+
    'geometry_type text,' +
    'geometry text,' +
    'ordinal bigint,' +
    'theme character varying(255),' +
    'image character varying(2048)' +
  ')');
})
.then(function() {
  return db.none('CREATE INDEX theme_idx_new ON aaep_cache_new (theme)');
})
.then(function() {
  return db.none('COMMIT');
})
.then(function() {
  return db.none('BEGIN');
})
.then(function() {
  return new Promise(function(resolve, reject) {
    async.eachSeries(items, function(item, callback) {
      var query = 'INSERT INTO aaep_cache_new VALUES (' +
                    '${id},' +
                    '${title},' +
                    '${snippet},' +
                    '${link},' +
                    '${url},' +
                    '${lat},' +
                    '${lng},' +
                    '${geometry_type},' +
                    '${geometry},' +
                    '${ordinal},' +
                    '${theme},' +
                    '${image}' +
                  ')';
      db.none(query, item).then(function() {
        callback();
      }).catch(function(error) {
        callback(error);
        reject(error);
      });
    }, function(err) {
      if(err) {
        reject(err.message);
      }
      resolve();
    });
  });
})
.then(function() {
  return db.none('GRANT SELECT ON aaep_cache_new TO scott');
})
.then(function() {
  return db.none('COMMIT');
})
.then(function() {
  return db.none('BEGIN');
})
.then(function() {
  return db.one('SELECT COUNT(*) FROM aaep_cache_new');
})
.then(function(result) {
  if(result.count != items.length) {
    throw new Error(items.length + ' expected in database, but found only ' + result.count);
  }
  return db.none('DROP TABLE aaep_cache');
})
.then(function() {
  return db.none('ALTER TABLE aaep_cache_new RENAME TO aaep_cache');
})
.then(function() {
  return db.none('ALTER INDEX theme_idx_new RENAME TO theme_idx');
})
.then(function() {
  db.none('COMMIT');
})
.catch(function(error) {
  console.log(error);
});
