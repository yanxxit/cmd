#!/usr/bin/env node

/**
 * WiFi 密码获取命令行工具
 * 使用方法：
 *   x-wifi                    - 获取当前连接的 WiFi 密码
 *   x-wifi --current          - 获取当前连接的 WiFi 密码
 *   x-wifi --list             - 列出所有已保存的 WiFi
 *   x-wifi --ssid <WiFi 名称>  - 获取指定 WiFi 的密码
 *   x-wifi --json             - 以 JSON 格式输出
 */

import { program } from 'commander';
import chalk from 'chalk';
import wifi from '../src/wifi.js';

program
  .version('1.0.0')
  .description('获取当前系统的 WiFi 密码')
  .option('-c, --current', '获取当前连接的 WiFi 密码')
  .option('-l, --list', '列出所有已保存的 WiFi 网络')
  .option('-s, --ssid <name>', '获取指定 WiFi 的密码')
  .option('-j, --json', '以 JSON 格式输出')
  .action((options) => {
    program.options = options;
  });

async function main() {
  program.parse(process.argv);
  const options = program.opts();

  try {
    // 如果没有指定任何选项，默认获取当前 WiFi 密码
    if (!options.current && !options.list && !options.ssid) {
      options.current = true;
    }

    if (options.list) {
      // 列出所有已保存的 WiFi
      await handleList(options.json);
    } else if (options.ssid) {
      // 获取指定 WiFi 的密码
      await handleGetPassword(options.ssid, options.json);
    } else if (options.current) {
      // 获取当前 WiFi 密码
      await handleCurrent(options.json);
    }
  } catch (error) {
    console.error(chalk.red(`❌ 错误：${error.message}`));
    process.exit(1);
  }
}

/**
 * 处理获取当前 WiFi 信息
 */
async function handleCurrent(isJson = false) {
  const info = await wifi.getCurrentWifiInfo();

  if (isJson) {
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log(chalk.green('📶 当前 WiFi 信息:'));
    console.log(`  ${chalk.cyan('SSID:')}     ${info.ssid}`);
    console.log(`  ${chalk.cyan('密码:')}     ${info.password ? chalk.yellow(info.password) : chalk.red('无法获取')}`);
    console.log(`  ${chalk.cyan('系统:')}     ${getPlatformName(info.platform)}`);
    
    if (!info.password) {
      console.log(chalk.yellow('\n提示：可能需要管理员权限才能获取 WiFi 密码'));
      if (process.platform === 'linux') {
        console.log(chalk.yellow('尝试使用 sudo: sudo x-wifi --current'));
      }
    }
  }
}

/**
 * 处理获取指定 WiFi 密码
 */
async function handleGetPassword(ssid, isJson = false) {
  const password = await wifi.getWifiPassword(ssid);

  if (isJson) {
    console.log(JSON.stringify({ ssid, password }, null, 2));
  } else {
    if (password) {
      console.log(chalk.green('✅ 找到 WiFi 密码:'));
      console.log(`  ${chalk.cyan('SSID:')}     ${ssid}`);
      console.log(`  ${chalk.cyan('密码:')}     ${chalk.yellow(password)}`);
    } else {
      console.log(chalk.red(`❌ 未找到 WiFi "${ssid}" 的密码`));
      console.log(chalk.yellow('提示：可能需要管理员权限'));
    }
  }
}

/**
 * 处理列出所有 WiFi
 */
async function handleList(isJson = false) {
  const wifiList = await wifi.getSavedWifiList();

  if (isJson) {
    console.log(JSON.stringify({ count: wifiList.length, networks: wifiList }, null, 2));
  } else {
    console.log(chalk.green(`📶 已保存的 WiFi 网络 (${wifiList.length} 个):`));
    if (wifiList.length === 0) {
      console.log(chalk.yellow('  没有找到已保存的 WiFi 网络'));
    } else {
      wifiList.forEach((ssid, index) => {
        console.log(`  ${chalk.cyan(`${index + 1}.`)} ${ssid}`);
      });
    }
  }
}

/**
 * 获取平台名称
 */
function getPlatformName(platform) {
  const names = {
    darwin: 'macOS',
    win32: 'Windows',
    linux: 'Linux'
  };
  return names[platform] || platform;
}

// 执行主函数
try {
  main();
} catch (err) {
  console.error(chalk.red('❌ 错误：执行失败'));
  console.error(err);
  process.exit(1);
}
