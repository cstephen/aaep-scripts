var drupal = require('./agents/drupal.js');

var drupalAgent = new drupal('http://arcticadaptationexchange.com/api');

var drupalInitPromise = drupalAgent.initialize({
  'username': 'AAEP Script User',
  'password': ''
});

drupalInitPromise
  .then(function () {
    drupalAgent.remove('/views/loopback_ace_weather_reports');
  });
