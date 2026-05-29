// Show before/after comparison for the refactor process.
export function renderPreviewPanel(scenario) {
  return `
    <section class="preview-shell">
      <div class="preview-block">
        <h2>${scenario.name}</h2>
        <p>${scenario.summary}</p>
      </div>
      <div class="preview-diff">
        <article class="preview-column" data-tone="before">
          <h3>拆分前：单 HTML</h3>
          <p>${scenario.before.structure}</p>
          <ul>
            ${scenario.before.risks.map((risk) => `<li>${risk}</li>`).join('')}
          </ul>
        </article>
        <article class="preview-column" data-tone="after">
          <h3>拆分后：ESM 模块化</h3>
          <ul>
            ${scenario.after.benefits.map((benefit) => `<li>${benefit}</li>`).join('')}
          </ul>
        </article>
      </div>
      <div class="preview-block">
        <h3>推荐目录草图</h3>
        <pre class="preview-code">public/${scenario.id}/
├── index.html
├── css/
│   ├── base.css
│   ├── layout.css
│   └── components.css
└── js/
    ├── main.js
    ├── app.js
    ├── components/
    ├── services/
    ├── state/
    └── utils/</pre>
      </div>
    </section>
  `;
}
