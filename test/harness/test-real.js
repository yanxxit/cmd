#!/usr/bin/env node
/**
 * AI Harness 真实测试脚本 - 使用实际的 AI API
 */

import chalk from 'chalk';
import { AIHarness } from '../../src/harness/index.js';

async function runRealTests() {
  console.log(chalk.bold.cyan('\n🚀 AI Harness 真实测试开始\n'));
  console.log(chalk.gray('='.repeat(60)) + '\n');

  const harness = new AIHarness();

  try {
    console.log(chalk.bold.magenta('📝 测试 1: ask() 单轮对话'));
    const answer1 = await harness.ask('用一句话介绍 JavaScript', '你是一个简洁的助手');
    console.log(chalk.green(`✅ 回答: ${answer1}`));
    console.log();

    console.log(chalk.bold.magenta('💬 测试 2: chat() 多轮对话'));
    const chat1 = await harness.chat('你好，我叫小明');
    console.log(chalk.green(`✅ 回复1: ${chat1}`));
    
    const chat2 = await harness.chat('我叫什么名字？');
    console.log(chalk.green(`✅ 回复2: ${chat2}`));
    console.log();

    console.log(chalk.bold.magenta('🧹 测试 3: clearHistory() 清空历史'));
    harness.clearHistory();
    console.log(chalk.green('✅ 历史已清空'));
    console.log();

    console.log(chalk.bold.magenta('📊 测试 4: batchTest() 批量测试（前2个提示词）'));
    const testPrompts = [
      '什么是 Node.js？',
      '解释一下 Promise'
    ];
    const results = await harness.batchTest(testPrompts);
    
    for (const result of results) {
      if (result.success) {
        console.log(chalk.green(`✅ [${result.index + 1}] ${result.prompt}`));
        console.log(chalk.gray(`   ${result.answer.substring(0, 50)}...`));
      } else {
        console.log(chalk.red(`❌ [${result.index + 1}] ${result.prompt}: ${result.error}`));
      }
    }
    console.log();

    console.log(chalk.bold.cyan('✅ 所有真实测试通过！'));
    console.log(chalk.gray('='.repeat(60)) + '\n');

  } catch (error) {
    console.error(chalk.red('\n❌ 测试失败:'), error.message);
    console.error(chalk.gray('请确保已配置正确的 HUNYUAN_API_KEY'));
    console.log();
  }
}

runRealTests().catch(console.error);
