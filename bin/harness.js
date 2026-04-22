#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import AIHarness from '../src/harness/index.js';

program
  .name('x-harness')
  .description('简单的 AI 测试和调用框架')
  .version('1.0.0');

program
  .command('ask <question>')
  .description('发送单轮对话请求')
  .option('-m, --model <model>', '模型名称', 'hunyuan-lite')
  .option('-s, --system <prompt>', '系统提示词')
  .option('-t, --temperature <temp>', '温度参数', parseFloat, 0.7)
  .option('--max-tokens <tokens>', '最大 token 数', parseInt, 2048)
  .action(async (question, options) => {
    try {
      const spinner = ora('正在请求 AI...').start();

      const harness = new AIHarness({
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens
      });

      const answer = await harness.ask(question, options.system);

      spinner.succeed('请求完成');
      console.log('\n' + chalk.cyan('AI 回答:'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.white(answer));
      console.log(chalk.gray('─'.repeat(60)) + '\n');
    } catch (error) {
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

program
  .command('chat')
  .description('多轮对话模式')
  .option('-m, --model <model>', '模型名称', 'hunyuan-lite')
  .option('-s, --system <prompt>', '系统提示词')
  .option('-t, --temperature <temp>', '温度参数', parseFloat, 0.7)
  .option('--max-tokens <tokens>', '最大 token 数', parseInt, 2048)
  .action(async (options) => {
    try {
      const harness = new AIHarness({
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens
      });

      console.log(chalk.cyan('\n🤖 进入多轮对话模式（输入 /quit 或 /q 退出，/clear 清空历史）'));
      console.log(chalk.gray('─'.repeat(60)) + '\n');

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const askQuestion = () => {
        rl.question(chalk.yellow('You: '), async (input) => {
          const trimmed = input.trim();

          if (trimmed === '/quit' || trimmed === '/q') {
            console.log(chalk.gray('\n再见！'));
            rl.close();
            return;
          }

          if (trimmed === '/clear') {
            harness.clearHistory();
            console.log(chalk.green('\n已清空对话历史\n'));
            askQuestion();
            return;
          }

          if (!trimmed) {
            askQuestion();
            return;
          }

          try {
            const spinner = ora('AI 正在思考...').start();
            const answer = await harness.chat(trimmed, options.system);
            spinner.stop();

            console.log(chalk.cyan('\nAI: ') + chalk.white(answer) + '\n');
          } catch (error) {
            console.error(chalk.red('\n错误:'), error.message + '\n');
          }

          askQuestion();
        });
      };

      askQuestion();
    } catch (error) {
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

program
  .command('batch <file>')
  .description('从文件批量测试提示词（每行一个）')
  .option('-m, --model <model>', '模型名称', 'hunyuan-lite')
  .option('-s, --system <prompt>', '系统提示词')
  .option('-t, --temperature <temp>', '温度参数', parseFloat, 0.7)
  .option('--max-tokens <tokens>', '最大 token 数', parseInt, 2048)
  .option('-o, --output <path>', '输出文件路径')
  .action(async (file, options) => {
    try {
      const spinner = ora('正在批量测试...').start();

      const harness = new AIHarness({
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens
      });

      const results = await harness.testFromFile(file, options.system);

      spinner.succeed('批量测试完成');

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      console.log(chalk.cyan('\n📊 测试结果:'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.green(`  成功: ${successCount}`));
      console.log(chalk.red(`  失败: ${failCount}`));
      console.log(chalk.gray('─'.repeat(60)) + '\n');

      for (const result of results) {
        console.log(chalk.yellow(`[${result.index + 1}] ${result.prompt}`));
        if (result.success) {
          console.log(chalk.white(result.answer) + '\n');
        } else {
          console.log(chalk.red(`错误: ${result.error}`) + '\n');
        }
      }

      if (options.output) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, JSON.stringify(results, null, 2));
        console.log(chalk.green(`结果已保存到: ${options.output}`));
      }
    } catch (error) {
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

program.parse();
