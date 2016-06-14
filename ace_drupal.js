var rest = require('restler-q');
var async = require('async');
var underscore = require('underscore');
var fs = require('fs');
var moment = require('moment');

module.exports = function aceDrupal(url) {
  var baseUrl = url;
  var token;
  var cookie;
  var authHeaders;

  function getExistingItems(viewPath) {
    var viewUrl = baseUrl + viewPath; 
    var options = {
      headers: authHeaders
    };
    return rest.get(viewUrl, options);
  }

  function addItem(metadata, item) {
    var content = fs.readFileSync(metadata.drupalTemplate, 'utf8');
    var template = underscore.template(content);
    console.log('Adding: ' + item.id);
    item.type = metadata.drupalType;

    var date = moment(item.Position.timestamp).format('MMMM D YYYY, h:mm:ss A');
    item.title = metadata.drupalTitle + ': ' + date + ' UTC';

    content = template(item);
    content = JSON.parse(content);
    var url = baseUrl + '/node.json';
    var options = {
      headers: authHeaders
    };

    return rest.postJson(url, content, options);
  }

  function initialize(credentials) {
    return new Promise(function (resolve, reject) {
      var url = baseUrl + '/user/token.json';
      var options = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
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

  function remove(viewPath) {
    var url = baseUrl + viewPath;
    var options = {
      headers: authHeaders
    };
    rest.get(url, options)
      .then(function (response) {
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

  function add(metadata, results) {
    var newItems = underscore.pluck(results, 'id');
    getExistingItems(metadata.drupalViewPath)
      .then(function (items) {
        var existingItems = underscore.pluck(items, 'lid');
        return underscore.difference(newItems, existingItems);
      })
      .then(function (validItems) {
        async.eachLimit(results, 5, function (result, callback) {
          if(underscore.indexOf(validItems, result.id) !== -1) {
            addItem(metadata, result)
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

  return {
    initialize: initialize,
    remove: remove,
    add: add,
    get: get
  };
};