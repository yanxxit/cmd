// Render module cards to explain how the page is split.
export function renderModuleMap(modules) {
  return `
    <section>
      <h2>推荐拆分结果</h2>
      <p class="demo-subtitle">把一个复杂页面切成职责稳定的小模块，阅读和局部修改都更容易。</p>
      <div class="module-grid">
        ${modules.map((module) => `
          <article class="module-card">
            <h3>${module.name}</h3>
            <p>${module.role}</p>
            <ul>
              ${module.items.map((item) => `<li>${item}</li>`).join('')}
            </ul>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}
