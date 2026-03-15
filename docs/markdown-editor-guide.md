# Markdown 对比编辑器使用指南

左右分栏 Markdown 编辑器，支持实时预览和对比展示，可同时编辑两边内容。

## 功能特性

- 📝 **左右分栏** - 同时编辑两个 Markdown 文档
- ✏️ **实时预览** - 编辑时自动渲染 Markdown
- 👁️ **视图切换** - 编辑/预览模式自由切换
- 🆚 **对比表格** - 并排展示渲染效果
- 💾 **本地保存** - 数据保存到本地文件
- 📚 **示例模板** - 内置 3 个示例对比
- 🎨 **明暗主题** - 支持深色/浅色模式
- ⌨️ **快捷键** - Ctrl/Cmd + S 快速保存

## 快速开始

### 启动服务

```bash
# 使用 x-static 命令
x-static

# 或直接启动
node -e "
import('./src/http-server/static.js').then(module => {
  const startServer = module.default;
  startServer({ port: 3000 });
});
"
```

### 访问页面

```
http://127.0.0.1:3000/markdown-editor/
```

## 使用教程

### 1. 创建新对比

点击顶部 **"➕ 新建对比"** 按钮，会创建一个新的对比项：
- 左侧默认标题："左侧"
- 右侧默认标题："右侧"
- 包含示例 Markdown 内容

### 2. 编辑内容

#### 左侧编辑器
1. 点击左侧标题输入框，修改标题（如 "Node.js"）
2. 在编辑区输入 Markdown 内容
3. 点击 "👁️ 预览" 查看渲染效果

#### 右侧编辑器
1. 点击右侧标题输入框，修改标题（如 "Python"）
2. 在编辑区输入 Markdown 内容
3. 点击 "👁️ 预览" 查看渲染效果

### 3. 查看对比

滚动到页面底部的 **"对比视图"** 区域，点击 **"🔄 渲染对比"** 按钮，会以表格形式展示两边的渲染效果。

### 4. 保存内容

点击顶部 **"💾 保存"** 按钮，内容会保存到本地文件。

## Markdown 语法支持

### 标题
```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 文本格式
```markdown
**粗体文本**
*斜体文本*
~~删除线~~
`行内代码`
```

### 代码块
````markdown
```javascript
console.log('Hello, World!');
```

```python
print('Hello, World!')
```
````

### 列表
```markdown
- 无序列表项 1
- 无序列表项 2
* 无序列表项 3

1. 有序列表项 1
2. 有序列表项 2
```

### 引用
```markdown
> 这是一段引用文本
> 可以有多行
```

### 链接
```markdown
[链接文本](https://example.com)
```

## 示例对比

### 示例 1: Hello World

**左侧 (Node.js):**
```markdown
# Hello Node.js

```javascript
console.log('Hello, World!');
```

## 特点
- 基于 JavaScript
- 异步非阻塞
- 事件驱动
```

**右侧 (Python):**
```markdown
# Hello Python

```python
print('Hello, World!')
```

## 特点
- 语法简洁
- 易读性强
- 生态丰富
```

### 示例 2: API 示例

**左侧 (Express):**
```markdown
# Express API

```javascript
import express from 'express';
const app = express();

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);
```
```

**右侧 (FastAPI):**
```markdown
# FastAPI

```python
from fastapi import FastAPI
app = FastAPI()

@app.get("/api/users")
async def get_users():
    return {"users": []}
```
```

### 示例 3: 数据库操作

**左侧 (Prisma):**
```markdown
# Prisma ORM

```javascript
const user = await prisma.user.create({
  data: {
    name: 'John',
    email: 'john@example.com'
  }
});
```
```

**右侧 (SQLAlchemy):**
```markdown
# SQLAlchemy

```python
user = User(name='John', email='john@example.com')
db.session.add(user)
db.session.commit()
```
```

## API 接口

### 获取对比列表

```bash
GET /api/markdown-contrast/list
```

响应：
```json
{
  "success": true,
  "data": [...],
  "count": 3
}
```

### 获取单个对比

```bash
GET /api/markdown-contrast/:id
```

### 保存对比

```bash
POST /api/markdown-contrast/save
Content-Type: application/json

{
  "id": "contrast-1234567890",
  "name": "我的对比",
  "icon": "📝",
  "left": {
    "title": "左侧",
    "markdown": "# 内容"
  },
  "right": {
    "title": "右侧",
    "markdown": "# 内容"
  }
}
```

### 删除对比

```bash
DELETE /api/markdown-contrast/:id
```

### 渲染 Markdown

```bash
POST /api/markdown-contrast/render
Content-Type: application/json

{
  "markdown": "# Hello\n\n**Bold** text"
}
```

响应：
```json
{
  "success": true,
  "html": "<h1>Hello</h1><br><strong>Bold</strong> text"
}
```

### 批量渲染（左右两边）

```bash
POST /api/markdown-contrast/render-both
Content-Type: application/json

{
  "left": "# Left content",
  "right": "# Right content"
}
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + S` | 保存当前对比 |
| `Tab` | 切换编辑/预览模式 |

## 数据存储

- **默认示例**: 内置在 `src/markdown-contrast.js` 中
- **用户保存**: 保存在 `.markdown-contrast-data.json` 文件中
- **数据位置**: 项目根目录

## 技巧提示

### 1. 同时编辑
左右两边的编辑器是独立的，可以同时输入内容，互不干扰。

### 2. 实时预览
输入时会自动渲染（300ms 防抖），无需手动点击渲染按钮。

### 3. 视图切换
- **编辑模式**: 显示 Markdown 源代码
- **预览模式**: 显示渲染后的 HTML

### 4. 清空内容
点击编辑器右上角的 "🗑️ 清空" 按钮可快速清除内容。

### 5. 删除对比
在编辑区顶部点击 "🗑️ 删除" 按钮可删除当前对比。

## 常见问题

**Q: 保存的数据在哪里？**
A: 保存在项目根目录的 `.markdown-contrast-data.json` 文件中。

**Q: 可以导出对比吗？**
A: 当前版本不支持导出，但可以直接编辑 JSON 文件。

**Q: 支持图片吗？**
A: 支持 Markdown 图片语法，但图片需要是网络链接。

**Q: 可以自定义样式吗？**
A: 可以修改 `public/markdown-editor/index.html` 中的 CSS 样式。

## 技术架构

### 后端
- **Express.js** - Web 服务器
- **文件系统** - 本地 JSON 文件存储
- **marked** - Markdown 渲染库

### 前端
- **Vue 3** - 响应式框架
- **Tailwind CSS** - UI 样式
- **marked** - Markdown 渲染

## 扩展建议

1. **导出功能** - 支持导出为 HTML/PDF
2. **导入功能** - 支持导入 Markdown 文件
3. **语法高亮** - 集成 Prism.js 代码高亮
4. **云同步** - 支持云端存储和同步
5. **更多模板** - 添加更多预设对比模板
