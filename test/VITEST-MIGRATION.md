# Vitest 测试迁移指南

## ✅ 已完成的迁移

已将以下测试脚本改造为 Vitest 格式：

### 1. 端口管理工具测试

| 原文件 | Vitest 文件 | 状态 |
|--------|-----------|------|
| `test/kill-port.test.js` | `test/kill-port.vitest.test.js` | ✅ 完成 |
| `test/who-port.test.js` | `test/who-port.vitest.test.js` | ✅ 完成 |
| `test/scan-ports.test.js` | `test/scan-ports.vitest.test.js` | ✅ 完成 |
| `test/system-top.test.js` | `test/system-top.vitest.test.js` | ✅ 完成 |
| `test/port-tools.test.js` | `test/port-tools.vitest.test.js` | ✅ 完成 |

### 2. 数据库测试

| 原文件 | Vitest 文件 | 状态 |
|--------|-----------|------|
| `test/jsondb.test.js` | `test/jsondb.vitest.test.js` | ✅ 完成 |
| `test/jsondb.test.mjs` | (合并到 jsondb.vitest.test.js) | ✅ 完成 |
| `test/jsondb.sql.js` | (SQL 测试示例，保留) | 📝 保留 |

### 3. 词典工具测试

| 原文件 | Vitest 文件 | 状态 |
|--------|-----------|------|
| `test/test-ejs.js` | `test/dict.vitest.test.js` | ✅ 完成 |
| `test/test-html-generate.js` | (合并到 dict.vitest.test.js) | ✅ 完成 |
| `test/test-html-open.js` | (合并到 dict.vitest.test.js) | ✅ 完成 |
| `test/test-generators.js` | (合并到 dict.vitest.test.js) | ✅ 完成 |
| `test/test_cache.js` | (合并到 dict.vitest.test.js) | ✅ 完成 |
| `test/test-log.js` | (日志测试，保留) | 📝 保留 |

### 4. 其他测试

| 原文件 | Vitest 文件 | 状态 |
|--------|-----------|------|
| `test/todo-api-test.js` | (需要运行服务器，保留原格式) | 📝 保留 |

## 📦 配置文件

### vitest.config.js

已更新配置以包含所有新测试文件：

```javascript
export default defineConfig({
  test: {
    include: [
      'test/**/*.vitest.test.js',
      'test/git/**/*.vitest.test.js'
    ],
    coverage: {
      include: [
        'src/git/**/*.js',
        'src/dict/**/*.js',
        'bin/kill-port.js',
        'bin/who-port.js',
        'bin/scan-ports.js',
        'bin/system-top.js'
      ]
    }
  }
});
```

## 🚀 运行测试

### 运行所有测试

```bash
npm test
```

### 按类别运行

```bash
# Git 命令测试
npm run test:git

# 端口管理工具测试
npm run test:ports

# 单个工具测试
npm run test:kill-port
npm run test:who-port
npm run test:scan-ports
npm run test:system-top

# 数据库测试
npm run test:jsondb

# 词典工具测试
npm run test:dict
```

### 监听模式

```bash
npm run test:watch
```

### 生成覆盖率

```bash
npm run test:coverage
```

## 📊 测试统计

### 新增测试文件

- ✅ `test/kill-port.vitest.test.js` - 6 个测试套件
- ✅ `test/who-port.vitest.test.js` - 5 个测试套件
- ✅ `test/scan-ports.vitest.test.js` - 7 个测试套件
- ✅ `test/system-top.vitest.test.js` - 7 个测试套件
- ✅ `test/port-tools.vitest.test.js` - 1 个集成测试套件
- ✅ `test/jsondb.vitest.test.js` - 4 个测试套件
- ✅ `test/dict.vitest.test.js` - 3 个测试套件

### 测试覆盖范围

1. **端口管理工具**
   - 帮助信息和版本号
   - 端口查询功能
   - 端口关闭功能
   - JSON 格式输出
   - 详细模式
   - 日志记录
   - 文件保存
   - 批量操作
   - 集成测试

2. **数据库功能**
   - 基本 CRUD 操作
   - JSONB 模式
   - 遍历功能
   - 文档更新和删除

3. **词典工具**
   - EJS 模板渲染
   - HTML 文件生成
   - Markdown 生成
   - 缓存功能

## 🎯 迁移优势

### 原测试脚本的问题

1. ❌ 使用自定义测试运行器
2. ❌ 没有统一的断言库
3. ❌ 错误报告不清晰
4. ❌ 无法并行执行
5. ❌ 覆盖率统计复杂

### Vitest 的优势

1. ✅ 标准化测试框架
2. ✅ 内置 Chai 断言
3. ✅ 清晰的错误报告
4. ✅ 并行执行测试
5. ✅ 内置覆盖率统计
6. ✅ 热更新支持
7. ✅ 图形界面
8. ✅ 快照测试

## 📝 保留的文件

以下文件保留原格式，因为它们有特殊用途：

### 1. `test/todo-api-test.js`
- 需要运行 HTTP 服务器
- 使用自定义 HTTP 客户端
- 建议：未来可以迁移到 Supertest + Vitest

### 2. `test/jsondb.sql.js`
- SQL 查询示例脚本
- 不是测试文件，是使用示例
- 建议：保留作为文档

### 3. `test/test-log.js`
- 日志功能简单测试
- 建议：可以迁移，但优先级低

### 4. `test/*.test.js` (旧格式)
- 原有的 Node.js 测试脚本
- 建议：逐步迁移或删除

## 🔧 迁移步骤

如果你想迁移剩余的测试文件：

1. **导入 Vitest API**
   ```javascript
   import { describe, it, expect } from 'vitest';
   ```

2. **使用 describe/it 重构测试结构**
   ```javascript
   describe('功能名称', () => {
     it('应该...', () => {
       // 测试代码
     });
   });
   ```

3. **替换断言**
   ```javascript
   // 原来
   if (result.success) {
     console.log('✅ 通过');
   } else {
     console.log('❌ 失败');
   }
   
   // 现在
   expect(result.success).toBe(true);
   ```

4. **使用钩子函数**
   ```javascript
   beforeAll(async () => {
     // 设置代码
   });
   
   afterAll(async () => {
     // 清理代码
   });
   ```

## 📈 下一步计划

1. ✅ 完成核心工具的 Vitest 迁移
2. 🔄 迁移剩余测试文件（可选）
3. 📊 设置 CI/CD 自动运行
4. 🎯 增加测试覆盖率目标
5. 📝 添加更多边界条件测试

## 🎉 总结

已完成 15 个测试脚本中的 7 个主要测试文件的 Vitest 迁移，覆盖：
- ✅ 所有端口管理工具
- ✅ 数据库功能
- ✅ 词典工具
- ✅ Git 命令（之前已完成）

测试代码更加规范、易维护，并且可以享受 Vitest 的所有高级特性！

---

**最后更新**: 2024-01-XX  
**迁移进度**: 7/15 (46%)  
**测试通过率**: 待运行验证
