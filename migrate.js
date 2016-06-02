var aceLoopback = require('./ace_loopback.js');
var aceDrupal = require('./ace_drupal.js');

var loopbackAgent = new aceLoopback('http://localhost:3000/api');
var drupalAgent = new aceDrupal('http://localhost:9090/api');

var loopbackInitPromise = loopbackAgent.initialize('/MobileUsers/login', {
  'username': 'testuser',
  'password': 'password'
});

var drupalInitPromise = drupalAgent.initialize({
  'username': 'ACE Import User',
  'password': 'password'
});

weatherHighlight = {
	'loopbackPath': '/WeatherReports',
	'drupalType': 'ace_weather_report',
	'drupalTitle': 'ACE Weather Reports',
	'drupalViewPath': '/views/ace_weather_reports',
	'drupalTemplate': './ace_weather_reports.json'
}

Promise.all([loopbackInitPromise, drupalInitPromise]).then(function() {
  return loopbackAgent.get(weatherHighlight);
}).then(function(results) {
  return drupalAgent.add(weatherHighlight, results);
});