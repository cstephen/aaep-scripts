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
	'title': 'ACE Weather Reports',
	'loopbackPath': '/WeatherReports',
	'drupalViewPath': '/views/ace_weather_reports',
	'drupalTemplate': './ace_weather_reports.json',

	// Keys on the left are fields in the Drupal content type. Values on the
	// right are their corresponding fields from the LoopBack model.
	fieldMap: {
		'body': 'notes',
		'cloud_cover': 'cloudCover',
		'precipitation': 'precipitation',
		'visibility': 'visibility',
		'pressure_tendency': 'pressureTendency',
		'pressure_value': 'pressureValue',
		'temperature_value': 'temperatureValue',
		'temperature_units': 'temperatureUnits',
		'wind_value': 'windValue',
		'wind_units': 'windUnits',
		'wind_direction': 'windDirection',
		'phenomenon': 'other'
	}
}

Promise.all([loopbackInitPromise, drupalInitPromise]).then(function() {
  return loopbackAgent.get(weatherHighlight);
}).then(function(results) {
  return drupalAgent.add(weatherHighlight, results);
});