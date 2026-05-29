// Demo entry: load page styles and start the refactor showcase.
const v = window.G_VER || Date.now();
const [{ loadCSSBatch }, { createDemoApp }] = await Promise.all([
  import(`./utils/style-loader.js?v=${v}`),
  import(`./app.js?v=${v}`)
]);

export async function bootDemoPage(options = {}) {
  await loadCSSBatch(['./css/layout.css', './css/components.css']);
  await createDemoApp(options);
}
