# x-scan-ports 命令文档

## 概述

`x-scan-ports` 是一个扫描指定范围内端口占用情况的命令行工具。它可以批量检查多个端口的状态，并以表格、JSON 或简洁模式输出结果。

## 设计思路

### 核心功能

1. **端口范围扫描** - 扫描指定范围内的所有端口
2. **多种输出格式** - 支持表格、JSON、简洁模式
3. **进度显示** - 实时显示扫描进度
4. **统计分析** - 提供占用率、常见进程等统计信息
5. **结果过滤** - 可只显示占用端口
6. **日志记录** - 记录扫描操作到日志文件

### 架构设计

```
bin/scan-ports.js            # CLI 入口，负责参数解析和输出
    ↓
src/command/scan-ports.js    # 核心工具函数，提供扫描和格式化 API
    ↓
src/command/who-port.js      # 复用端口查询功能
    ↓
系统命令 (lsof)              # 底层端口查询
```

### 与 x-who-port 的关系

- `x-who-port` - 查询单个端口的详细信息（进程、用户、时间等）
- `x-scan-ports` - 批量扫描多个端口，显示概要信息

## 使用方法

### 基本语法

```bash
x-scan-ports [start] [end] [选项]
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `start` | 起始端口号 | 3000 |
| `end` | 结束端口号 | 3010 |

### 选项说明

| 选项 | 简写 | 说明 |
|------|------|------|
| `--json` | `-j` | 以 JSON 格式输出 |
| `--simple` | `-s` | 简洁模式输出 |
| `--only-occupied` | `-o` | 只显示占用端口 |
| `--quiet` | `-q` | 安静模式，不显示进度 |
| `--no-log` | - | 不记录日志 |
| `--file <path>` | `-f` | 将结果保存到文件 |
| `--help` | `-h` | 显示帮助信息 |
| `--version` | `-V` | 显示版本号 |

### 使用示例

```bash
# 扫描默认范围（3000-3010）
x-scan-ports

# 扫描指定范围
x-scan-ports 8000 8080

# JSON 格式输出
x-scan-ports 3000 3010 --json

# 只显示占用端口
x-scan-ports 1 1000 --only-occupied

# 安静模式（适合脚本调用）
x-scan-ports 3000 3010 --quiet

# 保存到文件
x-scan-ports 3000 3010 --file result.txt

# 组合使用
x-scan-ports 8000 8080 --json --quiet --file scan.json
```

## 输出示例

### 表格模式（默认）

```
🔍 开始扫描端口范围：3000 - 3005
📊 端口总数：6
────────────────────────────────────────────────────────────
扫描进度：[██████████████████████████████] 100.0% (6/6) - 已发现 1 个占用端口

┌─────────┬──────────┬─────────────┬─────────────────────────────────────┐
│ 端口号  │ 状态     │ 进程数      │ 命令                                │
├─────────┼──────────┼─────────────┼─────────────────────────────────────┤
│    3000 │ 🔴   占用  │         1 │ node                                │
│    3001 │ 🟢   空闲  │         0 │ -                                   │
│    3002 │ 🟢   空闲  │         0 │ -                                   │
│    3003 │ 🟢   空闲  │         0 │ -                                   │
│    3004 │ 🟢   空闲  │         0 │ -                                   │
│    3005 │ 🟢   空闲  │         0 │ -                                   │
└─────────┴──────────┴─────────────┴─────────────────────────────────────┘


════════════════════════════════════════════════════════════
  📊 端口扫描汇总
════════════════════════════════════════════════════════════
  端口范围：3000 - 3005 (共 6 个端口)
  🔴 占用端口：1
  🟢 空闲端口：5
  📈 占用率：16.67%
════════════════════════════════════════════════════════════

  📋 占用端口列表:

    3000: node

  🔍 常见进程:

    node: 1 个端口

════════════════════════════════════════════════════════════

⏱️  扫描耗时：0.32s
```

### JSON 模式

```json
{
  "scanTime": "2026-03-18T03:16:48.889Z",
  "summary": {
    "scanTime": "2026-03-18T03:16:48.888Z",
    "portRange": {
      "start": 3000,
      "end": 3003,
      "total": 4
    },
    "statistics": {
      "occupied": 1,
      "free": 3,
      "occupancyRate": "25.00%"
    },
    "occupiedPorts": [
      {
        "port": 3000,
        "command": "node",
        "pid": 49914
      }
    ],
    "commonCommands": [
      {
        "command": "node",
        "count": 1
      }
    ]
  },
  "results": [
    {
      "port": 3000,
      "isOccupied": true,
      "processCount": 1,
      "processes": [
        {
          "command": "node",
          "pid": 49914,
          "user": "bytedance",
          "fd": "15u",
          "type": "IPv6",
          "name": "*:3000 (LISTEN)"
        }
      ],
      "queryTime": "2026-03-18T03:16:48.792Z"
    }
  ]
}
```

### 简洁模式

```
3000: node
3001: 空闲
3002: 空闲
3003: 空闲
```

### 只显示占用端口

```
┌─────────┬──────────┬─────────────┬─────────────────────────────────────┐
│ 端口号  │ 状态     │ 进程数      │ 命令                                │
├─────────┼──────────┼─────────────┼─────────────────────────────────────┤
│    3000 │ 🔴   占用  │         1 │ node                                │
└─────────┴──────────┴─────────────┴─────────────────────────────────────┘
```

## API 参考

### 模块导出

`src/command/scan-ports.js` 提供以下函数：

#### `scanSinglePort(port)`

扫描单个端口

```javascript
import { scanSinglePort } from '../src/command/scan-ports.js';

