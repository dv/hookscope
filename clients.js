exports.createClients = createClients;

var events = require('events');

/*
 * Initializes the socket.io code.
 * Pass either an Express app or a
 * simple port number as listener.
 */
function createClients(listener) {
  return new Clients(listener);
}

function Clients(listener) {
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

  /*
   * Notify the clients of the possible URL endpoints. Data
   * is an array containing the differint URLs, e.g.
   *    ["http://localhost/hooks/aXejf/", "http://aXejf.localhost/"]
   */
  this.setUrls = function setUrls(channel, data) {
    active_sockets["channel-" + channel].emit("urls", data);
    emit_event(channel, "urls", data);
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

Clients.super_ = events.EventEmitter;
Clients.prototype = Object.create(events.EventEmitter.prototype, {
  constructor: {
    value: Clients,
    enumerable: false
  }
});