# test-case-manager 重构方案

## 1. 目标与约束

### 1.1 业务目标

当前 `test-case-manager` 是一个面向内部使用的测试案例管理工具，核心能力包括：

- 测试案例列表查看、搜索、筛选、分页
- 测试案例新增、编辑、删除
- 测试案例集合管理
- 子案例管理
- Ant Design 风格后台布局与交互

### 1.2 技术目标

本轮重构的目标不是继续叠加兼容层，而是围绕以下原则做“减法”：

- 现代浏览器优先，不考虑老版本浏览器兼容
- 主打快速开发、结构清晰、方便维护
- 尽量减少桥接方案和运行时魔法
- 保留当前多页面静态部署能力
- 保持 Ant Design 后台体验

### 1.3 约束

- 页面运行在 `public/test-case-manager/` 下，适合继续采用静态资源部署
- 当前已经形成多页面 + 多模块目录结构
- 当前页面依赖 React、ReactDOM、Ant Design、Day.js、Lucide
- 当前代码主链路已经完成收敛，剩余工作主要是文档与目录层面的收尾整理

## 2. 当前现状

### 2.1 目录现状

当前目录大致分为：

- `index.html` / `sub-cases.html`：页面入口
- `js/bootstrap.js`：主页面启动器
- `js/lib/core.js`：公共运行时
- `js/components/`：业务组件
- `js/pages/`：页面模块
- `css/`：基础样式和页面样式

### 2.2 当前架构特征

当前代码已经从“大单页 HTML”走向模块化，并已基本完成主链路收敛：

- 主页面与子页面都已切换到 ESM 启动链路
- 页面与组件已改成显式 import 依赖
- `js/lib/core.js` 负责公共资源与页面启动基础设施
- 运行时 Babel 与历史注册链路已移除

### 2.3 当前主要问题

#### 问题 A：运行时桥接过多

当前大量依赖通过 `window.__APP__` 注入：

- `api`
- `icons`
- `format`
- `services`
- `ui`
- `components`
- `pages`

这类方案的主要问题：

- 依赖是隐式的，不利于阅读和重构
- 模块间关系不清晰
- 需要额外处理时序问题
- 不利于后续拆分和复用

#### 问题 B：历史运行时编译方案曾经过重

过渡阶段曾引入浏览器端 JSX 编译与额外装配链路。

这类方案的问题在于：

- 首屏加载更重
- 运行时错误链路更复杂
- 调试堆栈不直观
- 容易衍生额外的运行时装配逻辑

#### 问题 C：公共能力存在重复

当前以下能力存在重叠：

- 资源版本与 URL 生成
- CSS 加载与注入
- 页面启动逻辑
- API 调用方式
- 页面头部结构
- 列表展示小部件

这会导致：

- 新页面容易继续复制旧逻辑
- 代码看起来“拆分了”，但仍然不够简洁
- 后续维护时要同时理解多套实现

#### 问题 D：主页面与子页面架构不统一

这类问题在旧方案中比较明显，当前已经通过统一 bootstrap 链路基本解决。

## 3. 重构原则

### 3.1 优先级排序

本项目的优先级建议如下：

1. 简化运行时
2. 清晰依赖关系
3. 降低模块心智负担
4. 统一页面启动方式
5. 再考虑更进一步的 vendor 升级

### 3.2 明确要做的“减法”

建议优先移除或弱化以下内容：

- `window.__APP__` 作为业务桥接总线
- 历史页面注册与等待装配链路
- 浏览器端 Babel JSX 编译
- `sub-cases.html` 的内联业务脚本
- 多套重复的资源/样式加载实现

### 3.3 保留的合理部分

以下能力是值得保留和继续强化的：

- 原生 ESM
- ImportMap
- 开发/生产双版本号缓存策略
- 多页面静态部署结构
- Ant Design 后台布局方案

## 4. 推荐目标架构

## 4.1 推荐结论

最推荐的方向不是继续加桥接层，而是：

**原生 ESM + ImportMap + 轻量预编译 JSX + 显式 import 依赖**

这条路线兼顾：

- 快速
- 精简
- 可维护
- 现代浏览器能力
- 尽量少桥接

### 4.2 为什么不建议继续走当前桥接模式

旧桥接模式的核心链路大致是：

- HTML 启动
- core 初始化
- bootstrap 装配
- 历史页面注册
- 等待页面就绪
- React 挂载

这条链路过长，导致很多“本不该存在的复杂度”出现，例如：

- 页面注册函数
- 模块装配函数
- 页面等待函数
- `window.__APP__`

如果业务模块改成显式 ESM import，这些链路会大幅收缩。

### 4.3 当前落地结构

当前目录已经收敛为如下结构：

```text
public/test-case-manager/
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
    ├── pages/
    │   ├── cases.page.js
    │   ├── collections.page.js
    │   ├── index.page.js
    │   └── sub-cases.page.js
```

这套结构已经体现出当前的分层方式：

- `index.html` / `sub-cases.html` 作为轻量入口壳
- `js/bootstrap.js` / `js/sub-cases.bootstrap.js` 负责页面启动
- `js/lib/core.js` 提供资源版本、模块 URL、样式注入等基础能力
- `js/pages/` 承载页面模块
- `js/components/` 承载复用组件
- `js/api.js`、`js/format.js`、`js/icons.js` 作为共享业务/工具模块
- 原 `js/util/assets.js` 已并入 `js/lib/core.js`
- 原 `js/style-loader.js` 已并入 `js/lib/core.js`

## 5. 技术方案建议

### 5.1 方案对比

