#!/usr/bin/env node
/**
 * x-key-listen - Node.js 键盘监听工具
 * 参考 Python 的 keyboard/pynput 模块设计
 * 
 * 用法:
 *   x-key-listen                    # 监听所有按键
 *   x-key-listen -k ctrl+c          # 监听特定按键
 *   x-key-listen --record           # 记录按键序列
 *   x-key-listen --hotkey "ctrl+q"  # 注册热键
 */

import { create_listener, read_key } from '../src/keyboard/listener.js';
import { program } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';

// 程序版本
const VERSION = '1.0.0';

// 设置 CLI
program
  .name('x-key-listen')
  .description('Node.js 键盘监听工具 - 类似 Python 的 keyboard 模块')
  .version(VERSION);

// 监听所有按键
program
  .command('listen')
  .description('监听所有键盘输入')
  .option('-v, --verbose', '显示详细信息')
  .option('--no-color', '禁用颜色输出')
  .action((options) => {
    start_listener(options);
  });

// 监听特定按键
program
  .command('wait <key>')
  .description('等待特定按键')
  .action((key) => {
    wait_for_key(key);
  });

// 记录按键序列
program
  .command('record')
  .description('记录按键序列（按 Ctrl+C 停止）')
  .option('-o, --output <file>', '输出到文件')
  .action((options) => {
    record_keys(options);
  });

// 注册热键
program
  .command('hotkey <combination>')
  .description('注册热键监听')
  .action((combination) => {
    register_hotkey(combination);
  });

// 显示按键映射
program
  .command('map')
  .description('显示按键映射表')
  .action(() => {
    show_key_map();
  });

// 测试模式
program
  .command('test')
  .description('测试键盘监听功能')
  .action(() => {
    test_keyboard();
  });

// 默认命令（直接运行时）
program
  .argument('[key]', '要监听的特定按键')
  .option('-v, --verbose', '显示详细信息')
  .action((key, options) => {
    if (key) {
      wait_for_key(key);
    } else {
      start_listener(options);
    }
  });

program.parse(process.argv);

// ============================================================================
// 功能函数
// ============================================================================

/**
 * 启动键盘监听器
 */
function start_listener(options = {}) {
  const useColor = options.color !== false;
  
  print_banner(useColor);
  
  console.log(chalk.cyan('\n📡 键盘监听器已启动'));
  console.log(chalk.gray('按 Ctrl+C 退出\n'));
  
  if (options.verbose) {
    console.log(chalk.yellow('详细模式：显示所有事件类型'));
  }
  
  const listener = create_listener();
  
  // 启动监听
  listener.start({ suppress: false });
  
  // 监听所有按键
  listener.on('key', (event) => {
    const timestamp = new Date().toISOString().substr(11, 12);
    const event_type = event.is_press() ? '↓' : '↑';
    const key_name = chalk.green(event.name);
    
    if (options.verbose) {
      console.log(`[${timestamp}] ${event_type} ${key_name}`);
    } else {
      if (event.is_press()) {
        process.stdout.write(`\r${chalk.gray('当前按键:')} ${key_name}   `);
      }
    }
  });
  
  // 监听特殊按键
  listener.on('ctrl+c', () => {
    console.log('\n');
    console.log(chalk.yellow('收到 Ctrl+C，正在退出...'));
    listener.stop();
    process.exit(0);
  });
  
  listener.on('escape', () => {
    console.log('\n');
    console.log(chalk.yellow('收到 Escape，正在退出...'));
    listener.stop();
    process.exit(0);
  });
  
  listener.on('q', () => {
    console.log('\n');
    console.log(chalk.yellow('收到 Q，正在退出...'));
    listener.stop();
    process.exit(0);
  });
}

/**
 * 等待特定按键
 */
async function wait_for_key(key) {
  print_banner();
  
  console.log(chalk.cyan(`\n⏳ 等待按键: ${chalk.yellow(key)}`));
  console.log(chalk.gray('按 Ctrl+C 退出\n'));
  
  const listener = create_listener();
  listener.start();
  
  listener.on(key.toLowerCase(), (event) => {
    console.log(chalk.green(`\n✓ 检测到按键: ${event.name}`));
    console.log(chalk.gray(`时间戳：${new Date(event.timestamp).toLocaleTimeString()}`));
    listener.stop();
    process.exit(0);
  });
  
  listener.on('ctrl+c', () => {
    console.log('\n');
    listener.stop();
    process.exit(0);
  });
}

/**
 * 记录按键序列
 */
