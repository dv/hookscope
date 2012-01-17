var _        = require('underscore')._;
var express  = require('express');
var http     = require('http');
var url      = require('url');
var redis    = require('redis');
var config   = require('./config.js').config;
var app      = express.createServer();
var sockets;

app.use(app.router);
app.use(express.static(config.webRoot));      // Serve static on route fall through

// Ignore favicons
if (config.ignoreFavicon) {
  app.get('*/favicon.ico', function(req, res) {
    return false;
  });
}

// Translate subdomain channel into hookdir
if (config.subDomainChannel) {
  app.all('*', function(req, res, next) {
    var subDomain = req.headers.host.slice(0, -config.domain.length).split('.')[0];

    if (subDomain && !_.include(config.staticSubDomains, subDomain)) {
      req.url = '/' + config.hookDir + '/' + subDomain + req.url;
    }

    next(); 
  });
}

// Parse the webhook requests
app.all('/' + config.hookDir + '/:hookscopechannel/:subpath?', function(req, res) {
  var requestUrl = url.parse(req.url, true);

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('ok\n');

  dataObject = {
    datetime: new Date(),
    url: requestUrl,
    headers: req.headers,
    httpVersion: req.httpVersion,
    method: req.method
  };

  dataObject.channel = req.params.hookscopechannel;

  if (!dataObject.channel) {
    console.log("Received channelless request. Discard.");
    return;
  }

  if (sockets.exists(dataObject.channel)) {
    console.log("Received request for channel '" + dataObject.channel + "'. Emit.");
    sockets.request(dataObject.channel, dataObject);
  } else {
    console.log("Received request for unknown channel '" + dataObject.channel + "'. Discard.");
  }

});

app.listen(config.port);

console.log("Server started on port " + config.port);

sockets = require('./clients.js').createClients(app, config.socketOpts);

// Let the client know the webhook-URL.
sockets.on("set channel", function(channel) {
  urls = [];

  if (config.hookDir) {
    urls.push("/" + config.hookDir + "/" + channel);
  }

  if (config.subDomainChannel) {
    urls.push(channel + "." + config.domain); 
  }

  sockets.setUrls(channel, urls);
});


if (config.persist) {
  var persistence = require('./persistence.js').createClient(config.redisPort, config.redisHost, config.redisAuth);

  sockets.on("touch", function(channel) {
    persistence.touch(channel);
  });

  sockets.on("publish", function(channel, data) {
    persistence.pushRequest(channel, data);
  });

  sockets.on("set channel", function(channel) {
    persistence.getRequests(channel, function(error, data) {
      sockets.history(channel, data);
    });
  });

  sockets.on("clear", function(channel) {
    persistence.clear(channel);
  });
}
