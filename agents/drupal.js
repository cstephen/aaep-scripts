var rest = require('restler-q');
var async = require('async');
var underscore = require('underscore');
var fs = require('fs');
var moment = require('moment');

module.exports = function aceDrupal(url) {
  // The base Drupal REST server URL.
  var baseUrl = url;

  // The CSRF token.
  var token;

  // The authentication cookie.
  var cookie;

  // Most requests use the same set of authentication headers.
  // Store them so we don't have to recreate them every time.
  var authHeaders;

  // Add an item to Drupal using the provided typeInfo object and item values.
  function addItem(typeInfo, item) {
    console.log('Adding: ' + item.id);

    // Read the template file specified in typeInfo object.
    var content = fs.readFileSync(typeInfo.drupalTemplate, 'utf8');

    // Create a proper template object from template file content.
    var template = underscore.template(content);

    // Attach the Drupal content type to item values.
    item.type = typeInfo.drupalType;

    // Format and append timestamp received from LoopBack to Drupal content title.
    var date = moment(item.Position.timestamp).format('MMMM D YYYY, h:mm:ss A');
    item.title = typeInfo.drupalTitle + ': ' + date + ' UTC';

    // Insert item values into template, then convert template into JSON object.
    content = template(item);
    content = JSON.parse(content);

    var url = baseUrl + '/node.json';
    var options = {
      headers: authHeaders
    };

    // Post new item to Drupal REST server and return promise.
    return rest.postJson(url, content, options);
  }

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

  // Remove all of the node IDs returned by a custom Drupal view..
  function remove(viewPath) {
    var url = baseUrl + viewPath;
    var options = {
      headers: authHeaders
    };
    rest.get(url, options)
      .then(function (response) {

        // Limit the number of concurrent operations so we do not
        // overwhelm Drupal.
        async.eachLimit(response, 5, function (result, callback) {
          console.log('Deleting: ' + result.lid);
          url = baseUrl + '/node/' + result.nid;
          rest.del(url, options)
            .then(function (response) {
              callback();
            })
            .fail(function (err) {
              console.log(err);
            });
        });
      })
      .fail(function (err) {
        console.log(err);
      });
  }

  // Add an array of items, as they were provided by LoopBack.
  function add(typeInfo, results) {
    var newItems = underscore.pluck(results, 'id');

    // Get the existing items from a custom Drupal view, then compare
    // the "id" field from the LoopBack results with the "lid" field of
    // the Drupal results. Only the LoopBack items that do not already
    // have a corresponding Drupal item are new and need to be added.
    get(typeInfo.drupalViewPath)
      .then(function (items) {
        var existingItems = underscore.pluck(items, 'lid');
        return underscore.difference(newItems, existingItems);
      })
      .then(function (validItems) {
        // Limit the number of concurrent operations so we do not
        // overwhelm Drupal.
        async.eachLimit(results, 5, function (result, callback) {
          if(underscore.indexOf(validItems, result.id) !== -1) {
            addItem(typeInfo, result)
              .then(function () {
                callback();
              })
              .fail(function (err) {
                console.log(err);
              });
          } else {
            callback();
          }
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
    remove: remove,
    add: add,
    get: get
  };
};