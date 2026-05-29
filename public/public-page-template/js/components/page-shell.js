// Template shell: keep structure in a dedicated view module.
export function renderPageShell({ generatedAt, summary }) {
  return `
    <main class="template-page">
      <section class="template-hero">
        <h1>public/ 页面模板</h1>
        <p>使用多文件原生 ESM + ImportMaps 搭建零构建静态页面，将结构、样式和逻辑拆分为可维护模块。</p>
        <div class="template-meta">
          <span class="template-pill">生成时间：${generatedAt}</span>
          <span class="template-pill">版本键：${window.G_VER}</span>
        </div>
      </section>
      <section class="template-grid">
        ${summary.cards.map((card) => `
          <article class="template-card">
            <h2>${card.title}</h2>
            <p>${card.description}</p>
            <ul>
              ${card.items.map((item) => `<li>${item}</li>`).join('')}
            </ul>
          </article>
        `).join('')}
      </section>
    </main>
  `;
}
