import { initCore, loadJS } from './lib/core.js';

const MEMBER_H5_PAGE_MODULE = './js/pages/member-h5.page.js';

export async function startMemberH5App(options = {}) {
  if (!window.getAssetUrl || !window.getModuleUrl || !window.G_VER) {
    initCore(window.__TCM_MEMBER_H5_BOOTSTRAP__ || {});
  }

  const rootNode = document.getElementById(options.rootId || 'member-h5-root');
  if (!rootNode) {
    throw new Error('member h5 root element not found');
  }

  try {
    const pageModule = await loadJS(MEMBER_H5_PAGE_MODULE);
    const App = pageModule.default;
    ReactDOM.createRoot(rootNode).render(React.createElement(App));
  } catch (error) {
    console.error(error);
    rootNode.innerHTML = '<div style="padding:32px;text-align:center;color:#ff4d4f;">用户登录页加载失败，请刷新重试</div>';
  }
}
