# 端口管理工具测试文档

## 概述

本目录包含端口管理工具（`x-who-port` 和 `x-kill-port`）的完整测试套件。

## 测试文件

| 文件 | 说明 | 测试内容 |
|------|------|----------|
| `who-port.test.js` | x-who-port 单元测试 | 查询功能、JSON 输出、详细模式等 |
| `kill-port.test.js` | x-kill-port 单元测试 | 关闭功能、强制模式、日志记录等 |
| `port-tools.test.js` | 综合集成测试 | 完整工作流程测试 |

## 运行测试

### 运行单个测试

```bash
# 测试 x-who-port 命令
node test/who-port.test.js

# 测试 x-kill-port 命令
node test/kill-port.test.js

# 运行综合集成测试
node test/port-tools.test.js
```

### 运行所有测试

```bash
# 依次运行所有测试
node test/who-port.test.js && node test/kill-port.test.js && node test/port-tools.test.js
```

## 测试覆盖

### x-who-port 测试覆盖

| 测试项 | 说明 | 状态 |
|--------|------|------|
| 基本查询功能 | 查询占用端口的进程信息 | ✅ |
| JSON 格式输出 | 以 JSON 格式返回结果 | ✅ |
| 详细模式 | 显示工作目录等详细信息 | ✅ |
| 查询空闲端口 | 正确识别未被占用的端口 | ✅ |
| 无效端口号处理 | 正确处理超出范围的端口号 | ✅ |
| 帮助信息 | 显示正确的使用说明 | ✅ |
| 日志记录功能 | 记录命令执行到日志文件 | ✅ |
| 进程信息完整性 | 返回完整的进程信息字段 | ✅ |

### x-kill-port 测试覆盖

| 测试项 | 说明 | 状态 |
|--------|------|------|
| 帮助信息 | 显示正确的使用说明 | ✅ |
| 无效端口号处理 | 正确处理超出范围的端口号 | ✅ |
| 强制关闭端口 | 使用 --force 参数关闭进程 | ✅ |
| 关闭空闲端口 | 正确识别未被占用的端口 | ✅ |
| 日志记录功能 | 记录命令执行到日志文件 | ✅ |
| 版本号 | 显示正确的版本号 | ✅ |
| 非强制模式 | 交互式确认关闭进程 | ✅ |
| 批量关闭 | 同时关闭多个端口的进程 | ✅ |

### 集成测试覆盖

| 测试场景 | 说明 | 状态 |
|----------|------|------|
| 完整工作流程 | 查询 → 关闭 → 验证 | ✅ |

## 测试实现细节

### 测试服务器

测试使用动态启动的 HTTP 服务器来占用端口：

```javascript
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Test Server');
});
server.listen(port, () => {
    console.log('SERVER_READY');
    setInterval(() => {}, 1000); // 保持运行
});
```

### 子进程隔离

`x-kill-port` 测试使用子进程启动测试服务器，避免被 `kill` 命令误杀：

```javascript
const child = spawn('node', ['-e', serverCode], {
    stdio: ['ignore', 'pipe', 'pipe']
});
```

### 端口占用检测

使用 `lsof` 命令检测端口是否被占用：

```javascript
function isPortOccupied(port) {
    const result = execCommand(`lsof -ti:${port}`);
    return result.success && result.output.trim().length > 0;
}
```

## 测试输出示例

### 成功输出

```
🧪 x-who-port 命令测试开始

────────────────────────────────────────────────────────────

📌 准备：启动测试服务器在端口 18765
✅ 测试服务器已启动在端口 18765

📋 测试 1: 基本查询功能
────────────────────────────────────────────────────────────
命令：node bin/who-port.js 18765 --no-log
✅ 通过

...

════════════════════════════════════════════════════════════
📊 测试结果汇总
────────────────────────────────────────────────────────────
✅ 通过：8
❌ 失败：0
════════════════════════════════════════════════════════════

🎉 所有测试通过！
```

### 失败输出

```
📋 测试：JSON 格式输出
────────────────────────────────────────────────────────────
❌ 失败 - JSON 解析错误

...

════════════════════════════════════════════════════════════
📊 测试结果汇总
────────────────────────────────────────────────────────────
✅ 通过：7
❌ 失败：1
════════════════════════════════════════════════════════════

⚠️ 部分测试失败，请检查日志
```

## 测试端口范围

测试使用的端口范围：`18765 - 19999`

这些端口通常不会被系统占用，适合进行测试。

## 日志文件

测试过程中生成的日志文件：

- `logs/who-port.log` - x-who-port 命令日志
- `logs/kill-port.log` - x-kill-port 命令日志

## 故障排除

### 问题：测试失败 "端口未被占用"

**原因**：测试服务器启动失败或端口已被占用

**解决方法**：
1. 检查端口是否被其他进程占用
2. 等待一段时间后重试
3. 更换测试端口范围

### 问题：测试被中断

**原因**：`x-kill-port` 测试可能误杀测试进程

**解决方法**：
- 使用 `port-tools.test.js` 中的子进程隔离方案
- 确保测试端口不与测试进程使用端口冲突

### 问题：日志文件不存在

**原因**：使用了 `--no-log` 参数

**解决方法**：
- 测试日志功能时不要使用 `--no-log` 参数
- 检查 `logs/` 目录是否存在

## 扩展测试

### 添加新测试用例

在相应的测试文件中添加：

```javascript
// 测试 X: 新功能
printTest('新功能测试');
let result = execCommand(`node bin/who-port.js ${TEST_PORT} --new-option`);
if (result.output.includes('预期输出')) {
    console.log('✅ 通过');
    stats.whoPort.passed++;
} else {
    console.log('❌ 失败');
    stats.whoPort.failed++;
}
```

### 添加新的集成测试场景

```javascript
async function testNewScenario() {
    printTest('新场景：场景描述');
    
    const TEST_PORT = 19000;
    let testServer = null;
    
    try {
        testServer = await startTestServerInChildProcess(TEST_PORT);
        
        // 测试步骤...
        
    } finally {
        if (testServer) testServer.kill();
    }
}
```

## 性能基准

测试执行时间基准：

| 测试套件 | 预期时间 |
|----------|----------|
| who-port.test.js | < 5 秒 |
| kill-port.test.js | < 10 秒 |
| port-tools.test.js | < 15 秒 |

## 相关文档

- [x-who-port 命令文档](../docs/who-port-command.md)
- [x-kill-port 命令文档](../docs/kill-port-command.md)
- [端口管理工具集文档](../docs/port-tools.md)

## 版本历史

- **v1.0.0** - 初始测试套件
  - x-who-port 单元测试
  - x-kill-port 单元测试
  - 综合集成测试
