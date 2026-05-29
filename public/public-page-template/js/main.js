// Template entry: load styles and boot the app.
const v = window.G_VER || Date.now();
const [{ loadCSSBatch }, { createTemplateApp }] = await Promise.all([
  import(`./utils/style-loader.js?v=${v}`),
  import(`./app.js?v=${v}`)
]);

export async function bootTemplatePage(options = {}) {
  await loadCSSBatch(['./css/page.css']);
  createTemplateApp(options);
}
