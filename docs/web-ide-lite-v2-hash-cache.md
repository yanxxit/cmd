# Web IDE Lite v2 - Hash 缓存更新优化指南

## 概述

本项目实现了三种方案来自动为 JS 模块添加 hash 值，实现缓存更新控制：

1. **客户端方案**：`hash-version.js` - 轻量级脚本，自动拦截模块导入
2. **服务器端方案**：`hash-middleware.js` - Express 中间件，自动处理 hash 验证
3. **构建时方案**：`build-hash.js` - 构建脚本，静态生成带 hash 的引用

## 方案对比

| 方案 | 优点 | 缺点 | 推荐场景 |
|------|------|------|----------|
| hash-version.js | 使用简单，只需引入一个脚本 | 需要运行时处理 | 快速原型、开发环境 |
| hash-middleware.js | 服务器端处理，支持缓存控制 | 需要修改服务器配置 | 生产环境 |
| build-hash.js | 构建时处理，零运行时开销 | 需要构建步骤 | 生产环境、CI/CD |

## 使用方法

### 方案一：Hash Version Manager（推荐用于开发）

在 HTML 的 `<head>` 中添加：

```html
<head>
  <!-- 引入 Hash Version Manager -->
  <script src="/shared/hash-version.js" data-version="1.0.0" data-debug="false"></script>
  
  <!-- 你的模块脚本 -->
  <script type="module" src="/js/main.js"></script>
</head>
```

**配置选项：**

```html
<!-- 使用固定版本号 -->
<script src="/shared/hash-version.js" data-version="1.0.0"></script>

<!-- 使用时间戳强制刷新缓存 -->
<script src="/shared/hash-version.js" data-cache-buster="true"></script>

<!-- 开启调试模式 -->
<script src="/shared/hash-version.js" data-debug="true"></script>
```

**功能：**
- 自动为 `<script type="module" src="...">` 添加版本参数
- 自动拦截 `import()` 动态导入
- 自动拦截动态创建的 `<script>` 标签

**示例效果：**

```html
<!-- 原始 HTML -->
<script type="module" src="/js/main.js"></script>

<!-- 自动转换为 -->
<script type="module" src="/js/main.js?v=1.0.0"></script>
```

```js
// 原始代码
import { greet } from './utils.js';
import('./lazy-module.js');

// 运行时自动转换为
import { greet } from './utils.js?v=1.0.0';
import('./lazy-module.js?v=1.0.0');
```

### 方案二：服务器端 Hash 中间件（推荐用于生产）

在 `src/http-server/static.js` 中已经集成：

```javascript
import { createHashMiddleware, createStaticWithHashInjection } from './hash-middleware.js';

// 为特定目录添加 hash 中间件
const webIdeLiteV2Dir = path.join(ROOT_DIR, 'public/web-ide-lite-v2');
app.use('/web-ide-lite-v2', createHashMiddleware(webIdeLiteV2Dir, { hashLength: 8 }));
app.use('/web-ide-lite-v2', express.static(webIdeLiteV2Dir));

// HTML 文件 hash 注入
app.use(createStaticWithHashInjection(webIdeLiteV2Dir, { hashLength: 8 }));
```

**配置选项：**

```javascript
createHashMiddleware(rootDir, {
  hashLength: 8,                              // hash 长度
  cacheControl: 'public, max-age=31536000',  // 缓存控制头
  enableCache: true                           // 是否启用缓存
});
```

**API 函数：**

```javascript
import { computeFileHash, clearHashCache, injectHashToHtml } from './hash-middleware.js';

// 计算文件 hash
const hash = computeFileHash('./path/to/file.js');

// 清除缓存
clearHashCache(); // 或 clearHashCache('./path/to/file.js');

// 为 HTML 注入 hash
const html = injectHashToHtml(htmlContent, baseDir);
```

### 方案三：构建脚本（推荐用于 CI/CD）

**基本用法：**

```bash
# 为指定目录的文件添加 hash
npm run build:hash -- public/web-ide-lite-v2

# 或直接运行
node scripts/build-hash.js public/web-ide-lite-v2
```

**高级用法：**

```bash
# 指定输出目录
node scripts/build-hash.js public/web-ide-lite-v2 -o dist

# 使用固定版本号代替 hash
node scripts/build-hash.js public/web-ide-lite-v2 -v 1.0.0

# 指定 hash 长度
node scripts/build-hash.js public/web-ide-lite-v2 -l 10

# 查看帮助
node scripts/build-hash.js --help
```

**配置选项：**

