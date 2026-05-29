// Entry for interactive migration checklist page.
const v = window.G_VER || Date.now();
const [{ loadCSSBatch }, { createMigrationChecklistApp }] = await Promise.all([
  import(`./utils/style-loader.js?v=${v}`),
  import(`./app.js?v=${v}`)
]);

export async function bootMigrationChecklistPage(options = {}) {
  await loadCSSBatch(['./css/layout.css', './css/components.css']);
  await createMigrationChecklistApp(options);
}
