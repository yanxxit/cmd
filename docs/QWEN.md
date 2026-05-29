# 项目上下文：cmd (xtools)

## 项目概述

**cmd**（也称为 **xtools**）是一个基于 Node.js 的命令行工具集，用于日常开发任务。它提供了一套全面的实用工具，包括静态文件服务、文件查看器、数据转换工具，以及多个版本的 TODO 任务管理应用。

**主要特点：**
- **类型：** 代码项目（Node.js CLI 工具 + Web 应用）
- **架构：** Express.js 后端 + 多前端框架（原生 JS、Alpine.js、Vue 3、React 18）
- **数据库：** PGLite（嵌入式 PostgreSQL）用于 TODO 数据持久化
- **包管理器：** npm/pnpm
- **模块系统：** ES Modules（`"type": "module"`）

## 目录结构

```
cmd/
├── bin/                    # CLI 命令可执行文件
│   ├── command.js         # 主 CLI 入口 (it-cmd)
│   ├── static.js          # 静态文件服务器 (x-static)
│   ├── git-clone.js       # Git 克隆带代理 (x-git-clone)
│   ├── md-viewer.js       # Markdown 查看器 (x-md-view)
│   ├── clean-node.js      # 清理 node_modules (x-clean-node)
│   └── ...                # 其他命令
├── src/                   # 源代码
│   ├── http-server/       # Express 服务器和 API 路由
│   │   ├── static.js      # 主服务器配置
│   │   ├── todo-api.js    # TODO API 端点
│   │   ├── auth-api.js    # 认证 API
│   │   └── ...
│   ├── model/             # 数据模型 (PGLite)
│   │   ├── database.js    # 数据库初始化
│   │   ├── todo.js        # TODO 模型
│   │   └── subtask.js     # 子任务模型
│   ├── ai/                # AI 相关工具
│   ├── dict/              # 词典工具
│   ├── git/               # Git 工具
│   └── util/              # 通用工具
├── public/                # 静态 Web 资源
│   ├── file-viewer/       # 文件查看器 Web 应用
│   ├── todo/              # TODO 应用 v1 (原生 JS)
│   ├── todo-v2/           # TODO 应用 v2 (Alpine.js + Tailwind)
│   ├── todo-v3/           # TODO 应用 v3 (Bootstrap + Alpine.js)
│   ├── todo-v4/           # TODO 应用 v4 (Alpine.js + Tailwind)
│   ├── todo-v5/           # TODO 应用 v5 (Petite-Vue)
│   ├── todo-v6/           # TODO 应用 v6 (Vue 3 + Tailwind)
│   ├── todo-v7/           # TODO 应用 v7 (React 18 + Ant Design)
│   ├── calendar/          # 日历管理 (FullCalendar + Vue 3)
│   ├── time/              # 时间工具 (Vue 3)
│   ├── login/             # 登录页面 (Pico CSS)
│   ├── pomodoro/          # 番茄时钟
│   ├── csv-to-json/       # CSV 转 JSON 转换器
│   ├── xlsx-parser/       # XLSX 转 JSON 转换器
│   └── index.html         # 工具箱首页
├── docs/                  # 文档
├── test/                  # 测试文件
├── templates/             # EJS 模板
├── .pgdata/               # PGLite 数据库存储
└── package.json           # 项目配置
```

## 可用命令

### 核心命令

```bash
# 启动静态文件服务器（默认端口 3000）
x-static [目录] [-p 端口]

# 启动文件查看器（x-static 的别名）
x-file-viewer [目录] [-p 端口]

# Git 克隆，自动代理回退
x-git-clone <仓库 URL> [目标目录]
x-git-clone <repo> --depth 1        # 浅克隆
x-git-clone <repo> -b <分支>        # 指定分支

# Git 稀疏检出
x-git-sparse <repo> <目录>

# 查看 Git 日志
x-git-log

# Markdown 查看器（终端）
x-md-view <file.md>

# Markdown 查看器（浏览器）
x-md-browser <file.md>

# 清理所有 node_modules 目录
x-clean-node

# 列出目录大小
x-ls-size [目录]
x-ls-size-fast [目录]

# AI 问答助手
x-ask <问题>

# 与 AI 聊天
x-chat

# 翻译（有道）
x-fy <单词>

# 文本转语音
x-say <文本>

# 主 CLI (it-cmd)
it-cmd <命令> [选项]
```

### 开发命令

```bash
# 全局链接包（用于开发）
npm link

# 取消链接包
npm unlink

# 运行 TODO API 测试
npm run test:todo
```

## Web 应用

### 静态文件服务器

**命令：** `x-static [目录] [-p 3000]`

**功能：**
- 从指定目录提供静态文件服务
- 内置文件查看器 `/file-viewer/`
- 通过配置支持代理
- 启用压缩
- 可访问所有 Web 应用

**访问点：**
- 首页：`http://127.0.0.1:3000/`
- 文件查看器：`http://127.0.0.1:3000/file-viewer/`

### TODO 应用（7 个版本）

所有版本共享相同的 API 后端，但使用不同的前端框架：

| 版本 | 技术栈 | URL | 说明 |
|------|--------|-----|------|
| v1 | 原生 JS | `/todo/` | 学习用途 |
| v2 | Alpine.js + Tailwind | `/todo-v2/` | 现代化 UI |
| v3 | Bootstrap 5 + Alpine.js | `/todo-v3/` | 经典组件库 |
| v4 | Alpine.js + Tailwind | `/todo-v4/` | 轻量级（推荐） |
| v5 | Petite-Vue + Tailwind | `/todo-v5/` | 超轻量级 |
| v6 | Vue 3 + Tailwind | `/todo-v6/` | 完整 Vue 3（推荐） |
| v7 | React 18 + Ant Design v5 | `/todo-v7/` | 企业级 UI（推荐） |

