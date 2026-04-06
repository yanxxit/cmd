#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * 测试 x-git log-server 命令
 */

console.log(chalk.cyan('='.repeat(60)));
console.log(chalk.cyan('Testing x-git log-server command...'));
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
  let passedTests = 0;
  let failedTests = 0;

  try {
    // ========== 测试 1: 帮助信息 ==========
    console.log(chalk.yellow('Test 1: 帮助信息'));
    try {
      const result = await runCommand(['log-server', '--help']);
      const hasOptions = result.output.includes('--port') && 
                         result.output.includes('--host') &&
                         result.output.includes('--open') &&
                         result.output.includes('日志可视化服务器');
      
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

    // ========== 测试 2: 默认端口启动 ==========
    console.log(chalk.yellow('\nTest 2: 默认端口启动'));
    try {
      const serverProcess = spawn('node', [path.resolve(PROJECT_ROOT, 'bin/git.js'), 'log-server'], {
        cwd: PROJECT_ROOT,
        env: { ...process.env }
      });

      let started = false;
      let output = '';

      const timeout = setTimeout(() => {
        if (!started) {
          console.log(chalk.red('✗ 服务器启动超时'));
          failedTests++;
          serverProcess.kill();
        }
      }, 5000);

      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (data.toString().includes('Git 日志服务器已启动') || 
            data.toString().includes('localhost:3000') ||
            data.toString().includes('127.0.0.1:3000')) {
          started = true;
          clearTimeout(timeout);
          console.log(chalk.green('✓ 服务器启动成功'));
          passedTests++;
          serverProcess.kill();
        }
      });

      serverProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      await new Promise((resolve) => {
        serverProcess.on('close', resolve);
        setTimeout(resolve, 6000);
      });

    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(1000);

    // ========== 测试 3: 指定端口启动 ==========
    console.log(chalk.yellow('\nTest 3: 指定端口启动'));
    try {
      const testPort = '3001';
      const serverProcess = spawn('node', [path.resolve(PROJECT_ROOT, 'bin/git.js'), 'log-server', '-p', testPort], {
        cwd: PROJECT_ROOT,
        env: { ...process.env }
      });

      let started = false;
      let output = '';

      const timeout = setTimeout(() => {
        if (!started) {
          console.log(chalk.red('✗ 服务器启动超时'));
          failedTests++;
          serverProcess.kill();
        }
      }, 5000);

      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (data.toString().includes(testPort)) {
          started = true;
          clearTimeout(timeout);
          console.log(chalk.green(`✓ 服务器在端口 ${testPort} 启动成功`));
          passedTests++;
          serverProcess.kill();
        }
      });

      serverProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      await new Promise((resolve) => {
        serverProcess.on('close', resolve);
        setTimeout(resolve, 6000);
      });

    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(1000);

    // ========== 测试 4: 指定主机启动 ==========
    console.log(chalk.yellow('\nTest 4: 指定主机启动'));
    try {
      const serverProcess = spawn('node', [path.resolve(PROJECT_ROOT, 'bin/git.js'), 'log-server', '--host', '0.0.0.0'], {
        cwd: PROJECT_ROOT,
        env: { ...process.env }
      });

      let started = false;
      let output = '';

      const timeout = setTimeout(() => {
        if (!started) {
          console.log(chalk.red('✗ 服务器启动超时'));
          failedTests++;
          serverProcess.kill();
        }
      }, 5000);

      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (data.toString().includes('0.0.0.0') || 
            data.toString().includes('Git 日志服务器已启动')) {
          started = true;
          clearTimeout(timeout);
          console.log(chalk.green('✓ 服务器在 0.0.0.0 启动成功'));
          passedTests++;
          serverProcess.kill();
        }
      });

      serverProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      await new Promise((resolve) => {
        serverProcess.on('close', resolve);
        setTimeout(resolve, 6000);
      });

    } catch (e) {
      console.log(chalk.red('✗ 测试执行失败:', e.message));
      failedTests++;
    }

    await setTimeout(1000);

    // ========== 测试 5: API 端点可用性 ==========
    console.log(chalk.yellow('\nTest 5: API 端点验证'));
    try {
      const axios = await import('axios').catch(() => null);
      
      if (!axios) {
        console.log(chalk.yellow('⚠ axios 未安装，跳过 API 测试'));
        return;
      }

      const testPort = '3002';
      const serverProcess = spawn('node', [path.resolve(PROJECT_ROOT, 'bin/git.js'), 'log-server', '-p', testPort], {
        cwd: PROJECT_ROOT,
        env: { ...process.env }
      });

      let started = false;

      const timeout = setTimeout(async () => {
        if (!started) {
          console.log(chalk.red('✗ 服务器启动超时'));
          failedTests++;
          serverProcess.kill();
        }
      }, 8000);

      serverProcess.stdout.on('data', async (data) => {
        const output = data.toString();
        if (output.includes('Git 日志服务器已启动')) {
          started = true;
          clearTimeout(timeout);

          try {
            const response = await axios.default.get(`http://127.0.0.1:${testPort}/api/commits?date=today`);
            
            if (response.data && response.data.success !== undefined) {
              console.log(chalk.green('✓ API 端点响应正常'));
              passedTests++;
            } else {
              console.log(chalk.red('✗ API 响应格式异常'));
              failedTests++;
            }
          } catch (e) {
            console.log(chalk.red('✗ API 请求失败:', e.message));
            failedTests++;
          } finally {
            serverProcess.kill();
          }
        }
      });

      serverProcess.stderr.on('data', (data) => {
        // 忽略错误输出
      });

      await new Promise((resolve) => {
        serverProcess.on('close', resolve);
        setTimeout(resolve, 9000);
      });

    } catch (e) {
      console.log(chalk.yellow('⚠ API 测试跳过:', e.message));
    }

    await setTimeout(1000);

    // ========== 测试总结 ==========
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan('log-server 命令测试总结:'));
    console.log(chalk.green(`✓ 通过：${passedTests}`));
    console.log(chalk.red(`✗ 失败：${failedTests}`));
    console.log(chalk.cyan('='.repeat(60)));

    if (failedTests > 0) {
      console.log(chalk.yellow('\n部分测试失败'));
    } else {
      console.log(chalk.green('\n所有测试通过！✓'));
    }

  } catch (error) {
    console.error(chalk.red('测试执行出错:'), error);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error(chalk.red('测试执行出错:'), error);
  process.exit(1);
});
