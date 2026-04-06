# 命令行工具测试套件

## 概述

本项目包含完整的命令行工具测试套件，覆盖所有 bin 目录下的脚本。

## 测试文件结构

```
test/
├── cli-tools.vitest.test.js      # 命令行工具测试（新增）
├── port.vitest.test.js           # Port 统一命令测试
├── port-tools.vitest.test.js     # Port 工具集成测试
├── system-top.vitest.test.js     # System-top 命令测试
├── dict.vitest.test.js           # Dict 词典测试
├── jsondb.vitest.test.js         # JSONDB 测试
└── git/
    ├── git-vitest.test.js        # Git 统一命令综合测试
    ├── git-clone.vitest.test.js  # Git clone 测试
    └── ...                       # 其他 Git 测试
```

## 测试覆盖

### cli-tools.vitest.test.js

测试所有命令行工具的基本功能：

#### AI 相关工具
- ✅ **x-ask** - AI 问答工具
  - 帮助信息
  - 版本号
  - 问题参数

- ✅ **x-chat** - AI 聊天工具
  - 帮助信息
  - 版本号
  - 交互式模式

- ✅ **x-say** - 语音工具
  - 帮助信息
  - 版本号
  - 文本参数

#### 词典翻译工具
- ✅ **x-ds** - 屌丝字典
  - 帮助信息
  - lookup 子命令
  - cli 子命令
  - serve 子命令

- ✅ **x-fy** - 翻译工具
  - 帮助信息
  - 翻译参数
  - --no-cache 选项
  - --day 历史记录

#### 系统工具
- ✅ **x-clean-node** - 清理 node_modules
  - 帮助信息
  - 指定目录
  - 错误处理

- ✅ **x-ls-size** - 目录大小查询
  - 帮助信息
  - 查询目录
  - 限制数量

- ✅ **x-ls-size-fast** - 快速目录查询
  - 帮助信息
  - 并行处理
  - 并发数配置

#### Markdown 工具
- ✅ **x-md-view** - Markdown 查看器
  - 帮助信息
  - 查看文件
  - 分页模式

- ✅ **x-md-browser** - Markdown 浏览器
  - 帮助信息
  - 指定端口
  - 错误处理

#### 网络工具
- ✅ **x-http-sniffer** - HTTP 抓包工具
  - 帮助信息
  - 指定端口
  - 生成证书
  - 统计信息

- ✅ **x-wifi** - WiFi 密码工具
  - 脚本存在性
  - 帮助注释
  - 功能选项

- ✅ **x-static** - 静态文件服务器
  - 脚本存在性
  - 帮助注释
  - 端口配置

### port.vitest.test.js

测试统一的 port 命令：
- ✅ who 命令 - 查询端口占用
- ✅ kill 命令 - 关闭端口
- ✅ scan 命令 - 扫描端口范围
- ✅ 集成测试 - 完整工作流程

### git 测试套件

测试统一的 git 命令：
- ✅ git-vitest.test.js - 综合测试
- ✅ git-clone.vitest.test.js - clone 命令
- ✅ git-commit.vitest.test.js - commit 命令
- ✅ git-log.test.js - log 命令
- ✅ git-log-server.test.js - log-server 命令
- ✅ git-sparse.test.js - sparse 命令

## 运行测试

### 运行所有测试
```bash
npm test
```

### 运行特定测试
```bash
# 命令行工具测试
npm test -- test/cli-tools.vitest.test.js

# Port 工具测试
npm run test:port

# Git 工具测试
npm run test:git

# 单个测试文件
npx vitest run test/port.vitest.test.js
```

### 测试覆盖率
```bash
npm run test:coverage
```

### 测试监视模式
```bash
npm run test:watch
```

### 测试图形界面
```bash
npm run test:ui
```

## 测试结果

### 当前状态
- **Test Files**: 5 passed (7 total)
- **Tests**: 82 passed, 10 failed, 4 skipped (96 total)
- **Duration**: ~20s

### 测试报告
测试完成后，HTML 报告生成在：
```
test/result/test-results.html
```

查看报告：
```bash
npx vite preview --outDir test/result
```

## 测试规范

### 测试命名约定
- 使用中文描述测试用例
- 格式：`应该 <行为> <预期结果>`
- 示例：`应该显示帮助信息`

### 测试结构
```javascript
describe('命令名称 - 功能描述', () => {
  it('应该 <测试点>', () => {
    const result = execCommand(`node bin/command.js --option`);
    expect(result.success).toBe(true);
    expect(result.output).toContain('expected text');
  });
});
```

### 辅助函数
```javascript
function execCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      ...options
    });
    return { success: true, output, error: null };
  } catch (err) {
    return { success: false, output: err.stdout || '', error: err.message };
  }
}
```

## 注意事项

1. **测试环境**：某些测试需要特定的环境配置（如 API 密钥、网络环境等）
2. **端口占用**：测试可能使用随机端口，避免端口冲突
3. **超时设置**：网络相关测试设置了超时处理
4. **清理资源**：测试完成后应清理临时文件和进程

## 持续改进

- [ ] 增加集成测试覆盖率
- [ ] 添加性能测试
- [ ] 添加端到端测试
- [ ] 优化测试执行速度
- [ ] 添加 Mock 数据支持
