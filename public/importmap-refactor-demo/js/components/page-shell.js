// Shell renderer for the demo page.
export function renderPageShell({
  generatedAt,
  versionKey,
  scenarios,
  selectedScenarioId,
  metrics,
  moduleMapHtml,
  previewHtml,
  caseStudyHtml,
  activityHtml
}) {
  return `
    <main class="demo-page">
      <section class="demo-hero">
        <article class="demo-panel">
          <div class="demo-panel-inner">
            <h1 class="demo-title">复杂 HTML 拆分示例</h1>
            <p class="demo-subtitle">这个页面不只展示“拆分前后”对比，还补了一套逐步迁移的实战案例，帮助团队理解如何把一个不断膨胀的单 HTML 页面平滑改造成多文件 ESM 结构。</p>
            <div class="demo-badges">
              <span class="demo-badge">生成时间：${generatedAt}</span>
              <span class="demo-badge">版本键：${versionKey}</span>
              <span class="demo-badge">策略：ImportMaps + 多文件 ESM</span>
            </div>
            <div class="demo-toolbar">
              <div class="demo-toolbar-controls">
                <select class="demo-select" data-role="scenario-select">
                  ${scenarios.map((scenario) => `
                    <option value="${scenario.id}" ${scenario.id === selectedScenarioId ? 'selected' : ''}>${scenario.name}</option>
                  `).join('')}
                </select>
                <button class="demo-button" data-action="simulate-legacy">分析旧页面</button>
                <button class="demo-button" data-action="simulate-split">执行拆分</button>
                <button class="demo-button" data-action="simulate-case-step">查看实战案例</button>
                <button class="demo-button" data-variant="ghost" data-action="simulate-style">应用样式拆分</button>
              </div>
            </div>
          </div>
        </article>
        <aside class="demo-panel">
          <div class="demo-panel-inner">
            <h2>改造指标</h2>
            <ul class="summary-list">
              ${metrics.map((item) => `
                <li>
                  <span>${item.label}</span>
                  <strong>${item.value}</strong>
                </li>
              `).join('')}
            </ul>
          </div>
        </aside>
      </section>

      <section class="demo-grid">
        <div class="demo-stack">
          <section class="demo-panel"><div class="demo-panel-inner">${moduleMapHtml}</div></section>
          <section class="demo-panel"><div class="demo-panel-inner">${previewHtml}</div></section>
          <section class="demo-panel"><div class="demo-panel-inner">${caseStudyHtml}</div></section>
        </div>
        <section class="demo-panel"><div class="demo-panel-inner">${activityHtml}</div></section>
      </section>
    </main>
  `;
}
