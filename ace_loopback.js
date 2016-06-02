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
      var title = metadata.title;
      var loopbackPath = metadata.loopbackPath;
      var fieldMap = metadata.fieldMap;
      var url = baseUrl + loopbackPath + '?access_token=' + token;

      rest.get(url).then(function(response) {
        var results = [];
        for(var i = 0; i < response.length; i++) {
          // Initialize this result with the title provided in the metadata.
          var result = {
            title: title
          };

          // Store each LoopBack field as its corresponding Drupal name.
          for(field in fieldMap) {
            result[field] = response[i][fieldMap[field]];
          }

          results.push(result);
        }
        resolve(results);
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