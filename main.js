var paperboy = require('paperboy');
var http     = require('http');
var url      = require('url');
var redis    = require('redis');
var config   = require('./config.js').config;
var sockets;

function staticRequest(req) {
  return !((req.url.split("/")[1] === config.hookdir) 
          || (config.subDomainChannel
          && req.headers["host"].split(":")[0] == config.domain));
}

function extractChannel(req) {
  if (config.hookdir && req.url.split("/")[1] === config.hookdir) {
    return req.url.split("/")[2];

  } else if (config.subDomainChannel && req.headers["host"]) {
    return req.headers["host"].split(".")[0]; 
  } else {
    return false;
  }
}



function parseRequest(req, res) {
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

  dataObject.channel = extractChannel(req);

  if (!dataObject.channel) {
    console.log("Received chaneless request. Discard.");
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

  if (staticRequest(req)) {
    paperboy.deliver(config.webroot, req, res);
  } else {
    parseRequest(req, res);
  }
});
server.listen(config.port);

console.log("Server started on port " + config.port);

sockets = require('./clients.js').createClients(server, config.socketOpts);


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
