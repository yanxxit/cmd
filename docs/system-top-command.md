# x-system-top 命令文档

## 概述

`x-system-top` 是一个查询系统资源占用前列进程的命令行工具，类似简化版的 `top` 命令。它可以快速查看系统中 CPU、内存占用最高的进程，帮助用户了解系统状态。

## 设计思路

### 核心功能

1. **进程资源查询** - 获取进程的 CPU、内存占用信息
2. **多种排序方式** - 支持按 CPU、内存、PID 排序
3. **系统信息概览** - 显示 CPU 核心数、内存使用情况、系统负载
4. **多种输出格式** - 支持表格和 JSON 格式
5. **自定义数量** - 可指定显示的进程数量
6. **日志记录** - 记录查询操作到日志文件

### 架构设计

```
bin/system-top.js             # CLI 入口，负责参数解析和输出
    ↓
src/command/system-top.js     # 核心工具函数，提供查询和格式化 API
    ↓
系统命令 (ps, vm_stat, etc.)  # 底层系统调用获取资源信息
```

### 与系统命令的关系

| 系统命令 | x-system-top | 说明 |
|----------|--------------|------|
| `top` | `x-system-top` | 简化版 top，更适合脚本调用 |
| `ps aux` | `x-system-top` | 更友好的输出格式 |
| `htop` | `x-system-top` | 无需安装，跨平台 |

## 使用方法

### 基本语法

```bash
x-system-top [选项]
```

### 选项说明

| 选项 | 简写 | 说明 | 默认值 |
|------|------|------|--------|
| `--number <n>` | `-n` | 显示进程数量 | 10 |
| `--sort <field>` | `-s` | 排序方式：cpu, memory, pid | memory |
| `--json` | `-j` | 以 JSON 格式输出 | - |
| `--no-header` | - | 不显示系统信息头部 | - |
| `--no-log` | - | 不记录日志 | - |
| `--file <path>` | `-f` | 将结果保存到文件 | - |
| `--help` | `-h` | 显示帮助信息 | - |
| `--version` | `-V` | 显示版本号 | - |

### 使用示例

```bash
# 查看内存占用前 10 的进程（默认）
x-system-top

# 查看 CPU 占用前 5 的进程
x-system-top -n 5 -s cpu

# 查看内存占用前 20 的进程
x-system-top -n 20 -s memory

# JSON 格式输出（适合脚本处理）
x-system-top -n 10 -j

# 只显示进程表格，不显示系统信息
x-system-top -n 10 --no-header

# 保存结果到文件
x-system-top -n 20 --file system-report.txt

# 组合使用
x-system-top -n 15 -s cpu --json --file cpu-top.json
```

## 输出示例

### 表格模式（默认）

```
════════════════════════════════════════════════════════════
  📊 系统资源概览
════════════════════════════════════════════════════════════
  🖥️  CPU: 10 核心
  💾  内存：2117.32 MB / 2133.92 MB (99.22%)
      [██████████████████████████████] 99.2%
════════════════════════════════════════════════════════════

┌───────┬──────────┬─────────┬──────────┬───────────┬───────────┬────────┬─────────┐
│ 排名  │ PID      │ CPU %   │ Memory % │ RSS (MB)  │ VSZ (MB)  │ 用户   │ 命令    │
├───────┼──────────┼─────────┼──────────┼───────────┼───────────┼────────┼─────────┤
│   1  │        1 │     0.5 │      0.1 │     12.95 │ 416852.84 │   root │ /sbin/l… │
│   2  │      317 │     1.2 │      0.1 │     11.86 │ 417081.03 │   root │ /usr/li… │
│   3  │      319 │     0.0 │      0.0 │      5.25 │ 416968.17 │   root │ /usr/li… │
│   4  │      321 │     0.2 │      0.0 │      4.92 │ 416939.36 │   root │ /System… │
│   5  │      322 │     0.0 │      0.0 │      7.13 │ 416976.41 │   root │ /System… │
└───────┴──────────┴─────────┴──────────┴───────────┴───────────┴────────┴─────────┘

⏱️  查询耗时：0.101s
```

