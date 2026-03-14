# Web IDE Lite v2 - 模块化版本使用文档

> 📅 创建时间：2026-03-13  
> 📋 技术栈：Vue 3 + TailwindCSS + ES Modules

---

## 🎯 功能概述

Web IDE Lite v2 是完全模块化的版本，使用 ES Modules 和 TailwindCSS：
- ✅ ES Modules 模块化
- ✅ TailwindCSS 原子化 CSS
- ✅ Vue 3 Composition API
- ✅ 文件/目录管理
- ✅ 语法高亮
- ✅ 语言切换
- ✅ 主题切换
- ✅ 右键菜单

---

## 📁 文件结构

```
public/web-ide-lite-v2/
├── index.html          # HTML 结构
├── js/
│   ├── app.js          # 主应用入口
│   ├── config.js       # 配置文件
│   ├── utils.js        # 工具函数
│   └── file-ops.js     # 文件操作模块
└── components/         # Vue 组件（预留）
```

---

## 🔧 技术特点

### 1. ES Modules

**使用方式：**
```html
<script type="module" src="/web-ide-lite-v2/js/app.js"></script>
```

**导入导出：**
```javascript
// 导入
import { createApp, ref } from 'vue';
import { formatFileSize } from './utils.js';
import { fileOperations } from './file-ops.js';

// 导出
export function createWebIDE() { ... }
export const fileOperations = { ... }
```

### 2. TailwindCSS

**CDN 引入（开发环境）：**
```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          ide: {
            bg: '#1e1e1e',
            sidebar: '#252526',
            activity: '#333333',
            status: '#007acc'
          }
        }
      }
    }
  }
</script>
```

**使用示例：**
```html
<div class="h-screen flex flex-col bg-ide-bg text-gray-300">
  <header class="h-12 bg-ide-sidebar border-b border-gray-700">
    <button class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded">
      打开目录
    </button>
  </header>
</div>
```

### 3. 模块化架构

**主应用 (app.js)：**
```javascript
import { createApp, ref, computed } from 'vue';
import { languageMap, fileIcons } from './config.js';
import { formatFileSize } from './utils.js';
import { fileOperations } from './file-ops.js';

export function createWebIDE() {
  const app = createApp({ ... });
  return app;
}

const app = createWebIDE();
app.mount('#app');
```

**配置模块 (config.js)：**
```javascript
export const languageMap = { ... };
export const fileIcons = { ... };
export const fileTypes = [ ... ];
```

**工具模块 (utils.js)：**
```javascript
export function formatFileSize(bytes) { ... }
export function debounce(func, wait) { ... }
```

**文件操作模块 (file-ops.js)：**
```javascript
import { formatFileSize } from './utils.js';

export const fileOperations = {
  async openDirectory(...) { ... },
  async saveFile(...) { ... }
};
```

---

## 🎨 UI 设计

### 颜色方案

| 用途 | 颜色 | Tailwind 类 |
|------|------|------------|
| 背景 | #1e1e1e | bg-ide-bg |
| 侧边栏 | #252526 | bg-ide-sidebar |
| 状态栏 | #007acc | bg-ide-status |
| 边框 | #374151 | border-gray-700 |
| 文字 | #d1d5db | text-gray-300 |

### 布局结构

```
┌─────────────────────────────────────────┐
│           Header (头部)                  │
├───────────┬─────────────────────────────┤
│           │                             │
│  Sidebar  │        Main Editor          │
│  (侧边栏)  │       (主编辑器)             │
│           │                             │
├───────────┴─────────────────────────────┤
│          Status Bar (状态栏)             │
└─────────────────────────────────────────┘
```

---

## 🚀 使用方式

### 访问地址

```bash
# 启动服务
x-static

# 访问模块化版本
http://127.0.0.1:3000/web-ide-lite-v2/
```

### 功能操作

**打开目录：**
1. 点击"📂 打开目录"按钮
2. 选择本地文件夹
3. 自动加载目录结构

**创建文件：**
1. 点击"📄 新建"按钮
2. 输入文件名
3. 自动打开编辑

**保存文件：**
- 快捷键：`Ctrl+S` / `Cmd+S`
- 点击"💾 保存"按钮

**切换语言：**
1. 右下角状态栏选择语言
2. 自动加载语法高亮

**切换主题：**
- 点击状态栏右下角 🌙/☀️ 按钮

**右键菜单：**
- 文件上右键：打开/重命名/复制/下载/删除
- 文件夹上右键：展开/折叠/新建文件/删除
- 空白处右键：新建文件/新建文件夹

---

## 📊 版本对比

| 特性 | v1 | v2 |
|------|-----|-----|
| 模块化 | ❌ | ✅ |
| TailwindCSS | ❌ | ✅ |
| ES Modules | ❌ | ✅ |
| 文件组织 | 单文件 | 多模块 |
| 可维护性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 可扩展性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🔮 未来扩展

### 组件化

```javascript
// components/FileTree.vue
export default {
  props: ['files', 'folders'],
  emits: ['open', 'contextmenu'],
  setup(props, { emit }) {
    // 组件逻辑
  }
}
```

### 构建优化

```bash
# 使用 Vite 构建
npm install -D vite
vite build
```

### 功能扩展

- [ ] 代码补全
- [ ] 错误检查
- [ ] Git 集成
- [ ] 终端集成
- [ ] 插件系统

---

## 📚 相关资源

- [Vue 3 文档](https://vuejs.org/)
- [TailwindCSS 文档](https://tailwindcss.com/)
- [ES Modules](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules)

---

*本文档基于 v2.0.0 版本编写。*
