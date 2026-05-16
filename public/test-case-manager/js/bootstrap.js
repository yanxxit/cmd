import {
  initCore,
  loadJSBatch,
  loadDescriptorModules,
  startDescriptorApp,
} from './lib/core.js';

// ESM 核心装配：统一导入业务模块、编译 JSX descriptor 模块并启动应用
const CORE_MODULES = {
  api: './js/api.js',
  icons: './js/icons.js',
  format: './js/format.js',
  style: './js/style-loader.js',
};

const APP_MODULE_FILES = [
  './js/components/StatsPanel.js',
  './js/components/TestCaseList.js',
  './js/components/CollectionManager.js',
  './js/pages/cases.page.js',
  './js/pages/collections.page.js',
  './js/pages/index.page.js',
];

async function importCoreModules() {
  const entries = Object.entries(CORE_MODULES);
  const resolved = await loadJSBatch(entries.map(([, path]) => path));

  return entries.reduce((acc, [key], index) => {
    const mod = resolved[index];
    acc[key] = key === 'api' ? mod.api : mod;
    return acc;
  }, {});
}

export async function initCoreApp() {
  if (!window.getAssetUrl || !window.getModuleUrl || !window.G_VER) {
    initCore(window.__TCM_BOOTSTRAP__ || {});
  }

  const modules = await importCoreModules();
  window.__APP__ = {
    ...modules,
    G_VER: window.G_VER,
    getAssetUrl: window.getAssetUrl,
    getModuleUrl: window.getModuleUrl,
    components: {},
    pages: {},
  };
  window.dispatchEvent(new CustomEvent('esm-ready'));
  return window.__APP__;
}

export async function loadAppModules(files = APP_MODULE_FILES) {
  return loadDescriptorModules(files, { app: window.__APP__ });
}

export async function startApp({
  pageKey = 'index',
  rootId = 'root',
  fallbackHTML = '<p style="padding:24px;color:#ff4d4f">页面加载失败，请刷新重试</p>',
} = {}) {
  await startDescriptorApp({
    pageKey,
    rootId,
    fallbackHTML,
    afterRender: async () => {
      setTimeout(() => {
        try {
          lucide.createIcons();
        } catch (error) {}
      }, 100);
    },
  });
}

export { APP_MODULE_FILES };
