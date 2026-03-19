# cmd xtools
node.js 开发常用的命令行工具，日常使用。

## 实现功能
- [x] 开启静态服务
- [x] 本地文件查看器（Web 页面）
- [x] XLSX/CSV 转 JSON（Web 页面）
- [x] TODO 任务管理应用（7 个版本）
- [x] 日历管理页面（FullCalendar + Vue 3）
- [x] 时间工具页面（实时时钟/时区/时间戳）
- [x] HTTP 测试平台（参考 httpbin.org）
- [x] 登录入口页面（Pico CSS）
- [x] 实现自定义代理
- [x] md5
- [x] 常用时间转换：tool time
- [x] cal 日历
- [x] say 命令
- [ ] 读书工具
- [x] 翻译 - 有道
    - [x] 记录到本地，避免重复请求
    - [x] 从本地数据库获取翻译
    - [x] 记录到本地 json 文件
    - [ ] 记录到本地数据库，MySQL 获取其他数据库
    - [ ] 请求日志：word,created
    - [ ] 提供一个页面，提供维护页面
- [ ] socke.io 测试页面
- [ ] 简单的 http 模块
- [ ] 图片压缩
- [ ] json 转换（非标准的转换为标准）
- [x] AI Ask 助手
- [x] git 稀疏克隆 下载指定目录
- [x] git 完整克隆 - 下载完整仓库
- [ ] git 日志查询，昨日提交记录，将提交内容生成网页展示出来，或者 markdown 文件
- [x] git 历史日志查看
- [ ] 使用 git 查看自己昨日提交的内容，并终结提交记录，了解自己昨日做了哪些事情
- [x] 将代码改成 module 模式 重构
- [ ] 将代码使用 typescript 重构
- [ ] skill 下载
- [ ] 是否要集成 python 相关脚本
- [ ] 校验网络，测试网速？
- [x] github 代码加速下载
    - [x] 使用 git clone --depth 1 只克隆最近的提交，而不是完整的历史记录。
    - [x] git clone 时，检查 github 网络，如果无法访问 github 时，则切换到其他镜像站点。
    - [x] 优先尝试 https://kgithub.com 和 https://ghproxy.com/github.com 方案
    - [x] 推荐方案：使用 giteee 或者 gitcode
    - [x] https://gitee.com/organizations/mirrors/projects
    - [x] https://gitee.com/mirrors/everything-claude-code
- [ ] github Release / ZIP / Raw 文件 文件下载
- [ ] 开发环境，下载并安装，并统一配置。先从配置入手。
- [x] 实现命令行的 markdown 查看器
- [x] 实现命令行使用浏览器方式打开 markdown 文件
- [x] 清理当前目录下所有的 node_modules 目录
- [ ] 实现目录下文件查询：类似 find 或者 rg 命令
- [x] 日历管理
- [x] TODO 任务管理
    - [x] 数据库存储（PGLite）
    - [x] API 接口
    - [x] 前端界面（原生 HTML/CSS/JS）
    - [x] 子任务管理
    - [x] 优先级管理
    - [x] 筛选和排序
    - [x] 批量操作
- [x] 获取操作系统相关信息web展示页面：
  - 内存，磁盘，CPU 等信息
  - 基于 nodejs
  - 使用socket 进行前后端通讯
- [x] 创建一个本地web 打开本地应用，类似搜索工具
  - [x] 打开指定的应用
  - [ ] 搜索指定文件，并渲染到页面上？
- [x] 获取当前系统的网络wifi密码
- [ ] Linux history 添加时间，增加最大行数
- [ ] 使用 nodejs 实现对比学习工具，例如：nodejs vs python 对比学习工具
  - [ ] 使用 nodejs 实现对比学习工具,  左右两边都是编辑器，左边新增一个属性，右边也添加一个属性（左右两边使用 markdown 语法），两边可以同时输入，输入完毕，可点击查看渲染效果，形成左右两边对比的列表
  - [ ] 添加属性，通过 AI 获取对应属性的参数值
