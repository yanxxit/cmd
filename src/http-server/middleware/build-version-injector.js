import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { computeFileHash } from '../hash-middleware.js';

/**
 * 递归收集目录下的所有文件。
 * 这里用于计算目录级版本号，让一个页面目录内任意文件变化时都能触发版本更新。
 */
function listFilesRecursively(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return listFilesRecursively(fullPath);
    }
    return entry.name === '.DS_Store' ? [] : [fullPath];
  });
}

/**
 * 基于整个目录的文件指纹生成稳定版本号。
 * 适用于 zero-build 场景：不需要真正打包，只要目录内容有改动，版本号就会变化。
 */
export function computeDirectoryBuildVersion(dirPath) {
  const files = listFilesRecursively(dirPath).sort((a, b) => a.localeCompare(b));
  const fingerprint = files
    .map((filePath) => `${path.relative(dirPath, filePath)}:${computeFileHash(filePath, 8)}`)
    .join('|');
  return crypto.createHash('md5').update(fingerprint).digest('hex').slice(0, 12);
}

/**
 * 在 HTML 中注入运行时可读取的构建版本号。
 * 页面里的 bootstrap 配置会优先读取 window.__APP_BUILD_VERSION__，从而避免保留占位符字符串。
 */
export function injectBuildVersionToHtml(html, buildVersion) {
  const injection = `  <script>window.__APP_BUILD_VERSION__ = '${buildVersion}';</script>\n`;
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>\n${injection}`);
  }
  return `${injection}${html}`;
}

/**
 * 读取 HTML 文件并返回已注入版本号的内容。
 */
export function sendHtmlWithBuildVersion(res, htmlFilePath, buildVersion) {
  const html = fs.readFileSync(htmlFilePath, 'utf8');
  const content = injectBuildVersionToHtml(html, buildVersion);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(content);
}

/**
 * 创建一个只处理 `.html` 请求的版本号注入中间件。
 * 适合挂在某个静态目录前面，让直接访问 HTML 文件时也能自动拿到真实版本号。
 */
export function createHtmlBuildVersionMiddleware({ baseDir, getBuildVersion }) {
  return (req, res, next) => {
    if (!req.path.endsWith('.html')) {
      return next();
    }

    const htmlPath = path.resolve(baseDir, req.path.replace(/^\/+/, ''));
    if (!htmlPath.startsWith(baseDir) || !fs.existsSync(htmlPath)) {
      return next();
    }

    try {
      sendHtmlWithBuildVersion(res, htmlPath, getBuildVersion());
    } catch (error) {
      next(error);
    }
  };
}
