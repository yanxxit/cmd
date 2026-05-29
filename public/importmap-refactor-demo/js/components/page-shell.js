// Shell renderer for the demo page.
export function renderPageShell({
  generatedAt,
  versionKey,
  scenarios,
  selectedScenarioId,
  metrics,
  moduleMapHtml,
  previewHtml,
  activityHtml
}) {
  return `
    <main class="demo-page">
      <section class="demo-hero">
        <article class="demo-panel">
          <div class="demo-panel-inner">
            <h1 class="demo-title">复杂 HTML 拆分示例</h1>
            <p class="demo-subtitle">这个页面演示如何把一个功能不断增长的单 HTML 页面，拆成“入口、组件、状态、服务、样式”各自独立的 ESM 模块。适合给 public/ 新规则提供具体示例。</p>
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
        </div>
        <section class="demo-panel"><div class="demo-panel-inner">${activityHtml}</div></section>
      </section>
    </main>
  `;
}
