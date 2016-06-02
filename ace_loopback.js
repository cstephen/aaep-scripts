var rest = require('restler-q');

module.exports = function aceLoopback(baseUrl) {
  var baseUrl = baseUrl;
  var token;

  function initialize(loginPath, credentials) {
    return new Promise(function(resolve, reject) {
      var url = baseUrl + loginPath;
      var options = {
        headers: {
          'Content-Type': 'application/json'
        },
        data: credentials
      }

      rest.post(url, options).then(function(response) {
        token = response.id;
        resolve();
      }).fail(function(err) {
        reject(err);
      });
    });
  }

  function get(metadata) {
    return new Promise(function(resolve, reject) {
      var loopbackPath = metadata.loopbackPath;
      var url = baseUrl + loopbackPath + '?access_token=' + token;
      rest.get(url).then(function(response) {
        resolve(response);
      }).fail(function(err) {
        reject(err);
      });
    });
  }

  return {
    initialize: initialize,
    get: get
  }
}