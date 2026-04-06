# Vitest 测试指南

本项目使用 [Vitest](https://vitest.dev/) 作为测试框架，提供快速的测试执行和丰富的功能。

## 📦 安装依赖

首次使用需要安装 Vitest 和相关插件：

```bash
npm install
```

## 🚀 运行测试

### 运行所有测试

```bash
# 运行所有测试（生产模式）
npm test

# 运行所有测试并生成覆盖率报告
npm run test:coverage
```

### 监听模式（开发推荐）

```bash
# 监听文件变化自动重新运行测试
npm run test:watch
```

### 图形界面

```bash
# 打开 Vitest UI 界面
npm run test:ui
```

### 运行特定测试

```bash
# 运行所有 Git 测试
npm run test:git

# 运行综合测试
npm run test:git:basic

# 运行 clone 命令测试
npm run test:git:clone

# 运行 commit 命令测试
npm run test:git:commit

# 运行 log 命令测试
npm run test:git:log

# 运行 log-server 命令测试
npm run test:git:server

# 运行 sparse 命令测试
npm run test:git:sparse
```

## 📊 测试覆盖率

生成并查看测试覆盖率报告：

```bash
# 生成覆盖率报告
npm run test:coverage

# 查看 HTML 报告
open coverage/index.html
```

覆盖率报告位置：
- HTML: `coverage/index.html`
- JSON: `coverage/coverage-final.json`
- LCOV: `coverage/lcov.info`

## 📝 测试文件结构

```
test/git/
├── vitest.config.js           # Vitest 配置文件
├── git-vitest.test.js         # 综合测试（Vitest 格式）
├── git-clone.vitest.test.js   # clone 命令测试（Vitest 格式）
├── git-clone.test.js          # clone 命令测试（旧格式）
├── git-commit.test.js         # commit 命令测试（旧格式）
├── git-log.test.js            # log 命令测试（旧格式）
├── git-log-server.test.js     # log-server 命令测试（旧格式）
├── git-sparse.test.js         # sparse 命令测试（旧格式）
└── README.md                  # 测试文档
```

## ✨ Vitest 特性

### 1. 全局 API

Vitest 提供全局 API，无需导入：

```javascript
describe('测试套件', () => {
  it('测试用例', () => {
    expect(true).toBe(true);
  });
});
```

### 2. 钩子函数

```javascript
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

describe('我的测试', () => {
  beforeAll(() => {
    // 所有测试前执行一次
  });

  afterAll(() => {
    // 所有测试后执行一次
  });

  beforeEach(() => {
    // 每个测试前执行
  });

  afterEach(() => {
    // 每个测试后执行
  });

  it('测试 1', () => {
    // ...
  });

  it('测试 2', () => {
    // ...
  });
});
```

### 3. 快照测试

```javascript
it('应该生成正确的输出', () => {
  const output = generateOutput();
  expect(output).toMatchSnapshot();
});
```

### 4. Mock 功能

```javascript
import { vi } from 'vitest';

// Mock 模块
vi.mock('fs/promises', () => ({
  readFile: vi.fn(() => Promise.resolve('mocked content'))
}));

// Mock 定时器
vi.useFakeTimers();
setTimeout(() => {
  console.log('1 秒后');
}, 1000);
vi.advanceTimersByTime(1000);
```

### 5. 异步测试

```javascript
// Async/await
it('应该异步加载数据', async () => {
  const data = await loadData();
  expect(data).toBeDefined();
});

// Promise
it('应该返回 Promise', () => {
  return loadData().then(data => {
    expect(data).toBeDefined();
  });
});

// 超时处理
it('应该在超时前完成', async () => {
  await expect(promise).resolves.toBeDefined();
}, 5000);
```

## 🎯 测试示例

### 基本测试

```javascript
import { describe, it, expect } from 'vitest';
import { add } from '../src/math.js';

describe('数学函数', () => {
  it('应该正确相加', () => {
    expect(add(1, 2)).toBe(3);
  });

  it('应该处理负数', () => {
    expect(add(-1, -1)).toBe(-2);
  });
});
```

### CLI 命令测试

```javascript
import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';

function runCommand(args) {
  return new Promise((resolve) => {
    const proc = spawn('node', ['bin/git.js', ...args]);
    let output = '';
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.on('close', (code) => {
      resolve({ code, output });
    });
  });
}

describe('Git 命令', () => {
  it('应该显示帮助信息', async () => {
    const result = await runCommand(['--help']);
    expect(result.output).toContain('clone');
  });
});
```

## ⚙️ 配置选项

### vitest.config.js

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,              // 启用全局 API
    environment: 'node',        // Node.js 环境
    include: ['test/**/*.test.js'],
    exclude: ['node_modules'],
    testTimeout: 30000,         // 测试超时时间
    hookTimeout: 30000,         // 钩子超时时间
    coverage: {
      provider: 'v8',           // 覆盖率提供者
      reporter: ['text', 'json', 'html'],
    },
    reporters: ['verbose'],     // 报告格式
  },
});
```

## 🔧 常用命令

```bash
# 运行匹配的测试
npm run test:watch -- -t "clone"

# 运行特定文件
npm run test:watch -- test/git/git-clone.vitest.test.js

# 更新快照
npm run test:watch -- -u

# 只运行失败的测试
npm run test:watch -- --failed

# 生成覆盖率报告
npm run test:coverage
```

## 📚 相关资源

- [Vitest 官方文档](https://vitest.dev/)
- [Vitest GitHub](https://github.com/vitest-dev/vitest)
- [测试最佳实践](https://vitest.dev/guide/)

## 🐛 故障排除

### 测试超时

增加超时时间：
```javascript
it('长时间运行的测试', async () => {
  // ...
}, 60000); // 60 秒
```

### 模块导入问题

确保使用正确的路径：
```javascript
// 使用绝对路径
import { func } from '@/utils/func.js';

// 或使用相对路径
import { func } from '../../src/utils/func.js';
```

### 环境变量

创建 `.env.test` 文件：
```bash
TEST_ENV=true
API_KEY=test-key
```

## 📈 迁移计划

旧的测试文件（`.test.js`）仍然可用，但建议迁移到 Vitest 格式（`.vitest.test.js`）以获得更好的体验。

迁移步骤：
1. 将 `it`/`describe` 改为 Vitest 导入或使用全局 API
2. 移除自定义的测试运行器
3. 利用 Vitest 的钩子和断言
4. 添加快照测试和覆盖率

## 🎉 最佳实践

1. **测试命名**: 使用描述性的测试名称
2. **单一职责**: 每个测试只测试一个功能
3. **独立性**: 测试之间不应该相互依赖
4. **可重复性**: 测试应该是确定性的
5. **清理资源**: 使用 `afterEach`/`afterAll` 清理临时文件

---

**最后更新**: 2024-01-XX
**维护者**: Development Team
