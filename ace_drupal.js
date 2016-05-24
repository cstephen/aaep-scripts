(function() {
  var rest = require('restler-q');
  var drupalApi = 'http://localhost:9090/api'
  var token;
  var cookie;

  this.initialize = function() {
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
        var token = response;
        url = drupalApi + '/user/login.json';
        options = {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token
          },
          'username': 'ACE Import User',
          'password': 'password'
        }

        return rest.postJson(url, options);
      }).then(function(response) {
        this.token = response.token;
        this.cookie = response.session_name + '=' + response.sessid;
        resolve();
      }).fail(function(err) {
        console.log(err);
        reject(err);
      });
    });
  }

  this.remove = function() {
    var url = drupalApi + '/views/ace_weather_reports';
    var options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.token,
        'Cookie': this.cookie
      }
    }
    rest.get(url, options).then(function(response) {
      console.log('Woo!');
      for(var i = 0; i < response.length; i++) {
        console.log('Deleting: ' + response[i].nid);
        this.url = drupalApi + '/node/' + response[i].nid;
        return rest.del(this.url, this.options);
      }
    }).fail(function(err) {
      console.log(err);
    });
  }

  this.temp = function() {
    var url = drupalApi + '/node/1197';
    var options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.token,
        'Cookie': this.cookie
      }
    }
    rest.get(url, options).then(function(response) {
      console.log(response);
    });
  }

  this.post = function() {
    var content = require('./ace_weather_reports.json');
    var url = drupalApi + '/node.json';
    var options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.token,
        'Cookie': this.cookie
      }
    }

    rest.postJson(url, content, options).then(function(reponse) {
      console.log(response);
    }).fail(function(err) {
      console.log(err);
    });
  }

  //this.initialize().then(this.remove);
  this.initialize().then(this.post);
})();
