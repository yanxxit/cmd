# AI Harness 测试

本目录包含 AI Harness 工具的测试文件和 mock 数据。

## 📁 文件说明

- `prompts.txt` - 用于批量测试的示例提示词文件
- `test-harness.js` - 模拟测试脚本（不调用真实 AI API）
- `test-real.js` - 真实测试脚本（使用真实 AI API）
- `test-apikey.js` - API Key 读取逻辑测试
- `test/harness.vitest.test.js` - Vitest 单元测试文件（10个测试用例
- `README.md` - 本文件

## 🚀 运行测试

### 1. 测试核心逻辑（Mock 模式）

```bash
node test/harness/test-harness.js
```

这个测试会模拟所有功能，包括：
- ✅ ask() 单轮对话
- ✅ chat() 多轮对话
- ✅ clearHistory() 清空历史
- ✅ batchTest() 批量测试

### 2. 真实 API 测试

```bash
node test/harness/test-real.js
```

这个测试使用真实的 AI API，测试内容：
- ✅ ask() 单轮对话
- ✅ chat() 多轮对话（记住上下文）
- ✅ clearHistory() 清空历史
- ✅ batchTest() 批量测试

### 3. 测试 API Key 读取

```bash
node test/harness/test-apikey.js
```

这个测试会验证 API Key 的读取逻辑，优先级如下：
1. 项目目录的 `.env` 文件
2. 系统环境变量

### 4. Vitest 单元测试

```bash
# 运行单个测试文件
npm run test:fast -- --run test/harness.vitest.test.js

# 运行完整的快速测试
npm run test:fast
```

单元测试覆盖了 10 个测试用例：
- ✅ 初始化测试 - 默认配置
- ✅ 初始化测试 - 自定义配置
- ✅ ask() 方法测试 - 单轮对话
- ✅ ask() 方法测试 - 自定义系统提示
- ✅ chat() 方法测试 - 多轮对话
- ✅ chat() 方法测试 - 历史记录管理
- ✅ clearHistory() 方法测试 - 清空历史
- ✅ batchTest() 方法测试 - 批量测试
- ✅ batchTest() 方法测试 - 错误处理
- ✅ testFromFile() 方法测试 - 文件读取

### 5. 测试真实 CLI 命令

确保你已经运行 `npm link` 后：

```bash
# 查看帮助
x-harness --help

# 测试 ask 命令
x-harness ask "你好"

# 测试 chat 命令（交互式）
x-harness chat

# 测试批量测试
x-harness batch test/harness/prompts.txt
```

## 📝 测试数据

`prompts.txt` 包含了 5 个示例问题，用于测试批量功能：
- 请简要介绍一下 JavaScript
- 什么是 Node.js
- 解释一下 RESTful API
- 什么是 Promise
- 如何学习编程

## ✅ 真实测试结果

```
🚀 AI Harness 真实测试开始

📝 测试 1: ask() 单轮对话
✅ 回答: JavaScript 是一种广泛使用的编程语言...

💬 测试 2: chat() 多轮对话
✅ 回复1: 你好，小明！很高兴认识你...
✅ 回复2: 你叫小明。

🧹 测试 3: clearHistory() 清空历史
✅ 历史已清空

📊 测试 4: batchTest() 批量测试
✅ [1] 什么是 Node.js？
✅ [2] 解释一下 Promise

✅ 所有真实测试通过！
```

## ✅ Vitest 单元测试结果

```
Test Files  1 passed (1)
      Tests  10 passed (10)
   Duration  248ms
```
