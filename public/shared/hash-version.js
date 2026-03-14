/**
 * Hash Version Manager - 简单的版本管理脚本
 * 
 * 使用方法：
 * 1. 在 HTML 中引入此脚本
 * 2. 设置全局版本号
 * 3. 所有模块导入自动添加版本号
 * 
 * 示例：
 * <script src="/shared/hash-version.js" data-version="1.0.0"></script>
 * <script type="module">
 *   import { greet } from './utils.js'; // 自动添加 ?v=1.0.0
 * </script>
 */

(function(global) {
  'use strict';

  // 配置
  const config = {
    version: '1.0.0',
    debug: false,
    cacheBuster: false // 是否使用随机数强制刷新缓存
  };

  // 从 script 标签读取配置
  const scripts = document.getElementsByTagName('script');
  for (let script of scripts) {
    if (script.src && script.src.includes('hash-version.js')) {
      config.version = script.dataset.version || config.version;
      config.debug = script.dataset.debug === 'true';
      config.cacheBuster = script.dataset.cacheBuster === 'true';
      break;
    }
  }

  // 日志
  function log(...args) {
    if (config.debug) {
      console.log('[HashVersion]', ...args);
    }
  }

  // 添加版本参数到 URL
  function addVersionToUrl(url) {
    const separator = url.includes('?') ? '&' : '?';
    const param = config.cacheBuster 
      ? `_t=${Date.now()}` 
      : `v=${config.version}`;
    return `${url}${separator}${param}`;
  }

  // 解析相对路径
  function resolvePath(path, base = document.baseURI) {
    try {
      return new URL(path, base).pathname;
    } catch {
      return path;
    }
  }

  // 检查是否是本地模块
  function isLocalModule(url) {
    return url && (url.startsWith('.') || url.startsWith('/') || url.startsWith('http'));
  }

  // 检查 URL 是否已有版本参数
  function hasVersion(url) {
    return url.includes('v=') || url.includes('hash=') || url.includes('_t=');
  }

  // 拦截 import() 函数
  const originalImport = global.import;
  global.import = async function(url) {
    if (!isLocalModule(url) || hasVersion(url)) {
      return originalImport.apply(this, arguments);
    }

    const newUrl = addVersionToUrl(url);
    log('导入模块:', newUrl);
    return originalImport.call(this, newUrl);
  };

  // 处理 <script type="module"> 标签
  function processModuleScripts() {
    document.querySelectorAll('script[type="module"]').forEach(script => {
      const src = script.src;
      if (src && isLocalModule(src) && !hasVersion(src)) {
        script.src = addVersionToUrl(src);
        log('处理 script 标签:', script.src);
      }
    });
  }

  // 处理动态创建的 script 标签
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName, options) {
    const element = originalCreateElement.call(document, tagName, options);
    if (tagName === 'script') {
      const originalSetAttribute = element.setAttribute.bind(element);
      element.setAttribute = function(name, value) {
        if (name === 'src' && isLocalModule(value) && !hasVersion(value)) {
          value = addVersionToUrl(value);
          log('动态 script 标签:', value);
        }
        return originalSetAttribute(name, value);
      };

      // 拦截 src 属性设置
      Object.defineProperty(element, 'src', {
        set(value) {
          if (isLocalModule(value) && !hasVersion(value)) {
            value = addVersionToUrl(value);
            log('动态设置 src:', value);
          }
          this.setAttribute('src', value);
        },
        get() {
          return this.getAttribute('src');
        }
      });
    }
    return element;
  };

  // 提供公共 API
  global.HashVersion = {
    // 设置版本号
    setVersion(version) {
      config.version = version;
      log('设置版本号:', version);
    },

    // 获取版本号
    getVersion() {
      return config.version;
    },

    // 启用缓存刷新模式
    enableCacheBuster() {
      config.cacheBuster = true;
      log('启用缓存刷新模式');
    },

    // 禁用缓存刷新模式
    disableCacheBuster() {
      config.cacheBuster = false;
      log('禁用缓存刷新模式');
    },

    // 添加版本到任意 URL
    addVersion(url) {
      return addVersionToUrl(url);
    }
  };

  // 初始化
  function init() {
    log('Hash Version Manager 初始化', config);
    processModuleScripts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(typeof window !== 'undefined' ? window : this);
