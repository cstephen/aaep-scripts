var aceDrupal = require('./agents/drupal.js');

var drupalAgent = new aceDrupal('http://localhost/api');

var drupalInitPromise = drupalAgent.initialize({
  'username': 'AAEP Script User',
  'password': 'password'
});

drupalInitPromise
  .then(function () {
    drupalAgent.remove('/views/ace_weather_reports');
  });
