var rest = require('restler-q');
var async = require('async');

module.exports = function aceDrupal(baseUrl) {
  var baseUrl = baseUrl;
  var token;
  var cookie;

  function initialize(credentials) {
    return new Promise(function(resolve, reject) {
      var url = baseUrl + '/user/token.json';
      var options = {
        headers: {
          'Content-Type': 'application/json'
        }
      }

      rest.postJson(url, options).then(function(response) {
        return response
      }).then(function(response) {
        var token = response;
        url = baseUrl + '/user/login.json';
        options = {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token
          },
          'username': credentials.username,
          'password': credentials.password
        }

        return rest.postJson(url, options);
      }).then(function(response) {
        token = response.token;
        cookie = response.session_name + '=' + response.sessid;
        resolve();
      }).fail(function(err) {
        console.log(err);
        reject(err);
      });
    });
  }

  function remove(viewPath) {
    var url = baseUrl + viewPath;
    var options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'Cookie': cookie
      }
    }
    rest.get(url, options).then(function(response) {
      async.eachLimit(response, 3, function(result, callback) {
        console.log('Deleting: ' + result.nid);
        url = baseUrl + '/node/' + result.nid;
        rest.del(url, options).then(function(response) {
          callback();
        });
      });
    }).fail(function(err) {
      console.log(err);
    });
  }

  function add(metadata, results) {
    drupalTemplate = metadata.drupalTemplate;
    var fs = require('fs');
    var underscore = require('underscore');
    var content = fs.readFileSync(drupalTemplate, 'utf8');
    var template = underscore.template(content);
    for(var i = 0; i < results.length; i++) {
      results[i].type = metadata.drupalType;
      results[i].title = metadata.drupalTitle;
      content = template(results[i]);
      content = JSON.parse(content);
      var url = baseUrl + '/node.json';
      var options = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
          'Cookie': cookie
        }
      }
      rest.postJson(url, content, options);
    }
  }

  return {
    initialize: initialize,
    remove: remove,
    add: add
  }
}