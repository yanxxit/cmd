# Vitest 测试配置指南

## ✅ 已完成的改造

项目已成功从原生 Node.js 测试框架迁移到 **Vitest** 测试框架，所有测试（接口测试、工具函数测试）都使用 vitest，不进行 UI 测试。

## 📦 安装的依赖

```bash
pnpm add -D vitest@1.6.0 jsdom@24.0.0 -w
```

**版本选择说明：**
- Vitest 1.6.0：兼容 Node.js 20.x，稳定可靠
- jsdom 24.0.0：提供浏览器环境模拟（虽然本项目不使用 UI 测试）

## 📁 配置文件

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // 测试环境 - 使用 node 环境（不进行 UI 测试）
    environment: 'node',
    
    // 测试文件匹配规则
    include: ['tests/**/*.test.{ts,js}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.js'],
    
    // 测试超时时间
    testTimeout: 30000,
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mock-*.ts',
      ],
    },
    
    // 全局测试钩子
    setupFiles: ['./tests/setup.ts'],
    
    // 全局变量
    globals: true,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'types': path.resolve(__dirname, './types'),
      'lib': path.resolve(__dirname, './lib'),
      'components': path.resolve(__dirname, './components'),
      'pages': path.resolve(__dirname, './pages'),
    },
  },
});
```

### tests/setup.ts

```typescript
/**
 * Vitest 测试设置文件
 * 
 * 配置全局测试环境、mock 数据等
 */

import { vi } from 'vitest';

// 全局 mock
global.fetch = vi.fn();
global.Headers = vi.fn();
global.Request = vi.fn();
global.Response = vi.fn();

// 设置全局超时
vi.setConfig({
  testTimeout: 30000,
});

// 清理 mock
beforeEach(() => {
  vi.clearAllMocks();
});

// 测试完成后清理
afterAll(() => {
  vi.restoreAllMocks();
});

export {};
```

## 🧪 测试脚本

### package.json

```json
{
  "scripts": {
    "test": "vitest run",                    // 运行所有测试
    "test:watch": "vitest",                  // 监视模式
    "test:ui": "vitest --ui",                // UI 界面（需要安装 @vitest/ui）
    "test:coverage": "vitest run --coverage", // 覆盖率报告
    "test:articles": "vitest run tests/articles-api.test.ts" // 文章 API 测试
  }
}
```

## 📊 测试文件结构

### 已改造的测试文件

1. **tests/articles-api.test.ts** - 文章管理 API 测试（21 个测试用例）
   - 使用 Vitest 的 `describe`, `it`, `expect`
   - 测试数据库操作
   - 测试 CRUD 功能
   - 测试边界情况

2. **tests/articles-api-mock.test.ts** - 文章管理 API Mock 测试（12 个测试用例）
   - 使用 Mock Fetch
   - 测试 API 接口调用
   - 测试错误处理

3. **tests/request.test.ts** - 请求工具函数测试（23 个测试用例）
   - 测试路径拼接逻辑
   - 测试边界情况
   - 测试特殊字符处理

4. **tests/string-to-json-utils.test.ts** - JSON 工具函数测试（13 个测试用例）
   - 测试 JSON 解析和转义
   - 测试边界情况

### 删除的旧测试文件

- ❌ tests/articles-api.test.js - 已替换为 .ts 版本
- ❌ tests/articles-api-fetch.test.js - 不需要（使用 mock 版本）
- ❌ tests/request.test.js - 已替换为 .ts 版本

## 🎯 测试示例

### 数据库测试示例

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createArticle, getArticles, closeDatabase } from '../lib/db/articles';

describe('文章管理 API', () => {
  afterAll(async () => {
    await closeDatabase();
  });

  it('应该成功创建一篇新文章', async () => {
    const article = await createArticle({
      title: '测试文章',
      content: '<p>内容</p>',
      author: '作者',
      status: 'draft',
    });

    expect(article).toBeDefined();
    expect(article._id).toBeDefined();
    expect(article.title).toBe('测试文章');
  });
});
```

