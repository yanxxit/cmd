#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { setTimeout } from 'timers/promises';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * 测试统一的 x-git 命令
 */

console.log(chalk.cyan('='.repeat(60)));
console.log(chalk.cyan('Testing x-git unified command...'));
console.log(chalk.cyan('='.repeat(60)) + '\n');

/**
 * 执行命令并获取输出
 */
async function runCommand(args, cwd = PROJECT_ROOT) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(PROJECT_ROOT, 'bin/git.js');
    const testProcess = spawn('node', [scriptPath, ...args], {
      cwd,
      env: { ...process.env }
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
 * 清理测试目录
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

async function runTests() {
  const testDir = './test-git-temp';
  let passedTests = 0;
  let failedTests = 0;
  const testResults = [];

  try {
    // ========== 测试 1: 主帮助信息 ==========
    console.log(chalk.yellow('Test 1: 主帮助信息'));
    try {
      const result = await runCommand(['--help']);
      const hasCommands = result.output.includes('clone') && 
                          result.output.includes('commit') && 
                          result.output.includes('log') &&
                          result.output.includes('log-server') &&
                          result.output.includes('sparse');
      
      if (hasCommands) {
        console.log(chalk.green('✓ 主帮助信息显示所有命令'));
        passedTests++;
        testResults.push({ name: '主帮助信息', passed: true });
      } else {
        console.log(chalk.red('✗ 主帮助信息缺少命令'));
        console.log(chalk.gray('输出:', result.output.substring(0, 200)));
        failedTests++;
        testResults.push({ name: '主帮助信息', passed: false });
      }
    } catch (e) {
      console.log(chalk.red('✗ 帮助命令执行失败:', e.message));
      failedTests++;
      testResults.push({ name: '主帮助信息', passed: false, error: e.message });
    }

    await setTimeout(500);

    // ========== 测试 2: 版本号 ==========
    console.log(chalk.yellow('\nTest 2: 版本号显示'));
    try {
      const result = await runCommand(['--version']);
      if (result.output.includes('1.0.0')) {
        console.log(chalk.green('✓ 版本号显示正确'));
        passedTests++;
        testResults.push({ name: '版本号显示', passed: true });
      } else {
        console.log(chalk.red('✗ 版本号显示不正确'));
        failedTests++;
        testResults.push({ name: '版本号显示', passed: false });
      }
    } catch (e) {
      console.log(chalk.red('✗ 版本命令执行失败:', e.message));
      failedTests++;
      testResults.push({ name: '版本号显示', passed: false, error: e.message });
    }

    await setTimeout(500);

    // ========== 测试 3: clone 命令帮助 ==========
    console.log(chalk.yellow('\nTest 3: clone 命令帮助'));
    try {
      const result = await runCommand(['clone', '--help']);
      const hasCloneOptions = result.output.includes('--branch') && 
                              result.output.includes('--mirror') &&
                              result.output.includes('--depth');
      
      if (hasCloneOptions) {
        console.log(chalk.green('✓ clone 命令帮助信息正确'));
        passedTests++;
        testResults.push({ name: 'clone 命令帮助', passed: true });
      } else {
        console.log(chalk.red('✗ clone 命令帮助信息不完整'));
        failedTests++;
        testResults.push({ name: 'clone 命令帮助', passed: false });
      }
    } catch (e) {
      console.log(chalk.red('✗ clone 帮助命令执行失败:', e.message));
      failedTests++;
      testResults.push({ name: 'clone 命令帮助', passed: false, error: e.message });
    }

    await setTimeout(500);

    // ========== 测试 4: commit 命令帮助 ==========
    console.log(chalk.yellow('\nTest 4: commit 命令帮助'));
    try {
      const result = await runCommand(['commit', '--help']);
      const hasCommitOptions = result.output.includes('--staged') && 
                               result.output.includes('--all') &&
                               result.output.includes('--type') &&
                               result.output.includes('--interactive');
      
      if (hasCommitOptions) {
        console.log(chalk.green('✓ commit 命令帮助信息正确'));
        passedTests++;
        testResults.push({ name: 'commit 命令帮助', passed: true });
      } else {
        console.log(chalk.red('✗ commit 命令帮助信息不完整'));
        failedTests++;
        testResults.push({ name: 'commit 命令帮助', passed: false });
      }
    } catch (e) {
      console.log(chalk.red('✗ commit 帮助命令执行失败:', e.message));
      failedTests++;
      testResults.push({ name: 'commit 命令帮助', passed: false, error: e.message });
    }

    await setTimeout(500);

    // ========== 测试 5: log 命令帮助 ==========
    console.log(chalk.yellow('\nTest 5: log 命令帮助'));
    try {
      const result = await runCommand(['log', '--help']);
      const hasLogOptions = result.output.includes('--date') && 
                            result.output.includes('--since') &&
                            result.output.includes('--month') &&
                            result.output.includes('--format');
      
      if (hasLogOptions) {
        console.log(chalk.green('✓ log 命令帮助信息正确'));
        passedTests++;
        testResults.push({ name: 'log 命令帮助', passed: true });
      } else {
        console.log(chalk.red('✗ log 命令帮助信息不完整'));
        failedTests++;
        testResults.push({ name: 'log 命令帮助', passed: false });
      }
    } catch (e) {
      console.log(chalk.red('✗ log 帮助命令执行失败:', e.message));
      failedTests++;
      testResults.push({ name: 'log 命令帮助', passed: false, error: e.message });
    }

    await setTimeout(500);

    // ========== 测试 6: log-server 命令帮助 ==========
    console.log(chalk.yellow('\nTest 6: log-server 命令帮助'));
    try {
      const result = await runCommand(['log-server', '--help']);
      const hasServerOptions = result.output.includes('--port') && 
                               result.output.includes('--host') &&
                               result.output.includes('--open');
      
      if (hasServerOptions) {
        console.log(chalk.green('✓ log-server 命令帮助信息正确'));
        passedTests++;
        testResults.push({ name: 'log-server 命令帮助', passed: true });
      } else {
        console.log(chalk.red('✗ log-server 命令帮助信息不完整'));
        failedTests++;
        testResults.push({ name: 'log-server 命令帮助', passed: false });
      }
    } catch (e) {
      console.log(chalk.red('✗ log-server 帮助命令执行失败:', e.message));
      failedTests++;
      testResults.push({ name: 'log-server 命令帮助', passed: false, error: e.message });
    }

    await setTimeout(500);

    // ========== 测试 7: sparse 命令帮助 ==========
    console.log(chalk.yellow('\nTest 7: sparse 命令帮助'));
    try {
      const result = await runCommand(['sparse', '--help']);
      const hasSparseOptions = result.output.includes('--repo-url') && 
                               result.output.includes('--target-path') &&
                               result.output.includes('--output-dir');
      
      if (hasSparseOptions) {
        console.log(chalk.green('✓ sparse 命令帮助信息正确'));
        passedTests++;
        testResults.push({ name: 'sparse 命令帮助', passed: true });
      } else {
        console.log(chalk.red('✗ sparse 命令帮助信息不完整'));
        failedTests++;
        testResults.push({ name: 'sparse 命令帮助', passed: false });
      }
    } catch (e) {
      console.log(chalk.red('✗ sparse 帮助命令执行失败:', e.message));
      failedTests++;
      testResults.push({ name: 'sparse 命令帮助', passed: false, error: e.message });
    }

    await setTimeout(500);

    // ========== 测试 8: commit 命令 - 非 Git 仓库错误 ==========
    console.log(chalk.yellow('\nTest 8: commit 命令 - 非 Git 仓库错误处理'));
    try {
      const os = await import('os');
      const nonGitDir = await fs.mkdtemp(path.join(os.tmpdir(), 'non-git-'));
      const result = await runCommand(['commit'], nonGitDir);
      
      const hasError = result.error.includes('当前目录不是 Git 仓库') || 
                       result.output.includes('当前目录不是 Git 仓库') ||
                       result.code === 1;
      
      if (hasError) {
        console.log(chalk.green('✓ 正确识别非 Git 仓库'));
        passedTests++;
        testResults.push({ name: '非 Git 仓库错误处理', passed: true });
      } else {
        console.log(chalk.red('✗ 未正确识别非 Git 仓库'));
        failedTests++;
        testResults.push({ name: '非 Git 仓库错误处理', passed: false });
      }
      
      await fs.rm(nonGitDir, { recursive: true, force: true });
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
      testResults.push({ name: '非 Git 仓库错误处理', passed: false, error: e.message });
    }

    await setTimeout(500);

    // ========== 测试 9: commit 命令 - 暂存区无变更 ==========
    console.log(chalk.yellow('\nTest 9: commit 命令 - 暂存区无变更'));
    try {
      await setupTestRepo(testDir);
      const result = await runCommand(['commit'], testDir);
      
      const hasNoChange = result.output.includes('暂存区没有变更') || 
                          result.output.includes('没有变更') ||
                          result.output.includes('git add');
      
      if (hasNoChange) {
        console.log(chalk.green('✓ 正确处理暂存区无变更情况'));
        passedTests++;
        testResults.push({ name: '暂存区无变更', passed: true });
      } else {
        console.log(chalk.red('✗ 未正确处理暂存区无变更'));
        failedTests++;
        testResults.push({ name: '暂存区无变更', passed: false });
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
      testResults.push({ name: '暂存区无变更', passed: false, error: e.message });
    }

    await setTimeout(500);

    // ========== 测试 10: commit 命令 - 有暂存区变更 ==========
    console.log(chalk.yellow('\nTest 10: commit 命令 - 有暂存区变更'));
    try {
      await setupTestRepo(testDir);
      
      await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("hello");\n');
      execSync('git add test.js', { cwd: testDir, stdio: 'pipe' });
      
      const result = await runCommand(['commit', '--no-api'], testDir);
      
      if (result.output.includes('test.js') || result.output.includes('变更统计')) {
        console.log(chalk.green('✓ 正确识别暂存区变更'));
        passedTests++;
        testResults.push({ name: '有暂存区变更', passed: true });
      } else {
        console.log(chalk.red('✗ 未正确识别暂存区变更'));
        failedTests++;
        testResults.push({ name: '有暂存区变更', passed: false });
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
      testResults.push({ name: '有暂存区变更', passed: false, error: e.message });
    }

    await setTimeout(500);

    // ========== 测试 11: log 命令 - 基本执行 ==========
    console.log(chalk.yellow('\nTest 11: log 命令 - 基本执行'));
    try {
      await setupTestRepo(testDir);
      
      // 创建一些提交历史
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content 1\n');
      execSync('git add file1.txt', { cwd: testDir, stdio: 'pipe' });
      execSync('git commit -m "Add file1"', { cwd: testDir, stdio: 'pipe' });
      
      const outputPath = path.resolve(testDir, 'test-log.html');
      const result = await runCommand(['log', '-d', 'today', '-o', outputPath], testDir);
      
      // 检查是否生成了文件
      try {
        const stats = await fs.stat(outputPath);
        if (stats.isFile()) {
          console.log(chalk.green('✓ log 命令生成报告成功'));
          passedTests++;
          testResults.push({ name: 'log 命令基本执行', passed: true });
        } else {
          console.log(chalk.red('✗ 生成的报告文件异常'));
          failedTests++;
          testResults.push({ name: 'log 命令基本执行', passed: false });
        }
      } catch (e) {
        console.log(chalk.red('✗ 报告文件未生成:', e.message));
        console.log(chalk.gray('输出:', result.output.substring(0, 300)));
        failedTests++;
        testResults.push({ name: 'log 命令基本执行', passed: false, error: e.message });
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
      testResults.push({ name: 'log 命令基本执行', passed: false, error: e.message });
    }

    await setTimeout(500);

    // ========== 测试总结 ==========
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan('测试总结:'));
    console.log(chalk.green(`✓ 通过：${passedTests}`));
    console.log(chalk.red(`✗ 失败：${failedTests}`));
    console.log(chalk.cyan('='.repeat(60)));

    console.log(chalk.cyan('\n详细测试结果:'));
    testResults.forEach((test, index) => {
      const icon = test.passed ? '✓' : '✗';
      const color = test.passed ? chalk.green : chalk.red;
      console.log(`  ${color(icon)} ${index + 1}. ${test.name}`);
      if (!test.passed && test.error) {
        console.log(chalk.gray(`     错误：${test.error}`));
      }
    });

    if (failedTests > 0) {
      console.log(chalk.yellow('\n部分测试失败，请检查输出信息'));
      process.exit(1);
    } else {
      console.log(chalk.green('\n所有测试通过！✓'));
    }

  } finally {
    await cleanupTestDir(testDir);
    console.log(chalk.gray('\n✓ 已清理测试目录'));
  }
}

// 运行测试
runTests().catch((error) => {
  console.error(chalk.red('测试执行出错:'), error);
  process.exit(1);
});
