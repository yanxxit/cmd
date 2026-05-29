// Render user actions as a compact activity log.
export function renderActivityLog(logs) {
  return `
    <section>
      <h2>拆分动作日志</h2>
      <p class="demo-subtitle">模拟从旧页面分析到模块拆分的过程，帮助理解这条新规则如何落地。</p>
      <ul class="log-list">
        ${logs.map((log) => `
          <li class="log-item">
            <strong>${log.title} · ${log.time}</strong>
            <span>${log.detail}</span>
          </li>
        `).join('')}
      </ul>
    </section>
  `;
}
