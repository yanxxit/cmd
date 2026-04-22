# System Top 工具使用指南

## 快速开始

### 基本用法
```bash
# 查看内存占用前 10 的进程
node bin/system-top.js

# 查看 CPU 占用前 10 的进程
node bin/system-top.js -s cpu

# 查看前 20 个进程
node bin/system-top.js -n 20
```

### 显示详细日志（排查问题）
```bash
# 启用详细日志模式，查看统计过程
node bin/system-top.js --stats -v

# 或完整参数
node bin/system-top.js -n 10 --stats --verbose
```

## 所有可用选项

```bash
node bin/system-top.js --help
```

### 选项说明

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-n, --number <number>` | 显示进程数量 | 10 |
| `-s, --sort <field>` | 排序方式：cpu, memory, pid, time | memory |
| `-j, --json` | 以 JSON 格式输出 | - |
| `--no-header` | 不显示系统信息头部 | - |
| `--no-log` | 不记录日志 | - |
| `-f, --file <path>` | 将结果保存到文件 | - |
| `-d, --detailed` | 显示详细进程信息（包含 PPID、启动时间等） | - |
| `-a, --analysis` | 显示进程分析信息（分类、类型等） | - |
| `--stats` | 显示资源统计汇总 | - |
| `-v, --verbose` | **启用详细日志模式（方便排查问题）** | - |

## 使用示例

### 1. 基本系统监控
```bash
# 查看系统资源概览和内存占用前 10 的进程
node bin/system-top.js
```

### 2. 进程分析模式
```bash
# 显示进程分类分析
node bin/system-top.js -n 10 -a
```

输出示例：
```
│ 排名  │ PID      │ CPU %   │ Memory % │ RSS (MB)  │ VSZ (MB)  │ 用户   │ 命令        │
├───────┼──────────┼─────────┼──────────┼───────────┼───────────┼────────┼─────────────┤
│   1  │        1 │     0.1 │      0.0 │      7.89 │ 416848.84 │   root │ /sbin/launc… │
│       │          │         │          │           │           │        │ ↳ system (system_process)
```

### 3. 资源统计汇总
```bash
# 显示详细的资源统计信息
node bin/system-top.js --stats
```

输出包含：
- 总进程数
- 总 CPU/内存使用
- 按分类统计（系统、开发工具、服务等）
- 资源占用最多的 Top 5 用户

### 4. 详细日志模式（调试用）
```bash
# 启用详细日志，查看每个进程的处理过程
node bin/system-top.js --stats -v
```

日志输出示例：
```
[LOGGER] ========== 开始资源统计 ==========
[LOGGER] 获取到进程总数：550

[LOGGER] 开始逐个处理进程...
[LOGGER] [进程 #0] 发现新分类：system
[LOGGER] [进程 #0] PID:1 分类:system CPU:1.1% MEM:0.1%
[LOGGER] [进程 #0] 发现新用户：root
[LOGGER] [进程 #1] 发现新分类：application
...

[LOGGER] ========== 分类统计结果 ==========
[LOGGER] 分类：application     | 数量：527 | CPU:  14.1% | MEM: 1051.0%
[LOGGER] 分类：development     | 数量：  7 | CPU:   0.2% | MEM:    1.8%
...
```

### 5. 导出到文件
```bash
# 保存为文本文件
node bin/system-top.js --stats -f report.txt

# 保存为 JSON 文件
node bin/system-top.js -j -f report.json
```

### 6. 组合使用
```bash
# 显示前 20 个进程，带分析和统计，启用详细日志
node bin/system-top.js -n 20 -a --stats -v

# 按 CPU 排序，显示详细信息，导出到文件
node bin/system-top.js -s cpu -d -f cpu_report.txt
```

## 进程分类说明

工具会自动识别进程类型并分类：

### 系统进程 (system)
- kernel, init, systemd, launchd
- kernel_task, WindowServer
- loginwindow, coreaudiod 等

### 开发工具 (development)
- node, npm, yarn, pnpm
- webpack, vite, rollup
- python, java, docker, git 等

### 服务进程 (service)
- nginx, apache, httpd
- mysql, postgres, mongodb, redis
- ssh, sshd, cron 等

### 浏览器 (browser)
- chrome, firefox, safari, edge
- electron

### Shell 进程 (shell)
- bash, zsh, sh

### 应用程序 (application)
- 其他未分类的用户应用程序

## 日志级别说明

### 详细日志模式 (-v, --verbose)

启用后会输出：

1. **开始统计**
   ```
   [LOGGER] ========== 开始资源统计 ==========
   [LOGGER] 获取到进程总数：550
   ```

2. **进程处理过程**（前 10 个进程）
   ```
   [LOGGER] [进程 #0] 发现新分类：system
   [LOGGER] [进程 #0] PID:1 分类:system CPU:1.1% MEM:0.1%
   [LOGGER] [进程 #0] 发现新用户：root
   ```

3. **分类统计结果**
   ```
   [LOGGER] 分类：application     | 数量：527 | CPU:  14.1% | MEM: 1051.0%
   [LOGGER] 分类：development     | 数量：  7 | CPU:   0.2% | MEM:    1.8%
   ```

4. **用户统计结果**
   ```
   [LOGGER] 用户：bytedance       | 数量：320 | CPU:  20.3% | MEM:   41.8%
   [LOGGER] 用户：root            | 数量：140 | CPU:  44.0% | MEM:    6.1%
   ```

5. **总计**
   ```
   [LOGGER] 总进程数：548
   [LOGGER] 总 CPU 使用：14.4%
   [LOGGER] 总内存使用：1053.0%
   ```

## 常见问题排查

### 1. 统计数字不对？
使用 `-v` 查看详细日志，检查每个进程是否正确分类和累加。

### 2. 某个进程没有被识别？
查看日志中的 `[LOGGER] [进程 #X]` 输出，确认进程命令和分类。

### 3. 内存/CPU 使用率异常？
检查日志中的总计部分，查看是否有异常值的进程。

### 4. 分类错误？
可以在源代码 `src/command/system-top.js` 的 `analyzeProcess` 函数中添加新的识别规则。

## 性能说明

- 默认扫描 1000 个进程进行统计
- 详细日志模式会略微增加执行时间
- 建议在生产环境使用 `--no-log` 禁用日志记录

## 相关文件

- 主程序：`bin/system-top.js`
- 核心模块：`src/command/system-top.js`
- 日志文件：`logs/system-top.log`（如果未禁用）
