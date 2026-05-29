export const caseStudy = {
  pageName: '运营看板页',
  originalFile: 'public/ops-dashboard/index.html',
  summary: '这个实战案例模拟一个 900+ 行的运营看板 HTML 文件，内部同时塞了筛选器、统计卡片、列表表格、弹窗、内联样式与请求逻辑。目标是逐步拆成多文件原生 ESM 模块，并保留零构建访问方式。',
  steps: [
    {
      id: 'snapshot',
      title: '第 1 步：冻结旧页面快照',
      goal: '先把旧页面保存为基线，避免边改边丢失上下文。',
      before: ['所有结构、样式、脚本都在 index.html', '缺少清晰的回归点'],
      actions: ['复制旧文件并记录核心交互', '列出请求接口、表格操作、弹窗逻辑、筛选项', '截屏或保留旧版 DOM 结构片段'],
      after: ['得到可回退的旧页面快照', '回归点和模块边界初步明确'],
      output: ['docs/ops-dashboard-migration-notes.md', '旧版 index.html 备份']
    },
    {
      id: 'entry-shell',
      title: '第 2 步：收敛入口 HTML',
      goal: '把 index.html 减到只保留挂载点、ImportMaps、基础样式注入和模块入口。',
      before: ['body 底部存在 400+ 行内联脚本', 'head 内联了大段 page-specific style'],
      actions: ['提取基础 meta 和挂载节点', '定义 window.G_VER、window.getAssetUrl', '通过 type="module" 只加载 js/main.js'],
      after: ['入口 HTML 只负责引导', '业务逻辑不再直接写在 HTML 中'],
      output: ['index.html', 'js/main.js']
    },
    {
      id: 'styles-extract',
      title: '第 3 步：拆分样式层',
      goal: '把耦合在 HTML 内的大段样式拆成 base/layout/components。',
      before: ['表格样式、弹窗样式、筛选器样式都写在同一个 style 标签', '存在大量 !important 与深层覆盖'],
      actions: ['提取设计变量到 css/base.css', '把页面布局写入 css/layout.css', '把卡片、弹窗、表格样式写入 css/components.css'],
      after: ['样式级联更清晰', '局部样式修改不再影响整页'],
      output: ['css/base.css', 'css/layout.css', 'css/components.css']
    },
    {
      id: 'render-split',
      title: '第 4 步：拆分视图渲染',
      goal: '先拆模板，再拆逻辑，避免一个函数里既拼 DOM 又做状态修改。',
      before: ['renderDashboard() 同时创建筛选器、卡片、表格、弹窗 HTML', '字符串模板超长且难复用'],
      actions: ['创建 components/page-shell.js 负责外层骨架', '创建 components/stats-grid.js、components/filter-bar.js、components/table-panel.js', '让 app.js 只负责装配'],
      after: ['每个组件只渲染自己负责的区域', '模板可单独修改和复用'],
      output: ['js/components/page-shell.js', 'js/components/stats-grid.js', 'js/components/filter-bar.js', 'js/components/table-panel.js']
    },
    {
      id: 'state-services',
      title: '第 5 步：拆状态与服务层',
      goal: '把筛选状态、分页信息、接口请求从页面脚本中剥离。',
      before: ['全局变量 currentTab/pageNo/filters 散落', 'fetch 与 DOM 更新写在同一个函数里'],
      actions: ['新增 state/store.js 管理当前筛选和分页状态', '新增 services/dashboard-api.js 封装请求', '将数据转换函数挪到 services/transformers.js'],
      after: ['状态变化可追踪', '请求失败与渲染逻辑解耦'],
      output: ['js/state/store.js', 'js/services/dashboard-api.js', 'js/services/transformers.js']
    },
    {
      id: 'events-verify',
      title: '第 6 步：清理事件与回归验证',
      goal: '移除内联事件与隐式副作用，补齐刷新、筛选、弹窗、导出等回归路径。',
      before: ['按钮节点依赖 onclick="exportCSV()"', 'render 后重复绑定事件风险高'],
      actions: ['统一在 app.js 中 bindEvents', '为重复 render 场景增加事件去重策略', '执行迁移清单与关键交互回归'],
      after: ['事件绑定路径统一', '迁移后的页面具备可持续演进能力'],
      output: ['js/app.js', 'docs/public-html-to-esm-migration-checklist.md']
    }
  ],
  targetStructure: [
    'public/ops-dashboard/index.html',
    'public/ops-dashboard/css/base.css',
    'public/ops-dashboard/css/layout.css',
    'public/ops-dashboard/css/components.css',
    'public/ops-dashboard/js/main.js',
    'public/ops-dashboard/js/app.js',
    'public/ops-dashboard/js/components/page-shell.js',
    'public/ops-dashboard/js/components/filter-bar.js',
    'public/ops-dashboard/js/components/stats-grid.js',
    'public/ops-dashboard/js/components/table-panel.js',
    'public/ops-dashboard/js/state/store.js',
    'public/ops-dashboard/js/services/dashboard-api.js',
    'public/ops-dashboard/js/services/transformers.js',
    'public/ops-dashboard/js/utils/style-loader.js'
  ]
};
