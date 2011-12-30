var config = require('./config').config;

exports.createClient = function createClient(port, host, auth) {
  var redis = require('redis');

  client = redis.createClient(port, host);
  if (auth) { client.auth(auth) };

  return new Persistence(client);
}

/* class Persistence
* 
* methods:
*  - pushRequest(channel, data, callback)
*      Adds a new request (data) to an already or not existing
*      channel.
*  - channelExists(channel, callback)
*      Checks if the channel already exists
*      callback is called with one parameter (exists or not)
*  - touchChannel(channel, callback)
*      Update the expiry of channel to now+timeout
*/

function Persistence(client) {
  var self = this;
  this.client = client;

  self.channelExists = function channelExists(channel, callback) {
    client.exists("list:" + channel, function(err, data) {
      callback(data);
    });
  };

  self.pushRequest = function pushRequest(channel, data, callback) {
    self.channelExists(channel, function(exists) {
      var multi = self.client.multi();

      if (!exists) {
        // update the list of channels here

      }

      multi.lpush("list:" + channel, JSON.stringify(data));
      multi.ltrim("list:" + channel, 0, config.maxlen-1);
      multi.exec(callback);

      self.touch(channel);
    });
  };

  self.getRequests = function getRequests(channel, callback) {
    self.channelExists(channel, function(exists) {
      if (exists) {
        self.client.lrange("list:" + channel, 0, 100, function(error, result) {
          if (result) {
            parsedResult = [];

            for(i=0; i<result.length; i++) {
              parsedResult.push(JSON.parse(result[i]));
            }

            callback(error, parsedResult);
          }
        });
        self.touch(channel);
      }
    });
  }

  self.clear = function clear(channel, callback) {
    self.client.del("list:" + channel, callback);
  }


  /* 
   * Use this method every time you want to update
   * the expiry date for this channel.
   */
  self.touch = function touchChannel(channel, callback) {
    if (callback) { callback() };
  }

}

/*
 * Redis Keys
 * ==========
 * channels:     set of all the channels
 * 
 * channel:NAME  channel to subscribe to
 * list:NAME     list of messages (trimmed to config.maxlen)
 * expire:NAME   expire for this channel
 */