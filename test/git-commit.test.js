#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { setTimeout } from 'timers/promises';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

/**
 * 测试 x-git-commit 命令的功能
 */

console.log(chalk.cyan('Testing x-git-commit command...\n'));

/**
 * 执行命令并获取输出
 */
async function runCommand(args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    // 使用绝对路径
    const scriptPath = path.resolve(process.cwd(), 'bin/git-commit.js');
    // 禁用 dotenv 的环境变量加载
    const testProcess = spawn('node', [scriptPath, ...args], {
      cwd,
      env: { ...process.env, DOTENV_CONFIG_PATH: '/dev/null' }
    });

    let output = '';
    let errorOutput = '';

    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    testProcess.on('close', (code) => {
      resolve({ code, output, error: errorOutput });
    });

    testProcess.on('error', reject);
  });
}

/**
 * 清理测试环境
 */
async function cleanupTestDir(testDir) {
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (e) {
    // 忽略清理错误
  }
}

/**
 * 创建测试 Git 仓库
 */
async function setupTestRepo(testDir) {
  await cleanupTestDir(testDir);
  await fs.mkdir(testDir, { recursive: true });

  // 初始化 Git 仓库
  execSync('git init', { cwd: testDir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'pipe' });

  // 创建初始提交
  await fs.writeFile(path.join(testDir, 'README.md'), '# Test Repo\n');
  execSync('git add README.md', { cwd: testDir, stdio: 'pipe' });
  execSync('git commit -m "Initial commit"', { cwd: testDir, stdio: 'pipe' });
}

/**
 * 创建真正的非 Git 目录（在临时目录中）
 */
async function createNonGitDir() {
  const os = await import('os');
  const nonGitDir = await fs.mkdtemp(path.join(os.tmpdir(), 'non-git-'));
  return nonGitDir;
}

