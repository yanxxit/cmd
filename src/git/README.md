# Git 工具模块

这组模块提供了完整的 Git 操作功能，包括克隆、提交、日志、服务器等。

## 统一 CLI 使用方式

所有功能已整合到统一的命令行工具 `x-git` 中：

```bash
node bin/git.js <command> [options]
```

### 可用命令

#### 1. clone - 克隆 Git 仓库（支持镜像加速）

```bash
# 基本用法
node bin/git.js clone owner/repo
node bin/git.js clone https://github.com/owner/repo.git

# 指定分支和深度
node bin/git.js clone owner/repo -b develop -d 1

# 使用镜像加速（国内推荐）
node bin/git.js clone owner/repo --mirror kkgithub
node bin/git.js clone owner/repo --mirror ghproxy
node bin/git.js clone owner/repo --mirror gitee
```

**选项：**
- `-b, --branch <branch>`: 克隆指定分支
- `--single-branch`: 仅克隆单个分支
- `-d, --depth <depth>`: 浅克隆深度
- `--mirror <mirror>`: 指定镜像站点 (kkgithub/ghproxy/gitee/ghapi/gitclone/yumenaka/ghproxynet)

#### 2. commit - 生成符合规范的 commit 信息

```bash
# 基本用法（基于暂存区）
node bin/git.js commit

# 使用所有工作区变更
node bin/git.js commit -a

# 交互模式
node bin/git.js commit -i

# 指定 type 和 scope
node bin/git.js commit -t fix --scope core

# 仅显示变更统计（不使用 AI）
node bin/git.js commit --no-api
```

**选项：**
- `-s, --staged`: 仅使用暂存区的变更（默认）
- `-a, --all`: 使用所有工作区的变更
- `-c, --copy`: 生成后自动复制到剪贴板
- `-v, --verbose`: 显示详细信息
- `-t, --type <type>`: 指定 commit type (feat/fix/docs/style/refactor/test/chore/perf/ci/build/revert)
- `--scope <scope>`: 指定 commit scope
- `-i, --interactive`: 交互模式（选择 type、确认消息）
- `--no-api`: 不使用 AI，仅显示变更文件列表

#### 3. log - 生成 Git 提交日志报告

```bash
# 生成昨天的报告（默认）
node bin/git.js log

# 生成今天的报告
node bin/git.js log -d today

# 生成最近一个月的报告
node bin/git.js log --month

# 生成日期范围报告
node bin/git.js log --since 2024-01-01 --until 2024-01-31

# 按作者过滤
node bin/git.js log -a "作者姓名"

# 生成多种格式
node bin/git.js log --all

# 仅查看自己的提交
node bin/git.js log --mine
```

**选项：**
- `-d, --date <date>`: 指定日期 (默认：yesterday)
- `--since <date>`: 开始日期
- `--until <date>`: 结束日期
- `-a, --author <author>`: 按作者过滤
- `-o, --output <path>`: 输出文件路径 (默认：./git-log.html)
- `-f, --format <format>`: 输出格式：html/json/md
- `--diff`: 包含详细的代码变更内容
- `--open`: 生成后自动在浏览器中打开（仅 HTML 格式）
- `--all`: 生成所有格式的报告（html + json + md）
- `--month`: 显示最近一个月的提交记录
- `--no-merges`: 排除 merge 提交
- `--mine`: 仅查看自己的提交记录

#### 4. log-server - 启动 Git 日志可视化服务器

```bash
# 启动服务器（默认端口 3000）
node bin/git.js log-server

# 指定端口和主机
node bin/git.js log-server -p 8080 --host 0.0.0.0

# 启动后自动打开浏览器
node bin/git.js log-server --open
```

**选项：**
- `-p, --port <port>`: 服务器端口 (默认：3000)
- `--host <host>`: 服务器主机 (默认：127.0.0.1)
- `--open`: 启动后自动打开浏览器

#### 5. sparse - Git 稀疏检出工具

```bash
# 基本用法
node bin/git.js sparse

# 指定仓库和路径
node bin/git.js sparse -u https://gitee.com/yanxxit/conf.git -t vim

# 指定输出目录
node bin/git.js sparse -t config -o ./output

# 显示详细输出
node bin/git.js sparse -v
```

**选项：**
- `-u, --repo-url <url>`: 远程仓库地址
- `-b, --branch <branch>`: 分支名称
- `-t, --target-path <path>`: 想要拉取的特定文件或文件夹名
- `-d, --local-dir <dir>`: 本地文件夹名称
- `-o, --output-dir <dir>`: 最终输出目录
- `-v, --verbose`: 显示详细输出

## 模块结构

```
src/git/
├── index.js              # 统一导出所有模块
├── clone.js              # Git 克隆（支持镜像加速）
├── commit.js             # Git 提交生成
├── commit-log.js         # Git 提交日志
├── log.js                # Git 日志报告生成
├── log-server.js         # Git 日志服务器
├── repo-info.js          # 仓库信息
├── report-generator.js   # 报告生成器
├── sparseClone.js        # 稀疏克隆
└── README.md             # 本文件
```

## 编程方式使用

```javascript
import {
  cloneRepo,
  generateCommitMessage,
  generateLogReport,
  createGitLogServer,
  sparseClone
} from './src/git/index.js';

// 克隆仓库
await cloneRepo('owner/repo', './dest', { mirror: 'kkgithub' });

// 生成 commit message
const message = await generateCommitMessage(diff, files, lastCommit);

// 生成日志报告
await generateLogReport({ date: 'yesterday', format: 'html' });

// 启动日志服务器
const server = createGitLogServer({ port: 3000 });
await server.start();

// 稀疏克隆
await sparseClone({
  repoUrl: 'https://gitee.com/yanxxit/conf.git',
  targetPath: 'vim'
});
```