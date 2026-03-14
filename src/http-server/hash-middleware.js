/**
 * 静态资源 Hash 中间件
 * 
 * 功能：
 * 1. 为静态资源 URL 自动添加 hash 参数
 * 2. 支持基于文件修改时间的 hash 生成
 * 3. 支持缓存控制头
 * 
 * 使用示例：
 * app.use('/web-ide-lite-v2', hashMiddleware('./public/web-ide-lite-v2'));
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 缓存文件 hash 值
const hashCache = new Map();

/**
 * 计算文件 hash
 * @param {string} filePath - 文件路径
 * @param {number} length - hash 长度
 * @returns {string} - 文件 hash 值
 */
export function computeFileHash(filePath, length = 8) {
  const cacheKey = filePath;
  
  // 检查缓存
  if (hashCache.has(cacheKey)) {
    const cached = hashCache.get(cacheKey);
    // 检查文件是否已修改
    try {
      const stats = fs.statSync(filePath);
      const mtime = stats.mtimeMs;
      if (cached.mtime === mtime) {
        return cached.hash;
      }
    } catch (e) {
      // 文件不存在，返回旧 hash
      return cached.hash;
    }
  }

  try {
    // 读取文件内容计算 hash
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5').update(content).digest('hex');
    const shortHash = hash.slice(0, length);
    
    // 缓存 hash 值
    const stats = fs.statSync(filePath);
    hashCache.set(cacheKey, {
      hash: shortHash,
      mtime: stats.mtimeMs
    });
    
    return shortHash;
  } catch (error) {
    console.error('[HashMiddleware] 计算文件 hash 失败:', filePath, error.message);
    // 降级：使用修改时间
    try {
      const stats = fs.statSync(filePath);
      return (stats.mtimeMs % 100000000).toString(16).padStart(8, '0');
    } catch {
      return Date.now().toString(16).slice(-8);
    }
  }
}

/**
 * 清除 hash 缓存
 * @param {string} filePath - 可选，指定文件路径
 */
export function clearHashCache(filePath) {
  if (filePath) {
    hashCache.delete(filePath);
  } else {
    hashCache.clear();
  }
}

/**
 * 从 URL 中提取 hash 参数
 * @param {string} url - URL 字符串
 * @returns {string|null} - hash 值或 null
 */
export function extractHashFromUrl(url) {
  const match = url.match(/[?&](?:hash|v|_t)=([^&]+)/);
  return match ? match[1] : null;
}

/**
 * 从 URL 中移除 hash 参数
 * @param {string} url - URL 字符串
 * @returns {string} - 移除 hash 后的 URL
 */
export function removeHashFromUrl(url) {
  return url.replace(/[?&](?:hash|v|_t)=[^&]+/g, '').replace(/[?&]$/, '');
}

/**
 * 创建静态资源 hash 中间件
 * @param {string} rootDir - 静态资源根目录
 * @param {Object} options - 配置选项
 * @param {number} options.hashLength - hash 长度（默认 8）
 * @param {string} options.cacheControl - 缓存控制头（默认 'public, max-age=31536000'）
 * @param {boolean} options.enableCache - 是否启用缓存（默认 true）
 * @returns {Function} - Express 中间件函数
 */
