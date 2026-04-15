#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import http from 'http';

/**
 * 统一的端口管理工具
 */

program
  .name('x-port')
  .description('统一的端口管理工具 - 查询、关闭、扫描端口')
  .version('1.0.0');

// who 子命令 - 查询端口
program
  .command('who <port>')
  .description('查询占用指定端口的服务详细信息')
  .option('-j, --json', '以 JSON 格式输出')
  .option('-v, --verbose', '显示更详细的信息')
  .action((port, options) => {
    try {
      const portNum = parseInt(port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        console.error(chalk.red('❌ 错误：端口号必须是 1-65535 之间的数字'));
        process.exit(1);
      }

      console.log(chalk.cyan(`\n🔍 查询端口 ${portNum} 的占用情况...`));
      
      try {
        const output = execSync(`lsof -ti:${portNum}`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore']
        });
        
        if (output.trim()) {
          const pids = output.trim().split('\n');
          console.log(chalk.green(`\n✅ 端口 ${portNum} 被占用:`));
          console.log(chalk.gray('─'.repeat(60)));
          
          for (const pid of pids) {
            const psOutput = execSync(`ps -p ${pid} -o pid,command,user`, {
              encoding: 'utf-8',
              stdio: ['pipe', 'pipe', 'ignore']
            });
            
            const lines = psOutput.trim().split('\n');
            if (lines.length >= 2) {
              const values = lines[1].trim().split(/\s+/);
              console.log(chalk.yellow(`  PID: ${values[0]}`));
              console.log(chalk.yellow(`  命令：${values[1]}`));
              console.log(chalk.yellow(`  用户：${values[2]}`));
              console.log(chalk.gray('─'.repeat(60)));
            }
          }
          
          console.log(chalk.cyan(`\n📊 共 ${pids.length} 个进程占用端口 ${portNum}`));
        } else {
          console.log(chalk.green(`\n✅ 端口 ${portNum} 未被占用`));
        }
      } catch {
        console.log(chalk.green(`\n✅ 端口 ${portNum} 未被占用`));
      }
    } catch (err) {
      console.error(chalk.red(`❌ 错误：${err.message}`));
      process.exit(1);
    }
  });

// kill 子命令 - 关闭端口
program
  .command('kill <port>')
  .description('关闭占用指定端口的进程')
  .option('-f, --force', '强制关闭，不确认提示')
  .action(async (port, options) => {
    try {
      const portNum = parseInt(port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        console.error(chalk.red('❌ 错误：端口号必须是 1-65535 之间的数字'));
        process.exit(1);
      }

      console.log(chalk.cyan(`\n🔍 正在查找占用端口 ${portNum} 的进程...`));
      
      let pids = [];
      try {
        const output = execSync(`lsof -ti:${portNum}`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore']
        });
        pids = output.trim().split('\n').filter(Boolean);
      } catch {
        console.log(chalk.green(`\n✅ 端口 ${portNum} 未被占用，无需关闭`));
        process.exit(0);
      }
      
      if (pids.length === 0) {
        console.log(chalk.green(`\n✅ 端口 ${portNum} 未被占用，无需关闭`));
        process.exit(0);
      }

      console.log(chalk.yellow(`\n💀 找到 ${pids.length} 个进程占用端口 ${portNum}:`));
      for (const pid of pids) {
        console.log(chalk.gray(`  - PID ${pid}`));
      }

      // 非强制模式需要确认
      if (!options.force) {
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        await new Promise((resolve) => {
          rl.question(chalk.yellow('\n⚠️  确认要关闭这些进程吗？(y/N): '), (answer) => {
            rl.close();
            if (answer.toLowerCase() !== 'y') {
              console.log(chalk.gray('已取消操作'));
              process.exit(0);
            }
            resolve();
          });
        });
      }

      // 关闭进程
      console.log(chalk.cyan('\n💀 正在关闭进程...'));
      let successCount = 0;
      
      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          successCount++;
        } catch {
          // 忽略错误
        }
      }

      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.green(`\n✅ 成功关闭 ${successCount}/${pids.length} 个进程`));
      console.log(chalk.green(`✅ 端口 ${portNum} 已释放`));
      
    } catch (err) {
      console.error(chalk.red(`❌ 错误：${err.message}`));
      process.exit(1);
    }
  });