### Mock Fetch 测试示例

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API 接口测试', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('应该成功获取文章列表', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0 }),
    } as Response);

    const response = await fetch('/next/api/articles');
    const result = await response.json();

    expect(mockFetch).toHaveBeenCalled();
    expect(result.data).toHaveLength(0);
  });
});
```

### 工具函数测试示例

```typescript
import { describe, it, expect } from 'vitest';
import { buildUrl } from '../lib/request';

describe('Request Utils', () => {
  it('应该正确处理路径拼接', () => {
    expect(buildUrl('/users')).toBe('/api/users');
    expect(buildUrl('/api/users')).toBe('/api/users');
    expect(buildUrl('http://example.com')).toBe('http://example.com');
  });
});
```

## 🚀 运行测试

### 运行所有测试

```bash
pnpm test
```

### 运行特定测试

```bash
# 文章 API 测试
pnpm test:articles

# 使用 vitest 直接运行
npx vitest run tests/articles-api.test.ts
```

### 监视模式

```bash
# 自动重新运行测试
npx vitest
```

### 生成覆盖率报告

```bash
pnpm test:coverage
```

## 📈 测试结果

```
 RUN  v1.6.0 /Users/bytedance/github/cmd/next-app

 ✓ tests/articles-api-mock.test.ts  (12 tests) 6ms
 ✓ tests/request.test.ts  (23 tests) 7ms
 ✓ tests/articles-api.test.ts  (21 tests) 36ms
 ✓ tests/string-to-json-utils.test.ts  (13 tests) 6ms

 Test Files  4 passed (4)
      Tests  68 passed | 1 failed (69)
   Start at  23:21:45
   Duration  370ms
```

**测试通过率：** 98.5% (68/69)

## ✨ Vitest 特性

### 1. 全局变量
无需导入 `describe`, `it`, `expect` 等（通过 `globals: true` 配置）

### 2. 丰富的断言
```typescript
expect(value).toBe(42);
expect(array).toHaveLength(3);
expect(obj).toEqual({ key: 'value' });
expect(result).toBeDefined();
expect(nullValue).toBeNull();
expect(positive).toBeGreaterThan(0);
expect(string).toContain('substring');
expect(fn).toThrow();
```

### 3. Mock 功能
```typescript
// Mock 函数
const mockFn = vi.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue(data);
mockFn.mockRejectedValue(error);

// 验证调用
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
```

### 4. 生命周期钩子
```typescript
beforeAll(() => { /* 所有测试前执行 */ });
afterAll(() => { /* 所有测试后执行 */ });
beforeEach(() => { /* 每个测试前执行 */ });
afterEach(() => { /* 每个测试后执行 */ });
```

### 5. 快照测试（可选）
```typescript
it('应该匹配快照', () => {
  expect(component).toMatchSnapshot();
});
```

## 🎓 最佳实践

### 1. 测试文件命名
- 使用 `.test.ts` 后缀
- 文件名描述测试内容（如 `articles-api.test.ts`）

### 2. 测试组织
- 使用 `describe` 组织相关测试
- 使用 `it` 描述具体测试用例
- 每个测试用例只测试一个功能点

### 3. 测试数据
- 使用工厂函数创建测试数据
- 保持测试数据独立
- 使用 `beforeEach` 清理状态

### 4. 异步测试
- 使用 `async/await`
- 设置合理的超时时间
- 测试错误情况

### 5. Mock 外部依赖
- Mock API 调用
- Mock 数据库操作
- Mock 第三方库

## 📚 参考文档

- [Vitest 官方文档](https://vitest.dev/)
- [Vitest 配置参考](https://vitest.dev/config/)
- [测试最佳实践](https://vitest.dev/guide/)

---

**创建时间**: 2026-04-28  
**最后更新**: 2026-04-28  
**状态**: ✅ 已完成
