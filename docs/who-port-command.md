# x-who-port 命令文档

## 概述

`x-who-port` 是一个查询占用指定端口的服务详细信息的命令行工具。它可以显示进程的命令、PID、用户、启动时间、工作目录等详细信息，并提供 JSON 格式输出选项。

## 设计思路

### 核心功能

1. **端口占用检测** - 使用 `lsof` 命令查找占用指定端口的进程
2. **进程信息采集** - 收集进程的详细信息：
   - 基本信息：命令名、PID、用户、文件描述符
   - 网络信息：监听地址、协议类型、设备
   - 进程详情：父进程 PID、进程状态、启动时间、CPU 时间
   - 工作目录：进程当前工作目录
3. **多种输出格式** - 支持格式化输出和 JSON 输出
4. **详细模式** - 通过 `-v` 参数显示更多详细信息
5. **日志记录** - 所有操作都会记录到日志文件

### 架构设计

```
bin/who-port.js           # CLI 入口，负责参数解析和日志记录
    ↓
src/command/who-port.js   # 核心工具函数，提供可复用的 API
    ↓
系统命令 (lsof, ps)       # 底层系统调用获取进程信息
```

### 日志设计

日志文件位置：`logs/who-port.log`

日志格式：
```
[时间戳] [级别] 消息内容
```

日志级别：
- `INFO` - 一般信息
- `WARNING` - 警告信息
- `ERROR` - 错误信息
- `SUCCESS` - 成功信息
- `TIP` - 使用提示

## 使用方法

### 基本语法

```bash
x-who-port <port> [选项]
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `port` | 要查询的端口号（必填） |

### 选项说明

| 选项 | 简写 | 说明 |
|------|------|------|
| `--json` | `-j` | 以 JSON 格式输出 |
| `--verbose` | `-v` | 显示更详细的信息（包含工作目录） |
| `--no-log` | - | 不记录日志 |
| `--help` | `-h` | 显示帮助信息 |
| `--version` | `-V` | 显示版本号 |

### 使用示例

```bash
# 查询端口 3000 的占用信息
x-who-port 3000

# 以 JSON 格式输出
x-who-port 3000 --json

# 显示详细信息（包含工作目录）
x-who-port 3000 --verbose

# JSON 格式并显示详细信息
x-who-port 3000 --json --verbose

# 查询且不记录日志
x-who-port 3000 --no-log

# 查看帮助
x-who-port --help
```

## 输出示例

### 格式化输出

```
✅ 端口占用信息查询结果

════════════════════════════════════════════════════════════
📍 端口号：3000
📊 占用进程数：1
🕐 查询时间：2026/3/16 19:50:49
════════════════════════════════════════════════════════════

📌 进程 #1

  ┌ 基本信息
  ├─ 命令：node
  ├─ PID: 31942
  ├─ 用户：bytedance
  ├─ 文件描述符：15u
  └─ 协议类型：IPv6
  ┌ 网络信息
  ├─ 监听地址：*:3000 (LISTEN)
  └─ 设备：0x35b08c626ba35f29
  ┌ 进程详细信息
  ├─ 父进程 PID: 31940
  ├─ 进程状态：S
  ├─ 启动时间：一  3/16 19:50:45 2026
  ├─ CPU 时间：0:00.02
  └─ 完整命令：node -e const http = require('http')...
────────────────────────────────────────────────────────────

💡 使用提示:

  • 关闭进程：kill -9 31942
  • 查看详情：ps -p 31942 -f
  • 查看文件：lsof -p 31942
  • 强制关闭：x-kill-port 3000 --force
```

### JSON 输出

```json
{
  "port": 3000,
  "isOccupied": true,
  "processCount": 1,
  "queryTime": "2026-03-16T11:50:53.057Z",
  "processes": [
    {
      "command": "node",
      "pid": 31942,
      "user": "bytedance",
      "fd": "15u",
      "type": "IPv6",
      "device": "0x35b08c626ba35f29",
      "sizeOff": "0t0",
      "node": "TCP",
      "name": "*:3000 (LISTEN)",
      "port": 3000,
      "processInfo": {
        "pid": "31942",
        "ppid": "31940",
        "user": "bytedance",
        "stat": "S",
        "start": "7:50 下午",
        "time": "0:00.02",
        "command": "node -e const http = require('http')..."
      },
      "startTime": "一  3/16 19:50:45 2026",
      "cwd": "/",
      "queryTime": "2026-03-16T11:50:53.056Z"
    }
  ]
}
```

### 日志文件内容

```log
[2026-03-16T12:05:27.272Z] [INFO] ========== 命令开始 ==========
[2026-03-16T12:05:27.277Z] [INFO] 执行命令：x-who-port 8888
[2026-03-16T12:05:27.278Z] [INFO] 参数：port=8888, json=false, verbose=false
[2026-03-16T12:05:27.661Z] [INFO] 查询结果：isOccupied=true, processCount=1
[2026-03-16T12:05:27.661Z] [INFO] ========== 命令结束 ==========
```

## API 参考

### 模块导出

`src/command/who-port.js` 提供以下函数：

#### `getProcessInfo(pid)`

获取进程详细信息

```javascript
import { getProcessInfo } from '../src/command/who-port.js';