**功能：**
- ✅ CRUD 操作
- 📝 子任务管理
- 🔴 优先级（高/中/低）
- 📅 截止日期
- 🔍 搜索和筛选
- 📊 统计信息
- 📦 批量操作

**API 端点：**
```bash
GET  /api/todos              # 获取任务列表
POST /api/todos              # 创建任务
PUT  /api/todos/:id          # 更新任务
DELETE /api/todos/:id        # 删除任务
GET  /api/todos/stats        # 获取统计信息
GET  /api/todos/subtasks     # 获取子任务列表
POST /api/todos/subtasks     # 创建子任务
PUT  /api/todos/subtasks/:id # 更新子任务
DELETE /api/todos/subtasks/:id # 删除子任务
```

### 其他 Web 工具

| 工具 | URL | 说明 |
|------|-----|------|
| 日历管理 | `/calendar/` | 基于 FullCalendar 的日历，支持任务管理 |
| 时间工具 | `/time/` | 实时时钟、时区转换器、时间戳转换器 |
| 登录入口 | `/login/` | Pico CSS 登录页面，支持主题切换 |
| 番茄时钟 | `/pomodoro/` | 番茄钟，支持统计 |
| CSV 转 JSON | `/csv-to-json/` | 客户端 CSV 解析器 |
| XLSX 转 JSON | `/xlsx-parser/` | 服务端 Excel 解析器 |

## API 参考

### 认证 API

```bash
POST /api/auth/login
请求体：{ "username": "admin", "password": "admin123", "remember": true }
响应：{ "success": true, "data": { "token": "...", "user": {...} } }

POST /api/auth/logout
请求头：{ "Authorization": "Bearer <token>" }

GET /api/auth/me
请求头：{ "Authorization": "Bearer <token>" }
```

**测试账户：**
- `admin` / `admin123`（管理员）
- `user` / `user123`（普通用户）

### XLSX 解析器 API

```bash
POST /api/xlsx/upload
Content-Type: multipart/form-data
请求体：file（文件字段）

GET /api/xlsx/parse?path=/path/to/file.xlsx

GET /api/xlsx/info?path=/path/to/file.xlsx
```

## 配置

### 环境变量

在项目根目录创建 `.env` 文件：

```bash
# 混元 AI API Key
HUNYUAN_API_KEY=sk-xxx
```

### 本地依赖

项目使用本地依赖，通过 CDN 风格的路径提供服务：

```html
<!-- 在浏览器中访问 -->
/libs/axios/dist/axios.min.js
/libs/vue/dist/vue.global.prod.js
/libs/react/umd/react.production.min.js
/libs/antd/dist/antd.min.js
/libs/@picocss/pico/css/pico.min.css
/libs/fullcalendar/index.global.min.js
```

## 开发实践

### 模块系统
- 使用 ES Modules（`import`/`export`）
- package.json 中配置 `"type": "module"`

### 代码风格
- 中文注释，便于团队阅读
- 异步操作使用 Async/await
- 后端路由使用 Express.js
- 嵌入式数据库使用 PGLite

### 测试
- API 测试位于 `test/` 目录
- 运行测试：`npm run test:todo`

### 数据库
- PGLite（嵌入式 PostgreSQL）
- 数据存储在 `.pgdata/` 目录
- API 请求时自动初始化

## 关键技术

### 后端
- **Express.js** - Web 框架
- **PGLite** - 嵌入式 PostgreSQL
- **commander** - CLI 框架
- **http-proxy-middleware** - 代理支持
- **compression** - 响应压缩
- **morgan** - HTTP 请求日志

### 前端（各版本）
- **Vue 3** - 响应式框架（v6）
- **React 18** - UI 库（v7）
- **Alpine.js** - 轻量级框架（v2, v3, v4）
- **Petite-Vue** - 超轻量级（v5）
- **Ant Design v5** - 企业级 UI 组件（v7）
- **Tailwind CSS** - 实用优先 CSS
- **Bootstrap 5** - 组件库（v3）
- **FullCalendar** - 日历组件
- **Pico CSS** - 极简 CSS 框架

## 常见工作流

### 启动开发服务器

```bash
# 从项目根目录启动
x-static

# 指定目录和端口
x-static ./my-project -p 8080

# 访问应用
# 首页：http://127.0.0.1:3000/
# TODO v7: http://127.0.0.1:3000/todo-v7/
# 日历：http://127.0.0.1:3000/calendar/
```

### 添加新的 CLI 命令

1. 在 `bin/` 中创建命令文件：
```javascript
#!/usr/bin/env node
import { program } from 'commander';

program
  .command('my-command <arg>')
  .description('我的命令描述')
  .action((arg) => {
    console.log('你好', arg);
  });

program.parse(process.argv);
```

2. 添加到 `package.json` 的 bin：
```json
"bin": {
  "x-my-command": "bin/my-command.js"
}
```

3. 链接以进行测试：
```bash
npm link
```

### 添加新的 Web 应用

1. 在 `public/` 中创建目录：
```bash
mkdir public/my-app
```

2. 在 `src/http-server/static.js` 中添加路由：
```javascript
const myAppDir = path.join(ROOT_DIR, 'public/my-app');
app.use('/my-app', express.static(myAppDir));
app.get('/my-app', (req, res) => {
  res.sendFile(path.join(myAppDir, 'index.html'));
});
```

## 项目统计

- **工具总数：** 17+ CLI 命令
- **Web 应用：** 10+（包括 7 个 TODO 版本）
- **文档：** 30+ 文件在 `docs/`
- **依赖：** 35+ npm 包

## 相关文档

- `README.md` - 项目主文档
- `docs/` - 特定功能的详细指南
- `libs.md` - 本地依赖路径参考
