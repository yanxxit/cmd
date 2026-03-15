/**
 * Web IDE Lite v2 - 资源模块加载器
 * 
 * 使用 ES Modules 方式导入 CSS 和 JS 资源
 * 支持自动添加 hash 值，方便缓存更新
 */

// 导入 CSS（通过 JS 动态创建 link 标签）
export function loadCSS(url, options = {}) {
  const { hash, media = 'all' } = options;
  
  // 添加 hash 到 URL
  const finalUrl = hash ? `${url}?hash=${hash}` : url;
  
  // 检查是否已加载
  const existingLink = document.querySelector(`link[href^="${url}"]`);
  if (existingLink) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = finalUrl;
    link.media = media;
    
    link.onload = () => {
      console.log(`[CSS Loader] 已加载：${url}`);
      resolve();
    };
    
    link.onerror = (err) => {
      console.error(`[CSS Loader] 加载失败：${url}`, err);
      reject(err);
    };
    
    document.head.appendChild(link);
  });
}

// 导入 JS 模块
export async function loadModule(url, options = {}) {
  const { hash } = options;
  
  // 添加 hash 到 URL
  const finalUrl = hash ? `${url}?hash=${hash}` : url;
  
  try {
    const module = await import(finalUrl);
    console.log(`[Module Loader] 已加载：${url}`);
    return module;
  } catch (err) {
    console.error(`[Module Loader] 加载失败：${url}`, err);
    throw err;
  }
}

// 批量加载 CSS
export async function loadCSSBatch(urls) {
  await Promise.all(urls.map(url => loadCSS(url)));
}

// 批量加载 JS 模块
export async function loadModulesBatch(urls) {
  const modules = [];
  for (const url of urls) {
    const module = await loadModule(url);
    modules.push(module);
  }
  return modules;
}

// 动态 Import Map
export function setupImportMap(imports) {
  const script = document.createElement('script');
  script.type = 'importmap';
  script.textContent = JSON.stringify({ imports });
  document.head.appendChild(script);
}

// 初始化所有资源
export async function initResources(options = {}) {
  const {
    cssFiles = [],
    jsModules = [],
    importMap = {}
  } = options;
  
  console.log('[Resource Loader] 开始初始化资源');
  
  // 设置 Import Map
  if (Object.keys(importMap).length > 0) {
    setupImportMap(importMap);
  }
  
  // 加载 CSS
  if (cssFiles.length > 0) {
    await loadCSSBatch(cssFiles);
  }
  
  // 加载 JS 模块
  if (jsModules.length > 0) {
    await loadModulesBatch(jsModules);
  }
  
  console.log('[Resource Loader] 资源初始化完成');
}

// 获取文件 hash（从服务器或计算）
export async function getFileHash(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const etag = response.headers.get('ETag');
    const lastModified = response.headers.get('Last-Modified');
    
    if (etag) {
      return etag.replace(/"/g, '');
    }
    
    if (lastModified) {
      return btoa(lastModified).slice(0, 8);
    }
    
    // 降级：使用时间戳
    return Date.now().toString(16).slice(-8);
  } catch (e) {
    console.warn(`[Hash] 无法获取 ${url} 的 hash`);
    return null;
  }
}

// 自动添加 hash 到导入
export async function importWithHash(url) {
  const hash = await getFileHash(url);
  const finalUrl = hash ? `${url}?hash=${hash}` : url;
  return import(finalUrl);
}
