var aceDrupal = require('./ace_drupal.js');

var drupalAgent = new aceDrupal('http://localhost:9090/api');

var drupalInitPromise = drupalAgent.initialize({
  'username': 'ACE Import User',
  'password': 'password'
});

drupalInitPromise.then(function() {
  drupalAgent.remove('/views/ace_weather_reports');
});