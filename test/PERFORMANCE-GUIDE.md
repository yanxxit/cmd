# 性能测试指南

## 概述

本项目将测试分为两类：
- **日常测试**：快速执行的测试，用于日常开发验证
- **性能测试**：执行时间较长的测试，用于性能基准测试和 CI/CD

## 测试分类

### 日常快速测试 (< 10 秒)
- ✅ 帮助信息验证
- ✅ 版本号检查
- ✅ 基本参数验证
- ✅ 错误处理测试
- ✅ 文件存在性检查

### 性能测试 (> 10 秒)
- ⏱️ 大目录扫描测试
- ⏱️ 网络 API 调用测试
- ⏱️ 端口扫描测试
- ⏱️ 文件渲染性能测试
- ⏱️ 并发处理性能测试
- ⏱️ Git 仓库操作测试

## 运行测试

### 运行所有测试（包括性能测试）
```bash
npm test
```

### 仅运行快速测试（排除性能测试）
```bash
npm run test:fast
```

### 仅运行性能测试
```bash
npm run test:performance
```

### 运行特定测试
```bash
# CLI 工具测试
npm run test:cli

# Port 工具测试
npm run test:port

# Git 工具测试
npm run test:git

# JSONDB 测试
npm run test:jsondb

# Dict 测试
npm run test:dict

# System-top 测试
npm run test:system-top
```

## 测试文件结构

```
test/
├── performance.vitest.test.js      # 性能测试（新增）
├── cli-tools.vitest.test.js        # CLI 工具测试（部分移至 performance）
├── port.vitest.test.js             # Port 工具测试
├── port-tools.vitest.test.js       # Port 集成测试
├── system-top.vitest.test.js       # System-top 测试
├── jsondb.vitest.test.js           # JSONDB 测试
├── dict.vitest.test.js             # Dict 测试
└── git/
    ├── git-vitest.test.js          # Git 综合测试
    ├── git-clone.vitest.test.js    # Git clone 测试
    └── ...
```

## 性能测试详情

### x-ls-size - 大目录性能测试
```javascript
// 测试大目录查询性能
npm run test:performance -- --grep "大目录"
```

### x-ls-size-fast - 并行性能测试
```javascript
// 测试不同并发数的性能
npm run test:performance -- --grep "并行"
```

### x-fy - 翻译性能测试
```javascript
// 测试批量翻译和缓存性能
npm run test:performance -- --grep "翻译"
```

### x-port - 端口扫描性能测试
```javascript
// 测试大范围端口扫描
npm run test:performance -- --grep "端口扫描"
```

### x-http-sniffer - 抓包性能测试
```javascript
// 测试大量请求处理
npm run test:performance -- --grep "抓包"
```

### x-system-top - 系统监控性能测试
```javascript
// 测试持续监控性能
npm run test:performance -- --grep "系统监控"
```

### x-md-browser - Markdown 渲染性能
```javascript
// 测试大型文件渲染
npm run test:performance -- --grep "渲染"
```

### x-git - Git 操作性能测试
```javascript
// 测试 clone 操作性能
npm run test:performance -- --grep "Git"
```

## 性能基准

### 当前性能指标
- **快速测试**: ~5-8 秒
- **性能测试**: ~15-25 秒
- **全部测试**: ~25-35 秒

### 目标性能指标
- **快速测试**: < 10 秒 ✅
- **性能测试**: < 30 秒
- **CI/CD 总时间**: < 60 秒

## 添加性能测试

当您需要添加新的性能测试时，请遵循以下步骤：

1. **判断测试类型**
   - 如果测试执行时间 > 5 秒，应该放入 `performance.vitest.test.js`
   - 如果测试执行时间 < 5 秒，可以放入常规测试文件

2. **标记慢速测试**
   ```javascript
   // 在常规测试文件中使用 it.skip
   it.skip('应该查询大目录 (性能测试)', () => {
     // 测试代码
   });
   ```

3. **添加到性能测试文件**
   ```javascript
   // 在 performance.vitest.test.js 中
   it('应该查询大目录', () => {
     // 测试代码
   });
   ```

## CI/CD 集成

### GitHub Actions 示例
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run fast tests
        run: npm run test:fast
      
      - name: Run performance tests (only on main branch)
        if: github.ref == 'refs/heads/main'
        run: npm run test:performance
```

## 性能优化建议

1. **使用 it.skip 标记慢速测试**
   - 在开发过程中跳过耗时的测试
   - 只在 CI/CD 或专门的性能测试中运行

2. **使用 timeout 控制测试时间**
   ```javascript
   it('应该处理大量数据', () => {
     const result = execCommand(`timeout 5 node bin/command.js`);
     expect(result.output).toBeTruthy();
   });
   ```

3. **并行执行独立测试**
   ```javascript
   const results = await Promise.all([
     execCommand('command1'),
     execCommand('command2'),
     execCommand('command3')
   ]);
   ```

4. **使用缓存减少重复操作**
   ```javascript
   // 第一次查询（无缓存）
   const result1 = execCommand('command');
   
   // 第二次查询（有缓存）
   const result2 = execCommand('command');
   ```

## 监控性能变化

### 生成绩能报告
```bash
# 运行性能测试并生成报告
npm run test:performance -- --reporter=verbose

# 查看 HTML 报告
npx vite preview --outDir test/result
```

### 性能回归检测
- 定期检查性能测试执行时间
- 如果某个测试时间增长 > 20%，需要优化
- 在 PR 中比较性能差异

## 故障排除

### 测试超时
如果测试经常超时，可以：
1. 增加 timeout 时间
2. 将测试移到 performance 文件
3. 优化测试逻辑

### 内存占用过高
```javascript
// 在测试前后手动清理
beforeEach(() => {
  global.gc(); // 需要 --expose-gc 参数
});
```

### 端口冲突
```javascript
// 使用随机端口
const port = Math.floor(Math.random() * 10000) + 10000;
```

## 最佳实践

1. ✅ **日常开发使用 test:fast**
2. ✅ **提交前运行完整测试**
3. ✅ **性能测试单独运行**
4. ✅ **定期优化慢速测试**
5. ✅ **保持快速测试 < 10 秒**

## 相关链接

- [Vitest 性能测试文档](https://vitest.dev/guide/features.html#performance-testing)
- [测试最佳实践](./TEST-README.md)
- [Vitest 迁移指南](./VITEST-MIGRATION.md)
