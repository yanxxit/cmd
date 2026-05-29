// Render informational cards.
export function renderInfoList(title, items) {
  return `
    <section>
      <h2>${title}</h2>
      <ul class="info-list">
        ${items.map((item) => `
          <li class="info-card">
            <h3>${item.title}</h3>
            <p>${item.detail}</p>
          </li>
        `).join('')}
      </ul>
    </section>
  `;
}
