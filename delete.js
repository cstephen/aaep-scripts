var drupal = require('./agents/drupal.js');

var drupalAgent = new drupal('http://localhost/api');

var drupalInitPromise = drupalAgent.initialize({
  'username': 'AAEP Script User',
  'password': 'password'
});

drupalInitPromise
  .then(function () {
    drupalAgent.remove('/views/ace_weather_reports');
  });
