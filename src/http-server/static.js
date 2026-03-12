import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import http from 'http';
import morgan from 'morgan';
import proxy from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import fileViewerRouter from './file-viewer.js';
import todoApiRouter from './todo-api.js';
import pomodoroApiRouter from './pomodoro-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 项目根目录（static.js 在 src/http-server 目录下）
const ROOT_DIR = path.join(__dirname, '../..');

export default function (options = { port: 3000, dir: __dirname }) {
  const app = express();
  /**
   * Get port from environment and store in Express.
   */
  app.set('port', options.port);

  // 设置文件查看器根目录
  app.set('fileViewerRoot', options.dir);

  app.use(morgan('tiny'))

  // 添加 JSON 解析中间件
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 挂载具体 API 路由（必须在通用 /api 之前）
  app.use('/api/todos', todoApiRouter);
  app.use('/api/pomodoro', pomodoroApiRouter);

  // 挂载文件查看器路由（通用 /api 路由，放在最后）
  app.use('/api', fileViewerRouter);

  // 文件查看器前端页面（优先于用户目录静态资源）
  const fileViewerDir = path.join(ROOT_DIR, 'public/file-viewer');
  app.use('/file-viewer', express.static(fileViewerDir));

 

  // TODO 应用前端页面
  const todoDir = path.join(ROOT_DIR, 'public/todo');
  app.use('/todo', express.static(todoDir));
  app.get('/todo', (req, res) => {
    res.sendFile(path.join(todoDir, 'index.html'));
  });

  // 番茄时钟前端页面
  const pomodoroDir = path.join(ROOT_DIR, 'public/pomodoro');
  app.use('/pomodoro', express.static(pomodoroDir));
  app.get('/pomodoro', (req, res) => {
    res.sendFile(path.join(pomodoroDir, 'index.html'));
  });

  // 用户目录静态资源（最后）
  app.use('/files', express.static(options.dir));
  
  app.use(favicon(__dirname + '../../../favicon.ico'));


  const homeDir = path.join(ROOT_DIR, 'public/');
  app.use('/', express.static(homeDir));
  // 根路径显示工具首页
  app.get('/home', (req, res) => {
    res.sendFile(path.join(homeDir, 'index.html'));
  });

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
    import(options.config).then(proxys => {
      for (const m of proxys.default || proxys) {
        let pathRewrite = {};
        pathRewrite[`^/${m.path}`] = "";
        app.use(`/${m.path}`, proxy.createProxyMiddleware({ target: m.redirect, changeOrigin: true, pathRewrite: pathRewrite }));
      }
    });
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
