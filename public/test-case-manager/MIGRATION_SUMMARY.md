# test-case-manager 迁移总结报告

## 1. 迁移结论

`public/test-case-manager` 已完成从“运行时 Babel + 全局桥接 + 页面注册链路”的过渡架构，迁移到“轻量 HTML 入口壳 + bootstrap 启动器 + 原生 ESM 页面模块 + 显式依赖”的当前实现。

当前主链路具备以下特征：

- 主页面与子页面都通过独立 bootstrap 文件启动
- 页面与组件均已改为普通 ESM 模块
- 公共基础设施统一收敛到 `js/lib/core.js`
- 资源路径与缓存版本统一通过 `getAssetUrl()` / `getModuleUrl()` 处理
- 运行时 Babel、页面注册器、`window.__APP__` 业务桥接已从代码主链路移除

## 2. 当前目录结构

```text
public/test-case-manager/
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
    ├── pages/
    │   ├── cases.page.js
    │   ├── collections.page.js
    │   ├── index.page.js
    │   └── sub-cases.page.js
```

## 3. 已完成的关键迁移

- 将 `index.html`、`sub-cases.html` 收敛为轻量入口壳
- 将主页面启动逻辑收敛到 `js/bootstrap.js`
- 将子页面启动逻辑收敛到 `js/sub-cases.bootstrap.js`
- 将资源版本控制、样式注入、模块加载统一到 `js/lib/core.js`
- 将 `js/pages/` 下页面模块改为普通 ESM 页面
- 将 `js/components/` 下业务组件改为普通 ESM 组件
- 删除运行时 Babel 与 `jsx-loader.js`
- 删除 descriptor 注册相关死代码与桥接逻辑
- 删除 `window.__APP__` / `__APP_REGISTER__` 主链路依赖
- 将 `js/util/assets.js` 的资源能力并入 `js/lib/core.js`
- 将 `js/style-loader.js` 的样式加载能力并入 `js/lib/core.js`

## 4. 最终架构说明

### 4.1 入口层

- `index.html` 加载主页面基础样式与 `js/bootstrap.js`
- `sub-cases.html` 加载子页面基础样式与 `js/sub-cases.bootstrap.js`
- HTML 仅负责注入运行配置和触发启动，不再承载业务逻辑

### 4.2 启动层

- `js/bootstrap.js` 负责挂载主页面根组件
- `js/sub-cases.bootstrap.js` 负责挂载子页面根组件
- 启动器只做入口装配，不再承担历史桥接职责

### 4.3 基础设施层

- `js/lib/core.js` 负责初始化开发/生产模式
- `js/lib/core.js` 负责生成带版本的静态资源 URL
- `js/lib/core.js` 负责样式注入和模块加载辅助

### 4.4 页面与组件层

- `js/pages/` 负责页面级视图与页面状态组织
- `js/components/` 负责复用型 UI 组件
- 业务依赖通过显式 import 接入，不再通过全局总线传递

## 5. descriptor 残留审计结果

本次对 `public/test-case-manager` 执行了关键字审计，检索范围覆盖整个目录。

检索关键词：

- `descriptor`
- `registerDescriptor`
- `loadDescriptorModules`
- `waitForDescriptorApp`
- `startDescriptorApp`
- `__APP_REGISTER__`

审计结果：

- 代码目录中未发现残留引用
- `REFACTOR_PLAN.md` 中的历史表述已清理并收敛
- 当前项目内未发现 descriptor 相关配置或启动链路残留

## 6. 当前收益

- 启动链路更短，运行时心智负担更低
- 依赖关系更清晰，代码可读性更高
- 页面与组件职责边界更明确
- 开发/生产环境的资源缓存策略统一
- 后续继续收敛目录和共享模块时风险更低

## 7. 建议的后续收尾

- 复查 `js/bootstrap.js` 与 `js/lib/core.js` 的职责边界是否还能继续收敛
- 视需要补充一份“当前架构说明”给后续维护者快速上手
- 如果未来希望恢复 JSX 书写体验，优先选择预编译，不回退到浏览器端编译
