# Web IDE Lite v2 - Hash 缓存优化实现总结

## 实现的功能

针对 web-ide-lite-v2 项目，实现了三种基于 hash 的缓存更新机制：

### 1. 客户端方案：Hash Version Manager

**文件：** `/public/shared/hash-version.js`

**特点：**
- ✅ 使用简单，只需在 HTML 中引入一个脚本
- ✅ 自动拦截 `<script type="module">` 标签
- ✅ 自动拦截 `import()` 动态导入
- ✅ 自动拦截动态创建的 `<script>` 标签
- ✅ 支持固定版本号和随机时间戳模式

**使用示例：**
```html
<head>
  <!-- 引入 Hash Version Manager -->
  <script src="/shared/hash-version.js" data-version="1.0.0" data-debug="false"></script>
  
  <!-- 模块脚本自动添加 hash -->
  <script type="module" src="/js/main.js"></script>
</head>
```

**效果：**
```html
<!-- 原始 HTML -->
<script type="module" src="/js/main.js"></script>

<!-- 运行时自动转换为 -->
<script type="module" src="/js/main.js?v=1.0.0"></script>
```

### 2. 服务器端方案：Hash Middleware

**文件：** `/src/http-server/hash-middleware.js`

**特点：**
- ✅ 基于文件内容自动计算 hash
- ✅ 支持缓存控制头设置
- ✅ HTML 文件自动注入 hash
- ✅ 支持 hash 验证和缓存失效

**使用示例：**
```javascript
import { createHashMiddleware, createStaticWithHashInjection } from './hash-middleware.js';

// 为特定目录添加 hash 中间件
const webIdeLiteV2Dir = path.join(ROOT_DIR, 'public/web-ide-lite-v2');
app.use('/web-ide-lite-v2', createHashMiddleware(webIdeLiteV2Dir, { hashLength: 8 }));
app.use('/web-ide-lite-v2', express.static(webIdeLiteV2Dir));

// HTML 文件 hash 注入
app.use(createStaticWithHashInjection(webIdeLiteV2Dir, { hashLength: 8 }));
```

**API 函数：**
```javascript
// 计算文件 hash
const hash = computeFileHash('./path/to/file.js');

// 清除缓存
clearHashCache();

// 为 HTML 注入 hash
const html = injectHashToHtml(htmlContent, baseDir);
```

### 3. 构建时方案：Build Hash Script

**文件：** `/scripts/build-hash.js`

**特点：**
- ✅ 构建时静态生成带 hash 的引用
- ✅ 零运行时开销
- ✅ 支持 HTML、JS、CSS 文件
- ✅ 支持固定版本号或文件 hash

**使用示例：**
```bash
# 基本用法
npm run build:web-ide

# 指定版本号
node scripts/build-hash.js public/web-ide-lite-v2 -v 1.0.0

# 指定输出目录
node scripts/build-hash.js public/web-ide-lite-v2 -o dist

# 查看帮助
node scripts/build-hash.js --help
```

**处理范围：**
- HTML 中的 `<script src="...">`
- HTML 中的 `<link href="...">`
- HTML 中的 `<img src="...">`
- JS 中的 `import ... from "..."`
- JS 中的 `import("...")`

**效果示例：**
```js
// 原始代码
import { state } from './state.js';

// 构建后
import { state } from './state.js?hash=1.0.0';
```

## 文件清单

| 文件 | 说明 | 类型 |
|------|------|------|
| `/public/shared/hash-version.js` | 客户端 hash 版本管理器 | 客户端脚本 |
| `/public/shared/auto-hash-loader.js` | 客户端自动 hash 加载器（备用） | 客户端脚本 |
| `/src/http-server/hash-middleware.js` | 服务器端 hash 中间件 | 服务器模块 |
| `/scripts/build-hash.js` | 构建时 hash 生成脚本 | 构建工具 |
| `/docs/web-ide-lite-v2-hash-cache.md` | 详细使用文档 | 文档 |

## Bug 修复

修复了 `actions/` 目录中文件引用 `utils.js` 的路径错误：

- `js/actions/file-actions.js`: `./utils.js` → `../utils.js`
- `js/actions/directory-actions.js`: `./utils.js` → `../utils.js`

