var paperboy = require('paperboy');
var http     = require('http');
var url      = require('url');
var redis    = require('redis');
var config   = require('./config.js').config;
var sockets;



function parseRequest(req, res) {
  var requestUrl = url.parse(req.url, true);

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('ok\n');

  dataObject = {};
  dataObject.url = requestUrl;
  dataObject.headers = req.headers;
  dataObject.httpVersion = req.httpVersion;
  dataObject.method = req.method;

  if (config.hookdir && req.url.split("/")[1] === config.hookdir) {
    dataObject.channel = req.url.split("/")[2];

  } else if (req.headers["host"]) {
    dataObject.channel = req.headers["host"].split(".")[0]; 
      
  } else {
    console.log("Received channeless request. Discard.");
    return;
  }

  if (sockets.exists(dataObject.channel)) {
    console.log("Received request for channel '" + dataObject.channel + "'. Emit.");
    sockets.publish(dataObject.channel, dataObject);
  } else {
    console.log("Received request for unknown channel '" + dataObject.channel + "'. Discard.");
  }
}

var server = http.createServer(function (req, res) {

  if (config.ignoreFavicon && req.url.split("?")[0].substr(-11, 12) == "favicon.ico") {
    return false;
  }

  if (req.url.split("/")[1] === config.hookdir) {
      parseRequest(req, res);
  } else if (req.headers["host"].split(":")[0] == config.domain) {
      paperboy.deliver(config.webroot, req, res);
  } else {
      parseRequest(req, res);
  }

}).listen(config.port, config.host);

sockets = require('./sockets.js').createSockets(server);


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