const info = getProcessInfo('31942');
// 返回：{ pid, ppid, user, stat, start, time, command }
```

#### `getProcessStartTime(pid)`

获取进程启动时间

```javascript
import { getProcessStartTime } from '../src/command/who-port.js';

const startTime = getProcessStartTime('31942');
// 返回："一  3/16 19:50:45 2026"
```

#### `getProcessCwd(pid)`

获取进程工作目录

```javascript
import { getProcessCwd } from '../src/command/who-port.js';

const cwd = getProcessCwd('31942');
// 返回："/Users/bytedance/github/cmd"
```

#### `parseLsofLine(line, portNum)`

解析 lsof 输出行

```javascript
import { parseLsofLine } from '../src/command/who-port.js';

const proc = parseLsofLine('node 31942 bytedance 15u IPv6...', 3000);
// 返回：{ command, pid, user, fd, type, device, ... }
```

#### `queryPort(port, options, logCallback)`

查询占用指定端口的服务信息

```javascript
import { queryPort } from '../src/command/who-port.js';

const result = queryPort('3000', {}, (msg, level) => {
    console.log(`[${level}] ${msg}`);
});
// 返回：{ port, isOccupied, processCount, processes, queryTime }
```

#### `formatOutput(result, verbose, logCallback)`

格式化输出查询结果

```javascript
import { formatOutput } from '../src/command/who-port.js';

formatOutput(result, true, (msg, level) => {
    console.log(msg);
});
```

### 返回值结构

```javascript
{
    port: 3000,                    // 端口号
    isOccupied: true,              // 是否被占用
    processCount: 1,               // 占用进程数
    queryTime: "2026-03-16T...",   // 查询时间
    processes: [                   // 进程列表
        {
            command: "node",
            pid: 31942,
            user: "bytedance",
            fd: "15u",
            type: "IPv6",
            device: "0x35b08c626ba35f29",
            name: "*:3000 (LISTEN)",
            processInfo: {
                pid: "31942",
                ppid: "31940",
                user: "bytedance",
                stat: "S",
                start: "7:50 下午",
                time: "0:00.02",
                command: "node -e ..."
            },
            startTime: "一  3/16 19:50:45 2026",
            cwd: "/",
            queryTime: "2026-03-16T11:50:53.056Z"
        }
    ],
    error: null
}
```

## 实现细节

### 查找进程

使用 `lsof -i :<port> -P -n` 命令：
- `-i` 指定网络端口
- `-P` 不转换端口号为服务名
- `-n` 不转换 IP 为域名

### 获取进程信息

使用 `ps -p <pid> -o pid,ppid,user,stat,start,time,command` 命令：
- `-o` 指定输出字段
- 字段说明：
  - `pid` - 进程 ID
  - `ppid` - 父进程 ID
  - `user` - 用户
  - `stat` - 进程状态
  - `start` - 启动时间
  - `time` - CPU 时间
  - `command` - 完整命令

### 获取启动时间

使用 `ps -p <pid> -o lstart=` 命令：
- `lstart` - 长格式启动时间
- 输出格式：`Mon Mar 16 19:50:45 2026`

### 获取工作目录

使用 `lsof -p <pid> -d cwd` 命令：
- `-d cwd` - 获取当前工作目录

## 相关命令

- `x-kill-port` - 关闭占用端口的进程
- `x-static` - 启动静态文件服务器（常用端口 3000）

## 注意事项

1. **权限要求** - 查看其他用户的进程可能需要 sudo 权限
2. **性能影响** - 查询大量进程时可能有轻微性能开销
3. **信息准确性** - 进程信息可能在查询过程中发生变化

## 故障排除

### 问题：提示"端口未被占用"但实际有进程

**原因**：
1. 进程可能在使用 IPv6 而命令只检查 IPv4
2. 进程可能刚刚退出

**解决**：
1. 确认端口号正确
2. 使用 `lsof -i :<port>` 手动检查

### 问题：部分信息显示"unknown"

**原因**：进程可能已退出或权限不足

**解决**：使用 `sudo x-who-port <port>`

## 版本历史

- **v1.0.0** - 初始版本
  - 基本的端口查询功能
  - 格式化输出和 JSON 输出
  - 详细模式选项
  - 日志记录功能
