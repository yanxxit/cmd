// Render the page shell.
export function renderPageShell({ generatedAt, versionKey, metrics, checklistHtml, antiPatternHtml, pitfallHtml, note }) {
  return `
    <main class="checklist-page">
      <section class="checklist-hero">
        <article class="checklist-panel">
          <div class="checklist-panel-inner">
            <h1 class="hero-title">HTML -> ESM 迁移清单</h1>
            <p class="hero-desc">这是迁移清单文档的交互式页面版。团队成员可以直接在浏览器里勾选步骤、记录备注，并持续跟踪迁移进度。</p>
            <div class="pills">
              <span class="pill">生成时间：${generatedAt}</span>
              <span class="pill">版本键：${versionKey}</span>
              <span class="pill">模式：原生 ESM + ImportMaps</span>
            </div>
            <div class="toolbar">
              <button class="button" data-action="copy-summary">复制进度摘要</button>
              <button class="button" data-variant="ghost" data-action="reset-progress">重置勾选</button>
            </div>
          </div>
        </article>
        <aside class="checklist-panel">
          <div class="checklist-panel-inner">
            <h2>进度概览</h2>
            <ul class="metrics">
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

      <section class="checklist-grid">
        <div class="checklist-stack">
          <section class="checklist-panel"><div class="checklist-panel-inner">${checklistHtml}</div></section>
          <section class="checklist-panel"><div class="checklist-panel-inner">${antiPatternHtml}</div></section>
        </div>
        <div class="checklist-stack">
          <section class="checklist-panel">
            <div class="checklist-panel-inner">
              <h2>迁移备注</h2>
              <p class="muted">适合记录当前页面路径、待补测试、兼容要求、风险说明或需要同步给团队的事项。</p>
              <textarea class="note-box" data-role="note-box" placeholder="例如：保留 window.exportCSV 作为旧脚本兼容桥接；筛选器联动需重点回归。">${note || ''}</textarea>
            </div>
          </section>
          <section class="checklist-panel"><div class="checklist-panel-inner">${pitfallHtml}</div></section>
        </div>
      </section>
    </main>
  `;
}
