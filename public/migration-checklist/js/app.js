// App wiring for interactive checklist page.
import dayjs from 'dayjs';

const v = window.G_VER || Date.now();
const [
  { createStore },
  { checklistSections, antiPatterns, pitfallNotes },
  { renderPageShell },
  { renderChecklistSections },
  { renderInfoList },
  { loadChecklistProgress, saveChecklistProgress, resetChecklistProgress, buildSummaryText },
  { qs, qsa, on }
] = await Promise.all([
  import(`./state/store.js?v=${v}`),
  import(`./services/checklist-data.js?v=${v}`),
  import(`./components/page-shell.js?v=${v}`),
  import(`./components/checklist-sections.js?v=${v}`),
  import(`./components/info-list.js?v=${v}`),
  import(`./services/storage.js?v=${v}`),
  import(`./utils/dom.js?v=${v}`)
]);

export async function createMigrationChecklistApp({ mount = '#app' } = {}) {
  const root = qs(mount);
  if (!root) {
    throw new Error(`Mount node not found: ${mount}`);
  }

  const initial = loadChecklistProgress();
  const store = createStore({
    checkedMap: initial.checkedMap,
    note: initial.note,
    lastUpdatedAt: initial.lastUpdatedAt || dayjs().format('YYYY-MM-DD HH:mm:ss')
  });

  function getMetrics(state) {
    const total = checklistSections.reduce((sum, section) => sum + section.items.length, 0);
    const completed = Object.values(state.checkedMap).filter(Boolean).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return [
      { label: '总步骤数', value: `${total}` },
      { label: '已完成', value: `${completed}` },
      { label: '完成率', value: `${percent}%` },
      { label: '最后更新', value: state.lastUpdatedAt }
    ];
  }

  function render() {
    const state = store.getState();
    const metrics = getMetrics(state);
    root.innerHTML = renderPageShell({
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      versionKey: window.G_VER,
      metrics,
      checklistHtml: renderChecklistSections(checklistSections, state.checkedMap),
      antiPatternHtml: renderInfoList('常见反模式', antiPatterns.map((text) => ({ title: text, detail: '迁移时至少要显式识别一次，避免把老问题原样搬进新结构。' }))),
      pitfallHtml: renderInfoList('容易踩坑的注意事项', pitfallNotes),
      note: state.note
    });
    bindEvents();
  }

  function persist(partial) {
    const nextState = {
      ...store.getState(),
      ...partial,
      lastUpdatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    saveChecklistProgress(nextState);
    store.setState(nextState);
  }

  function bindEvents() {
    qsa('[data-check-item]', root).forEach((checkbox) => {
      on(checkbox, 'change', (event) => {
        const key = event.target.getAttribute('data-check-item');
        const checkedMap = { ...store.getState().checkedMap, [key]: event.target.checked };
        persist({ checkedMap });
      });
    });

    on(qs('[data-role="note-box"]', root), 'input', (event) => {
      persist({ note: event.target.value });
    });

    on(qs('[data-action="reset-progress"]', root), 'click', () => {
      resetChecklistProgress();
      persist({ checkedMap: {}, note: '' });
    });

    on(qs('[data-action="copy-summary"]', root), 'click', async () => {
      const summary = buildSummaryText(checklistSections, store.getState());
      try {
        await navigator.clipboard.writeText(summary);
        const noteBox = qs('[data-role="note-box"]', root);
        if (noteBox && !noteBox.value.includes('已复制摘要')) {
          persist({ note: `${store.getState().note}

[系统提示] 已复制摘要，可粘贴到任务单。`.trim() });
        }
      } catch (error) {
        persist({ note: `${store.getState().note}

[复制失败] 请手动复制摘要。`.trim() });
      }
    });
  }

  store.subscribe(render);
  render();
}
