# Vitest 测试配置总结

## ✅ 已完成的工作

### 1. 安装 Vitest 和插件

已安装以下开发依赖：

```json
{
  "devDependencies": {
    "@vitest/coverage-v8": "^2.1.9",
    "@vitest/ui": "^2.1.9",
    "vitest": "^2.1.9"
  }
}
```

### 2. 创建配置文件

**vitest.config.js**
```javascript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/git/**/*.test.js'],
    exclude: ['test/git/run-all-tests.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/git/**/*.js', 'bin/git.js'],
    },
    reporters: ['verbose', 'html'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@git': path.resolve(__dirname, 'src/git'),
      '@bin': path.resolve(__dirname, 'bin')
    }
  }
});
```

### 3. 添加 npm 脚本

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:git": "vitest run test/git/",
    "test:git:basic": "vitest run test/git/git-vitest.test.js",
    "test:git:clone": "vitest run test/git/git-clone.test.js",
    "test:git:commit": "vitest run test/git/git-commit.test.js",
    "test:git:log": "vitest run test/git/git-log.test.js",
    "test:git:server": "vitest run test/git/git-log-server.test.js",
    "test:git:sparse": "vitest run test/git/git-sparse.test.js"
  }
}
```

### 4. 创建测试文件

- ✅ `test/git/git-vitest.test.js` - 综合测试（18 个测试用例，全部通过）
- ✅ `test/git/git-clone.vitest.test.js` - clone 命令测试（Vitest 格式）
- ✅ `test/git/VITEST-GUIDE.md` - 完整的使用指南

## 🚀 使用方法

### 运行所有测试

```bash
npm test
```

### 监听模式（开发推荐）

```bash
npm run test:watch
```

### 生成覆盖率报告

```bash
npm run test:coverage
```

### 打开 UI 界面

```bash
npm run test:ui
```

### 运行特定测试

```bash
# 运行综合测试
npm run test:git:basic

# 运行 clone 命令测试
npm run test:git:clone

# 运行 commit 命令测试
npm run test:git:commit
```

## 📊 测试结果

当前测试状态：**18/18 通过** ✅

```
✓ test/git/git-vitest.test.js (18)
  ✓ x-git CLI (18)
    ✓ 基本功能 (2)
    ✓ clone 命令 (2)
    ✓ commit 命令 (6)
    ✓ log 命令 (4)
    ✓ log-server 命令 (2)
    ✓ sparse 命令 (2)
```

## 🔌 常用 Vitest 插件

### 已安装的插件

1. **@vitest/coverage-v8** - 代码覆盖率
   - 生成 HTML/JSON/LCOV 格式报告
   - 支持 v8 引擎覆盖率收集

2. **@vitest/ui** - 图形界面
   - 可视化测试结果
   - 实时查看测试详情
   - 友好的错误展示

### 推荐的其他插件

```bash
# 快照测试
npm install -D @vitest/snapshot

# 浏览器环境测试
npm install -D @vitest/browser

# Mock 功能增强
npm install -D @vitest/spy
```

## 📝 测试示例

### 基本测试

```javascript
import { describe, it, expect } from 'vitest';

describe('我的功能', () => {
  it('应该正常工作', () => {
    expect(true).toBe(true);
  });
});
```

### 异步测试

```javascript
import { describe, it, expect } from 'vitest';

describe('异步功能', () => {
  it('应该异步加载数据', async () => {
    const data = await loadData();
    expect(data).toBeDefined();
  });
});
```

### CLI 命令测试

```javascript
import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';

describe('Git 命令', () => {
  it('应该显示帮助信息', async () => {
    const result = await runCommand(['--help']);
    expect(result.output).toContain('clone');
  });
});
```

## 📈 测试覆盖率

运行以下命令生成覆盖率报告：

```bash
npm run test:coverage
```

报告位置：
- HTML: `coverage/index.html`
- JSON: `coverage/coverage-final.json`
- LCOV: `coverage/lcov.info`

## 🎯 最佳实践

1. **使用全局 API** - Vitest 提供全局的 `describe`, `it`, `expect`
2. **钩子函数** - 使用 `beforeEach`, `afterEach` 清理资源
3. **断言库** - Vitest 兼容 Chai 断言语法
4. **快照测试** - 使用 `toMatchSnapshot()` 进行 UI 测试
5. **Mock 功能** - 使用 `vi.fn()`, `vi.mock()` 进行模拟

## 📚 相关文档

- [Vitest 官方文档](https://vitest.dev/)
- [测试指南](./VITEST-GUIDE.md)
- [配置选项](https://vitest.dev/config/)

## 🎉 下一步

1. 将旧的测试文件迁移到 Vitest 格式
2. 添加更多单元测试
3. 集成 CI/CD 自动运行测试
4. 设置测试覆盖率门槛

---

**状态**: ✅ 完成  
**最后更新**: 2024-01-XX  
**测试通过率**: 100% (18/18)
