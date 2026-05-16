// 资源版本与 URL 工具：统一处理开发/生产模式的缓存策略
const DEFAULT_DEV_FLAGS = ['dev', 'nocache'];
const DEFAULT_BUILD_VERSION = window.__APP_BUILD_VERSION__ || '__BUILD_VERSION__';

function resolveUrl(path) {
  return new URL(path, document.baseURI);
}

function isExternalUrl(path) {
  const url = resolveUrl(path);
  return /^https?:$/i.test(url.protocol) && url.origin !== window.location.origin;
}

function appendVersion(url, version) {
  const next = new URL(url.href);
  next.searchParams.set('v', String(version));
  return next.href;
}

export function resolveRuntimeVersion(options = {}) {
  const {
    buildVersion = DEFAULT_BUILD_VERSION,
    devFlags = DEFAULT_DEV_FLAGS,
    search = window.location.search,
  } = options;

  const params = new URLSearchParams(search);
  const isDev = devFlags.some((flag) => params.has(flag));
  const version = isDev ? Date.now() : buildVersion;

  return { isDev, version, buildVersion, devFlags };
}

export function makeAssetUrl(isDev, version) {
  return function getAssetUrl(path) {
    if (isExternalUrl(path)) return path;
    const absolute = resolveUrl(path);
    return appendVersion(absolute, version);
  };
}

export function initAssetRuntime(options = {}) {
  if (
    typeof window.getAssetUrl === 'function' &&
    typeof window.getModuleUrl === 'function' &&
    window.G_VER
  ) {
    return {
      IS_DEV: Boolean(window.IS_DEV),
      G_VER: window.G_VER,
    };
  }

  const { isDev, version } = resolveRuntimeVersion(options);
  const getAssetUrl = makeAssetUrl(isDev, version);

  window.IS_DEV = isDev;
  window.G_VER = version;
  window.getAssetUrl = getAssetUrl;
  window.getModuleUrl = getAssetUrl;

  return {
    IS_DEV: isDev,
    G_VER: version,
  };
}

export function getAssetUrl(path) {
  if (typeof window.getAssetUrl === 'function') {
    return window.getAssetUrl(path);
  }

  const { version } = resolveRuntimeVersion();
  return makeAssetUrl(false, version)(path);
}

export function getModuleUrl(path) {
  return getAssetUrl(path);
}

export function injectStyleLinks(hrefs) {
  const list = Array.isArray(hrefs) ? hrefs : [hrefs];
  list.forEach((href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = getAssetUrl(href);
    document.head.appendChild(link);
  });
}

export { DEFAULT_BUILD_VERSION, DEFAULT_DEV_FLAGS };