- [ ] 基于@cloudflare/cloudflared 临时搭建一个 http 服务，将本地服务暴露到公网
- [x] 通过AI 生成一个简单的 json 数据库。
  - [x] 创建一个简单的 json 数据库。
  - [x] 支持 jsonb
  - [ ] 开发一个在线管理工具
  - [ ] 支持导入和导出
  - [ ] 添加性能测试脚本，对比 sqlite
- [ ] alasql 一个 web 工具
  - [x] 一个 web 管理工具
  - [x] 添加学习案例
  - [ ] 添加一个 web 管理工具，打开文件数据库，罗列出所有的表，选择表，执行查询语句，返回结果，支持导出csv 和 xlsx,支持 json 和 jsonb
- [ ] 添加一个聊天室功能，或者实现一个简单的 IM
- [x] 基于flowchart实现一个流程图编辑器，cdn 参考：https://www.bootcdn.cn/flowchart/，参考案例：https://flowchart.js.org/，并生成一份文档

- [ ] daisyui + tailwindcss + alpine.js

## 使用

### TODO 任务管理应用

启动服务后访问 `http://127.0.0.1:3000/todo/` 即可使用 TODO 任务管理应用。

```sh
# 启动静态文件服务
x-static
```

**功能特性：**
- ✅ 任务增删改查
- 📝 子任务管理
- 🔴🟡🟢 优先级管理（高/中/低）
- 📅 截止日期管理
- 🔍 搜索功能
- 📊 筛选（全部/待处理/已完成）
- 🔀 排序（按时间/优先级/截止日期）
- 📦 批量操作
- 📈 统计信息

**版本：**
- **v1** (`/todo/`) - 原生 HTML/CSS/JS 实现
- **v2** (`/todo-v2/`) - Tailwind CSS + Alpine.js 实现，现代化 UI
- **v3** (`/todo-v3/`) - Bootstrap 5 + Alpine.js 实现，经典组件库
- **v4** (`/todo-v4/`) - Alpine.js + Tailwind CSS，轻量级响应式
- **v5** (`/todo-v5/`) - Petite-Vue + Tailwind CSS，轻量级 Vue 方案
- **v6** (`/todo-v6/`) - Vue 3 + Tailwind CSS，完整 Vue 3 体验
- **v7** (`/todo-v7/`) - React 18 + Ant Design v5，企业级 UI 组件

**v7 React + Ant Design 特性：**
- ⚛️ React 18 Hooks
- 🎨 Ant Design v5 组件库
- 💯 企业级 UI 设计
- 📦 完整的组件生态
- 🎯 适合企业项目

**v4 Alpine.js 特性：**
- 🎯 使用 Alpine.js 3.x
- 🔧 x-data / x-init 响应式
- 💡 x-model 双向绑定
- 🔄 x-for / x-if / x-show 模板指令
- ⚡ 轻量级（仅 15KB）

**API 接口：**
```bash
# 获取任务列表
GET /api/todos?filter=all&sort=created_desc&search=keyword

# 创建任务
POST /api/todos
Body: { "content": "任务内容", "priority": 2, "due_date": "2026-12-31", "note": "备注" }

# 更新任务
PUT /api/todos/:id
Body: { "completed": true, "priority": 1 }

# 删除任务
DELETE /api/todos/:id

# 批量操作
POST /api/todos/batch
Body: { "ids": [1, 2, 3], "action": "complete" }

# 获取统计信息
GET /api/todos/stats

# 子任务 API
GET /api/todos/subtasks?todo_id=1
POST /api/todos/subtasks
PUT /api/todos/subtasks/:id
DELETE /api/todos/subtasks/:id
```

**测试 API：**
```sh
node test/todo-api-test.js
```

### 本地开发

```js
npm link
```

### 新增功能：Git Clone

使用 `x-git-clone` 命令克隆 Git 仓库：

```sh
# 基本用法
x-git-clone <repository-url> [destination]

# 示例
x-git-clone https://github.com/user/repo.git
x-git-clone git@github.com:user/repo.git
x-git-clone user/repo  # GitHub 简写格式

# 克隆特定分支
x-git-clone <repository-url> -b <branch-name>

# 创建浅克隆（只克隆最近的提交）
x-git-clone <repository-url> --depth 1

# 克隆单一分支
x-git-clone <repository-url> --single-branch
```

