var rest = require('restler-q');
var async = require('async');
var underscore = require('underscore');

module.exports = function aceDrupal(baseUrl) {
  var baseUrl = baseUrl;
  var token;
  var cookie;
  var authHeaders;

  function getExistingItems(viewPath) {
    var viewUrl = baseUrl + viewPath; 
    var options = {
      headers: authHeaders
    }
    return rest.get(viewUrl, options);
  }

  function addItem(metadata, item) {
    var fs = require('fs');
    var content = fs.readFileSync(metadata.drupalTemplate, 'utf8');
    var template = underscore.template(content);
    console.log('Adding: ' + item.id);
    item.type = metadata.drupalType;
    item.title = metadata.drupalTitle;
    content = template(item);
    content = JSON.parse(content);
    var url = baseUrl + '/node.json';
    var options = {
      headers: authHeaders
    }
    rest.postJson(url, content, options);
  }

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
        authHeaders = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
          'Cookie': cookie
        }
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
      headers: authHeaders
    }
    rest.get(url, options).then(function(response) {
      async.eachLimit(response, 5, function(result, callback) {
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
    var newItems = underscore.pluck(results, 'id');
    getExistingItems(metadata.drupalViewPath).then(function(items) {
      existingItems = underscore.pluck(items, 'lid');
      return underscore.difference(newItems, existingItems);
    }).then(function(validItems) {
      for(var i = 0; i < results.length; i++) {
        if(underscore.indexOf(validItems, results[i].id) !== -1) {
          addItem(metadata, results[i]);
        }
      }
    });
  }

  function get(viewPath) {
    var url = baseUrl + viewPath;
    var options = {
      headers: authHeaders
    }
    return rest.get(url, options);
  }

  return {
    initialize: initialize,
    remove: remove,
    add: add,
    get: get
  }
}