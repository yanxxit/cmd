// core.js —— 公共基础设施
// 统一管理：版本号控制、资源 URL 生成、JS/CSS 加载

/**
 * 初始化全局环境
 * 必须在所有模块加载前同步调用（已在 HTML <head> 内联脚本中执行）
 *
 * @param {Object} options
 * @param {string} [options.buildVersion] 构建时注入的版本号占位符
 * @param {string[]} [options.devFlags=['dev','nocache']] 开启开发模式的 URL 参数名
 */
export function initCore(options = {}) {
  const {
    buildVersion = '__BUILD_VERSION__',
    devFlags = ['dev', 'nocache'],
  } = options;

  const urlParams = new URLSearchParams(window.location.search);
  const IS_DEV = devFlags.some((flag) => urlParams.has(flag));

  // 开发模式用时间戳防缓存；生产模式用固定版本号利用缓存
  const G_VER = IS_DEV ? Date.now() : buildVersion;

  window.IS_DEV = IS_DEV;
  window.G_VER = G_VER;
  window.getAssetUrl = makeAssetUrl(G_VER);
  window.getModuleUrl = window.getAssetUrl;

  return { IS_DEV, G_VER };
}

/**
 * 构造资源 URL 生成器
 * - 本地资源（./ 或 ../ 或 / 开头）：相对 HTML 解析为绝对 URL，并拼接版本号
 *   这样无论调用方在哪个目录，import()/link 都能正确寻址
 * - 第三方 CDN（http/https）：原样返回，由 CDN 自带缓存策略管理
 */
function makeAssetUrl(ver) {
  return function getAssetUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('./') || path.startsWith('/') || path.startsWith('../')) {
      const absolute = new URL(path, document.baseURI).href;
      return `${absolute}?v=${ver}`;
    }
    return path;
  };
}

/**
 * 获取资源 URL（兼容 core 未初始化的情况）
 */
export function getAssetUrl(path) {
  if (typeof window.getAssetUrl === 'function') {
    return window.getAssetUrl(path);
  }
  const ver = window.G_VER || Date.now();
  return `${path}?v=${ver}`;
}

export function getModuleUrl(path) {
  if (typeof window.getModuleUrl === 'function') {
    return window.getModuleUrl(path);
  }
  return getAssetUrl(path);
}

// ============================================================
// JS 模块加载
// ============================================================

const jsCache = new Map();

/**
 * 动态加载 JS 模块（自动拼版本号 + 去重）
 * @param {string} path 模块路径，相对路径或别名
 * @returns {Promise<Module>} ES Module 命名空间对象
 */
export function loadJS(path) {
  if (jsCache.has(path)) return jsCache.get(path);
  const promise = import(getModuleUrl(path));
  jsCache.set(path, promise);
  return promise;
}

/**
 * 批量串行加载 JS，返回模块数组
 */
export async function loadJSBatch(paths) {
  const modules = [];
  for (const p of paths) {
    modules.push(await loadJS(p));
  }
  return modules;
}

// ============================================================
// CSS 加载
// ============================================================

const cssCache = new Map();

/**
 * 动态加载 CSS（自动拼版本号 + 去重）
 * @param {string} href CSS 路径
 * @returns {Promise<HTMLLinkElement>} resolve 时表示样式已应用
 */
export function loadCSS(href) {
  if (cssCache.has(href)) return cssCache.get(href);

  const promise = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = getAssetUrl(href);
    link.dataset.lazy = '1';
    link.dataset.href = href;
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`CSS load failed: ${href}`));
    document.head.appendChild(link);
  });

  cssCache.set(href, promise);
  return promise;
}

/**
 * 卸载之前由 loadCSS 加载的样式
 */
export function unloadCSS(href) {
  const promise = cssCache.get(href);
  if (!promise) return;
  promise.then((link) => link.remove()).catch(() => {});
  cssCache.delete(href);
}

/**
 * 同步注入 CSS（首屏关键样式专用，避免 FOUC）
 * 直接同步插入 <link>，无需 await onload
 */
export function injectCSS(hrefs) {
  const list = Array.isArray(hrefs) ? hrefs : [hrefs];
  list.forEach((href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = getAssetUrl(href);
    document.head.appendChild(link);
  });
}

/**
 * 批量串行加载 CSS
 */
export async function loadCSSBatch(hrefs) {
  for (const href of hrefs) {
    await loadCSS(href);
  }
}

// ============================================================
// 页面启动器：组合 CSS + JS 的常见加载场景
// ============================================================

/**
 * 启动一个页面：注入首屏 CSS、加载入口 JS 模块、调用入口 init 方法
 *
 * @param {Object} config
 * @param {string[]} [config.styles=[]] 首屏关键 CSS 列表（同步注入）
 * @param {string} config.entry 页面入口 JS 路径，例如 './js/index.js'
 * @param {string} [config.initMethod='initPage'] 入口模块导出的初始化函数名
 * @returns {Promise<{module: any, result: any}>}
 */
export async function bootstrapPage(config) {
  const { styles = [], entry, initMethod = 'initPage' } = config;

  if (styles.length) injectCSS(styles);

  const mod = await loadJS(entry);

  let result;
  if (typeof mod[initMethod] === 'function') {
    result = await mod[initMethod]();
  }

  return { module: mod, result };
}

/**
 * 输出当前运行模式（调试用）
 */
export function logMode(label = '当前模式') {
  console.log(
    `${label}：%c${window.IS_DEV ? '🔧 开发模式（防缓存）' : '🚀 生产模式（固定版本）'}%c  版本号：${window.G_VER}`,
    'color:#1890ff;font-weight:bold;',
    'color:#888;',
  );
}
