// 与 SKILL.md (native-esm-importmaps) 同款：按需加载并去重的 CSS 工具
const loaded = new Map();
const ver = () => window.G_VER || Date.now();

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

export function unloadCSS(href) {
  const promise = loaded.get(href);
  if (!promise) return;
  promise.then((link) => link.remove()).catch(() => {});
  loaded.delete(href);
}

export default { loadCSS, unloadCSS };
