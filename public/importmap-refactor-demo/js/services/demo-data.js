// Scenario data that compares legacy single-file HTML with modular ESM structure.
const scenarios = [
  {
    id: 'dashboard',
    name: '仪表盘页面',
    summary: '典型的管理后台首页，既有筛选器、统计卡片，也有图表区和操作日志。',
    before: {
      lines: 860,
      structure: '<header> + <section> + 内联模板 + 事件脚本 + 样式混在同一个 HTML 文件',
      risks: ['筛选逻辑和视图渲染强耦合', '样式覆盖范围难追踪', '局部改动容易引发整页回归']
    },
    after: {
      entry: 'js/main.js',
      benefits: ['入口只负责加载样式与启动应用', '组件按职责拆分，局部修改影响可控', '样式拆成 base/layout/components 三层']
    },
    modules: [
      {
        name: 'components/page-shell.js',
        role: '只负责整体布局骨架和挂载容器。',
        items: ['Hero 区域', '工具栏区域', '左右栏容器']
      },
      {
        name: 'components/module-map.js',
        role: '渲染模块拆分卡片，解释每个文件负责什么。',
        items: ['文件名', '职责说明', '子能力清单']
      },
      {
        name: 'components/preview-panel.js',
        role: '对比拆分前后的结构与收益。',
        items: ['旧结构描述', '新结构目录', '改造收益']
      },
      {
        name: 'state/store.js',
        role: '管理当前场景和操作日志。',
        items: ['scenarioId', 'logs', '订阅更新']
      },
      {
        name: 'services/demo-data.js',
        role: '管理模拟数据，隔离页面内容与视图渲染。',
        items: ['场景列表', '概览指标', '对比数据']
      }
    ]
  },
  {
    id: 'form-builder',
    name: '复杂表单页',
    summary: '常见于测试平台、配置中心等页面，字段多、联动多、校验多。',
    before: {
      lines: 1100,
      structure: '<form>、字段联动脚本、弹窗、校验提示和样式都写在 index.html 内',
      risks: ['字段联动关系难维护', '表单校验规则散落在多个 onclick 中', '新增字段要同时改模板、脚本、样式']
    },
    after: {
      entry: 'js/main.js',
      benefits: ['字段 schema 可抽到 services 层', '组件能独立处理编辑区、预览区、提示区', '交互逻辑不再依赖全局内联函数']
    },
    modules: [
      {
        name: 'components/form-editor.js',
        role: '负责字段渲染、输入收集和局部校验反馈。',
        items: ['字段列表', '错误提示', '保存按钮状态']
      },
      {
        name: 'components/form-preview.js',
        role: '负责实时预览输出结果。',
        items: ['JSON 预览', '差异高亮', '只读模式']
      },
      {
        name: 'services/schema.js',
        role: '统一维护字段定义和联动规则。',
        items: ['字段元信息', '默认值', '依赖关系']
      },
      {
        name: 'utils/style-loader.js',
        role: '按需加载表单专属样式。',
        items: ['懒加载 CSS', '避免重复注入']
      }
    ]
  }
];

export function listScenarios() {
  return scenarios;
}

export function getScenarioById(id) {
  return scenarios.find((scenario) => scenario.id === id) || scenarios[0];
}

export function getOverviewMetrics(scenario) {
  return [
    { label: '旧页面行数', value: `${scenario.before.lines} 行` },
    { label: '拆分后模块数', value: `${scenario.modules.length} 个` },
    { label: '入口文件', value: scenario.after.entry },
    { label: '核心收益', value: scenario.after.benefits[0] }
  ];
}
