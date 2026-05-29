// Entry: load styles and boot the 2048 app.
const v = window.G_VER || Date.now();
const [{ loadCSSBatch }, { createGame2048App }] = await Promise.all([
  import(`./utils/style-loader.js?v=${v}`),
  import(`./app.js?v=${v}`)
]);

export async function bootGame2048Page(options = {}) {
  await loadCSSBatch(['./css/page.css']);
  await createGame2048App(options);
}
