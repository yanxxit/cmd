import { initCore, loadJS } from './lib/core.js';

const ARTICLE_VIEW_PAGE_MODULE = './js/pages/article-view.page.js';

export async function startArticleViewApp(options = {}) {
  if (!window.getAssetUrl || !window.getModuleUrl || !window.G_VER) {
    initCore(window.__TCM_ARTICLE_VIEW_BOOTSTRAP__ || {});
  }

  const rootNode = document.getElementById(options.rootId || 'article-root');
  if (!rootNode) {
    throw new Error('article root element not found');
  }

  try {
    const pageModule = await loadJS(ARTICLE_VIEW_PAGE_MODULE);
    const App = pageModule.default;
    ReactDOM.createRoot(rootNode).render(React.createElement(App));
  } catch (error) {
    console.error(error);
    rootNode.innerHTML = '<div style="padding:40px;text-align:center;color:#ff4d4f;">文章阅读页加载失败，请刷新重试</div>';
  }
}
