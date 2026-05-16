# test-case-manager 需求整理与优化方案

## 1. 文档目标

本文档基于 `public/test-case-manager` 当前代码现状，整理业务需求、技术目标、约束条件与后续优化方向。

目标不是重新设计一套复杂架构，而是在当前已经完成 ESM 化收敛的基础上，继续做“减法”：

- 更快
- 更简
- 更容易维护
- 更少桥接
- 更符合现代浏览器能力

## 2. 业务需求整理

### 2.1 核心业务能力

当前项目的核心能力包括：

- 测试案例列表展示
- 测试案例搜索、筛选、分页
- 测试案例新增、编辑、删除
- 测试案例集合管理
- 子案例查看与 CRUD
- 后台管理台风格的布局与交互

### 2.2 使用场景特征

该项目属于内部工具型页面，特点是：

- 用户规模有限
- 页面功能明确
- 更关注开发效率与维护成本
- 对启动速度和调试体验有直接要求
- 不需要兼容老旧浏览器

## 3. 技术目标与约束

### 3.1 技术目标

本项目的技术目标应保持为：

- 现代浏览器优先
- 保留静态部署能力
- 尽量减少运行时魔法
- 模块边界清晰
- 依赖关系显式
- 尽量不使用桥接方案

### 3.2 当前约束

- 页面运行在 `public/test-case-manager/` 下
- 入口仍采用 HTML + 本地静态资源加载
- 当前依赖 React、ReactDOM、Ant Design、Day.js、Lucide
- 当前已转为原生 ESM 模块化结构
- 当前仍存在少量 UMD 全局依赖和 HTML 入口层重复代码

## 4. 当前架构现状

### 4.1 已完成的收敛

当前项目已经完成以下关键收敛：

- 移除运行时 Babel
- 移除 descriptor 注册链路
- 移除 `window.__APP__` 业务桥接主链路
- 移除 `jsx-loader.js`、`assets.js`、`style-loader.js`
- 将公共运行时能力统一到 `js/lib/core.js`
- 将页面挂载流程收敛到 `core.js` 的统一启动能力
- 将主页面与子页面统一为“轻量 HTML 壳 + bootstrap + page module”结构

### 4.2 当前目录结构

```text
public/test-case-manager/
├── OPTIMIZATION_PROPOSAL.md
├── MIGRATION_SUMMARY.md
├── REFACTOR_PLAN.md
├── index.html
├── sub-cases.html
├── test.html
├── css/
│   ├── base.css
│   ├── index.css
│   └── sub-cases.css
└── js/
    ├── api.js
    ├── bootstrap.js
    ├── format.js
    ├── icons.js
    ├── sub-cases.bootstrap.js
    ├── components/
    │   ├── CollectionManager.js
    │   ├── StatsPanel.js
    │   └── TestCaseList.js
    ├── lib/
    │   └── core.js
    └── pages/
        ├── cases.page.js
        ├── collections.page.js
        ├── index.page.js
        └── sub-cases.page.js
```

### 4.3 当前分层

- `index.html` / `sub-cases.html`
  - 页面入口壳
  - 负责引入 vendor、注入页面配置、触发 bootstrap
- `js/lib/core.js`
  - 负责版本号、资源 URL、模块加载、样式加载、页面挂载
- `js/bootstrap.js` / `js/sub-cases.bootstrap.js`
  - 负责页面入口配置
- `js/pages/`
  - 负责页面级视图与状态组织
- `js/components/`
  - 负责可复用组件
- `js/api.js` / `js/icons.js` / `js/format.js`
  - 负责共享逻辑

## 5. 当前方案的优点

当前实现已经具备以下优势：

- 依赖关系比历史方案清晰很多
- 页面入口链路明显缩短
- 目录结构比早期单体 HTML 更清楚
- 调试链路更直接
- 基础设施职责已基本收敛到 `core.js`
- 后续继续做小步优化的风险较低

## 6. 当前仍可继续优化的点

### 6.1 HTML 入口层仍有重复

`index.html` 与 `sub-cases.html` 仍存在较多重复：

- React / ReactDOM / Day.js / AntD 的脚本引入
- bootstrap 配置注入
- 资源加载失败兜底 UI
- `initCore()` + `injectCSS()` 的启动前置逻辑

这部分虽然已经比过去简单，但仍可继续收敛。

### 6.2 vendor 仍是 UMD 全局依赖

当前 React、ReactDOM、Ant Design、Day.js 仍通过 UMD 全局变量使用：

- 对 IDE 类型与静态分析不够友好
- 运行时对全局变量有隐式依赖
- HTML 层需要手工保证加载顺序

这已经是当前项目里最主要的“剩余桥接味道”来源。

### 6.3 页面模块仍偏重

