var path = require('path');

exports.config = {
  // The directory from which to serve the static files
  webroot: path.join(path.dirname(__filename), ''),

  // The domain used to host this app
  domain: "localhost",

  // The subdirectory to listen for webhooks on. If you don't
  // want to enable this, put false.
  hookdir: "hook",

  // HTTP server details
  host: "127.0.0.1",
  port: process.env.PORT || 8000,

  // Persist requests y/n (if true, configure redis below)
  persist: false, 

  // Redis connection
  redisHost: "viperfish.redistogo.com",
  redisPort: "9991",
  redisAuth: "89dde81eafc9835bf0ff47ec973c48d5",

  // Redis expiry of unused channels
  expire: 60*60*24*7,

  // Maximum requests per channel
  maxlen: 20,

  // Ignore favicon.ico requests?
  ignoreFavicon: true

}