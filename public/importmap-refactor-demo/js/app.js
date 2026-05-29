// App assembly: connect shell, preview, practical case study and activity log.
import dayjs from 'dayjs';

const v = window.G_VER || Date.now();
const [
  { createStore },
  { getScenarioById, listScenarios, getOverviewMetrics },
  { caseStudy },
  { renderPageShell },
  { renderModuleMap },
  { renderPreviewPanel },
  { renderCaseStudy },
  { renderActivityLog },
  { qs, on }
] = await Promise.all([
  import(`./state/store.js?v=${v}`),
  import(`./services/demo-data.js?v=${v}`),
  import(`./services/case-study.js?v=${v}`),
  import(`./components/page-shell.js?v=${v}`),
  import(`./components/module-map.js?v=${v}`),
  import(`./components/preview-panel.js?v=${v}`),
  import(`./components/case-study-steps.js?v=${v}`),
  import(`./components/activity-log.js?v=${v}`),
  import(`./utils/dom.js?v=${v}`)
]);

export async function createDemoApp({ mount = '#app' } = {}) {
  const root = qs(mount);
  if (!root) {
    throw new Error(`Mount node not found: ${mount}`);
  }

  const scenarios = listScenarios();
  const initialScenario = scenarios[0];
  const store = createStore({
    scenarioId: initialScenario.id,
    logs: [
      {
        title: '页面初始化',
        detail: `使用 ImportMaps + ESM 脚手架加载示例，版本键 ${window.G_VER}`,
        time: dayjs().format('HH:mm:ss')
      }
    ]
  });

  function appendLog(title, detail) {
    const current = store.getState().logs;
    store.setState({
      logs: [
        {
          title,
          detail,
          time: dayjs().format('HH:mm:ss')
        },
        ...current
      ].slice(0, 8)
    });
  }

  function render() {
    const state = store.getState();
    const scenario = getScenarioById(state.scenarioId);
    const metrics = getOverviewMetrics(scenario);

    root.innerHTML = renderPageShell({
      generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      versionKey: window.G_VER,
      scenarios,
      selectedScenarioId: state.scenarioId,
      metrics,
      moduleMapHtml: renderModuleMap(scenario.modules),
      previewHtml: renderPreviewPanel(scenario),
      caseStudyHtml: renderCaseStudy(caseStudy),
      activityHtml: renderActivityLog(state.logs)
    });

    bindEvents();
  }

  function bindEvents() {
    on(qs('[data-role="scenario-select"]', root), 'change', (event) => {
      const scenario = getScenarioById(event.target.value);
      store.setState({ scenarioId: scenario.id });
      appendLog('切换场景', `当前查看 ${scenario.name}`);
    });

    on(qs('[data-action="simulate-legacy"]', root), 'click', () => {
      const scenario = getScenarioById(store.getState().scenarioId);
      appendLog('分析旧页面', `单文件 HTML 包含 ${scenario.before.lines} 行，风险集中在 ${scenario.before.risks[0]}`);
      render();
    });

    on(qs('[data-action="simulate-split"]', root), 'click', () => {
      const scenario = getScenarioById(store.getState().scenarioId);
      appendLog('执行拆分', `拆成 ${scenario.modules.length} 个模块，主入口改为 ${scenario.after.entry}`);
      render();
    });

    on(qs('[data-action="simulate-style"]', root), 'click', () => {
      appendLog('应用样式拆分', '基础样式、布局样式、组件样式已独立，支持按需加载。');
      render();
    });

    on(qs('[data-action="simulate-case-step"]', root), 'click', () => {
      appendLog('查看实战案例', `按 ${caseStudy.steps.length} 个步骤逐步拆分 ${caseStudy.pageName}`);
      render();
    });
  }

  store.subscribe(render);
  render();
}
