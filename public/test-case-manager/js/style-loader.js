// js/style-loader.js - 按需加载并去重的样式工具
// 与 SKILL.md (native-esm-importmaps) 中样式管理方案保持一致
const loaded = new Map(); // href -> Promise<HTMLLinkElement>

const ver = () => window.G_VER || Date.now();

/**
 * 异步加载一个 CSS 文件，自动拼版本号防缓存。
 * 同一 href 仅加载一次，重复调用返回同一个 Promise。
 *
 * @param {string} href 相对/绝对 CSS 路径
 * @returns {Promise<HTMLLinkElement>} resolve 时表示样式已应用
 */
export function loadCSS(href) {
  if (loaded.has(href)) return loaded.get(href);

  const p = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${href}?v=${ver()}`;
    link.dataset.lazy = '1';
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`CSS load failed: ${href}`));
    document.head.appendChild(link);
  });

  loaded.set(href, p);
  return p;
}

/**
 * 卸载之前由 loadCSS 加载的样式，可用于路由切换时清理
 */
export function unloadCSS(href) {
  const promise = loaded.get(href);
  if (!promise) return;
  promise.then((link) => link.remove()).catch(() => {});
  loaded.delete(href);
}

/** 批量串行加载，任一失败则整体 reject */
export async function loadCSSBatch(hrefs) {
  for (const href of hrefs) {
    await loadCSS(href);
  }
}

export default { loadCSS, unloadCSS, loadCSSBatch };
