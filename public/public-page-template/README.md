# public-page-template

这是面向 `public/` 静态页面的标准模板，目标是：

- 使用原生 ESM 组织前端代码。
- 使用 ImportMaps 管理第三方依赖。
- 将结构、样式、状态、服务和组件拆分到多文件中。
- 通过 `window.G_VER` 为本地模块和样式追加版本号，降低浏览器缓存干扰。

## 标准目录结构
```text
public/<page-name>/
├── index.html
├── css/
│   ├── base.css
│   └── page.css
└── js/
    ├── app.js
    ├── main.js
    ├── components/
    │   └── page-shell.js
    ├── services/
    │   └── mock-api.js
    └── utils/
        ├── dom.js
        └── style-loader.js
```

## 模块职责
- `index.html`：只保留挂载点、ImportMaps、全局版本号和入口引导。
- `js/main.js`：统一加载页面样式并启动应用。
- `js/app.js`：组装组件、服务和交互逻辑。
- `js/components/`：页面片段或可复用视图。
- `js/services/`：接口请求、mock 数据、数据格式化。
- `js/utils/`：DOM 操作、样式加载、轻量工具函数。

## ImportMaps 使用原则
- 第三方依赖走 ImportMaps，例如 `dayjs`。
- 本地频繁修改的业务模块，优先使用相对路径加 `?v=${window.G_VER}` 的动态导入。
- 不要写 `import(window.getModuleUrl('@alias'))` 这种浏览器无法正确解析的形式。

## 启动方式
请通过 HTTP 服务访问，而不是双击打开 HTML：

```bash
cd /Users/bytedance/github/cmd/public
python3 -m http.server 8000
```

然后访问对应页面路径。


## 在线预览
- 访问 `/public-page-template/` 查看可运行预览。
- 源模板仍以 `harness/templates/public-page-template/` 为准。
