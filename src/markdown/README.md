# Markdown 工具集

本目录包含一系列 Markdown 处理工具的核心功能实现，分为两个主要模块：

## 核心功能模块

### 1. 终端查看器 (view.js)

在终端中渲染和显示 Markdown 文件内容的功能模块。

#### 功能特点：
- 使用 `marked` 和 `marked-terminal` 库将 Markdown 转换为终端友好的格式
- 支持多种 Markdown 元素：标题、列表、代码块、表格、引用等
- 可选的分页功能，使用 `less` 命令显示长文档
- 错误处理机制，对文件不存在等情况进行提示

#### 导出函数：
```javascript
/**
 * 在终端中查看 Markdown 文件
 * @param {string} filePath - Markdown 文件路径
 * @param {boolean} paging - 是否使用分页器
 */
export async function viewMarkdown(filePath, paging = false)
```

### 2. 浏览器查看器 (browser.js)

将 Markdown 文件渲染成网页并在浏览器中打开的功能模块。

#### 功能特点：
- 使用 `marked` 将 Markdown 转换为 HTML
- 使用 `express` 创建本地 HTTP 服务器
- 自带基础样式，支持 Markdown 基本元素的渲染
- 跨平台浏览器打开功能（macOS、Windows、Linux）
- 可指定服务器端口

#### 导出函数：
```javascript
/**
 * 在浏览器中打开 Markdown 文件
 * @param {string} filePath - Markdown 文件路径
 * @param {number} port - 服务器端口
 */
export async function browseMarkdown(filePath, port = 0)
```

## 命令行工具

这些核心功能被封装在命令行工具中：

- `bin/md-view.js` - 终端查看器命令行接口
- `bin/md-browser.js` - 浏览器查看器命令行接口

两者都使用 `commander` 库处理命令行参数，仅保留参数解析逻辑，实际功能调用对应的核心模块。

## 使用方式

### 直接使用核心模块
```javascript
import { viewMarkdown } from './src/markdown/view.js';
import { browseMarkdown } from './src/markdown/browser.js';

// 在终端中查看 Markdown 文件
await viewMarkdown('./README.md', true); // 使用分页

// 在浏览器中打开 Markdown 文件
const server = await browseMarkdown('./README.md', 3000); // 指定端口
```

### 通过命令行工具
```bash
# 终端查看
node bin/md-view.js README.md
node bin/md-view.js -f README.md -p

# 浏览器查看
node bin/md-browser.js README.md
node bin/md-browser.js -f README.md -p 8080
```

## 设计思路

1. **功能分离**：将核心功能与命令行参数处理逻辑分离，提高代码复用性
2. **模块化**：每个功能模块独立，便于维护和扩展
3. **一致性**：统一的错误处理和用户反馈机制
4. **可扩展性**：易于添加新功能或修改现有功能而不影响整体架构