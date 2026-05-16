import { initCore, loadJS } from './lib/core.js';

const MEMBER_CENTER_PAGE_MODULE = './js/pages/member-center.page.js';

export async function startMemberCenterApp(options = {}) {
  if (!window.getAssetUrl || !window.getModuleUrl || !window.G_VER) {
    initCore(window.__TCM_MEMBER_CENTER_BOOTSTRAP__ || {});
  }

  const rootNode = document.getElementById(options.rootId || 'member-center-root');
  if (!rootNode) {
    throw new Error('member center root element not found');
  }

  try {
    const pageModule = await loadJS(MEMBER_CENTER_PAGE_MODULE);
    const App = pageModule.default;
    ReactDOM.createRoot(rootNode).render(React.createElement(App));

    setTimeout(() => {
      try {
        lucide.createIcons();
      } catch (error) {}
    }, 80);
  } catch (error) {
    console.error(error);
    rootNode.innerHTML = '<div style="padding:40px;text-align:center;color:#ff4d4f;">会员中心加载失败，请刷新重试</div>';
  }
}

