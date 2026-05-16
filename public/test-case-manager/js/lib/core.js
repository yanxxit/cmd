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
let descriptorLoaderPromise;

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

function getDescriptorLoader() {
  if (!descriptorLoaderPromise) {
    descriptorLoaderPromise = loadJS('./js/util/jsx-loader.js');
  }
  return descriptorLoaderPromise;
}

/**
 * 注册 descriptor 到全局 __APP__ 命名空间
 *
 * @param {Object} descriptor descriptor 模块默认导出
 * @param {Object} [app=window.__APP__] 目标 app 命名空间
 */
export function registerDescriptor(descriptor, app = window.__APP__) {
  if (!descriptor || typeof descriptor !== 'object') {
    throw new Error('模块未导出有效的 descriptor');
  }

  if (!app) {
    throw new Error('__APP__ 尚未初始化，无法注册 descriptor');
  }

  if (descriptor.type === 'component') {
    if (!descriptor.name || typeof descriptor.component !== 'function') {
      throw new Error('component descriptor 缺少 name 或 component');
    }
    app.components = app.components || {};
    app.components[descriptor.name] = descriptor.component;
    return descriptor;
  }

  if (descriptor.type === 'page') {
    if (!descriptor.key) {
      throw new Error('page descriptor 缺少 key');
    }

    const pageRecord = {
      title: descriptor.title || descriptor.key,
    };

    if (typeof descriptor.component === 'function') {
      pageRecord.Component = descriptor.component;
    }
    if (typeof descriptor.App === 'function') {
      pageRecord.App = descriptor.App;
    }
    if (descriptor.registeredKeys) {
      pageRecord.registeredKeys = descriptor.registeredKeys;
    }

    app.pages = app.pages || {};
    app.pages[descriptor.key] = pageRecord;
    return descriptor;
  }

  throw new Error(`未知 descriptor 类型: ${descriptor.type}`);
}

/**
 * 批量加载 JSX descriptor 模块并注册到 __APP__
 *
 * @param {string[]} paths descriptor 文件路径
 * @param {Object} [options]
 * @param {Object} [options.app=window.__APP__] 目标 app 命名空间
 */
export async function loadDescriptorModules(paths, options = {}) {
  const { app = window.__APP__ } = options;
  const { importBabelModule } = await getDescriptorLoader();
  const descriptors = [];

  for (const path of paths) {
    const mod = await importBabelModule(path);
    const descriptor = mod.default || mod.descriptor;
    registerDescriptor(descriptor, app);
    descriptors.push(descriptor);
  }

  return descriptors;
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
 * 等待某个页面 App 就绪，适用于 descriptor 页面启动链路
 *
 * @param {Object} options
 * @param {string} [options.pageKey='index'] 页面 key
 * @param {number} [options.timeout=10000] 超时时间
 * @param {string} [options.eventName='esm-ready'] 等待的全局事件
 */
export async function waitForDescriptorApp(options = {}) {
  const {
    pageKey = 'index',
    timeout = 10000,
    eventName = 'esm-ready',
  } = options;

  if (!window.__APP__) {
    await new Promise((resolve) => {
      window.addEventListener(eventName, resolve, { once: true });
    });
  }

  await new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.__APP__?.pages?.[pageKey]?.App) return resolve();
      if (Date.now() - start > timeout) {
        return reject(new Error('页面加载超时'));
      }
      setTimeout(tick, 30);
    };
    tick();
  });
}

/**
 * 启动 descriptor 页面：等待 App、挂载 React、执行渲染后钩子
 *
 * @param {Object} options
 * @param {string} [options.pageKey='index'] 页面 key
 * @param {string} [options.rootId='root'] 挂载根节点 id
 * @param {number} [options.timeout=10000] 页面等待超时
 * @param {string} [options.fallbackHTML] 渲染失败时的降级 HTML
 * @param {() => void | Promise<void>} [options.afterRender] 渲染完成后的钩子
 */
export async function startDescriptorApp(options = {}) {
  const {
    pageKey = 'index',
    rootId = 'root',
    timeout = 10000,
    fallbackHTML = '<p style="padding:24px;color:#ff4d4f">页面加载失败，请刷新重试</p>',
    afterRender,
  } = options;

  const rootNode = document.getElementById(rootId);
  if (!rootNode) {
    throw new Error(`root element not found: #${rootId}`);
  }

  try {
    await waitForDescriptorApp({ pageKey, timeout });
  } catch (error) {
    console.error(error);
    rootNode.innerHTML = fallbackHTML;
    return;
  }

  const App = window.__APP__.pages[pageKey].App;
  ReactDOM.createRoot(rootNode).render(React.createElement(App));

  if (typeof afterRender === 'function') {
    await afterRender();
  }
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