| 参数 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--output` | `-o` | 输出目录 | 输入目录（原地构建） |
| `--version` | `-v` | 使用版本号代替 hash | 使用文件 hash |
| `--length` | `-l` | hash 长度 | 8 |
| `--help` | `-h` | 显示帮助信息 | - |

**处理范围：**
- HTML 文件中的 `<script src="...">`
- HTML 文件中的 `<link href="...">`
- HTML 文件中的 `<img src="...">`
- JS 文件中的 `import ... from "..."`
- JS 文件中的 `import("...")`

## 完整示例

### Web IDE Lite v2 项目结构

```
public/web-ide-lite-v2/
├── index.html          # 主页面（已集成 hash-version.js）
├── js/
│   ├── main.js         # 入口文件
│   ├── utils.js        # 工具函数
│   ├── state.js        # 状态管理
│   └── ...
└── ...
```

### index.html 配置

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Web IDE Lite v2</title>
  
  <!-- 方案一：Hash Version Manager -->
  <script src="/shared/hash-version.js" data-version="1.0.0"></script>
  
  <!-- 模块脚本（自动添加 hash） -->
  <script type="module" src="/web-ide-lite-v2/js/main.js"></script>
</head>
<body>
  <div id="app"></div>
</body>
</html>
```

### main.js 模块导入

```js
// 这些导入会自动添加 hash 值
import { createApp } from 'vue';        // 外部依赖，不添加
import { state } from './state.js';     // 本地模块，添加 ?v=1.0.0
import { actions } from './actions.js'; // 本地模块，添加 ?v=1.0.0

// 动态导入也会自动添加
const module = await import('./lazy.js'); // ?v=1.0.0
```

## 缓存更新流程

### 开发环境

1. 修改文件内容
2. 更新 `data-version` 版本号
3. 浏览器自动加载新版本

```html
<!-- 版本更新 -->
<script src="/shared/hash-version.js" data-version="1.0.1"></script>
```

### 生产环境

**方式一：使用构建脚本**

```bash
# CI/CD 流程
npm run build:hash -- public/web-ide-lite-v2 -o dist
# 部署 dist 目录
```

**方式二：使用服务器端 hash**

服务器自动计算文件 hash，浏览器缓存失效由 hash 变化控制。

## 最佳实践

### 1. 开发环境配置

```html
<head>
  <!-- 使用 Hash Version Manager，便于调试 -->
  <script src="/shared/hash-version.js" data-version="dev" data-debug="true"></script>
</head>
```

### 2. 生产环境配置

```html
<head>
  <!-- 使用固定版本号，关闭调试 -->
  <script src="/shared/hash-version.js" data-version="1.0.0" data-debug="false"></script>
  
  <!-- 或者使用构建时生成的 hash -->
  <script type="module" src="/js/main.js?hash=abc12345"></script>
</head>
```

### 3. CI/CD 集成

```yaml
# .github/workflows/deploy.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Build with hash
        run: npm run build:hash -- public/web-ide-lite-v2 -o dist -v ${{ github.sha }}
      - name: Deploy
        run: ./deploy.sh dist
```

### 4. 版本号管理

```javascript
// 使用 Git commit hash 作为版本号
const version = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim();

// 或使用 package.json 版本
const version = require('./package.json').version;
```

## 故障排查

### 问题：缓存没有更新

**解决方案：**
1. 检查版本号是否更新
2. 清除浏览器缓存（Ctrl+Shift+R）
3. 检查服务器缓存控制头

### 问题：模块加载失败

**解决方案：**
1. 检查文件路径是否正确
2. 检查 hash 中间件配置
3. 查看浏览器控制台错误信息

### 问题：构建脚本不工作

**解决方案：**
```bash
# 检查 Node.js 版本（需要支持 ES Modules）
node --version

# 检查文件权限
chmod +x scripts/build-hash.js

# 查看详细错误
node scripts/build-hash.js public/web-ide-lite-v2 2>&1
```

## 相关资源

- [MDN: HTTP 缓存](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)
- [Express 静态文件服务](https://expressjs.com/en/starter/static-files.html)
- [ES Modules](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules)

## 总结

| 使用场景 | 推荐方案 | 配置复杂度 |
|----------|----------|------------|
| 快速开发 | hash-version.js | ⭐ |
| 生产部署 | build-hash.js + 服务器 | ⭐⭐⭐ |
| 动态更新 | hash-middleware.js | ⭐⭐ |

根据项目需求选择合适的方案，或者组合使用多种方案以达到最佳效果。
