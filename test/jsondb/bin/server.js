#!/usr/bin/env node

/**
 * JSONDB Web 管理工具服务器
 * 提供静态文件服务
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3040;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // 处理 API 路由
  if (req.url.startsWith('/api/')) {
    handleApi(req, res);
    return;
  }

  // 静态文件服务 - 规范化路径
  let urlPath = req.url === '/' ? '/admin.html' : req.url;
  urlPath = path.normalize(urlPath);
  let filePath = path.join(PUBLIC_DIR, urlPath);
  
  // 安全检查：确保路径在 PUBLIC_DIR 内
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('禁止访问');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  // 添加 UTF-8 字符集
  const charset = ext === '.html' || ext === '.js' || ext === '.css' || ext === '.json' ? '; charset=utf-8' : '';
  
  // 添加缓存控制
  res.setHeader('Cache-Control', 'no-cache');

  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error(`文件读取错误：${filePath}`, err.message);
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`文件不存在：${urlPath}`);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('服务器错误');
      }
    } else {
      console.log(`发送文件：${filePath} (${content.length} bytes)`);
      res.writeHead(200, { 
        'Content-Type': contentType + charset,
        'Content-Length': content.length
      });
      res.end(content);
    }
  });
});

// 简单的 API 处理（可选扩展）
function handleApi(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'API 端点' }));
}

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          JSONDB Web 管理工具已启动                         ║
╚═══════════════════════════════════════════════════════════╝

  🌐 访问地址：http://127.0.0.1:${PORT}
  
  📋 使用说明:
  1. 点击"打开数据库文件夹"按钮
  2. 选择包含 JSON/JSONB 文件的目录
  3. 在左侧选择集合
  4. 执行查询或导出数据
  
  ═══════════════════════════════════════════════════════
  `);
});