async function runTests() {
  const testDir = './test-git-commit-temp';
  let passedTests = 0;
  let failedTests = 0;

  try {
    // ========== 测试 1: 帮助信息 ==========
    console.log(chalk.yellow('Test 1: 帮助信息'));
    try {
      const result = await runCommand(['--help']);
      if (result.output.includes('根据当前变更生成符合规范的 git commit 总结')) {
        console.log(chalk.green('✓ 帮助信息显示正确'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 帮助信息内容不正确'));
        console.log(chalk.gray('输出:', result.output.substring(0, 100)));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 帮助命令执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 2: 非 Git 仓库错误 ==========
    console.log(chalk.yellow('\nTest 2: 非 Git 仓库错误处理'));
    try {
      const nonGitDir = await createNonGitDir();
      const result = await runCommand([], nonGitDir);
      
      const hasError = result.error.includes('当前目录不是 Git 仓库') || 
                       result.output.includes('当前目录不是 Git 仓库') ||
                       result.code === 1;
      
      if (hasError) {
        console.log(chalk.green('✓ 正确识别非 Git 仓库'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确识别非 Git 仓库'));
        console.log(chalk.gray('输出:', (result.output + result.error).substring(0, 100)));
        failedTests++;
      }
      
      // 清理临时目录
      await fs.rm(nonGitDir, { recursive: true, force: true });
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 3: 暂存区无变更 ==========
    console.log(chalk.yellow('\nTest 3: 暂存区无变更'));
    try {
      await setupTestRepo(testDir);
      const result = await runCommand([], testDir);
      
      const hasNoChange = result.output.includes('暂存区没有变更') || 
                          result.output.includes('没有变更') ||
                          result.output.includes('git add');
      
      if (hasNoChange) {
        console.log(chalk.green('✓ 正确处理暂存区无变更情况'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确处理暂存区无变更'));
        console.log(chalk.gray('输出:', result.output.substring(0, 200)));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 4: 工作区无变更 ==========
    console.log(chalk.yellow('\nTest 4: 工作区无变更'));
    try {
      await setupTestRepo(testDir);
      const result = await runCommand(['-a'], testDir);

      // 清理 dotenv 和 ANSI 代码
      const fullOutput = (result.output + result.error)
        .replace(/\[dotenv@[^\]]*\]\s*[^\n]*/g, '')  // 移除 dotenv 提示
        .replace(/\x1b\[[0-9;]*m/g, '')              // 移除 ANSI 颜色代码
        .trim();
      
      // 检查是否包含"没有变更"或"没有任何变更"
      if (fullOutput.includes('没有') && fullOutput.includes('变更')) {
        console.log(chalk.green('✓ 正确处理工作区无变更情况'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确处理工作区无变更'));
        console.log(chalk.gray('输出:', fullOutput.substring(0, 200)));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 5: 有暂存区变更 ==========
    console.log(chalk.yellow('\nTest 5: 有暂存区变更'));
    try {
      await setupTestRepo(testDir);
      
      // 创建修改文件
      await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("hello");\n');
      execSync('git add test.js', { cwd: testDir, stdio: 'pipe' });
      
      const result = await runCommand(['-v'], testDir);
      
      if (result.output.includes('test.js')) {
        console.log(chalk.green('✓ 正确识别暂存区变更'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确识别暂存区变更'));
        console.log(chalk.gray('输出:', result.output.substring(0, 200)));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 6: 有工作区变更 ==========
    console.log(chalk.yellow('\nTest 6: 有工作区变更'));
    try {
      await setupTestRepo(testDir);
      
      // 创建修改文件（不添加到暂存区）
      await fs.writeFile(path.join(testDir, 'feature.js'), 'const x = 1;\n');
      
      const result = await runCommand(['-a', '-v'], testDir);
      
      // 合并 output 和 error 进行检查
      const fullOutput = result.output + result.error;
      
      if (fullOutput.includes('feature.js')) {
        console.log(chalk.green('✓ 正确识别工作区变更'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确识别工作区变更'));
        console.log(chalk.gray('输出:', fullOutput.substring(0, 200)));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 7: 版本号显示 ==========
    console.log(chalk.yellow('\nTest 7: 版本号显示'));
    try {
      const result = await runCommand(['--version']);
      if (result.output.includes('1.0.0')) {
        console.log(chalk.green('✓ 版本号显示正确'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 版本号显示不正确'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 版本命令执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 8: 多个文件变更 ==========
    console.log(chalk.yellow('\nTest 8: 多个文件变更'));
    try {
      await setupTestRepo(testDir);
      
      // 创建多个修改文件
      await fs.writeFile(path.join(testDir, 'file1.js'), 'console.log(1);\n');
      await fs.writeFile(path.join(testDir, 'file2.css'), '.test { color: red; }\n');
      await fs.writeFile(path.join(testDir, 'file3.html'), '<div>test</div>\n');
      
      execSync('git add .', { cwd: testDir, stdio: 'pipe' });
      
      const result = await runCommand(['-v'], testDir);
      
      if (result.output.includes('file1.js') && 
          result.output.includes('file2.css') && 
          result.output.includes('file3.html')) {
        console.log(chalk.green('✓ 正确处理多个文件变更'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确处理多个文件变更'));
        console.log(chalk.gray('输出:', result.output.substring(0, 200)));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 9: 输出格式验证 ==========
    console.log(chalk.yellow('\nTest 9: 输出格式验证'));
    try {
      await setupTestRepo(testDir);
      
      // 创建修改文件
      await fs.writeFile(path.join(testDir, 'app.js'), 'function test() {}\n');
      execSync('git add app.js', { cwd: testDir, stdio: 'pipe' });
      
      const result = await runCommand([], testDir);
      
      // 检查输出是否包含关键元素（不依赖 AI 生成结果）
      const hasCommitMessage = result.output.includes('commit message') || 
                               result.output.includes('使用方法') ||
                               result.output.includes('git commit -m');
      const hasUsageHint = result.output.includes('git commit -m');
      
      if (hasCommitMessage && hasUsageHint) {
        console.log(chalk.green('✓ 输出格式正确'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 输出格式不正确'));
        console.log(chalk.gray('输出:', result.output.substring(0, 300)));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    // ========== 测试总结 ==========
    console.log(chalk.cyan('\n' + '='.repeat(50)));
    console.log(chalk.cyan('测试总结:'));
    console.log(chalk.green(`通过：${passedTests}`));
    console.log(chalk.red(`失败：${failedTests}`));
    console.log(chalk.cyan('='.repeat(50)));

    if (failedTests > 0) {
      process.exit(1);
    }

  } finally {
    // 清理测试目录
    await cleanupTestDir(testDir);
    console.log(chalk.gray('\n✓ 已清理测试目录'));
  }
}

// 运行测试
runTests().catch((error) => {
  console.error(chalk.red('测试执行出错:'), error);
  process.exit(1);
});
