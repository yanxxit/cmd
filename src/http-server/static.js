import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import http from 'http';
import morgan from 'morgan';
import proxy from 'http-proxy-middleware';
import compression from 'compression';
import { fileURLToPath } from 'url';
import fileViewerRouter from './file-viewer.js';
import todoApiRouter from './todo-api.js';
import pomodoroApiRouter from './pomodoro-api.js';
import authApiRouter from './auth-api.js';
import xlsxParserRouter from './xlsx-parser.js';

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
  
  // 设置默认目录
  if (!options.dir) {
    options.dir = process.cwd();
  }

  // 设置文件查看器根目录
  app.set('fileViewerRoot', options.dir);

  app.use(morgan('tiny'))

  // 添加压缩中间件
  app.use(compression());

  // 添加 JSON 解析中间件
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 允许访问 node_modules 目录（用于本地依赖）
  app.use('/node_modules', express.static(path.join(ROOT_DIR, 'node_modules')));
  // 添加 /libs 路由指向 node_modules 目录，配置 CDN 式静态资源（压缩 + 缓存）
  app.use('/libs', express.static(path.join(ROOT_DIR, 'node_modules'), {
    maxAge: '365d', // 缓存一年
    etag: true, // 启用 ETag
    lastModified: true, // 启用 Last-Modified
    setHeaders: (res, path) => {
      // 设置强缓存
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      // 设置压缩头
      res.setHeader('Vary', 'Accept-Encoding');
    }
  }));

  // 挂载 XLSX 解析 API 路由（必须在通用 /api 之前）
  app.use('/api/xlsx', xlsxParserRouter);

  // 挂载认证 API 路由
  app.use('/api/auth', authApiRouter);

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

  // TODO v2 应用前端页面（Tailwind CSS + Alpine.js）
  const todoV2Dir = path.join(ROOT_DIR, 'public/todo-v2');
  app.use('/todo-v2', express.static(todoV2Dir));
  app.get('/todo-v2', (req, res) => {
    res.sendFile(path.join(todoV2Dir, 'index.html'));
  });

  // TODO v3 应用前端页面（Bootstrap 5 + Alpine.js）
  const todoV3Dir = path.join(ROOT_DIR, 'public/todo-v3');
  app.use('/todo-v3', express.static(todoV3Dir));
  app.get('/todo-v3', (req, res) => {
    res.sendFile(path.join(todoV3Dir, 'index.html'));
  });

  // TODO v4 应用前端页面（Tailwind + Shoelace + Petite-Vue + axios）
  const todoV4Dir = path.join(ROOT_DIR, 'public/todo-v4');
  app.use('/todo-v4', express.static(todoV4Dir));
  app.get('/todo-v4', (req, res) => {
    res.sendFile(path.join(todoV4Dir, 'index.html'));
  });

  // TODO v6 应用前端页面（Vue 3 + Tailwind + axios）
  const todoV6Dir = path.join(ROOT_DIR, 'public/todo-v6');
  app.use('/todo-v6', express.static(todoV6Dir));
  app.get('/todo-v6', (req, res) => {
    res.sendFile(path.join(todoV6Dir, 'index.html'));
  });

  // TODO v7 应用前端页面（React + Ant Design v5）
  const todoV7Dir = path.join(ROOT_DIR, 'public/todo-v7');
  app.use('/todo-v7', express.static(todoV7Dir));
  app.get('/todo-v7', (req, res) => {
    res.sendFile(path.join(todoV7Dir, 'index.html'));
  });

  // 番茄时钟前端页面
  const pomodoroDir = path.join(ROOT_DIR, 'public/pomodoro');
  app.use('/pomodoro', express.static(pomodoroDir));
  app.get('/pomodoro', (req, res) => {
    res.sendFile(path.join(pomodoroDir, 'index.html'));
  });

  // CSV 转 JSON 前端页面
  const csvToJsonDir = path.join(ROOT_DIR, 'public/csv-to-json');
  app.use('/csv-to-json', express.static(csvToJsonDir));
  app.get('/csv-to-json', (req, res) => {
    res.sendFile(path.join(csvToJsonDir, 'index.html'));
  });

  // XLSX 转 JSON 前端页面
  const xlsxParserDir = path.join(ROOT_DIR, 'public/xlsx-parser');
  app.use('/xlsx-parser', express.static(xlsxParserDir));
  app.get('/xlsx-parser', (req, res) => {
    res.sendFile(path.join(xlsxParserDir, 'index.html'));
  });

  // 登录页面
  const loginDir = path.join(ROOT_DIR, 'public/login');
  app.use('/login', express.static(loginDir));
  app.get('/login', (req, res) => {
    res.sendFile(path.join(loginDir, 'index.html'));
  });

  // 日历管理页面
  const calendarDir = path.join(ROOT_DIR, 'public/calendar');
  app.use('/calendar', express.static(calendarDir));
  app.get('/calendar', (req, res) => {
    res.sendFile(path.join(calendarDir, 'index.html'));
  });

  // 时间工具页面
  const timeDir = path.join(ROOT_DIR, 'public/time');
  app.use('/time', express.static(timeDir));
  app.get('/time', (req, res) => {
    res.sendFile(path.join(timeDir, 'index.html'));
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
