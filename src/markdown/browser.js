import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

/**
 * 在浏览器中打开 Markdown 文件
 * @param {string} filePath - Markdown 文件路径
 * @param {number} port - 服务器端口
 */
export async function browseMarkdown(filePath, port = 0) {
  try {
    // 检查文件是否存在
    await fs.access(filePath);

    // 读取 Markdown 文件内容
    const markdownContent = await fs.readFile(filePath, 'utf8');

    // 将 Markdown 转换为 HTML
    const htmlContent = marked.parse(markdownContent);

    // 创建 Express 应用
    const app = express();

    // 定义路由
    app.get('/', (req, res) => {
      const htmlPage = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Browser - ${path.basename(filePath)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #2c3e50;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    code {
      background-color: #f8f8f8;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }
    pre {
      background-color: #f8f8f8;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 15px;
      margin-left: 0;
      color: #777;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="markdown-body">
    ${htmlContent}
  </div>
</body>
</html>`;
      res.send(htmlPage);
    });

    // 启动服务器
    const server = app.listen(port, () => {
      const serverPort = server.address().port;
      const url = `http://localhost:${serverPort}`;
      console.log(`\x1b[32m✅ Markdown 文件已渲染到网页: ${url}\x1b[0m`);
      console.log(`\x1b[33m📁 源文件: ${filePath}\x1b[0m`);
      console.log(`\x1b[36mℹ️  按 Ctrl+C 停止服务器\x1b[0m`);

      // 在浏览器中打开页面
      openBrowser(url);
    });

    // 返回服务器实例以便外部管理
    return server;

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`\x1b[31m❌ 错误: 文件不存在 - ${filePath}\x1b[0m`);
    } else {
      console.error('\x1b[31m❌ 错误: 处理文件时发生错误\x1b[0m');
      console.error(error.message);
    }
    throw error;
  }
}

// 打开浏览器的函数
async function openBrowser(url) {
  const platform = os.platform();

  try {
    if (platform === 'darwin') {  // macOS
      await execAsync(`open "${url}"`);
    } else if (platform === 'win32') {  // Windows
      await execAsync(`start "${url}"`);
    } else {  // Linux 和其他平台
      await execAsync(`xdg-open "${url}"`);
    }
  } catch (error) {
    // 如果自动打开浏览器失败，提示用户手动打开
    console.log(`\x1b[33m⚠️  无法自动打开浏览器，请手动访问: ${url}\x1b[0m`);
  }
}