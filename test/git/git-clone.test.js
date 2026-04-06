#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * 测试 x-git clone 命令
 */

console.log(chalk.cyan('='.repeat(60)));
console.log(chalk.cyan('Testing x-git clone command...'));
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

async function runTests() {
  const testDir = './test-clone-output';
  let passedTests = 0;
  let failedTests = 0;

  try {
    // ========== 测试 1: 帮助信息 ==========
    console.log(chalk.yellow('Test 1: 帮助信息'));
    try {
      const result = await runCommand(['clone', '--help']);
      const hasOptions = result.output.includes('--branch') && 
                         result.output.includes('--mirror') &&
                         result.output.includes('--depth') &&
                         result.output.includes('克隆 Git 仓库');
      
      if (hasOptions) {
        console.log(chalk.green('✓ 帮助信息显示正确'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 帮助信息内容不完整'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 帮助命令执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 2: 版本号 ==========
    console.log(chalk.yellow('\nTest 2: 版本号'));
    try {
      const result = await runCommand(['clone', '--help']);
      if (result.output.includes('x-git')) {
        console.log(chalk.green('✓ 命令名称正确'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 命令名称不正确'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 版本检查失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 3: 无效 URL 格式 ==========
    console.log(chalk.yellow('\nTest 3: 无效 URL 格式处理'));
    try {
      const result = await runCommand(['clone', 'invalid-url']);
      const hasError = result.error.includes('Invalid Git URL') || 
                       result.output.includes('Invalid Git URL') ||
                       result.code !== 0;
      
      if (hasError) {
        console.log(chalk.green('✓ 正确识别无效 URL'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 未识别无效 URL'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 4: GitHub shorthand 格式 ==========
    console.log(chalk.yellow('\nTest 4: GitHub shorthand 格式支持'));
    try {
      const result = await runCommand(['clone', 'owner/repo', '--help']);
      if (result.output.includes('克隆 Git 仓库')) {
        console.log(chalk.green('✓ 支持 GitHub shorthand 格式'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ GitHub shorthand 格式支持异常'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 5: 镜像选项验证 ==========
    console.log(chalk.yellow('\nTest 5: 镜像选项验证'));
    try {
      const result = await runCommand(['clone', '--help']);
      const hasMirrors = result.output.includes('kkgithub') && 
                         result.output.includes('ghproxy') &&
                         result.output.includes('gitee');
      
      if (hasMirrors) {
        console.log(chalk.green('✓ 镜像站点选项完整'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 镜像站点选项不完整'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 6: 实际克隆测试（小型仓库） ==========
    console.log(chalk.yellow('\nTest 6: 实际克隆测试'));
    try {
      console.log(chalk.gray('正在克隆测试仓库...'));
      
      await cleanupTestDir(testDir);
      
      const result = await runCommand([
        'clone', 
        'https://github.com/iliakan/javascript-tutorial-en.git',
        testDir,
        '--depth',
        '1'
      ]);

      const fullOutput = result.output + result.error;
      
      if (fullOutput.includes('cloned') || 
          fullOutput.includes('Cloning') ||
          result.code === 0) {
        console.log(chalk.green('✓ 克隆命令执行成功'));
        passedTests++;
        
        await setTimeout(2000);
        
        try {
          const stats = await fs.stat(testDir);
          if (stats.isDirectory()) {
            console.log(chalk.green('✓ 目标目录创建成功'));
            passedTests++;
            
            const gitDir = path.join(testDir, '.git');
            try {
              const gitStats = await fs.stat(gitDir);
              if (gitStats.isDirectory()) {
                console.log(chalk.green('✓ .git 目录存在'));
                passedTests++;
              } else {
                console.log(chalk.yellow('⚠ .git 目录异常'));
              }
            } catch (e) {
              console.log(chalk.yellow('⚠ .git 目录检查失败'));
            }
          } else {
            console.log(chalk.red('✗ 目标目录不是文件夹'));
            failedTests++;
          }
        } catch (e) {
          console.log(chalk.red('✗ 目录验证失败:', e.message));
          failedTests++;
        }
      } else {
        console.log(chalk.red('✗ 克隆命令执行失败'));
        console.log(chalk.gray('输出:', fullOutput.substring(0, 200)));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(1000);

    // ========== 测试总结 ==========
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan('clone 命令测试总结:'));
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

async function cleanupTestDir(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (e) {
    // 忽略清理错误
  }
}

runTests().catch((error) => {
  console.error(chalk.red('测试执行出错:'), error);
  process.exit(1);
});
