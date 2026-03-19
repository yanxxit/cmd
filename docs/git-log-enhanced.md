# Git 日志工具增强版

## 新增功能

### 1. 代码重构

已将 `bin/x-git-log.js` 中的代码拆分到 `src/git/` 目录下，采用模块化设计：

```
src/git/
├── index.js              # 统一导出所有 git 相关函数
├── commit-log.js         # 提交日志获取功能
├── report-generator.js   # 报告生成功能 (HTML/JSON/Markdown)
├── repo-info.js          # 仓库信息获取功能
└── sparseClone.js        # 稀疏克隆功能
```

### 2. 仅查看自己的提交记录

新增 `--mine` 选项，自动使用当前 Git 配置的用户名和邮箱，并排除 merge 提交：

```bash
# 仅查看自己的提交（自动使用 git config user.name/email）
x-git-log --mine

# 结合其他选项使用
x-git-log --mine --date today
x-git-log --mine --since 2024-01-01 --until 2024-01-31
```

### 3. 排除 Merge 提交

新增 `--no-merges` 选项，排除所有 merge 提交记录：

```bash
# 排除 merge 提交
x-git-log --no-merges

# 查看昨天自己的提交（排除 merge）
x-git-log --mine --no-merges
```

### 4. 可视化界面（HTTP 服务）

新增 HTTP 服务器，提供基于 Vue 3 + Tailwind CSS 的可视化界面，支持在线查看提交和代码差异：

#### 启动服务器

```bash
# 默认端口 3000
x-git-log-server

# 指定端口
x-git-log-server -p 8080

# 启动后自动打开浏览器
x-git-log-server --open
```

#### 访问地址

- **可视化界面**: http://127.0.0.1:3000/
- **API 端点**: http://127.0.0.1:3000/api/commits

#### 功能特性

- 📊 实时统计卡片（提交数、文件数、新增/删除行数）
- 🔍 筛选功能（日期范围、作者、仅我的提交、排除 Merge）
- 📁 文件列表展示，支持点击查看详情
- 🔀 差异对比视图（支持语法高亮）
- 📋 一键复制差异内容
- 🎨 响应式设计，支持移动端

## API 接口

### 获取提交列表

```bash
GET /api/commits?date=yesterday&author=xxx&noMerges=true&mine=true
```

### 获取单个提交详情

```bash
GET /api/commits/:hash
```

### 获取文件差异

```bash
GET /api/commits/:hash/diff/:filePath
```

### 获取仓库信息

```bash
GET /api/repo
```

## 使用示例

### CLI 命令

```bash
# 查看昨天的提交
x-git-log

# 查看今天的提交
x-git-log --date today

# 查看最近 30 天的提交
x-git-log --month

# 查看指定日期范围的提交
x-git-log --since 2024-01-01 --until 2024-01-31

# 按作者过滤
x-git-log --author "张三"

# 仅查看自己的提交
x-git-log --mine

# 生成 JSON 格式报告
x-git-log -f json -o report.json

# 生成所有格式的报告
x-git-log --all

# 生成报告并自动打开浏览器
x-git-log --open
```

### HTTP 服务

```bash
# 启动服务
x-git-log-server

# 指定端口并自动打开浏览器
x-git-log-server -p 8080 --open
```

## 技术栈

- **后端**: Node.js + Express.js
- **前端**: Vue 3 + Tailwind CSS
- **Git 操作**: 原生 Git 命令
- **模板引擎**: EJS

## 模块化设计

### commit-log.js

提供 Git 提交日志获取功能：

```javascript
import { getCommitsByDate, getCommitsByDateRange, getFullCommitLog } from '../src/git/index.js';

// 获取指定日期的提交
const commits = await getCommitsByDate({ 
  date: 'yesterday',
  author: '张三',
  noMerges: true,
  mine: true
});

// 获取日期范围内的提交
const commits = await getCommitsByDateRange({ 
  since: '2024-01-01',
  until: '2024-01-31',
  includeDiff: true
});
```

### report-generator.js

提供报告生成功能：

```javascript
import { generateHTMLReport, generateJSONReport, generateMarkdownReport } from '../src/git/index.js';

await generateHTMLReport(commits, '2024-01-01', true, './report.html');
await generateJSONReport(commits, '2024-01-01', './report.json');
await generateMarkdownReport(commits, '2024-01-01', true, './report.md');
```

### repo-info.js

提供仓库信息获取功能：

```javascript
import { getRemoteRepoInfo, getRepoStats, getCurrentGitUser } from '../src/git/index.js';

const remoteInfo = await getRemoteRepoInfo();
const stats = await getRepoStats();
const user = getCurrentGitUser();
```
