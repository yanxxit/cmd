/**
 * Auto Hash Loader - 自动为模块导入添加 hash 值
 * 
 * 功能：
 * 1. 拦截 import() 动态导入，自动添加 hash 参数
 * 2. 拦截 <script type="module"> 中的导入
 * 3. 支持手动计算文件 hash 并添加
 * 
 * 使用方法：
 * <script src="/shared/auto-hash-loader.js" data-auto-hash="true"></script>
 * 
 * 配置选项（通过 data 属性）：
 * - data-auto-hash="true" - 启用自动 hash
 * - data-hash-length="8" - hash 长度（默认 8）
 * - data-cache-key="v1" - 手动指定版本覆盖
 */

(function() {
  'use strict';

  // 配置
  const config = {
    enabled: true,
    hashLength: 8,
    cacheKey: null,
    debug: false,
    hashCache: new Map() // 缓存文件 hash 值
  };

  // 从 script 标签读取配置
  const script = document.currentScript || document.querySelector('script[data-auto-hash]');
  if (script) {
    config.enabled = script.dataset.autoHash !== 'false';
    config.hashLength = parseInt(script.dataset.hashLength) || 8;
    config.cacheKey = script.dataset.cacheKey || null;
    config.debug = script.dataset.debug === 'true';
  }

  // 日志
  function log(...args) {
    if (config.debug) {
      console.log('[AutoHash]', ...args);
    }
  }

  // 简单的 hash 计算（用于小文件）
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(config.hashLength, '0');
  }

  // 使用 SubtleCrypto API 计算文件 hash（推荐）
  async function computeFileHash(url) {
    const cacheKey = url.split('?')[0]; // 移除查询参数
    
    // 检查缓存
    if (config.hashCache.has(cacheKey)) {
      return config.hashCache.get(cacheKey);
    }

    try {
      const response = await fetch(cacheKey, { method: 'HEAD' });
      // 使用 Last-Modified 或 ETag 作为 hash 基础
      const lastModified = response.headers.get('Last-Modified') || '';
      const etag = response.headers.get('ETag') || '';
      
      if (etag) {
        const hash = etag.replace(/"/g, '').slice(0, config.hashLength);
        config.hashCache.set(cacheKey, hash);
        return hash;
      }
      
      if (lastModified) {
        const hash = simpleHash(lastModified).slice(0, config.hashLength);
        config.hashCache.set(cacheKey, hash);
        return hash;
      }

      // 降级：获取文件内容计算 hash
      const contentResponse = await fetch(cacheKey);
      const content = await contentResponse.text();
      const hash = simpleHash(content).slice(0, config.hashLength);
      config.hashCache.set(cacheKey, hash);
      return hash;
    } catch (error) {
      log('计算 hash 失败:', url, error);
      // 降级：使用时间戳
      return Date.now().toString(16).slice(-config.hashLength);
    }
  }

  // 添加 hash 到 URL
  function addHashToUrl(url, hash) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}hash=${hash}`;
  }

  // 解析相对路径
  function resolvePath(path, base = document.baseURI) {
    try {
      return new URL(path, base).pathname;
    } catch {
      return path;
    }
  }

  // 拦截 import() 函数
  const originalImport = window.import;
  window.import = async function(url) {
    if (!config.enabled || !url) {
      return originalImport.apply(this, arguments);
    }

    // 只处理相对路径的本地模块
    if (url.startsWith('.') || url.startsWith('/')) {
      const resolvedPath = resolvePath(url);
      
      // 使用服务器端 hash（如果可用）
      if (config.cacheKey) {
        const hashUrl = addHashToUrl(url, config.cacheKey);
        log('使用缓存键导入:', hashUrl);
        return originalImport.call(this, hashUrl);
      }

      // 自动计算 hash
      try {
        const hash = await computeFileHash(resolvedPath);
        const hashUrl = addHashToUrl(url, hash);
        log('自动计算 hash 导入:', hashUrl);
        return originalImport.call(this, hashUrl);
      } catch (error) {
        log('hash 计算失败，使用原始 URL:', url);
        return originalImport.apply(this, arguments);
      }
    }

    return originalImport.apply(this, arguments);
  };

  // 处理 <script type="module"> 中的导入
  function processModuleScripts() {
    if (!config.enabled) return;

    document.querySelectorAll('script[type="module"]').forEach(script => {
      const src = script.src;
      if (src && (src.startsWith('/') || src.startsWith('.'))) {
        // 已经处理过的跳过
        if (src.includes('hash=')) return;

        const resolvedPath = resolvePath(src);
        
        if (config.cacheKey) {
          script.src = addHashToUrl(src, config.cacheKey);
          log('处理 script 标签:', script.src);
        } else {
          // 异步计算并更新
          computeFileHash(resolvedPath).then(hash => {
            script.src = addHashToUrl(src, hash);
            log('处理 script 标签:', script.src);
          });
        }
      }

      // 处理内联模块中的 import 语句
      if (!script.src && script.textContent) {
        script.textContent = processImportStatements(script.textContent);
      }
    });
  }

  // 处理 import 语句
  function processImportStatements(code) {
    if (!config.enabled) return code;

    // 匹配 import ... from '...' 语句
    const importRegex = /import\s+([\s\S]*?)\s+from\s+(['"])([^'"]+)\2/g;
    
    return code.replace(importRegex, (match, imports, quote, path) => {
      // 跳过外部依赖
      if (!path.startsWith('.') && !path.startsWith('/')) {
        return match;
      }

      // 跳过已有 hash
      if (path.includes('hash=')) {
        return match;
      }

      // 添加 hash
      if (config.cacheKey) {
        const newPath = addHashToUrl(path, config.cacheKey);
        return `import ${imports} ${quote}${newPath}${quote}`;
      }

      // 异步处理（需要动态导入）
      // 对于静态 import，我们无法异步处理，所以保持原样
      // 服务器端应该处理这个
      return match;
    });
  }

  // 提供手动 API
  window.AutoHash = {
    // 设置缓存键
    setCacheKey(key) {
      config.cacheKey = key;
      log('设置缓存键:', key);
    },

    // 清除缓存
    clearCache() {
      config.hashCache.clear();
      log('清除 hash 缓存');
    },

    // 获取文件的 hash
    async getHash(url) {
      const resolvedPath = resolvePath(url);
      return computeFileHash(resolvedPath);
    },

    // 添加 hash 到 URL
    addHash(url, hash) {
      return addHashToUrl(url, hash);
    },

    // 启用/禁用
    enable() { config.enabled = true; },
    disable() { config.enabled = false; },

    // 配置
    configure(options) {
      Object.assign(config, options);
    }
  };

  // 初始化
  function init() {
    log('AutoHash Loader 初始化', config);
    
    // 处理现有的 script 标签
    processModuleScripts();

    // 监听 DOM 变化
    const observer = new MutationObserver(() => {
      processModuleScripts();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  // 在 DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