## 配置修改

### package.json

添加了两个 npm 脚本：
```json
{
  "scripts": {
    "build:hash": "node scripts/build-hash.js",
    "build:web-ide": "node scripts/build-hash.js public/web-ide-lite-v2"
  }
}
```

### src/http-server/static.js

添加了 hash 中间件集成：
```javascript
import { createHashMiddleware, createStaticWithHashInjection } from './hash-middleware.js';

// 在 web-ide-lite-v2 路由中添加
const webIdeLiteV2Dir = path.join(ROOT_DIR, 'public/web-ide-lite-v2');
app.use('/web-ide-lite-v2', createHashMiddleware(webIdeLiteV2Dir, { hashLength: 8 }));
app.use('/web-ide-lite-v2', express.static(webIdeLiteV2Dir));
app.use(createStaticWithHashInjection(webIdeLiteV2Dir, { hashLength: 8 }));
```

### public/web-ide-lite-v2/index.html

添加了 Hash Version Manager：
```html
<head>
  <!-- Hash Version Manager - 自动为模块添加版本号/hash -->
  <script src="/shared/hash-version.js" data-version="1.0.0" data-debug="false"></script>
</head>
```

## 使用场景推荐

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| 开发环境 | hash-version.js | 快速迭代，便于调试 |
| 生产环境 | build-hash.js | 零运行时开销 |
| 动态更新 | hash-middleware.js | 自动计算 hash |
| CI/CD | build-hash.js + version | 可重复构建 |

## 快速开始

### 开发模式

1. 在 HTML 中引入 hash-version.js：
```html
<script src="/shared/hash-version.js" data-version="dev"></script>
```

2. 修改代码后更新版本号：
```html
<script src="/shared/hash-version.js" data-version="1.0.1"></script>
```

3. 浏览器自动加载新版本

### 生产模式

```bash
# 构建带 hash 的版本
npm run build:web-ide

# 或使用固定版本号
node scripts/build-hash.js public/web-ide-lite-v2 -v $(git rev-parse --short HEAD)
```

## 测试验证

```bash
# 1. 语法检查
node -c src/http-server/hash-middleware.js
node -c scripts/build-hash.js

# 2. 运行构建脚本
npm run build:web-ide

# 3. 启动服务器
x-static

# 4. 访问应用
# http://127.0.0.1:3000/web-ide-lite-v2/
```

## 缓存更新流程

### 方案一：手动更新版本号

```html
<!-- v1.0.0 -->
<script src="/shared/hash-version.js" data-version="1.0.0"></script>

<!-- 更新到 v1.0.1 -->
<script src="/shared/hash-version.js" data-version="1.0.1"></script>
```

### 方案二：使用 Git commit hash

```html
<script>
  // 动态设置版本号
  window.HASH_VERSION = '{{GIT_COMMIT_HASH}}';
</script>
<script src="/shared/hash-version.js"></script>
```

### 方案三：构建时自动生成

```bash
# CI/CD 流程中
VERSION=$(git rev-parse --short HEAD)
node scripts/build-hash.js public/web-ide-lite-v2 -v $VERSION -o dist
```

## 注意事项

1. **外部依赖不添加 hash**：CDN 资源（如 vue、antd）不会添加 hash
2. **相对路径才处理**：只有 `./` 和 `/` 开头的路径会添加 hash
3. **已有 hash 跳过**：如果 URL 已有 `hash=` 或 `v=` 参数，不会重复添加
4. **文件不存在跳过**：如果引用的文件不存在，保持原样

## 故障排查

### 缓存不更新

1. 检查版本号是否修改
2. 强制刷新浏览器（Ctrl+Shift+R）
3. 检查服务器缓存头

### 模块加载失败

1. 检查文件路径是否正确
2. 查看浏览器控制台错误
3. 检查 hash 中间件配置

## 总结

本次优化实现了三种不同层面的 hash 缓存方案：

1. **客户端**：hash-version.js - 最简单，只需引入一个脚本
2. **服务器端**：hash-middleware.js - 最灵活，支持动态计算
3. **构建时**：build-hash.js - 最高效，零运行时开销

可以根据项目需求选择单一方案或组合使用，达到最佳的缓存控制效果。
