const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const http = require('http');
const morgan = require('morgan');
const proxy = require('http-proxy-middleware');

module.exports = function (options = { port: 3000, dir: __dirname }) {
  const app = express();
  /**
   * Get port from environment and store in Express.
   */
  app.set('port', options.port);
  app.use(morgan('tiny'))
  app.use(express.static(options.dir));
  app.use(favicon(__dirname + '/favicon.ico'));

  // xtools static .\public\ -P https://condejs.org
  // xtools static .\public\ -P iapi>>http://172.16.1.102:7001
  if (options.proxy) {
    if (options.proxy.indexOf(">>") > -1) {
      let [api, url] = options.proxy.split(">>");
      let pathRewrite = {};
      pathRewrite[`^/${api}`] = "";
      app.use(`/${api}`, proxy.createProxyMiddleware({ target: url, changeOrigin: true, pathRewrite: pathRewrite }));
    } else {
      app.use('/', proxy.createProxyMiddleware({ target: options.proxy, changeOrigin: true }));
    }
  }

  // xtools static -c .\test\proxy.json
  if (options.config) {
    let proxys = require(options.config);
    for (const m of proxys) {
      let pathRewrite = {};
      pathRewrite[`^/${m.path}`] = "";
      app.use(`/${m.path}`, proxy.createProxyMiddleware({ target: m.redirect, changeOrigin: true, pathRewrite: pathRewrite }));
    }
  }


  /**
   * Create HTTP server.
   */
  const server = http.createServer(app);

  /**
   * Listen on provided port, on all network interfaces.
   */
  server.listen(options.port, function (e) {
    console.log("static:", options.dir);
    console.log(`http://127.0.0.1:${options.port}`);
  });
  server.on('error', onError);
  server.on('listening', onListening);

  /**
 * Event listener for HTTP server "error" event.
 */
  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof options.port === 'string'
      ? 'Pipe ' + options.port
      : 'Port ' + options.port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */
  function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    console.log('Listening on ' + bind);
  }
}
