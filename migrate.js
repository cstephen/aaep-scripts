var aceLoopback = require('./ace_loopback.js');
var aceDrupal = require('./ace_drupal.js');

var loopbackInitPromise = aceLoopback.initialize();
var drupalInitPromise = aceDrupal.initialize();

Promise.all([loopbackInitPromise, drupalInitPromise]).then(function() {
  return aceLoopback.get();
}).then(function(results) {
  return aceDrupal.add(results);
});