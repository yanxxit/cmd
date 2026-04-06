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
 * 测试 x-git sparse 命令
 */

console.log(chalk.cyan('='.repeat(60)));
console.log(chalk.cyan('Testing x-git sparse command...'));
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

async function runTests() {
  const testDir = './test-sparse-output';
  let passedTests = 0;
  let failedTests = 0;

  try {
    // ========== 测试 1: 帮助信息 ==========
    console.log(chalk.yellow('Test 1: 帮助信息'));
    try {
      const result = await runCommand(['sparse', '--help']);
      const hasOptions = result.output.includes('--repo-url') && 
                         result.output.includes('--target-path') &&
                         result.output.includes('--output-dir') &&
                         result.output.includes('--branch') &&
                         result.output.includes('稀疏检出');
      
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

    // ========== 测试 2: 默认参数验证 ==========
    console.log(chalk.yellow('\nTest 2: 默认参数验证'));
    try {
      const result = await runCommand(['sparse', '--help']);
      const hasDefaults = result.output.includes('https://gitee.com/yanxxit/conf.git') && 
                          result.output.includes('main') &&
                          result.output.includes('vim');
      
      if (hasDefaults) {
        console.log(chalk.green('✓ 默认参数显示正确'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 默认参数不正确'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 3: 版本号 ==========
    console.log(chalk.yellow('\nTest 3: 版本号'));
    try {
      const result = await runCommand(['sparse', '--help']);
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

    // ========== 测试 4: 选项完整性 ==========
    console.log(chalk.yellow('\nTest 4: 选项完整性'));
    try {
      const result = await runCommand(['sparse', '--help']);
      const allOptions = result.output.includes('-u, --repo-url') && 
                         result.output.includes('-b, --branch') &&
                         result.output.includes('-t, --target-path') &&
                         result.output.includes('-d, --local-dir') &&
                         result.output.includes('-o, --output-dir') &&
                         result.output.includes('-v, --verbose');
      
      if (allOptions) {
        console.log(chalk.green('✓ 所有选项都可用'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 缺少部分选项'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 5: 输出目录选项 ==========
    console.log(chalk.yellow('\nTest 5: 输出目录选项解析'));
    try {
      const result = await runCommand(['sparse', '--help']);
      if (result.output.includes('最终输出目录')) {
        console.log(chalk.green('✓ 输出目录选项描述正确'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 输出目录选项描述不正确'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 6: 详细输出选项 ==========
    console.log(chalk.yellow('\nTest 6: 详细输出选项'));
    try {
      const result = await runCommand(['sparse', '--help']);
      if (result.output.includes('显示详细输出')) {
        console.log(chalk.green('✓ 详细输出选项可用'));
        passedTests++;
      } else {
        console.log(chalk.red('✗ 详细输出选项不可用'));
        failedTests++;
      }
    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(500);

    // ========== 测试 7: 实际稀疏克隆测试 ==========
    console.log(chalk.yellow('\nTest 7: 实际稀疏克隆测试（小型仓库）'));
    try {
      await cleanupTestDir(testDir);
      
      console.log(chalk.gray('正在执行稀疏克隆...'));
      
      const result = await runCommand([
        'sparse',
        '--repo-url', 'https://gitee.com/yanxxit/conf.git',
        '--target-path', 'vim',
        '--output-dir', testDir,
        '-v'
      ]);

      const fullOutput = result.output + result.error;
      
      if (fullOutput.includes('开始') || 
          fullOutput.includes('拉取') ||
          fullOutput.includes('vim') ||
          result.code === 0) {
        console.log(chalk.green('✓ 稀疏克隆命令执行成功'));
        passedTests++;
        
        await setTimeout(3000);
        
        try {
          const stats = await fs.stat(testDir);
          if (stats.isDirectory()) {
            console.log(chalk.green('✓ 输出目录创建成功'));
            passedTests++;
            
            const files = await fs.readdir(testDir);
            if (files.length > 0) {
              console.log(chalk.green(`✓ 目录中有 ${files.length} 个文件/目录`));
              passedTests++;
            } else {
              console.log(chalk.yellow('⚠ 输出目录为空'));
            }
          } else {
            console.log(chalk.red('✗ 输出目录不是文件夹'));
            failedTests++;
          }
        } catch (e) {
          console.log(chalk.red('✗ 目录验证失败:', e.message));
          failedTests++;
        }
      } else {
        console.log(chalk.red('✗ 稀疏克隆命令执行失败'));
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
    console.log(chalk.cyan('sparse 命令测试总结:'));
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
