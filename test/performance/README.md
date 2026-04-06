# 性能测试目录结构

## 目录组织

```
test/
├── performance/                    # 性能测试专用目录
│   ├── performance.vitest.test.js  # 综合性能测试
│   └── cli-tools.vitest.test.js    # CLI 工具性能测试
├── *.vitest.test.js                # 日常快速测试
└── git/
    └── *.vitest.test.js            # Git 工具测试
```

## 测试分类

### 快速测试 (< 7 秒)
位于 `test/` 根目录，日常开发使用

### 性能测试 (> 30 秒)
位于 `test/performance/` 目录，专门性能验证使用

## 运行命令

```bash
# 快速测试
npm run test:fast

# 性能测试
npm run test:performance

# CLI 工具性能测试
npm run test:performance:cli

# 完整测试（包含快速 + 性能）
npm test
```

## 添加性能测试

当测试执行时间超过 5 秒时，应该：

1. 在 `test/performance/` 目录下创建对应的测试文件
2. 在原测试文件中使用 `it.skip` 跳过
3. 在性能测试文件中实现完整测试

### 示例

**原测试文件** (test/cli-tools.vitest.test.js):
```javascript
// 性能测试已移至 test/performance/cli-tools.vitest.test.js
it.skip('应该查询大目录 (性能测试)', () => {
  // ...
});
```

**性能测试文件** (test/performance/cli-tools.vitest.test.js):
```javascript
it('应该查询大目录', () => {
  // ...
});
```

## 文件命名规范

- `*.vitest.test.js` - Vitest 测试文件
- `*.skip.js` - 被跳过的测试文件（在 exclude 配置中）
- 按功能模块组织：`cli-tools`, `port`, `git` 等
