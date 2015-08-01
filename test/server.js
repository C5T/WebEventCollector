var fs_ = require('fs');
var path_ = require('path');
var express_ = require('express');


var testApp = express_();

testApp.set('x-powered-by', false);

testApp.get('/', function (req, res) {
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

testApp.get('/c5t.js', function (req, res) {
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

var testServer = testApp.listen(3000, function () {
  console.log('Test server listening at http://localhost:%s', testServer.address().port);
});


// Establish a separate server for logging to test different origins.
var loggingApp = express_();

loggingApp.set('x-powered-by', false);

loggingApp.use(require('body-parser').urlencoded({
  extended: false,
  type: function () { return true; }
}));

loggingApp.all('/datadrop/v1/:trackingId', function (req, res) {
  console.log(
    '\n[' + (1*new Date()) + '] ' +
    req.method + ' ' + req.url + '\n' +
    req.params.trackingId + ' ' +
    JSON.stringify((req.method === 'GET' ? req.query : req.body), true, 2)
  );
  res.status(200).end();
});

var loggingServer = loggingApp.listen(4000, function () {
  console.log('Logging server listening at http://localhost:%s', loggingServer.address().port);
});
