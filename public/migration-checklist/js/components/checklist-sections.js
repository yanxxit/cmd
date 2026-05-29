// Render checklist sections and checkbox items.
export function renderChecklistSections(sections, checkedMap) {
  return `
    <section>
      <h2>分阶段迁移步骤</h2>
      <p class="muted">从入口 HTML、样式、脚本、依赖到验证交付，逐项勾选并自动保存进度。</p>
      ${sections.map((section) => {
        const done = section.items.filter((_, index) => checkedMap[`${section.id}:${index}`]).length;
        return `
          <article class="section-card">
            <div class="section-head">
              <div>
                <h3 class="section-title">${section.title}</h3>
                <p class="muted">${section.description}</p>
              </div>
              <span class="progress-chip">${done}/${section.items.length}</span>
            </div>
            <ul class="checklist-items">
              ${section.items.map((item, index) => {
                const key = `${section.id}:${index}`;
                const checked = checkedMap[key] ? 'checked' : '';
                return `
                  <li class="check-item">
                    <input type="checkbox" data-check-item="${key}" ${checked}>
                    <div>
                      <strong>${item}</strong>
                      <span>建议在完成后同步补充回归结论或风险备注。</span>
                    </div>
                  </li>
                `;
              }).join('')}
            </ul>
          </article>
        `;
      }).join('')}
    </section>
  `;
}
