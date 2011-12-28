var path = require('path');

exports.config = {
  // The from which to serve the static files
  webroot: path.join(path.dirname(__filename), ''),

  // The domain used to host this app
  domain: "localhost",

  // Redis connection string
  redis: "redis://relix:dd389d90c314b4a2b2100da90539d49a@barracuda.redistogo.com:9183/"
}