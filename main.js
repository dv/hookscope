var io       = require('socket.io').listen(8080);
var paperboy = require('paperboy');
var http     = require('http');
var url      = require('url');
var redis    = require('redis');
var config   = require('./config.js').config;
var cons     = {};

io.sockets.on('connection', function(socket) {
	socket.vars = {};
	socket.vars["chnl"] = "MIIIAAAWWOWOO"
	socket.on('set channel', function(channel) {
		socket.set('channel', channel, function () {
			console.log("Creating channel " + channel);
			cons["channel" + channel] = socket;	
		});
	});

	socket.on('disconnect', function () {
		console.log("Disconnected " + socket.vars["chnl"]);
		socket.get('channel', function (err,channel) {
			console.log("Removing channel " + channel);
			delete cons["channel" + channel];
		});
	});
});


function parseRequest(req, res) {
  requestUrl = url.parse(req.url, true);

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('ok\n');

  dataObject = {};
  dataObject.url = requestUrl;
  dataObject.headers = req.headers;
  dataObject.httpVersion = req.httpVersion;
  dataObject.method = req.method;

  if (req.headers["host"]) {
    dataObject.channel = req.headers["host"].split(".")[0];   
    
    if (cons["channel" + dataObject.channel]) {
      console.log("Received request for channel '" + dataObject.channel + "'. Emit.");
      cons["channel" + dataObject.channel].emit("request", dataObject);
    } else {
      console.log("Recieved request for unknown channel '" + dataObject.channel + "'. Discard.");
    }
  } else {
    console.log("Received HOST-less request. Discard.");
  }
}

http.createServer(function (req, res) {

  if (req.headers["host"].split(":")[0] == config.domain) {
    paperboy.deliver(config.webroot, req, res);
  } else {
    parseRequest(req, res);
  }

}).listen(8001, "127.0.0.1");