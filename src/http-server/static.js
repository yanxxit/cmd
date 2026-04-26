import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import http from 'http';
import morgan from 'morgan';
import proxy from 'http-proxy-middleware';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import fileViewerRouter from './file-viewer.js';
import todoApiRouter from './todo-api.js';
import pomodoroApiRouter from './pomodoro-api.js';
import taskManagerApiRouter from './task-manager-api.js';
import testCaseApiRouter from './test-case-api.js';
import authApiRouter from './auth-api.js';
import httpbinApiRouter from './httpbin-api.js';
import mockApiRouter from './mock-api.js';
import pgliteExportApiRouter from './pglite-export-api.js';
import xlsxParserRouter from './xlsx-parser.js';
// import alasqlParserRouter from './alasql-parser.js';
import aiChatApiRouter from './ai-chat-api.js';
import appsApiRouter from './apps-api.js';
import contrastApiRouter from './contrast-api.js';
import markdownContrastApiRouter from './markdown-contrast-api.js';
import { createRequestLogger } from './request-logger.js';
import requestLoggerApiRouter from './request-logger-api.js';
import { initDatabase as initTodoDatabase } from '../model/database.js';
import { createHashMiddleware, createStaticWithHashInjection } from './hash-middleware.js';
import { setupSystemInfoSocket, setupSystemInfoAPI } from './system-info-api.js';

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

  // 添加请求监听中间件（在 morgan 之后，其他中间件之前）
  app.use(createRequestLogger());

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

  // 挂载请求监听 API 路由
  app.use('/api/requests', requestLoggerApiRouter);

  // 挂载 XLSX 解析 API 路由（必须在通用 /api 之前）
  app.use('/api/xlsx', xlsxParserRouter);

  // 挂载 AlaSQL 解析 API 路由（必须在通用 /api 之前）
  // app.use('/api/alasql', alasqlParserRouter);

  // 挂载认证 API 路由
  app.use('/api/auth', authApiRouter);

  // 挂载 HTTP 测试平台 API 路由
  app.use('/api/httpbin', httpbinApiRouter);

  // 挂载 Mock API 路由
  app.use('/api/mock', mockApiRouter);

  // 挂载 PGLite 导出 API 路由
  app.use('/api/pglite', pgliteExportApiRouter);

  // 挂载 AI 聊天 API 路由
  app.use('/api/ai', aiChatApiRouter);

  // 挂载具体 API 路由（必须在通用 /api 之前）
  app.use('/api/todos', todoApiRouter);
  app.use('/api/pomodoro', pomodoroApiRouter);
  app.use('/api/tasks', taskManagerApiRouter);
  app.use('/api/test-cases', testCaseApiRouter);

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

  // 计算稿纸前端页面
  const calculatorDir = path.join(ROOT_DIR, 'public/calculator');
  app.use('/calculator', express.static(calculatorDir));
  app.get('/calculator', (req, res) => {
    res.sendFile(path.join(calculatorDir, 'index.html'));
  });

  // CSV 转 JSON 前端页面
  const csvToJsonDir = path.join(ROOT_DIR, 'public/csv-to-json');
  app.use('/csv-to-json', express.static(csvToJsonDir));
  app.get('/csv-to-json', (req, res) => {
    res.sendFile(path.join(csvToJsonDir, 'index.html'));
  });

  // 粘贴解析工具页面
  const pasteParserDir = path.join(ROOT_DIR, 'public/paste-parser');
  app.use('/paste-parser', express.static(pasteParserDir));
  app.get('/paste-parser', (req, res) => {
    res.sendFile(path.join(pasteParserDir, 'index.html'));
  });

  // XLSX 转 JSON 前端页面
  const xlsxParserDir = path.join(ROOT_DIR, 'public/xlsx-parser');
  app.use('/xlsx-parser', express.static(xlsxParserDir));
  app.get('/xlsx-parser', (req, res) => {
    res.sendFile(path.join(xlsxParserDir, 'index.html'));
  });

  // AlaSQL 数据工作台前端页面
  const alasqlParserDir = path.join(ROOT_DIR, 'public/alasql-parser');
  app.use('/alasql-parser', express.static(alasqlParserDir));
  app.get('/alasql-parser', (req, res) => {
    res.sendFile(path.join(alasqlParserDir, 'index.html'));
  });

  // Flowchart 流程图编辑器前端页面
  const flowchartEditorDir = path.join(ROOT_DIR, 'public/flowchart-editor');
  app.use('/flowchart-editor', express.static(flowchartEditorDir));
  app.get('/flowchart-editor', (req, res) => {
    res.sendFile(path.join(flowchartEditorDir, 'index.html'));
  });

  // Reveal.js 演示文稿编辑器前端页面
  const revealEditorDir = path.join(ROOT_DIR, 'public/reveal-editor');
  app.use('/reveal-editor', express.static(revealEditorDir));
  app.get('/reveal-editor', (req, res) => {
    res.sendFile(path.join(revealEditorDir, 'index.html'));
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

  // HTTP 测试平台页面
  const httpbinDir = path.join(ROOT_DIR, 'public/httpbin');
  app.use('/httpbin', express.static(httpbinDir));
  app.get('/httpbin', (req, res) => {
    res.sendFile(path.join(httpbinDir, 'index.html'));
  });

  // Mock API 测试平台页面
  const mockDir = path.join(ROOT_DIR, 'public/mock');
  app.use('/mock', express.static(mockDir));
  app.get('/mock', (req, res) => {
    res.sendFile(path.join(mockDir, 'index.html'));
  });

  // CSV 转 Markdown/HTML 表格
  const csvTableConverterDir = path.join(ROOT_DIR, 'public/csv-table-converter');
  app.use('/csv-table-converter', express.static(csvTableConverterDir));
  app.get('/csv-table-converter', (req, res) => {
    res.sendFile(path.join(csvTableConverterDir, 'index.html'));
  });

  // 请求监听页面
  const requestLoggerDir = path.join(ROOT_DIR, 'public/request-logger');
  app.use('/request-logger', express.static(requestLoggerDir));
  app.get('/request-logger', (req, res) => {
    res.sendFile(path.join(requestLoggerDir, 'index.html'));
  });

  // PGLite 数据导出工具
  const pgliteExportDir = path.join(ROOT_DIR, 'public/pglite-export');
  app.use('/pglite-export', express.static(pgliteExportDir));
  app.get('/pglite-export', (req, res) => {
    res.sendFile(path.join(pgliteExportDir, 'index.html'));
  });

  // AI 聊天工具
  const aiChatDir = path.join(ROOT_DIR, 'public/ai-chat');
  app.use('/ai-chat', express.static(aiChatDir));
  app.get('/ai-chat', (req, res) => {
    res.sendFile(path.join(aiChatDir, 'index.html'));
  });

  // 任务管理系统页面（基于 JSONDB）
  const taskManagerDir = path.join(ROOT_DIR, 'public/task-manager');
  app.use('/task-manager', express.static(taskManagerDir));
  app.get('/task-manager', (req, res) => {
    res.sendFile(path.join(taskManagerDir, 'index.html'));
  });

  // aPaaS 设计需求页面
  const apaasDesignDir = path.join(ROOT_DIR, 'public/apaas-design');
  app.use('/apaas-design', express.static(apaasDesignDir));
  app.get('/apaas-design', (req, res) => {
    res.sendFile(path.join(apaasDesignDir, 'index.html'));
  });

  // aPaaS 基础版页面
  const apaasBasicDir = path.join(ROOT_DIR, 'public/apaas-basic');
  app.use('/apaas-basic', express.static(apaasBasicDir));
  app.get('/apaas-basic', (req, res) => {
    res.sendFile(path.join(apaasBasicDir, 'index.html'));
  });

  // 测试案例管理系统页面
  const testCaseManagerDir = path.join(ROOT_DIR, 'public/test-case-manager');
  app.use('/test-case-manager', express.static(testCaseManagerDir));
  app.get('/test-case-manager', (req, res) => {
    res.sendFile(path.join(testCaseManagerDir, 'index.html'));
  });

  // Web IDE
  const webIdeDir = path.join(ROOT_DIR, 'public/web-ide');
  app.use('/web-ide', express.static(webIdeDir));
  app.get('/web-ide', (req, res) => {
    res.sendFile(path.join(webIdeDir, 'index.html'));
  });

  // 轻量级 Web IDE
  const webIdeLiteDir = path.join(ROOT_DIR, 'public/web-ide-lite');
  app.use('/web-ide-lite', express.static(webIdeLiteDir));
  app.get('/web-ide-lite', (req, res) => {
    res.sendFile(path.join(webIdeLiteDir, 'index.html'));
  });

  // 轻量级 Web IDE v2 (模块化版本)
  const webIdeLiteV2Dir = path.join(ROOT_DIR, 'public/web-ide-lite-v2');
  
  // 添加 hash 中间件（在静态文件服务之前）
  app.use('/web-ide-lite-v2', createHashMiddleware(webIdeLiteV2Dir, { hashLength: 8 }));
  app.use('/web-ide-lite-v2', express.static(webIdeLiteV2Dir));
  
  // HTML 文件 hash 注入
  app.use(createStaticWithHashInjection(webIdeLiteV2Dir, { hashLength: 8 }));
  
  app.get('/web-ide-lite-v2', (req, res) => {
    res.sendFile(path.join(webIdeLiteV2Dir, 'index.html'));
  });

  // 轻量级 Web IDE v2 JS 模块
  app.use('/web-ide-lite-v2/js', express.static(path.join(webIdeLiteV2Dir, 'js')));
  app.use('/web-ide-lite-v2/js/actions', express.static(path.join(webIdeLiteV2Dir, 'js/actions')));

  // 系统信息监控页面
  const systemInfoDir = path.join(ROOT_DIR, 'public/system-info');
  app.use('/system-info', express.static(systemInfoDir));
  app.get('/system-info', (req, res) => {
    res.sendFile(path.join(systemInfoDir, 'index.html'));
  });

  // 应用启动器页面
  const appsLauncherDir = path.join(ROOT_DIR, 'public/apps-launcher');
  app.use('/apps-launcher', express.static(appsLauncherDir));
  app.get('/apps-launcher', (req, res) => {
    res.sendFile(path.join(appsLauncherDir, 'index.html'));
  });

  // 挂载应用启动 API 路由
  app.use('/api/apps', appsApiRouter);

  // 对比学习页面
  const contrastLearningDir = path.join(ROOT_DIR, 'public/contrast-learning');
  app.use('/contrast-learning', express.static(contrastLearningDir));
  app.get('/contrast-learning', (req, res) => {
    res.sendFile(path.join(contrastLearningDir, 'index.html'));
  });

  // 挂载对比学习 API 路由
  app.use('/api/contrast', contrastApiRouter);

  // 2048 游戏页面
  const game2048Dir = path.join(ROOT_DIR, 'public/2048');
  app.use('/2048', express.static(game2048Dir));
  app.get('/2048', (req, res) => {
    res.sendFile(path.join(game2048Dir, 'index.html'));
  });

  // Vim 学习游戏页面
  const vimGameDir = path.join(ROOT_DIR, 'public/vim-game');
  app.use('/vim-game', express.static(vimGameDir));
  app.get('/vim-game', (req, res) => {
    res.sendFile(path.join(vimGameDir, 'index.html'));
  });

  // 在线算命工具页面
  const fortuneDir = path.join(ROOT_DIR, 'public/fortune');
  app.use('/fortune', express.static(fortuneDir));
  app.get('/fortune', (req, res) => {
    res.sendFile(path.join(fortuneDir, 'index.html'));
  });

  // JSON 对比工具 v2 页面（Vue 3 版）
  const jsonDiffV2Dir = path.join(ROOT_DIR, 'public/json-diff-v2');
  app.use('/json-diff-v2', express.static(jsonDiffV2Dir));
  app.get('/json-diff-v2', (req, res) => {
    res.sendFile(path.join(jsonDiffV2Dir, 'index.html'));
  });

  // String 转 JSON 工具页面
  const stringToJsonDir = path.join(ROOT_DIR, 'public/string-to-json');
  app.use('/string-to-json', express.static(stringToJsonDir));
  app.get('/string-to-json', (req, res) => {
    res.sendFile(path.join(stringToJsonDir, 'index.html'));
  });

  // Markdown 对比编辑器页面
  const markdownEditorDir = path.join(ROOT_DIR, 'public/markdown-editor');
  app.use('/markdown-editor', express.static(markdownEditorDir));
  app.get('/markdown-editor', (req, res) => {
    res.sendFile(path.join(markdownEditorDir, 'index.html'));
  });

  // 挂载 Next.js 静态资源
  const nextDir = path.join(ROOT_DIR, 'next-app/.next');
  console.log('----- nextDir=', nextDir);
  app.use('/next/_next', express.static(nextDir));

  // Next.js 页面路由（处理 SPA 路由）
  const nextPagesDir = path.join(ROOT_DIR, 'next-app/dist');
  app.get('/next/admin', (req, res) => {
    res.sendFile(path.join(nextPagesDir, 'admin.html'));
  });
  app.get('/next/admin/test-cases', (req, res) => {
    res.sendFile(path.join(nextPagesDir, 'admin', 'test-cases.html'));
  });

  // 挂载 Markdown 对比编辑器 API 路由
  app.use('/api/markdown-contrast', markdownContrastApiRouter);

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

  // 初始化 Socket.IO
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // 设置系统信息 Socket 路由
  setupSystemInfoSocket(io);

  // 设置系统信息 HTTP API
  setupSystemInfoAPI(app);

  // 预初始化 PGLite 数据库
  initTodoDatabase().catch(err => {
    console.error('⚠️ PGLite 数据库初始化失败:', err.message);
  });

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