### JSON 模式

```json
{
  "timestamp": "2026-03-18T08:00:39.148Z",
  "system": {
    "memory": {
      "total": 2266615808,
      "used": 2247450624,
      "free": 19165184,
      "active": 608673792,
      "inactive": 585539584,
      "wired": 1053237248,
      "totalMB": "2161.61",
      "usedMB": "2143.34",
      "freeMB": "18.28",
      "usagePercent": "99.15"
    },
    "cpu": {
      "cores": 10,
      "physicalCores": 10,
      "model": "Apple Silicon / Intel"
    }
  },
  "processes": [
    {
      "pid": 317,
      "command": "/usr/libexec/log",
      "cpu": 1.8,
      "mem": 0.1,
      "rss": 11104,
      "vsz": 427093024,
      "user": "root",
      "state": "Ss",
      "rssMB": "10.84",
      "vszMB": "417083.03"
    }
  ]
}
```

### 按 CPU 排序

```bash
x-system-top -n 5 -s cpu
```

```
════════════════════════════════════════════════════════════
  📊 系统资源概览
════════════════════════════════════════════════════════════
  🖥️  CPU: 10 核心
  💾  内存：2241.44 MB / 2261.46 MB (99.11%)
      [██████████████████████████████] 99.1%
════════════════════════════════════════════════════════════

┌───────┬──────────┬─────────┬──────────┬───────────┬───────────┬────────┬─────────┐
│ 排名  │ PID      │ CPU %   │ Memory % │ RSS (MB)  │ VSZ (MB)  │ 用户   │ 命令    │
├───────┼──────────┼─────────┼──────────┼───────────┼───────────┼────────┼─────────┤
│   1  │        1 │     1.9 │      0.1 │     10.39 │ 416852.84 │   root │ /sbin/l… │
│   2  │      317 │     1.7 │      0.1 │     11.20 │ 417082.03 │   root │ /usr/li… │
│   3  │      321 │     0.2 │      0.0 │      4.92 │ 416939.91 │   root │ /System… │
└───────┴──────────┴─────────┴──────────┴───────────┴───────────┴────────┴─────────┘
```

## API 参考

### 模块导出

`src/command/system-top.js` 提供以下函数：

#### `getProcessList(sortBy, limit)`

获取进程列表

```javascript
import { getProcessList } from '../src/command/system-top.js';

const processes = getProcessList('memory', 10);
// 返回：[{ pid, command, cpu, mem, rss, vsz, user, state }, ...]
```

#### `getMemoryInfo()`

获取内存信息

```javascript
import { getMemoryInfo } from '../src/command/system-top.js';

const memory = getMemoryInfo();
// 返回：{ total, used, free, totalMB, usedMB, freeMB, usagePercent }
```

#### `getCpuInfo()`

获取 CPU 信息

```javascript
import { getCpuInfo } from '../src/command/system-top.js';

const cpu = getCpuInfo();
// 返回：{ cores, physicalCores, model }
```

#### `getLoadAverage()`

获取系统负载

```javascript
import { getLoadAverage } from '../src/command/system-top.js';

const load = getLoadAverage();
// 返回：{ load1, load5, load15 }
```

#### `formatProcessTable(processes, options)`

格式化进程列表为表格

```javascript
import { getProcessList, formatProcessTable } from '../src/command/system-top.js';

const processes = getProcessList('memory', 10);
const table = formatProcessTable(processes, { showRank: true, colorize: true });
console.log(table);
```

#### `formatSystemInfo(memoryInfo, cpuInfo, loadInfo)`

格式化系统信息

```javascript
import { getMemoryInfo, getCpuInfo, getLoadAverage, formatSystemInfo } from '../src/command/system-top.js';

const memory = getMemoryInfo();
const cpu = getCpuInfo();
const load = getLoadAverage();
const info = formatSystemInfo(memory, cpu, load);
console.log(info);
```

#### `formatAsJson(processes, systemInfo)`

