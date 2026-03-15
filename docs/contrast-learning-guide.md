# Node.js vs Python 对比学习工具

基于 Web 的交互式对比学习工具，帮助开发者快速掌握 Node.js 和 Python 两种语言的差异。

## 功能特性

- 📚 **13 个核心主题** - 涵盖基础语法到高级特性
- 🆚 **并排对比** - 同时查看两种语言的代码实现
- 📝 **详细说明** - 每个主题都有详细解释和技巧提示
- 📊 **对比表格** - 总结关键差异点
- 🎨 **明暗主题** - 支持深色/浅色模式切换
- ⌨️ **键盘导航** - 使用快捷键快速浏览
- 🔍 **搜索功能** - 快速找到需要的主题

## 主题列表

### 基础语法
1. 👋 Hello World - 第一个程序
2. 📦 变量声明 - var/let/const vs 直接赋值
3. 🔖 数据类型 - 基本类型和引用类型

### 函数
4. ⚙️ 函数定义 - function/箭头函数 vs def

### 流程控制
5. 🔀 条件语句 - if-else/switch vs if-elif-else
6. 🔄 循环语句 - for/while vs for in/while

### 数据结构
7. 📚 数组/列表 - Array 方法 vs 列表推导式
8. 🗂️ 对象/字典 - Object vs dict

### 面向对象
9. 🏗️ 类与继承 - class/extends vs class/(Parent)

### 异步
10. ⚡ 异步编程 - Promise/async-await vs asyncio

### 模块化
11. 📦 模块系统 - ES Modules/CommonJS vs import

### 异常处理
12. ⚠️ 错误处理 - try-catch vs try-except

### IO 操作
13. 📄 文件操作 - fs 模块 vs open()/pathlib

## 使用方法

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
http://127.0.0.1:3000/contrast-learning/
```

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `↑ / ↓` | 上一个/下一个主题 |
| `Ctrl/Cmd + K` | 聚焦搜索框 |
| `ESC` | 清除搜索 |

## API 接口

### 获取分类

```bash
GET /api/contrast/categories
```

响应：
```json
{
  "success": true,
  "data": ["基础语法", "函数", "流程控制", ...]
}
```

### 获取主题列表

```bash
GET /api/contrast/topics
GET /api/contrast/topics?category=函数
```

响应：
```json
{
  "success": true,
  "data": [...],
  "count": 13
}
```

### 获取单个主题

```bash
GET /api/contrast/topics/:id
```

响应：
```json
{
  "success": true,
  "data": {
    "id": "hello-world",
    "name": "Hello World",
    "category": "基础语法",
    "icon": "👋",
    "nodejs": {
      "code": "console.log('Hello, World!');",
      "explanation": "...",
      "tips": "..."
    },
    "python": {
      "code": "print('Hello, World!')",
      "explanation": "...",
      "tips": "..."
    },
    "comparison": [...]
  }
}
```

### 搜索主题

```bash
GET /api/contrast/search?q=函数
```

## 代码示例

### Hello World

**Node.js:**
```javascript
console.log('Hello, World!');
```

**Python:**
```python
print('Hello, World!')
```

**对比:**
| 对比项 | Node.js | Python |
|--------|---------|--------|
| 语法 | console.log() | print() |
| 结束符 | 分号（可选） | 不需要 |
| 括号 | 需要 | 需要 |

### 变量声明

**Node.js:**
```javascript
var oldVar = '旧方式';  // 函数作用域
let letVar = '块级作用域';  // 推荐
const CONST = '常量';  // 只读
```

**Python:**
```python
variable = '变量'
CONSTANT = '常量（约定大写）'
name: str = '类型提示'  # Python 3.5+ 类型提示
```

### 异步编程

**Node.js:**
```javascript
async function fetchData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
```

**Python:**
```python
import asyncio
import aiohttp

async def fetch_data():
    async with aiohttp.ClientSession() as session:
        async with session.get('/api/data') as resp:
            data = await resp.json()
            print(data)

asyncio.run(fetch_data())
```

## 技术架构

### 后端

- **Express.js** - Web 服务器
- **ES Modules** - 模块化
- **对比数据** - JavaScript 对象存储

### 前端

- **Vue 3** - 响应式框架
- **Tailwind CSS** - UI 样式
- **Prism.js** - 代码高亮
- **深色模式** - 主题切换

## 扩展主题

要添加新的对比主题，编辑 `src/contrast-learning.js`：

```javascript
export const contrastTopics = [
  {
    id: 'new-topic',
    name: '新主题',
    category: '分类',
    icon: '🆕',
    nodejs: {
      code: `// Node.js 代码`,
      explanation: '解释',
      tips: '技巧'
    },
    python: {
      code: `# Python 代码`,
      explanation: '解释',
      tips: '技巧'
    },
    comparison: [
      { aspect: '对比项', nodejs: 'Node.js', python: 'Python' }
    ]
  }
];
```

## 学习路线

### 初学者
1. Hello World
2. 变量声明
3. 数据类型
4. 函数定义
5. 条件语句

### 进阶学习
1. 循环语句
2. 数组/列表
3. 对象/字典
4. 类与继承
5. 模块系统

### 高级主题
1. 异步编程
2. 错误处理
3. 文件操作

## 常见问题

**Q: 为什么选择这两种语言对比？**
A: Node.js 和 Python 都是流行的后端语言，对比学习可以快速掌握两者的异同。

**Q: 代码可以直接运行吗？**
A: 大部分代码示例可以直接运行，部分需要安装依赖（如 asyncio）。

**Q: 如何贡献新主题？**
A: 编辑 `src/contrast-learning.js` 添加新的对比主题对象。

**Q: 支持其他语言对比吗？**
A: 当前版本仅支持 Node.js vs Python，未来可能扩展。

## 相关资源

- [Node.js 官方文档](https://nodejs.org/docs/)
- [Python 官方文档](https://docs.python.org/3/)
- [MDN JavaScript 指南](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide)
- [Real Python](https://realpython.com/)
