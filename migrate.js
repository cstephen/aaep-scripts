var aceLoopback = require('./ace_loopback.js');
var aceDrupal = require('./ace_drupal.js');

var loopbackAgent = new aceLoopback();
var drupalAgent = new aceDrupal();

var loopbackInitPromise = loopbackAgent.initialize();
var drupalInitPromise = drupalAgent.initialize();

Promise.all([loopbackInitPromise, drupalInitPromise]).then(function() {
  return loopbackAgent.get();
}).then(function(results) {
  return drupalAgent.add(results);
});