export function createHashMiddleware(rootDir, options = {}) {
  const {
    hashLength = 8,
    cacheControl = 'public, max-age=31536000, immutable',
    enableCache = true
  } = options;

  const absoluteRootDir = path.resolve(rootDir);

  return (req, res, next) => {
    // 只处理带有 hash 参数的请求
    const hash = extractHashFromUrl(req.url);
    
    if (!hash) {
      // 没有 hash 参数，继续下一个中间件
      return next();
    }

    // 移除 hash 参数获取真实路径
    const cleanUrl = removeHashFromUrl(req.url);
    const filePath = path.join(absoluteRootDir, cleanUrl);

    // 安全检查：确保文件在根目录内
    if (!filePath.startsWith(absoluteRootDir)) {
      return next();
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return next();
    }

    // 计算当前文件的 hash
    const currentHash = computeFileHash(filePath, hashLength);

    // 设置缓存控制头
    if (enableCache) {
      res.setHeader('Cache-Control', cacheControl);
      res.setHeader('ETag', `"${currentHash}"`);
      res.setHeader('Vary', 'Accept-Encoding');
    }

    // 如果 hash 不匹配，返回 404 或重定向
    if (hash !== currentHash && hash !== 'latest') {
      // 可选：返回 404 或者继续处理（允许旧版本缓存存在）
      // return res.status(404).send('Resource not found');
      
      // 这里选择继续处理，允许旧版本缓存
      console.log(`[HashMiddleware] Hash 不匹配：${hash} !== ${currentHash}`);
    }

    // 继续处理请求
    next();
  };
}

/**
 * 为 HTML 文件中的模块导入自动添加 hash
 * @param {string} htmlContent - HTML 内容
 * @param {string} baseDir - 基础目录
 * @param {number} hashLength - hash 长度
 * @returns {string} - 处理后的 HTML 内容
 */
export function injectHashToHtml(htmlContent, baseDir, hashLength = 8) {
  // 处理 <script type="module" src="...">
  htmlContent = htmlContent.replace(
    /<script([^>]*)\s+src=["']([^"']+\.js)["']([^>]*)>/g,
    (match, before, src, after) => {
      // 跳过外部资源
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
        return match;
      }
      
      // 跳过已有 hash
      if (src.includes('hash=') || src.includes('v=')) {
        return match;
      }

      // 解析相对路径
      let filePath;
      if (src.startsWith('/')) {
        filePath = path.join(baseDir, '..' + src);
      } else {
        filePath = path.join(baseDir, src);
      }

      if (fs.existsSync(filePath)) {
        const hash = computeFileHash(filePath, hashLength);
        const separator = src.includes('?') ? '&' : '?';
        const newSrc = `${src}${separator}hash=${hash}`;
        return `<script${before} src="${newSrc}"${after}>`;
      }

      return match;
    }
  );

  // 处理 <link rel="stylesheet" href="...">
  htmlContent = htmlContent.replace(
    /<link([^>]*)\s+href=["']([^"']+\.css)["']([^>]*)>/g,
    (match, before, href, after) => {
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
        return match;
      }
      
      if (href.includes('hash=') || href.includes('v=')) {
        return match;
      }

      let filePath;
      if (href.startsWith('/')) {
        filePath = path.join(baseDir, '..' + href);
      } else {
        filePath = path.join(baseDir, href);
      }

      if (fs.existsSync(filePath)) {
        const hash = computeFileHash(filePath, hashLength);
        const separator = href.includes('?') ? '&' : '?';
        const newHref = `${href}${separator}hash=${hash}`;
        return `<link${before} href="${newHref}"${after}>`;
      }

      return match;
    }
  );

  return htmlContent;
}

/**
 * 创建带 hash 注入的静态文件服务中间件
 * @param {string} rootDir - 静态资源根目录
 * @param {Object} options - 配置选项
 * @returns {Function} - Express 中间件函数
 */
export function createStaticWithHashInjection(rootDir, options = {}) {
  const { hashLength = 8 } = options;
  const absoluteRootDir = path.resolve(rootDir);

  return (req, res, next) => {
    // 只处理 HTML 文件
    if (!req.path.endsWith('.html')) {
      return next();
    }

    const filePath = path.join(absoluteRootDir, req.path);
    
    if (!fs.existsSync(filePath)) {
      return next();
    }

    try {
      // 读取 HTML 内容
      let htmlContent = fs.readFileSync(filePath, 'utf8');
      
      // 注入 hash
      htmlContent = injectHashToHtml(htmlContent, filePath, hashLength);
      
      // 发送处理后的内容
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);
    } catch (error) {
      console.error('[HashInjection] 处理 HTML 文件失败:', error.message);
      next();
    }
  };
}
