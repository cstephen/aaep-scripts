var aceLoopback = require('./ace_loopback.js');
var aceDrupal = require('./ace_drupal.js');

var loopbackAgent = new aceLoopback('http://137.229.94.246:3000/api');
var drupalAgent = new aceDrupal('http://localhost/api');

var loopbackInitPromise = loopbackAgent.initialize('/MobileUsers/login', {
  'username': 'testuser',
  'password': 'password'
});

var drupalInitPromise = drupalAgent.initialize({
  'username': 'ACE Import User',
  'password': 'password'
});

weatherHighlight = {
	'loopbackPath': '/WeatherReports/with-positions',
	'drupalType': 'ace_weather_report',
	'drupalTitle': 'ACE Weather Report',
	'drupalViewPath': '/views/ace_weather_reports',
	'drupalTemplate': './templates/drupal/ace_weather_reports.json'
}

Promise.all([loopbackInitPromise, drupalInitPromise]).then(function() {
  return loopbackAgent.get(weatherHighlight.loopbackPath);
}).then(function(results) {
  return drupalAgent.add(weatherHighlight, results);
});