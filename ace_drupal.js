var rest = require('restler-q');
var drupalApi = 'http://localhost:9090/api';

module.exports = {
  drupalToken: null,
  cookie: null,
  initialize: function() {
    return new Promise(function(resolve, reject) {
      var url = drupalApi + '/user/token.json';
      var options = {
        headers: {
          'Content-Type': 'application/json'
        }
      }
      rest.postJson(url, options).then(function(response) {
        return response
      }).then(function(response) {
        var drupalToken = response;
        url = drupalApi + '/user/login.json';
        options = {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': drupalToken
          },
          'username': 'ACE Import User',
          'password': 'password'
        }

        return rest.postJson(url, options);
      }).then(function(response) {
        drupalToken = response.token;
        cookie = response.session_name + '=' + response.sessid;
        resolve();
      }).fail(function(err) {
        console.log(err);
        reject(err);
      });
    });
  },
  remove: function() {
    var url = drupalApi + '/views/ace_weather_reports';
    var options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': drupalToken,
        'Cookie': cookie
      }
    }
    rest.get(url, options).then(function(response) {
      for(var i = 0; i < response.length; i++) {
        console.log('Deleting: ' + response[i].nid);
        url = drupalApi + '/node/' + response[i].nid;
        return rest.del(url, options);
      }
    }).fail(function(err) {
      console.log(err);
    });
  },
  add: function(results) {
    var fs = require('fs');
    var underscore = require('underscore');
    var content = fs.readFileSync('./ace_weather_reports.json', 'utf8');
    var template = underscore.template(content);
    for(var i = 0; i < results.length; i++) {
      content = template(results[i]);
      content = JSON.parse(content);
      var url = drupalApi + '/node.json';
      var options = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-Token': drupalToken,
          'Cookie': cookie
        }
      }
      rest.postJson(url, content, options);
    }
  }
}