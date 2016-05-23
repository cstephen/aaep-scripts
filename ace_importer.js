(function() {
  var rest = require('restler-q');

  var drupalApi = 'http://localhost:9090/api'

  var url;
  var options;
  var token;
  var cookie;

  this.url = drupalApi + '/user/token.json';
  this.options = {
    headers: {
      'Content-Type': 'application/json'
    }
  }

  rest.postJson(this.url, this.options).then(function(response) {
    return response
  }).then(function(response) {
    this.token = response;
    this.url = drupalApi + '/user/login.json';
    this.options = {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.token
      },
      'username': 'ACE Import User',
      'password': 'password'
    }

    return rest.postJson(this.url, this.options);
  }).then(function(response) {
    console.log(response);
    this.token = response.token;
    this.cookie = response.session_name + '=' + response.sessid;
    this.url = drupalApi + '/views/ace_weather_reports';
    this.options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.token,
        'Cookie': this.cookie
      }
    }
    return rest.get(this.url, this.options);
  }).then(function(response) {
    for(var i = 0; i < response.length; i++) {
      console.log('Deleting: ' + response[i].nid);
      this.url = drupalApi + '/node/' + response[i].nid;
      return rest.del(this.url, this.options);
    }
  }).fail(function(err) {
    console.log(err);
  });
})();
