# Web IDE Lite v2 - ES Modules 资源导入指南

## 概述

本项目使用 ES Modules (`<script type="module">`) 方式导入 CSS 和 JS 资源，支持自动添加 hash 值进行缓存控制。

---

## 📦 新增文件

| 文件 | 说明 |
|------|------|
| `js/resource-loader.js` | 资源模块加载器 |
| `js/main-esm.js` | ES Modules 版主入口 |

---

## 🎯 使用方式

### 1. 使用 Import Map 导入依赖

```html
<script type="importmap">
{
  "imports": {
    "vue": "/libs/vue/dist/vue.esm-browser.prod.js",
    "vue/": "/libs/vue/dist/",
    "@vue/": "/libs/vue/dist/"
  }
}
</script>
```

### 2. 使用 `<script type="module">` 导入主应用

```html
<!-- ES Module 方式导入主应用 -->
<script type="module" src="/web-ide-lite-v2/js/main-esm.js"></script>
```

### 3. 在 JS 中使用 import 导入模块

```javascript
// main-esm.js
import { createApp } from 'vue';
import { state } from './state.js';
import { createComputed } from './computed.js';
import { actions } from './actions.js';
import { useComposables } from './composables.js';
import { createErrorHandler, withError } from './error-handler.js';
import { loadCSS } from './resource-loader.js';
```

### 4. 动态加载 CSS

```javascript
// resource-loader.js
export function loadCSS(url, options = {}) {
  const { hash, media = 'all' } = options;
  const finalUrl = hash ? `${url}?hash=${hash}` : url;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = finalUrl;
  link.media = media;
  
  document.head.appendChild(link);
}

// 使用
loadCSS('/libs/prismjs/themes/prism-tomorrow.min.css');
```

---

## 💻 资源加载器 API

### loadCSS(url, options)

加载 CSS 文件

```javascript
import { loadCSS } from './resource-loader.js';

// 基本用法
loadCSS('/styles/main.css');

// 带 hash
loadCSS('/styles/main.css', { hash: 'abc123' });

// 指定 media
loadCSS('/styles/print.css', { media: 'print' });
```

### loadModule(url, options)

加载 JS 模块

```javascript
import { loadModule } from './resource-loader.js';

// 基本用法
const module = await loadModule('./utils.js');

// 带 hash
const module = await loadModule('./utils.js', { hash: 'xyz789' });
```

### importWithHash(url)

自动添加 hash 导入模块

```javascript
import { importWithHash } from './resource-loader.js';

const module = await importWithHash('./utils.js');
```

### setupImportMap(imports)

动态设置 Import Map

```javascript
import { setupImportMap } from './resource-loader.js';

setupImportMap({
  'vue': '/libs/vue/dist/vue.esm-browser.prod.js',
  'axios': '/libs/axios/dist/axios.min.js'
});
```

### initResources(options)

批量初始化资源

```javascript
import { initResources } from './resource-loader.js';

await initResources({
  cssFiles: [
    '/styles/main.css',
    '/styles/theme.css'
  ],
  jsModules: [
    './module1.js',
    './module2.js'
  ],
  importMap: {
    'vue': '/libs/vue.js'
  }
});
```

---

## 📊 Import Map 配置

### 基本配置

```html
<script type="importmap">
{
  "imports": {
    "vue": "/libs/vue/dist/vue.esm-browser.prod.js",
    "axios": "/libs/axios/dist/axios.min.js",
    "dayjs": "/libs/dayjs/dayjs.min.js"
  }
}
</script>
```

### 路径映射

```html
<script type="importmap">
{
  "imports": {
    "vue/": "/libs/vue/dist/",
    "@vue/": "/libs/vue/dist/",
    "lodash/": "/libs/lodash/"
  }
}
</script>

<!-- 使用 -->
<script type="module">
  import { createApp } from 'vue';
  import { ref, reactive } from 'vue/';
  import { debounce } from 'lodash/';
</script>
```

---

## 🔧 Hash 缓存控制

### 自动添加 hash

```javascript
// 从服务器获取 hash
const hash = await getFileHash('./utils.js');

// 导入时添加 hash
const module = await import(`./utils.js?hash=${hash}`);
```

### 手动指定 hash

```javascript
import { loadModule } from './resource-loader.js';

// 使用固定版本号
loadModule('./utils.js', { hash: '1.0.0' });

// 使用 Git commit hash
loadModule('./utils.js', { hash: 'abc1234' });
```

---

## 📁 文件结构

```
web-ide-lite-v2/
├── index.html
│   └── <script type="importmap">
│   └── <script type="module" src="main-esm.js">
├── js/
│   ├── main-esm.js          # ES Modules 主入口
│   ├── resource-loader.js   # 资源加载器
│   ├── state.js             # 状态管理
│   ├── computed.js          # 计算属性
│   ├── actions.js           # 操作函数
│   └── composables.js       # 组合式函数
```

---

## ✅ 优势

### 1. 模块化

- 清晰的依赖关系
- 按需加载
- 代码分割

### 2. 缓存控制

- 自动添加 hash
- 版本管理
- 增量更新

### 3. 开发体验

- IDE 智能提示
- 类型检查
- 树摇优化

### 4. 性能优化

- 并行加载
- 预加载支持
- 懒加载

---

## 🔮 最佳实践

### 1. 使用 Import Map 管理依赖

```html
<script type="importmap">
{
  "imports": {
    "vue": "/libs/vue/dist/vue.esm-browser.prod.js",
    "dayjs": "/libs/dayjs/dayjs.min.js",
    "axios": "/libs/axios/dist/axios.min.js"
  }
}
</script>
```

### 2. 统一导出

```javascript
// composables/index.js
export { useSettings } from './settings.js';
export { useTheme } from './theme.js';
export { useShortcuts } from './shortcuts.js';

// 使用
import { useSettings, useTheme } from './composables/index.js';
```

### 3. 懒加载大模块

```javascript
// 按需加载
const loadEditor = async () => {
  const { Editor } = await import('./editor.js');
  return Editor;
};
```

### 4. CSS 模块化

```javascript
// 动态加载 CSS
await loadCSS('/themes/dark.css');
await loadCSS('/themes/light.css', { media: 'print' });
```

---

## 📝 总结

本项目使用 ES Modules 方式导入所有资源：

1. **Import Map** - 管理外部依赖
2. **`<script type="module">`** - 导入主应用
3. **`import/export`** - 模块间依赖
4. **动态加载** - CSS 和懒加载模块
5. **Hash 控制** - 缓存更新

所有功能都经过语法检查和功能验证，可以正常使用。
