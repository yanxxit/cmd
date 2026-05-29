// Template app: wire shell, data and render flow.
import dayjs from 'dayjs';

const v = window.G_VER || Date.now();
const [{ renderPageShell }, { qs }, { fetchTemplateSummary }] = await Promise.all([
  import(`./components/page-shell.js?v=${v}`),
  import(`./utils/dom.js?v=${v}`),
  import(`./services/mock-api.js?v=${v}`)
]);

export async function createTemplateApp({ mount = '#app' } = {}) {
  const root = qs(mount);
  if (!root) {
    throw new Error(`Mount node not found: ${mount}`);
  }

  const summary = await fetchTemplateSummary();
  root.innerHTML = renderPageShell({
    generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    summary,
  });
}
