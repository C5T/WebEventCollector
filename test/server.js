var fs_ = require('fs');
var path_ = require('path');
var express_ = require('express');

var app = express_();

app.set('x-powered-by', false);

app.get('/', function (req, res) {
  res.format({
    'text/html': function () {
      res.set('Content-Type', 'text/html');
      res.end(fs_.readFileSync(path_.join(__dirname, 'index.html')));
    },
    
    'default': function () {
      res.status(406).end('Not Acceptable');
    }
  });
});

app.get('/c5t.js', function (req, res) {
  res.format({
    'text/javascript': function () {
      res.set('Content-Type', 'text/javascript');
      res.end(fs_.readFileSync(path_.join(path_.resolve(__dirname, '..', 
        (process.env.NODE_ENV === 'development' ? 'src' : 'build')), 'c5t.js')));
    },
    
    'default': function () {
      res.status(406).end('Not Acceptable');
    }
  });
});

var server = app.listen(3000, function () {
  console.log('Listening at http://localhost:%s', server.address().port);
});
