# Monaco Editor Web IDE - 使用文档

> 📅 创建时间：2026-03-15
> 📋 Monaco Editor + ES Modules

---

## 🎯 功能概述

基于 Monaco Editor（VS Code 同款编辑器）的 Web IDE，使用 ES Modules 方式导入：

**核心功能：**
- ✅ Monaco Editor 完整功能
- ✅ 智能代码补全
- ✅ 多光标编辑
- ✅ 查找/替换
- ✅ 代码折叠
- ✅ 小地图（Minimap）
- ✅ 打开本地目录
- ✅ 文件/文件夹管理
- ✅ 多标签页编辑
- ✅ 语法高亮（50+ 语言）
- ✅ 本地保存/下载

---

## 🚀 快速开始

### 访问地址

```bash
# 启动服务
x-static

# 访问 Monaco Editor IDE
http://127.0.0.1:3000/monaco-editor/
```

### 基本操作

**打开目录：**
1. 点击 "📂 打开目录" 按钮
2. 选择本地文件夹
3. 自动加载目录结构和文件

**创建文件：**
1. 点击 "📄 新建" 按钮
2. 输入文件名（如 `test.js`）
3. 自动打开编辑

**保存文件：**
- 快捷键：`Ctrl+S` / `Cmd+S`
- 点击 "💾 保存" 按钮

**多标签编辑：**
- 点击文件打开新标签
- 点击标签切换文件
- 点击 `×` 关闭标签

---

## 📁 文件结构

```
public/monaco-editor/
├── index.html          # HTML 结构
├── css/
│   └── styles.css      # 样式文件
└── js/
    └── main.js         # 主入口（ES Modules）
```

**代码统计：**
- 文件数：3
- 总大小：~100KB（不含 Monaco Editor）

---

## 🔧 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Monaco Editor | 0.45.0 | 代码编辑器核心 |
| ES Modules | - | 模块化导入 |
| File System Access API | - | 本地文件访问 |

---

## ⌨️ 快捷键

### 基础快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` / `Cmd+S` | 保存文件 |
| `Ctrl+F` / `Cmd+F` | 查找 |
| `Ctrl+H` / `Cmd+H` | 替换 |
| `Ctrl+P` / `Cmd+P` | 快速打开文件 |
| `Ctrl+Shift+P` | 命令面板 |

### 编辑快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+D` | 选择下一个匹配 |
| `Ctrl+K Ctrl+D` | 移动选中内容到下一个匹配 |
| `Alt+↑/↓` | 上/下移动行 |
| `Shift+Alt+↑/↓` | 上/下复制行 |
| `Ctrl+/` | 切换行注释 |
| `Shift+Alt+A` | 切换块注释 |
| `Ctrl+K Ctrl+0` | 折叠所有区域 |
| `Ctrl+K Ctrl+J` | 展开所有区域 |
| `Ctrl+` ` ` | 触发智能补全 |

### 多光标快捷键

| 快捷键 | 功能 |
|--------|------|
| `Alt+Click` | 插入光标 |
| `Ctrl+Alt+↑/↓` | 上/下插入光标 |
| `Ctrl+U` | 撤销上一次光标操作 |

---

## 🎨 支持的语言

Monaco Editor 支持 50+ 种编程语言：

| 语言 | 扩展名 |
|------|--------|
| JavaScript | .js, .jsx, .mjs |
| TypeScript | .ts, .tsx |
| Python | .py |
| Go | .go |
| Java | .java |
| C/C++ | .c, .cpp, .h |
| C# | .cs |
| PHP | .php |
| Ruby | .rb |
| Rust | .rs |
| HTML | .html, .htm |
| CSS | .css, .scss, .less |
| JSON | .json |
| Markdown | .md |
| YAML | .yaml, .yml |
| XML | .xml |
| SQL | .sql |
| Shell | .sh, .bash |
| Vue | .vue |
| ... | ... |

---

## 📊 与 Lite 版本对比

| 特性 | Monaco Editor | Lite (Prism) |
|------|---------------|--------------|
| 编辑器核心 | Monaco Editor | textarea + Prism |
| 智能补全 | ✅ | ❌ |
| 多光标 | ✅ | ❌ |
| 查找/替换 | ✅ | ❌ |
| 代码折叠 | ✅ | ❌ |
| 小地图 | ✅ | ❌ |
| 错误提示 | ✅ | ❌ |
| 加载速度 | 较慢 | 快 |
| 文件大小 | ~3MB | ~30KB |
| 内存占用 | 高 | 低 |

---

## 🔍 Monaco Editor 特性

### 1. 智能补全

Monaco Editor 提供基于语言语法的智能补全：

```javascript
// 输入 console. 会自动提示
console. // 显示 log, warn, error 等
```

### 2. 错误检查

实时检查语法错误并显示波浪线：

```javascript
// 缺少分号、未定义变量等会显示错误
const x = y + 1  // y 未定义会显示错误
```

### 3. 悬停提示

鼠标悬停在代码上显示类型信息：

```typescript
// 悬停显示：function add(a: number, b: number): number
function add(a, b) {
  return a + b;
}
```

### 4. 定义跳转

`Ctrl+Click` 跳转到函数/变量定义处

### 5. 查找引用

`Shift+F12` 查找所有引用

---

## 🐛 常见问题

### 1. Monaco Editor 加载失败

**原因：** 本地 libs 中没有 Monaco Editor

**解决：**
```bash
# 确保 libs/monaco-editor 目录存在
ls libs/monaco-editor
```

### 2. 无法打开目录

**原因：** 浏览器不支持 File System Access API

**解决：** 使用 Chrome/Edge 等现代浏览器

### 3. 保存失败

**原因：** 文件权限问题或浏览器限制

**解决：** 使用"下载文件"功能保存到本地

### 4. 中文显示乱码

**原因：** 文件编码问题

**解决：** 确保文件是 UTF-8 编码

---

## 🔧 扩展功能

### 自定义主题

Monaco Editor 支持自定义主题：

```javascript
monaco.editor.defineTheme('my-theme', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6a9955' },
    { token: 'string', foreground: 'ce9178' }
  ],
  colors: {
    'editor.background': '#1e1e1e'
  }
});

monaco.editor.setTheme('my-theme');
```

### 添加自定义补全

```javascript
monaco.languages.registerCompletionItemProvider('javascript', {
  provideCompletionItems: (model, position) => {
    return {
      suggestions: [
        {
          label: 'mySnippet',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'console.log("${1:hello}")',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        }
      ]
    };
  }
});
```

---

## 📝 更新日志

### v1.0.0 (2026-03-15)
- ✅ Monaco Editor Web IDE 发布
- ✅ ES Modules 方式导入
- ✅ 文件/目录管理
- ✅ 多标签编辑
- ✅ 语法高亮（50+ 语言）
- ✅ 智能补全
- ✅ 查找/替换
- ✅ 代码折叠
- ✅ 小地图

---

## 🔮 未来计划

- [ ] 文件右键菜单
- [ ] 文件搜索（全局）
- [ ] Git 集成
- [ ] 终端集成
- [ ] 插件系统
- [ ] 自定义主题选择
- [ ] 设置面板

---

## 📚 相关资源

- [Monaco Editor 官网](https://microsoft.github.io/monaco-editor/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [Monaco Editor Playground](https://microsoft.github.io/monaco-editor/playground.html)

---

*本文档基于 v1.0.0 版本编写。*
