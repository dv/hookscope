var path = require('path');
var url = require('url');
var redisConfig = url.parse(process.env.REDISTOGO_URL || "");

exports.config = {
  // The directory from which to serve the static files
  webroot: path.join(path.dirname(__filename), ''),

  // If hostname is in the form of channel.domain.tld
  subDomainChannel: false,

  // The domain used to host this app
  domain: "localhost",

  // The subdirectory to listen for webhooks on. If you don't
  // want to enable this, put false.
  hookdir: "hook",

  // HTTP server details
  host: "127.0.0.1",
  port: process.env.PORT || 8000,

  // Persist requests y/n (if true, configure redis below)
  persist: !!(redisConfig.hostname && redisConfig.hostname.length) || false, 

  // Redis connection
  redisHost: redisConfig.hostname || "localhost",
  redisPort: redisConfig.port || "6379",
  redisAuth: (redisConfig.auth || "").split(":")[1] || "auth string here",

  // Redis expiry of unused channels
  expire: 60*60*24*7,

  // Maximum requests per channel
  maxlen: 20,

  // Ignore favicon.ico requests?
  ignoreFavicon: true

}