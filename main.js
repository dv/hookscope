var io = require('socket.io').listen(8080);
var cons = {};

io.sockets.on('connection', function(socket) {
	socket.vars = {};
	socket.vars["chnl"] = "MIIIAAAWWOWOO"
	socket.on('set channel', function(channel) {
		socket.set('channel', channel, function () {
			console.log("Creating channel " + channel);
			cons["channel" + channel] = this;	
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

var http = require('http');
var url = require('url');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');

  dataObject = {};
  dataObject.url = url.parse(req.url, true);
  dataObject.headers = req.headers;
  dataObject.httpVersion = req.httpVersion;
  dataObject.method = req.method;

  io.sockets.emit("request", dataObject);
}).listen(8001, "127.0.0.1");