const result = scanSinglePort(3000);
// 返回：{ port, isOccupied, processCount, processes, queryTime }
```

#### `scanPortRange(startPort, endPort, options, progressCallback)`

扫描端口范围

```javascript
import { scanPortRange } from '../src/command/scan-ports.js';

const results = scanPortRange(3000, 3010, {}, (progress) => {
    console.log(`进度：${progress.percent}%`);
});
// 返回：[{ port, isOccupied, processCount, ... }, ...]
```

#### `getOccupiedPorts(results)`

获取占用端口列表

```javascript
import { getOccupiedPorts } from '../src/command/scan-ports.js';

const occupied = getOccupiedPorts(results);
// 返回：[{ port, isOccupied: true, ... }, ...]
```

#### `formatAsTable(results, options)`

格式化为表格

```javascript
import { formatAsTable } from '../src/command/scan-ports.js';

const table = formatAsTable(results, { onlyOccupied: true });
console.log(table);
```

#### `formatAsJson(results, summary)`

格式化为 JSON

```javascript
import { formatAsJson } from '../src/command/scan-ports.js';

const json = formatAsJson(results, summary);
```

#### `generateSummary(results, startPort, endPort)`

生成汇总信息

```javascript
import { generateSummary } from '../src/command/scan-ports.js';

const summary = generateSummary(results, 3000, 3010);
// 返回：{ scanTime, portRange, statistics, occupiedPorts, commonCommands }
```

## 性能考虑

### 扫描速度

- 单个端口查询耗时约 20-50ms
- 扫描 100 个端口约需 2-5 秒
- 扫描 1000 个端口约需 20-50 秒

### 优化建议

```bash
# 使用安静模式减少输出开销
x-scan-ports 1 1000 --quiet

# 使用 JSON 模式并重定向到文件
x-scan-ports 1 1000 --json > scan.json

# 分段扫描大范围
x-scan-ports 1 500 --json --quiet &
x-scan-ports 501 1000 --json --quiet &
wait
```

## 使用场景

### 场景 1：查找可用端口

```bash
# 扫描 3000-3020 范围，查找空闲端口
x-scan-ports 3000 3020 --simple | grep "空闲"
```

### 场景 2：监控端口占用

```bash
# 定期扫描并保存结果
x-scan-ports 3000 3020 --json --file scan-$(date +%Y%m%d).json
```

### 场景 3：排查端口冲突

```bash
# 扫描常用端口范围
x-scan-ports 8000 8100 --only-occupied
```

### 场景 4：脚本集成

```bash
#!/bin/bash
# 检查端口 3000 是否可用
result=$(x-scan-ports 3000 3000 --json --quiet)
occupied=$(echo $result | jq '.results[0].isOccupied')

if [ "$occupied" = "true" ]; then
    echo "端口 3000 被占用"
    exit 1
else
    echo "端口 3000 可用"
    exit 0
fi
```

## 日志记录

### 日志位置

`logs/scan-ports.log`

### 日志内容

```log
[2026-03-18T03:16:48.888Z] [INFO] ========== 命令开始 ==========
[2026-03-18T03:16:48.888Z] [INFO] 执行命令：x-scan-ports 3000 3010
[2026-03-18T03:16:48.888Z] [INFO] 参数：start=3000, end=3010, json=false
[2026-03-18T03:16:49.208Z] [INFO] 扫描完成：耗时 0.32s, 总端口 11, 占用 1
[2026-03-18T03:16:49.208Z] [INFO] ========== 命令结束 ==========
```

## 相关命令

- `x-who-port` - 查询单个端口的详细信息
- `x-kill-port` - 关闭占用端口的进程

## 注意事项

1. **扫描范围** - 建议单次扫描不超过 1000 个端口
2. **权限要求** - 某些端口可能需要 sudo 权限才能查询
3. **性能影响** - 大范围扫描可能短暂影响系统性能
4. **防火墙** - 某些端口可能被防火墙阻止查询

## 故障排除

### 问题：扫描速度慢

**原因**：网络端口或防火墙延迟

**解决**：
1. 使用 `--quiet` 模式减少输出
2. 分段扫描大范围
3. 使用 `--json` 模式直接输出结果

### 问题：部分端口无法查询

**原因**：权限不足或系统限制

**解决**：使用 `sudo x-scan-ports ...`

## 版本历史

- **v1.0.0** - 初始版本
  - 端口范围扫描功能
  - 表格、JSON、简洁三种输出模式
  - 进度显示和统计分析
  - 日志记录功能
