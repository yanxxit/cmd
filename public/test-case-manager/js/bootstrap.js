import {
  initCore,
  loadJS,
} from './lib/core.js';

const MAIN_PAGE_MODULE = './js/pages/index.page.js';

export async function startApp({
  rootId = 'root',
  fallbackHTML = '<p style="padding:24px;color:#ff4d4f">页面加载失败，请刷新重试</p>',
} = {}) {
  if (!window.getAssetUrl || !window.getModuleUrl || !window.G_VER) {
    initCore(window.__TCM_BOOTSTRAP__ || {});
  }

  const rootNode = document.getElementById(rootId);
  if (!rootNode) {
    throw new Error(`root element not found: #${rootId}`);
  }

  try {
    const pageModule = await loadJS(MAIN_PAGE_MODULE);
    const App = pageModule.default;

    if (typeof App !== 'function') {
      throw new Error('主页面模块未导出有效的默认组件');
    }

    ReactDOM.createRoot(rootNode).render(React.createElement(App));

    setTimeout(() => {
      try {
        lucide.createIcons();
      } catch (error) {}
    }, 100);
  } catch (error) {
    console.error(error);
    rootNode.innerHTML = fallbackHTML;
  }
}