例如 `js/pages/index.page.js` 同时承担：

- 布局壳
- 菜单配置
- 主题切换
- 本地持久化
- 页面切换
- 图标刷新

这会导致单文件职责偏多，后续再扩展页面时容易重新膨胀。

### 6.4 API 层还比较轻

当前 `js/api.js` 是一个很轻的 fetch 封装，适合当前规模，但后续若继续增长，会缺少：

- 超时控制
- 更清晰的错误分类
- 统一空响应与非 JSON 处理
- 请求上下文扩展位

### 6.5 路由与页面状态仍偏局部

当前主页面用内部状态控制页面切换，属于简单而有效的方式，但如果未来继续扩展：

- URL 不可分享当前页状态
- 页面切换状态与浏览器历史未对齐
- 不利于多页面入口继续统一

### 6.6 图标系统仍有额外运行时处理

当前仍依赖 `lucide.createIcons()` 的二次扫描：

- 首屏与交互后都要额外触发
- 对组件渲染顺序存在隐式要求

如果图标继续增多，可以考虑更稳定的组件化方案。

## 7. 推荐优化方向

### 7.1 方向一：继续保持“无桥接、轻运行时”

这是当前最重要的原则，不建议回退到：

- 运行时 Babel
- descriptor 注册
- 全局业务总线
- 复杂的页面注册器

### 7.2 方向二：把 `core.js` 作为唯一运行时基础设施入口

建议后续所有通用能力都优先考虑是否放入 `js/lib/core.js`，例如：

- 页面启动前置逻辑
- HTML 错误降级渲染
- 资源预加载
- 通用页面挂载器

避免重新出现散落的 util 或兼容层文件。

### 7.3 方向三：继续做“薄入口、薄 bootstrap、薄 page”

建议的结构原则是：

- HTML 只负责最小壳层
- bootstrap 只负责页面入口参数
- page 只负责页面视图和页面状态
- 通用逻辑下沉到 `core.js` 或共享模块

### 7.4 方向四：后续优先做 ESM vendor 化

如果后续还有一轮值得做的中等规模优化，优先建议是：

- 将 React / ReactDOM / Day.js / AntD / Lucide 逐步迁移到 ESM 依赖方式
- 用 ImportMap 或固定版本 ESM 资源替代 UMD 全局变量

这会显著降低 HTML 层的隐式顺序依赖。

## 8. 推荐精简方案

### 8.1 P0：低风险继续收敛

这部分收益高、改动小，建议优先做：

1. 抽一个统一的 HTML 启动脚本模板，减少 `index.html` 和 `sub-cases.html` 的重复
2. 将资源加载失败的兜底 UI 下沉到 `core.js`
3. 将主页面的菜单配置、用户菜单、主题存储键拆到独立配置文件
4. 将 URL 参数解析等小工具从页面中抽到共享模块
5. 补一份“当前架构说明”文档给后续维护者

### 8.2 P1：中期优化

这部分适合在功能稳定后推进：

1. 将 vendor 从 UMD 全局模式迁移到 ESM 模式
2. 为关键入口增加 `modulepreload`
3. 为 `api.js` 增加超时、错误分类和更稳的响应解析
4. 视需求引入简单 URL 路由同步，而不是完整前端路由框架

### 8.3 P2：仅在开发体验明显受限时考虑

这部分不是当前必须项：

1. 引入极轻量 JSX 预编译，仅做语法转换，不做复杂打包
2. 将 Lucide 替换为更直接的组件式图标接入方式
3. 将主页面布局壳进一步拆成 `layout` 模块

## 9. 最新技术建议

结合当前项目定位，建议优先采用以下现代浏览器能力：

- ES Modules
- Import Maps
- Top-level await
- `modulepreload`
- `URL` / `URLSearchParams`
- `AbortController`
- `structuredClone`
- `requestIdleCallback`（可选）
- View Transition API（仅在有明显页面切换收益时使用）

不建议引入：

- 重型打包链作为默认前提
- 复杂状态管理框架
- 运行时模板编译
- 自定义桥接总线

## 10. 最终优化建议

### 10.1 一句话结论

当前 `test-case-manager` 已经完成最关键的现代化重构，后续不需要再做大拆大建，而应围绕“统一基础设施、继续删除重复、逐步去掉 UMD 全局依赖”继续小步精简。

### 10.2 推荐执行顺序

1. 先统一 HTML 入口重复逻辑
2. 再继续瘦身 `index.page.js`
3. 然后评估 vendor ESM 化
4. 最后视开发体验再决定是否引入轻量 JSX 预编译

### 10.3 当前最值得做的下一步

如果只选一个下一步，最推荐：

**优先把 HTML 层重复启动逻辑收敛掉，并为 vendor ESM 化做准备。**