### 本地文件查看器

使用 `x-static` 或 `x-file-viewer` 命令启动本地文件查看器服务：

```sh
# 启动静态文件服务（默认当前目录）
x-static

# 指定目录
x-static ./my-project

# 指定端口
x-static -p 8080

# 指定目录和端口
x-static ./my-project -p 8080
```

启动后访问 `http://127.0.0.1:3000/file-viewer/` 即可使用文件查看器。

**功能特性：**
- 📁 展示当前目录文件列表
- 📂 支持点击进入子目录
- 📄 查看文件内容（支持文本文件预览）
- ⬇️ 下载文件
- 🔙 返回上级目录
- 🌙 支持深色/浅色主题切换
- 📱 响应式设计，支持移动端

**安全特性：**
- 限制访问范围在启动目录及其子目录
- 防止路径遍历攻击
- 敏感文件过滤（.env 等）
- 大文件限制预览（>1MB）
- 二进制文件无法预览

### CSV 转 JSON

使用 `x-static` 或 `x-file-viewer` 命令启动服务后，访问 `http://127.0.0.1:3000/csv-to-json/` 即可使用 CSV 转 JSON 工具。

**使用方法：**
1. 启动服务：`x-static`
2. 访问页面：`http://127.0.0.1:3000/csv-to-json/`
3. 上传文件：点击上传区域或拖拽文件
4. 查看结果：前端直接解析，实时显示 JSON 数据
5. 导出：复制 JSON 或下载 JSON 文件

**支持格式：**
- CSV 文件：`.csv`（UTF-8 编码）

**功能特性：**
- 🔒 前端直接解析，文件不上传服务器
- ⚙️ 可配置分隔符、表头、空行处理
- 📋 一键复制 JSON
- 💾 下载 JSON 文件
- 📈 显示文件统计信息
- 🎨 JSON 语法高亮
- 📱 响应式设计

### XLSX 转 JSON

使用 `x-static` 或 `x-file-viewer` 命令启动服务后，访问 `http://127.0.0.1:3000/xlsx-parser/` 即可使用 XLSX 转 JSON 工具。

**使用方法：**
1. 启动服务：`x-static`
2. 访问页面：`http://127.0.0.1:3000/xlsx-parser/`
3. 上传文件：点击上传区域或拖拽文件
4. 查看结果：后端解析后显示 JSON 数据
5. 导出：复制 JSON 或下载 JSON 文件

**支持格式：**
- Excel 文件：`.xlsx`, `.xls`

**功能特性：**
- 📊 支持多工作表 Excel 文件
- 🔀 工作表切换查看
- 📋 一键复制 JSON
- 💾 下载 JSON 文件
- 📈 显示文件统计信息
- 🎨 JSON 语法高亮
- 📱 响应式设计

**API 接口：**
```bash
# 上传并解析文件
POST /api/xlsx/upload
Content-Type: multipart/form-data
Request Body: file (文件字段)

# 解析已存在的文件
GET /api/xlsx/parse?path=/path/to/file.xlsx

# 获取文件信息
GET /api/xlsx/info?path=/path/to/file.xlsx
```

### 本地开发

```js
npm link
```
接下来剩下的就是测试了，对于测试来说不需要把安装包推到 `npm` 中，`npm` 为了方便，提供了 `npm link` 命令，可以实现 `预发布`。在项目根目录中使用 `npm link` 没有报错的话，就说明推送成功了。现在就可以在全局中使用 `q-init` 了。

在全局中使用 `initP -h` 命令，能够输出所编译的 `help` 信息就说明可以初始化项目了。


### 初始化数据

- 拉取 github 资源
  - 离线词典
  - 离线古诗词
  - 离线的一些数据
- 开发常用：
  - 开启一个模拟服务器
    - 实现一个类似 http 测试接口
    - 实现一个类似 httpserver