// scan 子命令 - 扫描端口
program
  .command('scan [start] [end]')
  .description('扫描指定范围内的端口占用情况')
  .option('-j, --json', '以 JSON 格式输出')
  .option('-q, --quiet', '安静模式，不显示进度')
  .option('-o, --only-occupied', '只显示占用端口')
  .action((start = '3000', end = '3010', options) => {
    try {
      const startPort = parseInt(start);
      const endPort = parseInt(end);

      if (isNaN(startPort) || isNaN(endPort)) {
        console.error(chalk.red('❌ 错误：端口号必须是数字'));
        process.exit(1);
      }

      if (startPort < 1 || startPort > 65535 || endPort < 1 || endPort > 65535) {
        console.error(chalk.red('❌ 错误：端口号必须在 1-65535 之间'));
        process.exit(1);
      }

      if (startPort > endPort) {
        console.error(chalk.red('❌ 错误：起始端口不能大于结束端口'));
        process.exit(1);
      }

      console.log(chalk.cyan('\n🔍 开始扫描端口范围:') + chalk.yellow(` ${startPort} - ${endPort}`));
      console.log(chalk.cyan('📊 端口总数:') + chalk.yellow(` ${endPort - startPort + 1}`));
      console.log(chalk.gray('─'.repeat(60)));

      const results = [];
      const total = endPort - startPort + 1;

      for (let port = startPort; port <= endPort; port++) {
        let isOccupied = false;
        let pids = [];

        try {
          const output = execSync(`lsof -ti:${port}`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
          });
          if (output.trim()) {
            isOccupied = true;
            pids = output.trim().split('\n').filter(Boolean);
          }
        } catch {
          isOccupied = false;
        }

        results.push({ port, isOccupied, pids });

        // 显示进度
        if (!options.quiet && !options.json) {
          const percent = Math.floor(((port - startPort + 1) / total) * 100);
          const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
          process.stdout.write(`\r[${bar}] ${percent}% (${port - startPort + 1}/${total})`);
        }
      }

      if (!options.quiet && !options.json) {
        console.log('\n');
      }

      // 输出结果
      if (options.json) {
        const jsonOutput = {
          startPort,
          endPort,
          total,
          results: results.filter(r => !options.onlyOccupied || r.isOccupied),
          summary: {
            occupied: results.filter(r => r.isOccupied).length,
            free: results.filter(r => !r.isOccupied).length
          }
        };
        console.log(JSON.stringify(jsonOutput, null, 2));
      } else {
        const occupied = results.filter(r => r.isOccupied);
        const free = results.filter(r => !r.isOccupied);

        if (options.onlyOccupied && occupied.length === 0) {
          console.log(chalk.green('\n✅ 没有找到占用的端口'));
        } else {
          console.log(chalk.cyan(`\n📊 扫描结果汇总:`));
          console.log(chalk.gray('─'.repeat(60)));
          console.log(chalk.green(`  占用端口：${occupied.length}`));
          console.log(chalk.gray(`  空闲端口：${free.length}`));
          console.log(chalk.gray('─'.repeat(60)));

          if (occupied.length > 0) {
            console.log(chalk.yellow('\n📌 占用的端口:'));
            for (const result of occupied) {
              console.log(chalk.cyan(`  端口 ${result.port}:`) + chalk.gray(` PID ${result.pids.join(', ')}`));
            }
          }
        }
      }

    } catch (err) {
      console.error(chalk.red(`❌ 错误：${err.message}`));
      process.exit(1);
    }
  });

program.parse();
