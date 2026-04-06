# Git 命令测试套件

本目录包含对统一 Git 命令行工具 `x-git` 的完整测试套件。

## 测试文件结构

```
test/git/
├── run-all-tests.js          # 运行所有测试的脚本
├── README.md                 # 测试文档（本文件）
├── git.test.js              # 综合测试 - 测试所有命令的基本功能
├── git-clone.test.js        # clone 命令专项测试
├── git-commit.test.js       # commit 命令专项测试
├── git-log.test.js          # log 命令专项测试
├── git-log-server.test.js   # log-server 命令专项测试
└── git-sparse.test.js       # sparse 命令专项测试
```

## 运行测试

### 运行所有测试

```bash
# 方式 1: 使用测试运行器
node test/git/run-all-tests.js

# 方式 2: 手动运行所有测试
node test/git/git.test.js
node test/git/git-clone.test.js
node test/git/git-commit.test.js
node test/git/git-log.test.js
node test/git/git-log-server.test.js
node test/git/git-sparse.test.js
```

### 运行单个测试

```bash
# 运行综合测试
node test/git/git.test.js

# 运行 clone 命令测试
node test/git/git-clone.test.js

# 运行 commit 命令测试
node test/git/git-commit.test.js

# 运行 log 命令测试
node test/git/git-log.test.js

# 运行 log-server 命令测试
node test/git/git-log-server.test.js

# 运行 sparse 命令测试
node test/git/git-sparse.test.js
```

## 测试说明

### 1. git.test.js - 综合测试

测试统一 CLI 的基本功能和所有命令的可用性：

- ✓ 主帮助信息显示
- ✓ 版本号显示
- ✓ 所有子命令帮助信息
- ✓ 命令参数验证
- ✓ 错误处理（非 Git 仓库等）
- ✓ 基本功能集成测试

**测试数量**: 11 个测试用例

### 2. git-clone.test.js - clone 命令测试

测试 Git 仓库克隆功能：

- ✓ 帮助信息完整性
- ✓ URL 格式验证
- ✓ GitHub shorthand 支持
- ✓ 镜像站点选项
- ✓ 实际克隆测试
- ✓ 目录创建验证

**测试数量**: 8 个测试用例

### 3. git-commit.test.js - commit 命令测试

测试 AI 驱动的 commit 信息生成功能：

- ✓ 帮助信息完整性
- ✓ 非 Git 仓库错误处理
- ✓ 暂存区无变更处理
- ✓ 工作区无变更处理
- ✓ 暂存区变更识别
- ✓ 工作区变更识别
- ✓ 详细模式
- ✓ 多文件变更
- ✓ type 选项
- ✓ 输出格式验证
- ✓ --no-api 模式

**测试数量**: 11 个测试用例

### 4. git-log.test.js - log 命令测试

测试 Git 日志报告生成功能：

- ✓ 帮助信息完整性
- ✓ 生成今天报告
- ✓ 生成昨天报告
- ✓ JSON 格式报告
- ✓ Markdown 格式报告
- ✓ 所有格式批量生成
- ✓ 日期范围查询
- ✓ 月度视图
- ✓ 输出摘要信息

**测试数量**: 9 个测试用例

### 5. git-log-server.test.js - log-server 命令测试

测试 Git 日志可视化服务器：

- ✓ 帮助信息完整性
- ✓ 默认端口启动
- ✓ 指定端口启动
- ✓ 指定主机启动
- ✓ API 端点可用性

**测试数量**: 5 个测试用例

### 6. git-sparse.test.js - sparse 命令测试

测试 Git 稀疏检出功能：

- ✓ 帮助信息完整性
- ✓ 默认参数验证
- ✓ 选项完整性
- ✓ 输出目录选项
- ✓ 详细输出选项
- ✓ 实际稀疏克隆测试

**测试数量**: 7 个测试用例

## 测试环境要求

- Node.js >= 14.0.0
- Git 已安装并配置
- 网络连接（用于克隆测试）
- 足够的磁盘空间（用于测试目录）

## 测试清理

所有测试脚本会自动清理创建的临时目录：
- `./test-git-temp`
- `./test-git-commit-temp`
- `./test-git-log-temp`
- `./test-clone-output`
- `./test-sparse-output`

如果测试意外中断，可以手动清理：

```bash
rm -rf ./test-git-* ./test-clone-* ./test-sparse-*
```

## 添加新测试

如需添加新的测试用例，请遵循以下模式：

```javascript
// ========== 测试 N: 测试名称 ==========
console.log(chalk.yellow('\nTest N: 测试名称'));
try {
  // 测试逻辑
  const result = await runCommand(['command', 'args']);
  
  if (/* 验证条件 */) {
    console.log(chalk.green('✓ 测试通过'));
    passedTests++;
  } else {
    console.log(chalk.red('✗ 测试失败'));
    failedTests++;
  }
} catch (e) {
  console.log(chalk.red('✗ 测试执行失败:', e.message));
  failedTests++;
}
```

## 常见问题

### Q: 测试失败怎么办？

A: 
1. 检查错误输出信息
2. 确保 Git 已正确安装
3. 确保网络连接正常
4. 检查是否有足够的权限创建文件
5. 清理临时目录后重试

### Q: 如何跳过某些测试？

A: 编辑 `run-all-tests.js`，从 `testFiles` 数组中移除对应的测试文件。

### Q: 如何增加测试超时时间？

A: 修改测试文件中的 `setTimeout` 时间参数。

## 测试覆盖率

当前测试覆盖的主要功能：

- [x] 命令帮助信息
- [x] 参数验证
- [x] 错误处理
- [x] clone 命令
- [x] commit 命令
- [x] log 命令
- [x] log-server 命令
- [x] sparse 命令
- [ ] 边界条件测试
- [ ] 性能测试
- [ ] 并发测试

## 贡献指南

欢迎提交新的测试用例和改进建议！请确保：

1. 新测试遵循现有测试的代码风格
2. 所有测试通过后再提交
3. 更新本文档说明新测试的用途
4. 清理所有临时文件和目录

## 许可证

与主项目许可证相同。
