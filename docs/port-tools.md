# 端口管理工具集

## 概述

本项目包含两个用于端口管理的命令行工具：

| 命令 | 功能 | 说明 |
|------|------|------|
| `x-who-port` | 查询端口占用信息 | 显示占用指定端口的进程详细信息 |
| `x-kill-port` | 关闭端口占用进程 | 关闭占用指定端口的进程 |

## 快速开始

```bash
# 1. 查询哪个进程占用了端口 3000
x-who-port 3000

# 2. 关闭占用端口 3000 的进程
x-kill-port 3000 --force

# 3. 再次查询确认端口已释放
x-who-port 3000
```

## 命令详解

### x-who-port - 查询端口占用信息

**功能**：查询占用指定端口的服务详细信息，包括位置、文件、命令、时间等。

**语法**：
```bash
x-who-port <port> [选项]
```

**选项**：
- `-j, --json` - 以 JSON 格式输出
- `-v, --verbose` - 显示更详细的信息（包含工作目录）
- `--no-log` - 不记录日志
- `-h, --help` - 显示帮助信息

**示例**：
```bash
# 基本查询
x-who-port 3000

# JSON 格式输出
x-who-port 3000 --json

# 显示详细信息
x-who-port 3000 --verbose
```

**输出信息**：
- 📍 端口号
- 📊 占用进程数
- 🕐 查询时间
- 进程基本信息（命令、PID、用户、文件描述符、协议类型）
- 网络信息（监听地址、设备）
- 进程详细信息（父进程 PID、进程状态、启动时间、CPU 时间、完整命令）
- 工作目录（详细模式）

### x-kill-port - 关闭端口占用进程

**功能**：通过端口号关闭占用端口的应用程序。

**语法**：
```bash
x-kill-port <port> [选项]
```

**选项**：
- `-f, --force` - 强制关闭，不确认提示
- `--no-log` - 不记录日志
- `-h, --help` - 显示帮助信息

**示例**：
```bash
# 交互式关闭（需要确认）
x-kill-port 3000

# 强制关闭（无需确认）
x-kill-port 3000 --force

# 不记录日志
x-kill-port 3000 --no-log
```

**输出信息**：
- 🔍 查找进程状态
- 📋 找到的进程列表
- 💀 关闭进程过程
- ✅ 执行结果统计

## 日志记录

### 日志位置

- `x-who-port` 日志：`logs/who-port.log`
- `x-kill-port` 日志：`logs/kill-port.log`

### 日志格式

```
[时间戳] [级别] 消息内容
```

### 日志级别

| 级别 | 说明 |
|------|------|
| `INFO` | 一般信息 |
| `WARNING` | 警告信息 |
| `ERROR` | 错误信息 |
| `SUCCESS` | 成功信息 |
| `TIP` | 使用提示 |

### 日志内容

每条命令执行会记录：
- 命令开始标记
- 执行的命令和参数
- 操作过程信息
- 执行结果
- 命令结束标记

**示例**：
```log
[2026-03-16T12:05:35.956Z] [INFO] ========== 命令开始 ==========
[2026-03-16T12:05:35.958Z] [INFO] 执行命令：x-kill-port 8888 --force
[2026-03-16T12:05:35.959Z] [INFO] 参数：port=8888, force=true
[2026-03-16T12:05:36.042Z] [INFO] 🔍 正在查找占用端口 8888 的进程...
[2026-03-16T12:05:36.050Z] [SUCCESS]   ✅ 成功关闭进程 36743
[2026-03-16T12:05:36.051Z] [INFO] 执行结果：success=true, found=1, killed=1
[2026-03-16T12:05:36.051Z] [INFO] ========== 命令结束 ==========
```

## 架构设计

```
bin/
├── who-port.js          # CLI 入口（查询）
└── kill-port.js         # CLI 入口（关闭）

src/command/
├── who-port.js          # 查询工具函数
└── kill-port.js         # 关闭工具函数

logs/
├── who-port.log         # 查询日志
└── kill-port.log        # 关闭日志

docs/
├── who-port-command.md  # 查询命令文档
└── kill-port-command.md # 关闭命令文档
```

## 可复用 API

### 查询工具 API

```javascript
import { queryPort, formatOutput } from './src/command/who-port.js';

// 查询端口
const result = queryPort('3000');

// 格式化输出
formatOutput(result, true, (msg, level) => {
    console.log(`[${level}] ${msg}`);
});
```

### 关闭工具 API

```javascript
import { killPort, findProcessByPort } from './src/command/kill-port.js';

// 查找进程
const processes = findProcessByPort('3000');

// 关闭端口
const result = await killPort('3000', { force: true }, (msg, level) => {
    console.log(`[${level}] ${msg}`);
});
```

## 使用场景

### 场景 1：开发服务器端口被占用

```bash
# 1. 查看谁占用了 3000 端口
x-who-port 3000

# 2. 如果是废弃的进程，关闭它
x-kill-port 3000 --force

# 3. 确认端口已释放
x-who-port 3000
```

### 场景 2：排查端口占用问题

```bash
# 查看详细占用信息
x-who-port 8080 --verbose

# 输出 JSON 用于脚本处理
x-who-port 8080 --json > port-info.json
```

### 场景 3：批量管理端口

```bash
# 在脚本中使用
for port in 3000 3001 3002; do
    x-who-port $port --json | jq '.isOccupied'
done
```

## 注意事项

1. **权限要求** - 管理其他用户的进程可能需要 sudo 权限
2. **数据丢失风险** - 强制关闭可能导致未保存的数据丢失
3. **系统进程** - 不要关闭系统关键进程
4. **日志清理** - 定期清理日志文件避免过大

## 相关文档

- [x-who-port 详细文档](./who-port-command.md)
- [x-kill-port 详细文档](./kill-port-command.md)

## 版本历史

- **v1.0.0** - 初始版本
  - x-who-port 查询功能
  - x-kill-port 关闭功能
  - 日志记录功能
  - 可复用工具函数
