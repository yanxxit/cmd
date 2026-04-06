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
 * 测试 x-git commit 命令
 */

console.log(chalk.cyan('='.repeat(60)));
console.log(chalk.cyan('Testing x-git commit command...'));
console.log(chalk.cyan('='.repeat(60)) + '\n');

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

async function cleanupTestDir(testDir) {
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (e) {
    // 忽略清理错误
  }
}

async function setupTestRepo(testDir) {
  await cleanupTestDir(testDir);
  await fs.mkdir(testDir, { recursive: true });

  execSync('git init', { cwd: testDir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { cwd: testDir, stdio: 'pipe' });

  await fs.writeFile(path.join(testDir, 'README.md'), '# Test Repo\n');
  execSync('git add README.md', { cwd: testDir, stdio: 'pipe' });
  execSync('git commit -m "Initial commit"', { cwd: testDir, stdio: 'pipe' });
}

async function runTests() {
  const testDir = './test-git-commit-temp';
  let passedTests = 0;
  let failedTests = 0;

  try {
    // ========== 测试 1: 帮助信息 ==========
    console.log(chalk.yellow('Test 1: 帮助信息'));
    try {
      const result = await runCommand(['commit', '--help']);
      const hasOptions = result.output.includes('--staged') && 
                         result.output.includes('--all') &&
                         result.output.includes('--type') &&
                         result.output.includes('--interactive') &&
                         result.output.includes('--no-api');
      
      if (hasOptions) {
        console.log(chalk.green('✓ 帮助信息完整'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 帮助信息不完整'));
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
      const os = await import('os');
      const nonGitDir = await fs.mkdtemp(path.join(os.tmpdir(), 'non-git-'));
      const result = await runCommand(['commit'], nonGitDir);
      
      const hasError = result.error.includes('当前目录不是 Git 仓库') || 
                       result.output.includes('当前目录不是 Git 仓库') ||
                       result.code === 1;
      
      if (hasError) {
        console.log(chalk.green('✓ 正确识别非 Git 仓库'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确识别非 Git 仓库'));
        failedTests++;
      }
      
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
      const result = await runCommand(['commit'], testDir);
      
      const hasNoChange = result.output.includes('暂存区没有变更') || 
                          result.output.includes('没有变更') ||
                          result.output.includes('git add');
      
      if (hasNoChange) {
        console.log(chalk.green('✓ 正确处理暂存区无变更'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确处理暂存区无变更'));
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
      const result = await runCommand(['commit', '-a'], testDir);

      const fullOutput = (result.output + result.error)
        .replace(/\x1b\[[0-9;]*m/g, '')
        .trim();
      
      if (fullOutput.includes('没有') && fullOutput.includes('变更')) {
        console.log(chalk.green('✓ 正确处理工作区无变更'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确处理工作区无变更'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 5: 有暂存区变更（不使用 AI） ==========
    console.log(chalk.yellow('\nTest 5: 有暂存区变更（--no-api）'));
    try {
      await setupTestRepo(testDir);
      
      await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("hello");\n');
      execSync('git add test.js', { cwd: testDir, stdio: 'pipe' });
      
      const result = await runCommand(['commit', '--no-api'], testDir);
      
      if (result.output.includes('test.js') || result.output.includes('变更统计')) {
        console.log(chalk.green('✓ 正确识别暂存区变更'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确识别暂存区变更'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 6: 有工作区变更（不使用 AI） ==========
    console.log(chalk.yellow('\nTest 6: 有工作区变更（--no-api）'));
    try {
      await setupTestRepo(testDir);
      
      await fs.writeFile(path.join(testDir, 'feature.js'), 'const x = 1;\n');
      
      const result = await runCommand(['commit', '-a', '--no-api'], testDir);
      
      const fullOutput = result.output + result.error;
      
      if (fullOutput.includes('feature.js') || fullOutput.includes('变更统计')) {
        console.log(chalk.green('✓ 正确识别工作区变更'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确识别工作区变更'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 7: 详细模式 ==========
    console.log(chalk.yellow('\nTest 7: 详细模式显示文件列表'));
    try {
      await setupTestRepo(testDir);
      
      await fs.writeFile(path.join(testDir, 'stats.js'), 'console.log(1);\nconsole.log(2);\nconsole.log(3);\n');
      execSync('git add stats.js', { cwd: testDir, stdio: 'pipe' });
      
      const result = await runCommand(['commit', '-v', '--no-api'], testDir);
      
      const fullOutput = result.output + result.error;
      const hasFileList = fullOutput.includes('变更文件') || 
                          fullOutput.includes('stats.js');
      
      if (hasFileList) {
        console.log(chalk.green('✓ 详细模式显示文件列表'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 详细模式未显示文件列表'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 8: 多个文件变更 ==========
    console.log(chalk.yellow('\nTest 8: 多个文件变更'));
    try {
      await setupTestRepo(testDir);
      
      await fs.writeFile(path.join(testDir, 'file1.js'), 'console.log(1);\n');
      await fs.writeFile(path.join(testDir, 'file2.css'), '.test { color: red; }\n');
      await fs.writeFile(path.join(testDir, 'file3.html'), '<div>test</div>\n');
      
      execSync('git add .', { cwd: testDir, stdio: 'pipe' });
      
      const result = await runCommand(['commit', '--no-api'], testDir);
      
      const fullOutput = result.output + result.error;
      if (fullOutput.includes('file1.js') && 
          fullOutput.includes('file2.css') && 
          fullOutput.includes('file3.html')) {
        console.log(chalk.green('✓ 正确处理多个文件变更'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确处理多个文件变更'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 9: 指定 type 选项 ==========
    console.log(chalk.yellow('\nTest 9: 指定 type 选项'));
    try {
      await setupTestRepo(testDir);
      
      await fs.writeFile(path.join(testDir, 'fix.js'), 'const x = 1;\n');
      execSync('git add fix.js', { cwd: testDir, stdio: 'pipe' });
      
      const result = await runCommand(['commit', '--type', 'fix', '--no-api'], testDir);
      
      const fullOutput = result.output + result.error;
      if (fullOutput.includes('fix')) {
        console.log(chalk.green('✓ 正确应用指定 type'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未正确应用指定 type'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 10: 输出格式验证 ==========
    console.log(chalk.yellow('\nTest 10: 输出格式验证'));
    try {
      await setupTestRepo(testDir);
      
      await fs.writeFile(path.join(testDir, 'app.js'), 'function test() {}\n');
      execSync('git add app.js', { cwd: testDir, stdio: 'pipe' });
      
      const result = await runCommand(['commit', '--no-api'], testDir);
      
      const hasUsageHint = result.output.includes('使用方法') || 
                           result.output.includes('git commit -m');
      
      if (hasUsageHint) {
        console.log(chalk.green('✓ 输出格式正确'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 输出格式不正确'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试总结 ==========
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan('commit 命令测试总结:'));
    console.log(chalk.green(`✓ 通过：${passedTests}`));
    console.log(chalk.red(`✗ 失败：${failedTests}`));
    console.log(chalk.cyan('='.repeat(60)));

    if (failedTests > 0) {
      console.log(chalk.yellow('\n部分测试失败'));
    } else {
      console.log(chalk.green('\n所有测试通过！✓'));
    }

  } finally {
    await cleanupTestDir(testDir);
    console.log(chalk.gray('\n✓ 已清理测试目录'));
  }
}

runTests().catch((error) => {
  console.error(chalk.red('测试执行出错:'), error);
  process.exit(1);
});