格式化为 JSON

```javascript
import { getProcessList, getMemoryInfo, getCpuInfo, getLoadAverage, formatAsJson } from '../src/command/system-top.js';

const processes = getProcessList('memory', 10);
const systemInfo = {
    memory: getMemoryInfo(),
    cpu: getCpuInfo(),
    load: getLoadAverage()
};
const json = formatAsJson(processes, systemInfo);
```

## 使用场景

### 场景 1：快速查看系统状态

```bash
# 查看内存占用最高的进程
x-system-top -n 10
```

### 场景 2：查找 CPU 占用高的进程

```bash
# 按 CPU 排序，找出占用最高的进程
x-system-top -n 10 -s cpu
```

### 场景 3：脚本中获取系统信息

```bash
#!/bin/bash
# 获取 JSON 格式的系统信息
info=$(x-system-top -n 5 -j --no-header)

# 使用 jq 解析
cpu_usage=$(echo $info | jq '.processes[0].cpu')
mem_usage=$(echo $info | jq '.system.memory.usagePercent')

echo "最高 CPU 占用：$cpu_usage%"
echo "内存使用率：$mem_usage%"
```

### 场景 4：定期监控系统状态

```bash
# 每分钟记录一次系统状态
while true; do
    x-system-top -n 20 --json --file "logs/system-$(date +%Y%m%d-%H%M).json"
    sleep 60
done
```

### 场景 5：生成系统报告

```bash
# 生成详细的系统报告
{
    echo "=== 系统资源报告 ==="
    echo "生成时间：$(date)"
    echo ""
    x-system-top -n 20
} > system-report.txt
```

## 日志记录

### 日志位置

`logs/system-top.log`

### 日志内容

```log
[2026-03-18T08:00:39.148Z] [INFO] ========== 命令开始 ==========
[2026-03-18T08:00:39.148Z] [INFO] 执行命令：x-system-top -n 5 -s memory
[2026-03-18T08:00:39.249Z] [INFO] 查询完成：耗时 0.101s, 进程数 5
[2026-03-18T08:00:39.249Z] [INFO] ========== 命令结束 ==========
```

## 跨平台支持

### macOS

- ✅ 使用 `ps` 获取进程信息
- ✅ 使用 `vm_stat` 获取内存信息
- ✅ 使用 `sysctl` 获取 CPU 信息
- ✅ 使用 `uptime` 获取系统负载

### Linux

- ✅ 使用 `ps` 获取进程信息
- ✅ 使用 `/proc/meminfo` 获取内存信息
- ✅ 使用 `nproc` 获取 CPU 信息
- ✅ 使用 `/proc/loadavg` 获取系统负载

## 性能考虑

### 查询速度

- 单次查询耗时约 50-150ms
- 查询 10 个进程约需 0.1 秒
- 查询 100 个进程约需 0.3 秒

### 资源消耗

- 内存占用 < 50MB
- CPU 占用 < 1%
- 适合频繁调用

## 相关命令

- `x-who-port` - 查询端口占用信息
- `x-kill-port` - 关闭端口占用进程
- `x-scan-ports` - 扫描端口范围

## 注意事项

1. **权限要求** - 查看其他用户的进程可能需要 sudo 权限
2. **实时性** - 数据为查询时的快照，不是实时更新
3. **系统差异** - 不同操作系统的输出可能略有差异
4. **进程命令** - 长命令会被截断显示

## 故障排除

### 问题：显示"N/A"或数据不准确

**原因**：系统命令执行失败或权限不足

**解决**：
1. 使用 `sudo x-system-top`
2. 检查系统命令是否可用（ps, vm_stat 等）

### 问题：表格显示错乱

**原因**：终端宽度不足或字体问题

**解决**：
1. 扩大终端窗口
2. 使用 `--json` 模式输出

## 版本历史

- **v1.0.0** - 初始版本
  - 进程资源查询功能
  - 支持 CPU、内存排序
  - 系统信息概览
  - 表格和 JSON 输出
  - 日志记录功能
