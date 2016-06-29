var rest = require('restler-q');

module.exports = function drupal(url) {
  // The base Drupal REST server URL.
  var baseUrl = url;

  // The CSRF token.
  var token;

  // The authentication cookie.
  var cookie;

  // Most requests use the same set of authentication headers.
  // Store them so we don't have to recreate them every time.
  var authHeaders;

  // Accepts username/password.
  function initialize(credentials) {
    // Return promise so calling script knows when agent is authenticated.
    return new Promise(function (resolve, reject) {
      var url = baseUrl + '/user/token.json';
      var options = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // Get CSRF token, then get authentication cookie, then build the
      // authentication headers we will use for all subsequent requests.
      rest.postJson(url, options)
        .then(function (response) {
          return response;
        })
        .then(function (response) {
          var token = response;
          url = baseUrl + '/user/login.json';
          options = {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': token
            },
            'username': credentials.username,
            'password': credentials.password
          };
          return rest.postJson(url, options);
        })
        .then(function (response) {
          token = response.token;
          cookie = response.session_name + '=' + response.sessid;
          authHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
            'Cookie': cookie
          };
          resolve();
        })
        .fail(function (err) {
          console.log(err);
          reject(err);
        });
    });
  }

  // Get the results from a Drupal view. Typically an array of NIDs.
  function get(viewPath) {
    var url = baseUrl + viewPath;
    var options = {
      headers: authHeaders
    };
    return rest.get(url, options)
      .fail(function (err) {
        console.log(err);
      });
  }

  // Export these functions.
  return {
    initialize: initialize,
    get: get
  };
};