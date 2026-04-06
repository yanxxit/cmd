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
 * 测试 x-git log 命令
 */

console.log(chalk.cyan('='.repeat(60)));
console.log(chalk.cyan('Testing x-git log command...'));
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

  await fs.writeFile(path.join(testDir, 'file1.txt'), 'content 1\n');
  execSync('git add file1.txt', { cwd: testDir, stdio: 'pipe' });
  execSync('git commit -m "Add file1"', { cwd: testDir, stdio: 'pipe' });

  await fs.writeFile(path.join(testDir, 'file2.txt'), 'content 2\n');
  execSync('git add file2.txt', { cwd: testDir, stdio: 'pipe' });
  execSync('git commit -m "Add file2"', { cwd: testDir, stdio: 'pipe' });
}

async function runTests() {
  const testDir = './test-git-log-temp';
  let passedTests = 0;
  let failedTests = 0;

  try {
    // ========== 测试 1: 帮助信息 ==========
    console.log(chalk.yellow('Test 1: 帮助信息'));
    try {
      const result = await runCommand(['log', '--help']);
      const hasOptions = result.output.includes('--date') && 
                         result.output.includes('--since') &&
                         result.output.includes('--month') &&
                         result.output.includes('--format') &&
                         result.output.includes('--mine');
      
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

    // ========== 测试 2: 生成今天的报告 ==========
    console.log(chalk.yellow('\nTest 2: 生成今天的报告'));
    try {
      await setupTestRepo(testDir);
      const outputPath = path.join(testDir, 'test-today.html');
      const result = await runCommand(['log', '-d', 'today', '-o', outputPath], testDir);
      
      try {
        const stats = await fs.stat(outputPath);
        if (stats.isFile() && stats.size > 0) {
          console.log(chalk.green('✓ 成功生成今天的报告'));
          passedTests++;
        } else {
          console.log(chalk.red('✗ 生成的报告文件异常'));
          failedTests++;
        }
      } catch (e) {
        console.log(chalk.red('✗ 报告文件未生成:', e.message));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(1000);

    // ========== 测试 3: 生成昨天的报告 ==========
    console.log(chalk.yellow('\nTest 3: 生成昨天的报告'));
    try {
      await setupTestRepo(testDir);
      const outputPath = path.join(testDir, 'test-yesterday.html');
      const result = await runCommand(['log', '-d', 'yesterday', '-o', outputPath], testDir);
      
      try {
        const stats = await fs.stat(outputPath);
        if (stats.isFile()) {
          console.log(chalk.green('✓ 成功生成昨天的报告'));
          passedTests++;
        } else {
          console.log(chalk.red('✗ 生成的报告文件异常'));
          failedTests++;
        }
      } catch (e) {
        console.log(chalk.red('✗ 报告文件未生成:', e.message));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(1000);

    // ========== 测试 4: 生成 JSON 格式报告 ==========
    console.log(chalk.yellow('\nTest 4: 生成 JSON 格式报告'));
    try {
      await setupTestRepo(testDir);
      const outputPath = path.join(testDir, 'test-report.json');
      const result = await runCommand(['log', '-d', 'today', '-f', 'json', '-o', outputPath], testDir);
      
      try {
        const stats = await fs.stat(outputPath);
        if (stats.isFile()) {
          const content = await fs.readFile(outputPath, 'utf-8');
          const json = JSON.parse(content);
          if (json.success !== undefined) {
            console.log(chalk.green('✓ 成功生成 JSON 格式报告'));
            passedTests++;
          } else {
            console.log(chalk.red('✗ JSON 格式不正确'));
            failedTests++;
          }
        } else {
          console.log(chalk.red('✗ 生成的报告文件异常'));
          failedTests++;
        }
      } catch (e) {
        console.log(chalk.red('✗ 报告文件验证失败:', e.message));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(1000);

    // ========== 测试 5: 生成 Markdown 格式报告 ==========
    console.log(chalk.yellow('\nTest 5: 生成 Markdown 格式报告'));
    try {
      await setupTestRepo(testDir);
      const outputPath = path.join(testDir, 'test-report.md');
      const result = await runCommand(['log', '-d', 'today', '-f', 'md', '-o', outputPath], testDir);
      
      try {
        const stats = await fs.stat(outputPath);
        if (stats.isFile()) {
          console.log(chalk.green('✓ 成功生成 Markdown 格式报告'));
          passedTests++;
        } else {
          console.log(chalk.red('✗ 生成的报告文件异常'));
          failedTests++;
        }
      } catch (e) {
        console.log(chalk.red('✗ 报告文件未生成:', e.message));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(1000);

    // ========== 测试 6: 生成所有格式报告 ==========
    console.log(chalk.yellow('\nTest 6: 生成所有格式报告（html + json + md）'));
    try {
      await setupTestRepo(testDir);
      const outputPath = path.join(testDir, 'test-all.html');
      const result = await runCommand(['log', '-d', 'today', '--all', '-o', outputPath], testDir);
      
      const htmlExists = await fs.stat(path.join(testDir, 'test-all.html')).then(() => true).catch(() => false);
      const jsonExists = await fs.stat(path.join(testDir, 'test-all.json')).then(() => true).catch(() => false);
      const mdExists = await fs.stat(path.join(testDir, 'test-all.md')).then(() => true).catch(() => false);
      
      if (htmlExists && jsonExists && mdExists) {
        console.log(chalk.green('✓ 成功生成所有格式报告'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未生成所有格式报告'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(1000);

    // ========== 测试 7: 日期范围查询 ==========
    console.log(chalk.yellow('\nTest 7: 日期范围查询'));
    try {
      await setupTestRepo(testDir);
      const outputPath = path.join(testDir, 'test-range.html');
      const result = await runCommand([
        'log', 
        '--since', '2020-01-01', 
        '--until', '2030-12-31',
        '-o', outputPath
      ], testDir);
      
      try {
        const stats = await fs.stat(outputPath);
        if (stats.isFile()) {
          console.log(chalk.green('✓ 日期范围查询成功'));
          passedTests++;
        } else {
          console.log(chalk.red('✗ 生成的报告文件异常'));
          failedTests++;
        }
      } catch (e) {
        console.log(chalk.red('✗ 报告文件未生成:', e.message));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(1000);

    // ========== 测试 8: 月度视图 ==========
    console.log(chalk.yellow('\nTest 8: 月度视图'));
    try {
      await setupTestRepo(testDir);
      const outputPath = path.join(testDir, 'test-month.html');
      const result = await runCommand(['log', '--month', '-o', outputPath], testDir);
      
      try {
        const stats = await fs.stat(outputPath);
        if (stats.isFile()) {
          console.log(chalk.green('✓ 月度视图生成成功'));
          passedTests++;
        } else {
          console.log(chalk.red('✗ 生成的报告文件异常'));
          failedTests++;
        }
      } catch (e) {
        console.log(chalk.red('✗ 报告文件未生成:', e.message));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(1000);

    // ========== 测试 9: 输出摘要信息 ==========
    console.log(chalk.yellow('\nTest 9: 输出摘要信息'));
    try {
      await setupTestRepo(testDir);
      const outputPath = path.join(testDir, 'test-summary.html');
      const result = await runCommand(['log', '-d', 'today', '-o', outputPath], testDir);
      
      const hasSummary = result.output.includes('提交摘要') || 
                         result.output.includes('提交数') ||
                         result.output.includes('修改文件');
      
      if (hasSummary) {
        console.log(chalk.green('✓ 输出包含摘要信息'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 输出缺少摘要信息'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试总结 ==========
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan('log 命令测试总结:'));
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
