#!/usr/bin/env node
import { program } from 'commander';
import readline from 'readline';
import chalk from 'chalk';
import SimpleAgentCore from '../src/agent/index.js';

class SimpleAgentCLI {
  constructor() {
    try {
      this.agent = new SimpleAgentCore();
    } catch (error) {
      console.error(chalk.red('❌ ' + error.message));
      process.exit(1);
    }
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.blue('You: ')
    });
  }

  showHelp() {
    const helpText = `
${chalk.cyan('🤖 Simple AI Agent')}
${chalk.cyan('='.repeat(50))}

${chalk.green('可用命令:')}
  - 直接输入问题: 与 Agent 对话，支持工具调用
  - ${chalk.yellow('clear')}: 清空对话历史
  - ${chalk.yellow('help')}: 显示帮助信息
  - ${chalk.yellow('exit')}: 退出程序

${chalk.green('可用工具:')}
  • ${chalk.cyan('read_file')}: 读取文件内容
  • ${chalk.cyan('list_directory')}: 列出目录内容
  • ${chalk.cyan('write_file')}: 写入文件
    `;
    console.log(helpText);
  }

  async start() {
    console.log(chalk.cyan('🚀 Simple AI Agent'));
    console.log(chalk.cyan('='.repeat(50)));
    this.showHelp();

    while (true) {
      try {
        const input = await new Promise((resolve) => {
          this.rl.question(chalk.blue('\nYou: '), resolve);
        });

        const command = input.toLowerCase().trim();

        switch (command) {
          case 'exit':
          case 'quit':
            console.log(chalk.green('再见！✨'));
            this.rl.close();
            return;
          case 'clear':
            this.agent.clearHistory();
            console.log(chalk.green('✅ 对话历史已清空\n'));
            break;
          case 'help':
            this.showHelp();
            break;
          case '':
            break;
          default:
            try {
              const result = await this.agent.getAgentResponse(input);
              console.log(chalk.green('\nAI: ') + result.content);
            } catch (error) {
              console.error(chalk.red('\n❌ 错误:'), error.message);
            }
            break;
        }
      } catch (error) {
        console.error(chalk.red('发生错误:'), error.message);
      }
    }
  }
}

program
  .version('1.0.0')
  .description('简单的 AI Agent - 支持工具调用的智能助手')
  .option('-i, --interactive', '启动交互式聊天模式')
  .action((options) => {
    if (options.interactive) {
      program.mode = 'interactive';
    } else {
      program.mode = 'interactive';
    }
  });

async function main() {
  program.parse(process.argv);

  if (program.mode === 'interactive') {
    const agent = new SimpleAgentCLI();
    await agent.start();
  }
}

try {
  main();
} catch (err) {
  console.error('\x1b[31m❌ 错误: 执行失败。\x1b[0m');
  console.error(err);
  process.exit(1);
}