function record_keys(options = {}) {
  print_banner();
  
  const recorded_keys = [];
  const start_time = Date.now();
  
  console.log(chalk.cyan('\n🔴 记录中...'));
  console.log(chalk.gray('按 Ctrl+C 停止记录\n'));
  
  const listener = create_listener();
  listener.start();
  
  listener.on('key', (event) => {
    if (event.is_press()) {
      const elapsed = ((Date.now() - start_time) / 1000).toFixed(2);
      recorded_keys.push({
        key: event.name,
        time: elapsed,
        type: 'press'
      });
      
      process.stdout.write(`\r${chalk.gray('已记录:')} ${recorded_keys.length} 个按键   `);
    }
  });
  
  listener.on('ctrl+c', () => {
    console.log('\n\n');
    console.log(chalk.yellow(`记录完成！共记录 ${recorded_keys.length} 个按键`));
    
    if (options.output) {
      // TODO: 保存到文件
      console.log(chalk.gray(`已保存到：${options.output}`));
    } else {
      console.log(chalk.gray('\n按键序列:'));
      console.log(recorded_keys.map(k => k.key).join(' -> '));
    }
    
    listener.stop();
    process.exit(0);
  });
}

/**
 * 注册热键
 */
function register_hotkey(combination) {
  print_banner();
  
  console.log(chalk.cyan(`\n🔥 热键监听: ${chalk.yellow(combination)}`));
  console.log(chalk.gray('按 Ctrl+C 退出\n'));
  
  const listener = create_listener();
  listener.start();
  
  listener.on_hotkey(combination, (event) => {
    console.log(chalk.green(`\n★ 热键触发：${combination}`));
    console.log(chalk.gray(`时间：${new Date(event.timestamp).toLocaleTimeString()}`));
  });
  
  // 显示所有按下的键
  listener.on('key', (event) => {
    if (event.is_press()) {
      process.stdout.write(`\r${chalk.gray('当前:')} ${event.name}   `);
    }
  });
  
  listener.on('ctrl+c', () => {
    console.log('\n');
    listener.stop();
    process.exit(0);
  });
}

/**
 * 显示按键映射表
 */
function show_key_map() {
  print_banner();
  
  console.log(chalk.cyan('\n📋 按键映射表\n'));
  
  const key_map = {
    '控制键': {
      'ctrl_c': 'Ctrl+C',
      'ctrl_d': 'Ctrl+D',
      'escape': 'Escape',
      'backspace': 'Backspace',
      'enter': 'Enter',
      'tab': 'Tab',
      'space': 'Space'
    },
    '方向键': {
      'up': '↑ 上',
      'down': '↓ 下',
      'left': '← 左',
      'right': '→ 右'
    },
    '功能键': {
      'home': 'Home',
      'end': 'End',
      'pageup': 'Page Up',
      'pagedown': 'Page Down',
      'delete': 'Delete',
      'insert': 'Insert'
    },
    'F 键': {
      'f1': 'F1',
      'f2': 'F2',
      'f3': 'F3',
      'f4': 'F4',
      'f5': 'F5',
      'f6': 'F6',
      'f7': 'F7',
      'f8': 'F8',
      'f9': 'F9',
      'f10': 'F10',
      'f11': 'F11',
      'f12': 'F12'
    }
  };
  
  for (const [category, keys] of Object.entries(key_map)) {
    console.log(chalk.yellow(category));
    for (const [key, desc] of Object.entries(keys)) {
      console.log(`  ${chalk.green(key.padEnd(15))} - ${desc}`);
    }
    console.log();
  }
  
  console.log(chalk.cyan('\n组合键格式:'));
  console.log('  ctrl+c      - Ctrl + C');
  console.log('  alt+enter   - Alt + Enter');
  console.log('  ctrl+shift+k - Ctrl + Shift + K');
}

/**
 * 测试键盘
 */
function test_keyboard() {
  print_banner();
  
  console.log(chalk.cyan('\n🧪 键盘测试模式\n'));
  console.log(chalk.gray('按下任意键，检查是否正确识别\n'));
  
  const listener = create_listener();
  listener.start();
  
  let test_count = 0;
  const test_results = [];
  
  listener.on('key', (event) => {
    if (event.is_press()) {
      test_count++;
      test_results.push(event.name);
      
      const status = chalk.green('✓');
      const key = chalk.yellow(event.name.padEnd(15));
      const count = chalk.gray(`(第 ${test_count} 次)`);
      
      console.log(`${status} ${key} ${count}`);
    }
  });
  
  listener.on('ctrl+c', () => {
    console.log('\n');
    console.log(chalk.yellow(`测试完成！共检测 ${test_count} 个按键`));
    
    if (test_results.length > 0) {
      console.log(chalk.gray('\n检测到的按键:'));
      console.log(test_results.join(', '));
    }
    
    listener.stop();
    process.exit(0);
  });
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 打印横幅
 */
function print_banner(useColor = true) {
  const title = figlet.textSync('Key Listen', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default'
  });
  
  if (useColor) {
    console.log(chalk.cyan(title));
  } else {
    console.log(title);
  }
  
  console.log(chalk.gray(`版本：${VERSION}`));
}
