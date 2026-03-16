# x-kill-port 命令文档

## 概述

`x-kill-port` 是一个通过端口号快速关闭占用端口的应用程序的命令行工具。它支持交互式确认和强制关闭两种模式，并提供完整的日志记录功能。

## 设计思路

### 核心功能

1. **端口占用检测** - 使用 `lsof` 命令查找占用指定端口的进程
2. **进程信息查询** - 使用 `ps` 命令获取进程的详细信息
3. **交互式确认** - 默认模式下需要用户确认后才执行关闭操作
4. **强制关闭** - 通过 `--force` 参数跳过确认直接关闭
5. **日志记录** - 所有操作都会记录到日志文件，便于审计和调试

### 架构设计

```
bin/kill-port.js          # CLI 入口，负责参数解析和日志记录
    ↓
src/command/kill-port.js  # 核心工具函数，提供可复用的 API
    ↓
系统命令 (lsof, kill)     # 底层系统调用
```

### 日志设计

日志文件位置：`logs/kill-port.log`

日志格式：
```
[时间戳] [级别] 消息内容
```

日志级别：
- `INFO` - 一般信息
- `WARNING` - 警告信息
- `ERROR` - 错误信息
- `SUCCESS` - 成功信息

## 使用方法

### 基本语法

```bash
x-kill-port <port> [选项]
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `port` | 要关闭的端口号（必填） |

### 选项说明

| 选项 | 简写 | 说明 |
|------|------|------|
| `--force` | `-f` | 强制关闭，不显示确认提示 |
| `--no-log` | - | 不记录日志 |
| `--help` | `-h` | 显示帮助信息 |
| `--version` | `-V` | 显示版本号 |

### 使用示例

```bash
# 交互式关闭端口 3000（需要确认）
x-kill-port 3000

# 强制关闭端口 3000（无需确认）
x-kill-port 3000 --force

# 关闭端口且不记录日志
x-kill-port 3000 --no-log

# 查看帮助
x-kill-port --help
```

## 输出示例

### 查找进程

```
🔍 正在查找占用端口 3000 的进程...

📋 找到 1 个占用端口 3000 的进程：

  PID      命令
  ──────────────────────────────────────
    12345  node server.js

❓ 确定要关闭这些进程吗？(y/N): y
```

### 关闭进程

```
💀 正在关闭进程...

  ✅ 成功关闭进程 12345

──────────────────────────────────────────────────
  成功：1 个进程

✅ 端口 3000 已释放。
```

### 日志文件内容

```log
[2026-03-16T12:05:35.956Z] [INFO] ========== 命令开始 ==========
[2026-03-16T12:05:35.958Z] [INFO] 执行命令：x-kill-port 8888 --force
[2026-03-16T12:05:35.959Z] [INFO] 参数：port=8888, force=true
[2026-03-16T12:05:35.966Z] [INFO] 🔍 正在查找占用端口 8888 的进程...
[2026-03-16T12:05:36.042Z] [INFO] 💀 正在关闭进程...
[2026-03-16T12:05:36.050Z] [SUCCESS]   ✅ 成功关闭进程 36743
[2026-03-16T12:05:36.050Z] [INFO] ──────────────────────────────────────────────────
[2026-03-16T12:05:36.050Z] [SUCCESS]   成功：1 个进程
[2026-03-16T12:05:36.051Z] [SUCCESS] ✅ 端口 8888 已释放。
[2026-03-16T12:05:36.051Z] [INFO] 执行结果：success=true, found=1, killed=1
[2026-03-16T12:05:36.051Z] [INFO] ========== 命令结束 ==========
```

## API 参考

### 模块导出

`src/command/kill-port.js` 提供以下函数：

#### `findProcessByPort(port)`

查找占用指定端口的进程

```javascript
import { findProcessByPort } from '../src/command/kill-port.js';

const processes = findProcessByPort('3000');
// 返回：[{ pid: '12345', command: 'node server.js' }]
```

#### `executeKill(processes, portNum, logCallback)`

执行关闭进程操作

```javascript
import { executeKill } from '../src/command/kill-port.js';

const result = executeKill(processes, 3000, (msg, level) => {
    console.log(`[${level}] ${msg}`);
});
// 返回：{ success: true, successCount: 1, failCount: 0, details: [...] }
```

#### `killPort(port, options, logCallback)`

完整的关闭端口流程

```javascript
import { killPort } from '../src/command/kill-port.js';

const result = await killPort('3000', { force: true }, (msg, level) => {
    console.log(`[${level}] ${msg}`);
});
// 返回：{ port: 3000, success: true, processesFound: [...], killResult: {...} }
```

### 返回值结构

```javascript
{
    port: 3000,              // 端口号
    success: true,           // 是否成功
    processesFound: [        // 找到的进程列表
        { pid: '12345', command: 'node server.js' }
    ],
    killResult: {            // 关闭结果
        success: true,
        successCount: 1,
        failCount: 0,
        details: [
            { pid: '12345', success: true }
        ]
    }
}
```

## 实现细节

### 查找进程

使用 `lsof -ti:<port>` 命令：
- `-t` 只输出 PID
- `-i` 指定网络端口
- 输出格式：每行一个 PID

### 获取进程信息

使用 `ps -p <pid> -o pid,command` 命令：
- `-p` 指定进程 ID
- `-o` 指定输出格式

### 关闭进程

使用 `kill -9 <pid>` 命令：
- `-9` 强制终止信号 (SIGKILL)
- 无法被捕获或忽略

## 相关命令

- `x-who-port` - 查询占用端口的服务详细信息
- `x-static` - 启动静态文件服务器（常用端口 3000）

## 注意事项

1. **权限要求** - 关闭其他用户的进程可能需要 sudo 权限
2. **数据丢失风险** - 强制关闭可能导致未保存的数据丢失
3. **系统进程** - 不要关闭系统关键进程
4. **日志文件** - 日志会持续追加，定期清理避免过大

## 故障排除

### 问题：提示"端口未被占用"但实际有进程

**原因**：进程可能在使用 IPv6 而命令只检查 IPv4

**解决**：使用 `x-who-port` 查看详细监听情况

### 问题：关闭失败

**原因**：权限不足或进程已退出

**解决**：
1. 使用 `sudo x-kill-port <port>`
2. 确认进程仍然存在

## 版本历史

- **v1.0.0** - 初始版本
  - 基本的端口关闭功能
  - 交互式确认模式
  - 强制关闭选项
  - 日志记录功能
