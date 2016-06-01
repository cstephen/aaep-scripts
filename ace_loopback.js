var rest = require('restler-q');
var loopbackApi = 'http://localhost:3000/api';

module.exports = function aceLoopback() {
  var token;

  function initialize() {
    return new Promise(function(resolve, reject) {
      var url = loopbackApi + '/MobileUsers/login';
      var options = {
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          'username': 'testuser',
          'password': 'password'
        }
      }
      rest.post(url, options).then(function(response) {
        token = response.id;
        resolve();
      }).fail(function(err) {
        reject(err);
      });
    });
  }

  function get() {
    return new Promise(function(resolve, reject) {
      var url = loopbackApi + '/WeatherReports?access_token=' + token;
      rest.get(url).then(function(response) {
        var results = [];
        for(var i = 0; i < response.length; i++) {
          results.push({
            'title': 'ACE Weather Reports',
            'body': response[i].notes,
            'cloud_cover': response[i].cloudCover,
            'precipitation': response[i].precipitation,
            'visibility': response[i].visibility,
            'pressure_tendency': response[i].pressureTendency,
            'pressure_value': response[i].pressureValue,
            'temperature_value': response[i].temperatureValue,
            'temperature_units': response[i].temperatureUnits,
            'wind_value': response[i].windValue,
            'wind_units': response[i].windUnits,
            'wind_direction': response[i].windDirection,
            'phenomenon': response[i].other
          });
        }
        resolve(results);
      }).fail(function(err) {
        reject(err);
      });
    });
  }

  return {
    initialize: initialize,
    get: get
  }
}