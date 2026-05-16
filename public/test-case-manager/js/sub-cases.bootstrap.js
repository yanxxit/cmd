import {
  initCore,
  loadJS,
} from './lib/core.js';

// 子案例页面启动器：统一初始化页面运行时，直接加载页面模块并挂载
const SUB_CASES_PAGE_MODULE = './js/pages/sub-cases.page.js';

export async function initSubCasesApp() {
  if (!window.getAssetUrl || !window.getModuleUrl || !window.G_VER) {
    initCore(window.__TCM_SUB_CASES_BOOTSTRAP__ || {});
  }

  return {
    G_VER: window.G_VER,
    getAssetUrl: window.getAssetUrl,
    getModuleUrl: window.getModuleUrl,
  };
}

export async function startSubCasesApp(options = {}) {
  const {
    rootId = 'root',
    fallbackHTML = '<p style="padding:24px;color:#ff4d4f">子案例页面加载失败，请刷新重试</p>',
  } = options;

  await initSubCasesApp();

  const rootNode = document.getElementById(rootId);
  if (!rootNode) {
    throw new Error(`root element not found: #${rootId}`);
  }

  try {
    const pageModule = await loadJS(SUB_CASES_PAGE_MODULE);
    const App = pageModule.default;

    if (typeof App !== 'function') {
      throw new Error('sub-cases 页面模块未导出有效的默认组件');
    }

    ReactDOM.createRoot(rootNode).render(React.createElement(App));
  } catch (error) {
    console.error(error);
    rootNode.innerHTML = fallbackHTML;
  }
}
