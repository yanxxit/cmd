// Render step-by-step practical case study.
export function renderCaseStudy(caseStudy) {
  return `
    <section>
      <h2>逐步拆分实战案例</h2>
      <p class="demo-subtitle">以 ${caseStudy.pageName} 为例，模拟一个 900+ 行的旧页面如何逐步拆成多文件原生 ESM 模块，而不是一次性重写。</p>
      <div class="case-study-block">
        <div class="case-study-summary">
          <strong>原文件：</strong> ${caseStudy.originalFile}
        </div>
        <p class="demo-subtitle">${caseStudy.summary}</p>
      </div>
      <div class="case-steps">
        ${caseStudy.steps.map((step, index) => `
          <article class="case-step-card">
            <div class="case-step-head">
              <span class="case-step-index">0${index + 1}</span>
              <div>
                <h3>${step.title}</h3>
                <p>${step.goal}</p>
              </div>
            </div>
            <div class="case-step-grid">
              <section class="case-step-panel">
                <strong>拆分前</strong>
                <ul>
                  ${step.before.map((item) => `<li>${item}</li>`).join('')}
                </ul>
              </section>
              <section class="case-step-panel">
                <strong>操作动作</strong>
                <ul>
                  ${step.actions.map((item) => `<li>${item}</li>`).join('')}
                </ul>
              </section>
              <section class="case-step-panel">
                <strong>拆分后</strong>
                <ul>
                  ${step.after.map((item) => `<li>${item}</li>`).join('')}
                </ul>
              </section>
            </div>
            <div class="case-step-output">
              <strong>输出文件：</strong>
              <code>${step.output.join(' · ')}</code>
            </div>
          </article>
        `).join('')}
      </div>
      <div class="preview-block">
        <h3>最终目标目录</h3>
        <pre class="preview-code">${caseStudy.targetStructure.join('\n')}</pre>
      </div>
    </section>
  `;
}
