var loopback = require('./agents/loopback.js');
var drupal = require('./agents/drupal.js');

var loopbackAgent = new loopback('http://137.229.94.246:3000/api');
var drupalAgent = new drupal('http://localhost/api');

var loopbackInitPromise = loopbackAgent.initialize('/MobileUsers/login', {
  'username': 'testuser',
  'password': 'password'
});

var drupalInitPromise = drupalAgent.initialize({
  'username': 'AAEP Script User',
  'password': 'password'
});

var weatherHighlight = {
  'loopbackPath': '/WeatherReports/aaep',
  'drupalType': 'ace_weather_report',
  'drupalTitle': 'ACE Weather Report',
  'drupalViewPath': '/views/ace_weather_reports',
  'drupalTemplate': './templates/drupal/ace_weather_reports.json'
};

Promise.all([loopbackInitPromise, drupalInitPromise])
  .then(function () {
    return loopbackAgent.get(weatherHighlight.loopbackPath);
  })
  .then(function (results) {
    return drupalAgent.add(weatherHighlight, results);
  });
