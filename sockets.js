exports.createSockets = createSockets;

var events = require('events');

/*
 * Initializes the socket.io code.
 * Pass either an Express app or a
 * simple port number as listener.
 */
function createSockets(listener) {
  return new Sockets(listener);
}

function Sockets(listener) {
  events.EventEmitter.call(this);

  var self = this;
  var io = require('socket.io').listen(listener);
  var active_sockets = {};

  this.exists = function exists(channel) {
    return active_sockets["channel-" + channel] && true;
  }

  this.publish = function publish(channel, data) {
    active_sockets["channel-" + channel].emit("request", data);
    emit_event(channel, "publish", data);
  }

  this.history = function history(channel, data) {
    active_sockets["channel-" + channel].emit("history", data);
    emit_event(channel, "history", data);
  }

  // Event handling
  io.sockets.on('connection', function(socket) {
    socket.on('set channel', function(channel) {
      connect_socket(socket, channel);
      emit_event(channel, 'set channel');
    });

    socket.on('disconnect', function() {
      disconnect_socket(socket);
    });

    socket.on('clear', function() {
      socket.get("channel", function(err, channel) {
        emit_event(channel, "clear");
      });
    });
  });

  // Private Members
  function connect_socket(socket, channel) {
    emit_event(channel, "connection");

    console.log("Connect to channel " + channel + ".");
    socket.set("channel", channel, function() {
      active_sockets["channel-" + channel] = socket;
    });
  }

  function disconnect_socket(socket) {
    socket.get("channel", function(err, channel) {
      if (err) {
        console.log("Error while removing channel: " + err);

      } else {
        emit_event(channel, "disconnect");
        console.log("Disconnect channel " + channel + ".");
        delete active_sockets["channel-" + channel];

      }
    });
  }

  function emit_event(channel, event, data) {
    self.emit("touch", channel, data);
    self.emit(event, channel, data);
  }
}

Sockets.super_ = events.EventEmitter;
Sockets.prototype = Object.create(events.EventEmitter.prototype, {
  constructor: {
    value: Sockets,
    enumerable: false
  }
});