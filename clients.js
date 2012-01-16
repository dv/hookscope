exports.createClients = createClients;

var events = require('events');
var _ = require('underscore')._;

/*
 * Initializes the socket.io code.
 * Pass either an Express app or a
 * simple port number as listener.
 */
function createClients(listener, options) {
  return new Clients(listener, options);
}

function Clients(listener, options) {
  events.EventEmitter.call(this);

  var self = this;
  var active_sockets = {};
  var io = require('socket.io').listen(listener);

  io.configure(function() {
    _.each(options, function(value, key) {
      io.set(key, value);
    });
  })

  this.exists = function exists(channel) {
    return active_sockets["channel-" + channel] && true;
  }

  this.publish = function publish(channel, data) {
    active_sockets["channel-" + channel].emit("request", data);
    emitEvent(channel, "publish", data);
  }

  this.history = function history(channel, data) {
    active_sockets["channel-" + channel].emit("history", data);
    emitEvent(channel, "history", data);
  }

  /*
   * Notify the clients of the possible URL endpoints. Data
   * is an array containing the differint URLs, e.g.
   *    ["http://localhost/hooks/aXejf/", "http://aXejf.localhost/"]
   */
  this.setUrls = function setUrls(channel, data) {
    active_sockets["channel-" + channel].emit("setUrls", data);
    emitEvent(channel, "setUrls", data);
  }

  // Event handling
  io.sockets.on('connection', function(socket) {
    socket.on('set channel', function(channel) {
      connectSocket(socket, channel);
      emitEvent(channel, 'set channel');
    });

    socket.on('disconnect', function() {
      disconnectSocket(socket);
    });

    socket.on('clear', function() {
      socket.get("channel", function(err, channel) {
        emitEvent(channel, "clear");
      });
    });
  });

  // Private Members
  function connectSocket(socket, channel) {
    emitEvent(channel, "connection");

    console.log("Connect to channel " + channel + ".");
    socket.set("channel", channel, function() {
      active_sockets["channel-" + channel] = socket;
    });
  }

  function disconnectSocket(socket) {
    socket.get("channel", function(err, channel) {
      if (err) {
        console.log("Error while removing channel: " + err);

      } else {
        emitEvent(channel, "disconnect");
        console.log("Disconnect channel " + channel + ".");
        delete active_sockets["channel-" + channel];

      }
    });
  }

  function emitEvent(channel, event, data) {
    self.emit("touch", channel, data);
    self.emit(event, channel, data);
  }
}

Clients.super_ = events.EventEmitter;
Clients.prototype = Object.create(events.EventEmitter.prototype, {
  constructor: {
    value: Clients,
    enumerable: false
  }
});