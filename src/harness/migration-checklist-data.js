export const checklistSections = [
  {
    id: 'preflight',
    title: '迁移前检查',
    description: '先确认迁移边界、回归范围和页面形态，避免误把适合框架化的页面继续塞进静态目录。',
    items: [
      '确认该页面仍属于零构建静态页，而不是应该迁移到独立框架子工程',
      '阅读 AGENTS.md、CLAUDE.md、docs/design.md、tasks/*.md',
      '优先使用 native-esm-importmaps skill 规划拆分方案',
      '记录当前页面路径、用途、核心交互和依赖资源',
      '保存迁移前页面快照，至少保留结构、脚本和样式的原始版本',
      '列出回归验证点，例如搜索、筛选、弹窗、复制、导入导出、快捷键',
      '梳理页面初始化顺序，确认哪些逻辑依赖 DOM ready、哪些逻辑依赖异步数据返回',
      '标记历史兼容要求，例如必须保留的全局变量、老参数格式和旧链接入口'
    ]
  },
  {
    id: 'entry',
    title: '收敛入口 HTML',
    description: '目标是让 index.html 只保留结构骨架、版本键和模块入口，不再承担全部业务逻辑。',
    items: [
      '保留基础 meta、挂载点、少量首屏脚本',
      '将大段内联 script 移出 index.html',
      '将大段内联 style 拆到 css/',
      '在入口中定义 window.G_VER 和静态资源版本函数',
      '在入口中添加 type="importmap"',
      '使用 type="module" 只加载 js/main.js',
      '移除散落在 HTML 节点上的内联 onclick/onchange/oninput 处理器',
      '确认入口脚本不会重复创建全局副本或重复绑定事件'
    ]
  },
  {
    id: 'styles',
    title: '拆分样式',
    description: '先把样式层次理顺，后续 JS 模块化时才不容易受隐藏级联影响。',
    items: [
      '把全局变量、reset、排版基础放入 css/base.css',
      '把布局放入 css/layout.css',
      '把组件样式放入 css/components.css',
      '若存在按需区域样式，接入 js/utils/style-loader.js',
      '确认没有遗漏原先依赖的内联样式覆盖关系',
      '检查是否存在选择器过深、使用 !important 堆叠、样式与结构强耦合等问题',
      '确认主题变量、暗黑模式或多品牌样式的切换逻辑已集中管理'
    ]
  },
  {
    id: 'scripts',
    title: '拆分脚本',
    description: '按职责拆入口、装配、组件、状态、服务和工具函数，避免一层脚本做所有事情。',
    items: [
      'js/main.js 只负责加载样式和启动应用',
      'js/app.js 负责装配模块与页面生命周期',
      'js/components/ 存放视图片段和局部渲染函数',
      'js/services/ 存放接口调用、mock 数据、数据转换',
      'js/state/ 存放状态管理或轻量 store',
      'js/utils/ 存放 DOM 工具、样式加载器、格式化函数',
      '把请求、渲染、事件绑定从同一个大函数中拆开',
      '为会被多处复用的模板、schema、配置项建立独立模块'
    ]
  },
  {
    id: 'deps',
    title: '处理依赖与兼容',
    description: '模块化时最容易出问题的是依赖加载顺序、老全局变量和浏览器缓存。',
    items: [
      '第三方稳定依赖通过 ImportMaps 管理',
      '本地高频变更模块使用相对路径 + ?v=${window.G_VER} 动态导入',
      '不要写 import(window.getModuleUrl("@alias")) 这类 alias + query 形式',
      '如页面依赖老旧全局变量，先梳理哪些必须保留，哪些可以模块化替换',
      '确认依赖顺序不会因模块拆分而变化，例如先有配置再初始化业务模块',
      '确认通过 HTTP 服务访问页面，而不是 file:// 直接双击打开',
      '排查 JSONP、window.xxx SDK、iframe 回调等历史接入方式是否需要适配桥接层'
    ]
  },
  {
    id: 'verify',
    title: '验证与交付',
    description: '迁移不是只要页面能打开，关键交互、刷新行为和开发体验都要回归。',
    items: [
      '页面可通过 HTTP 服务正常打开',
      '控制台无模块解析错误',
      'ImportMaps 在所有模块脚本之前加载',
      '样式文件加载顺序正确',
      '关键交互与迁移前一致',
      '本地模块修改后刷新可获取最新版本',
      '没有回退到新的超大单文件脚本',
      '补充最接近该页面的人工验证或自动测试说明',
      '在首页或相应导航补充访问入口',
      '在相关文档中标记已迁移到 ESM 模块结构',
      '如形成新的目录规范或迁移经验，回写到 docs/decisions/'
    ]
  }
];

export const antiPatterns = [
  '一个 index.html 同时包含 500+ 行样式和 500+ 行脚本',
  '事件处理都挂在 onclick/onchange/oninput 里',
  '页面状态散落在多个 window 全局变量',
  '请求和 DOM 更新耦合在同一个函数',
  '多个视图共用同一组难以复用的内联模板字符串',
  '初始化逻辑依赖脚本书写顺序，稍微调整 script 位置就报错',
  '样式覆盖依赖过深选择器或 !important 叠加',
  '复制、下载、导出等副作用逻辑直接写在按钮回调里且无法复用',
  '同一份数据被多个模块各自缓存，导致 UI 不一致',
  '模块拆分后仍保留大量隐式全局副作用，例如 import 后自动改 DOM'
];

export const pitfallNotes = [
  {
    title: 'ImportMaps 与版本号拼接',
    detail: '不要把 alias 和 query string 直接拼在一起做动态导入。浏览器会把 @alias?v=123 当成完整 specifier，而不会先走 importmap 再附加参数。'
  },
  {
    title: '脚本执行时机',
    detail: '原页面若依赖 body 底部 script 的天然执行顺序，拆成模块后要显式保证挂载点已存在，避免模块先执行导致 querySelector 取空。'
  },
  {
    title: '重复绑定事件',
    detail: '模块化后若采用重新 render 再重新 bind 的方式，必须避免重复注册事件监听，否则点击一次会触发多次。'
  },
  {
    title: '样式闪烁与懒加载',
    detail: '基础样式应在首屏同步注入；只把非首屏或重型组件样式交给 style-loader，避免出现明显 FOUC。'
  },
  {
    title: '老全局接口兼容',
    detail: '如果外部页面、书签、测试脚本仍调用 window.xxx 方法，迁移时需要明确哪些 API 要保留桥接层，不能一刀切删除。'
  },
  {
    title: '相对路径漂移',
    detail: '页面从单文件拆到多目录后，图片、下载链接、fetch 接口和 iframe src 的相对路径经常出错，必须逐项回归。'
  },
  {
    title: '本地缓存与持久化',
    detail: 'localStorage、sessionStorage、IndexedDB 的 key 若写死在旧脚本里，拆分时要集中收口，避免不同模块写入不一致。'
  },
  {
    title: '错误处理被吞掉',
    detail: '从内联脚本改成模块后，未捕获的 import 或 fetch 错误会直接出现在控制台。需要为关键流程补上用户可感知的错误提示。'
  }
];