#### 方案 A：继续现有桥接注册链路 + `window.__APP__`

优点：

- 改动小
- 可以继续复用现有逻辑

缺点：

- 运行时链路重
- 维护成本高
- 仍旧依赖桥接
- 不符合“尽量少桥接”的方向

结论：

不建议作为长期方案。

#### 方案 B：纯原生 ESM + 无 JSX

优点：

- 最纯粹
- 不需要构建
- 没有额外编译链路

缺点：

- React 写法会退化到 `React.createElement`
- 可读性明显下降
- 对后期维护不友好

结论：

不建议用于 Ant Design React 管理台。

#### 方案 C：原生 ESM + ImportMap + 显式 import

优点：

- 最平衡
- 保留现代模块体验
- 删除运行时编译链路
- 删除历史页面注册桥接
- 代码依赖关系更直接

缺点：

- 需要接受无 JSX 或预编译 JSX 的实现取舍

结论：

**推荐使用。**

## 6. 推荐技术选型

### 6.1 运行时能力

现代浏览器下建议直接使用：

- ES Modules
- Import Maps
- Top-level await
- `modulepreload`
- `URL` / `URLSearchParams`
- `AbortController`
- `structuredClone`
- View Transition API（可选）

### 6.2 React 层建议

如果继续使用 React + Ant Design，建议：

- 保留 React 18
- 保留 Ant Design v5
- 去掉 UMD 全局读取方式
- 通过 ESM import 直接引用依赖

### 6.3 当前实现取舍

当前项目已经采用“无运行时编译”的实现方式：

- 页面与组件直接输出为浏览器可执行的 ESM 模块
- 启动链路不依赖 Babel Standalone 或页面注册器
- 依赖通过显式 import 或顶层动态 import 装配

如果后续需要恢复 JSX 开发体验，也建议只引入极轻量预编译步骤，而不是回到浏览器端编译模式。

## 7. 项目精简方案

### 7.1 第一阶段：先做结构清理

目标：

- 不大改 UI 行为
- 先把重复和混乱处收敛

动作：

- 统一服务层，避免组件里混合写请求逻辑
- 统一公共 UI 小组件
- 统一页面头部
- 统一资源和样式加载工具
- 统一主页面与子页面入口结构

当前这部分已经开始具备基础，可以继续收敛。

### 7.2 第二阶段：去掉 `window.__APP__`

目标：

- 改成显式 import

动作：

- 组件直接 import services/ui/icons/format
- 页面直接 import 组件
- 主入口直接 import pages
- 删除 `components/pages` 注册到全局的方式

收益：

- 依赖关系一眼看清
- 更好搜索引用
- 更容易拆分文件

### 7.3 第三阶段：去掉历史页面注册链路

目标：

- 删除历史页面注册与等待装配机制

动作：

- `pages/*.page.js` 直接导出 React 组件
- `components/*.js` 直接导出组件
- 入口文件显式组装页面映射

示意：

```js
import CasesPage from '../pages/cases.page.js';
import CollectionsPage from '../pages/collections.page.js';

const pages = {
  cases: CasesPage,
  collections: CollectionsPage,
};
```

### 7.4 第四阶段：收敛运行时装配链路

目标：

- 删除历史运行时编译与额外装配逻辑

动作：

- 将页面统一为普通 ESM 模块
- `sub-cases.html` 改成和主页面同一套启动方式

收益：

- 启动链更短
- 性能更好
- 调试更直接

### 7.5 第五阶段：升级 vendor 依赖方式

目标：

- 去掉 UMD 全局依赖

动作：

- 为 React / ReactDOM / AntD / Day.js 建立 ESM vendor 层
- 或引入固定版本的 ESM 依赖源

注意：

这一阶段可以放后面，不需要第一时间做。

## 8. 推荐实施顺序

建议按下面顺序推进：

1. 统一服务层与公共 UI 层
2. `sub-cases.html` 模块化，和主页面对齐
3. 组件显式 import，逐步移除 `window.__APP__`
4. 删除历史页面注册机制
5. 收敛历史运行时装配逻辑
6. 最后再处理 vendor 的 ESM 化

## 9. 需要保留的经验

当前实现中以下思路值得保留：

- 开发模式时间戳防缓存
- 生产模式固定版本号复用缓存
- ImportMap 管理本地模块路径
- 多页面目录组织
- 将页面与组件分层

这些不是问题，真正需要处理的是：

- 运行时桥接
- 运行时编译
- 重复实现

## 10. 最终建议

### 10.1 一句话结论

对于 `test-case-manager`，最优方案不是继续在历史桥接注册链路和运行时编译方案上修修补补，而是：

**保留原生 ESM 和静态部署能力，移除运行时桥接与运行时 JSX 编译，改成显式 import 的轻量模块架构。**

### 10.2 当前落地方案

当前已经落地为：

**现代浏览器 + ImportMap + 原生 ESM + 直接 import + 统一 bootstrap 链路**

这套方案已经满足“快速、精简、方便维护、尽量不使用桥接方案”的目标。

### 10.3 不推荐方案

不建议继续长期使用：

- `window.__APP__` 业务桥接
- 历史页面注册链路
- 历史运行时编译链路

## 11. 下一步执行建议

如果继续推进，建议直接进入以下落地任务：

1. 继续精简遗留目录与文档表述
2. 复查 `bootstrap.js` 与 `js/lib/core.js` 的职责边界
3. 继续复查是否还有可并入 `js/lib/core.js` 的通用能力
4. 按需补齐当前 ESM 架构的说明文档
5. 最后决定是否把 UMD vendor 升级成 ESM vendor
