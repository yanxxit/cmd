#!/usr/bin/env node
/**
 * AI Harness 测试脚本 - 不实际调用 AI API，只测试代码逻辑
 */

import chalk from 'chalk';

class MockHarness {
  constructor(options = {}) {
    this.client = null;
    this.apiKey = null;
    this.model = options.model || "hunyuan-lite";
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 2048;
    this.history = [];
    this.mockResponses = [
      "JavaScript 是一种高级编程语言，主要用于网页开发。",
      "Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行环境。",
      "RESTful API 是一种基于 REST 架构风格的 API 设计方式。",
      "Promise 是 JavaScript 中处理异步操作的对象。",
      "学习编程需要多练习、多思考、多阅读优秀代码。"
    ];
  }

  async init() {
    console.log(chalk.cyan('✅ [模拟] 初始化客户端'));
    this.apiKey = 'mock_api_key';
    return this;
  }

  async ask(userQuestion, systemPrompt = null) {
    if (!this.apiKey) {
      await this.init();
    }
    
    console.log(chalk.yellow(`📤 [模拟] 发送问题: ${userQuestion}`));
    console.log(chalk.gray(`   系统提示: ${systemPrompt || '默认'}`));
    
    const response = this.mockResponses[Math.floor(Math.random() * this.mockResponses.length)];
    console.log(chalk.green(`📥 [模拟] 收到回答: ${response}`));
    
    return response;
  }

  async chat(userQuestion, systemPrompt = null) {
    if (!this.apiKey) {
      await this.init();
    }
    
    console.log(chalk.yellow(`💬 [模拟] 发送聊天: ${userQuestion}`));
    
    const response = `这是针对 \"${userQuestion}\" 的第 ${this.history.length + 1} 条回复`;
    this.history.push({ role: 'user', content: userQuestion });
    this.history.push({ role: 'assistant', content: response });
    
    console.log(chalk.green(`📥 [模拟] 收到聊天回复: ${response}`));
    
    return response;
  }

  clearHistory() {
    console.log(chalk.cyan('🧹 [模拟] 清空历史记录'));
    this.history = [];
  }

  async batchTest(prompts, systemPrompt = null) {
    console.log(chalk.cyan(`📊 [模拟] 开始批量测试 ${prompts.length} 个提示词`));
    
    const results = [];
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      results.push({
        index: i,
        prompt,
        answer: `这是第 ${i + 1} 个提示词的模拟回答`,
        success: true
      });
      console.log(chalk.gray(`   处理 ${i + 1}/${prompts.length}`));
    }
    
    return results;
  }
}

async function runTests() {
  console.log(chalk.bold.cyan('\n🚀 AI Harness 测试开始\n'));
  console.log(chalk.gray('='.repeat(60)) + '\n');

  const harness = new MockHarness();

  console.log(chalk.bold.magenta('📝 测试 1: ask() 单轮对话'));
  await harness.ask('你好，请介绍一下自己', '你是一个友好的助手');
  console.log();

  console.log(chalk.bold.magenta('💬 测试 2: chat() 多轮对话'));
  await harness.chat('你好');
  await harness.chat('你是谁');
  await harness.chat('再见');
  console.log();

  console.log(chalk.bold.magenta('🧹 测试 3: clearHistory() 清空历史'));
  harness.clearHistory();
  console.log();

  console.log(chalk.bold.magenta('📊 测试 4: batchTest() 批量测试'));
  const testPrompts = [
    '问题 1',
    '问题 2',
    '问题 3'
  ];
  const results = await harness.batchTest(testPrompts);
  console.log(chalk.green(`   成功完成 ${results.length} 个测试`));
  console.log();

  console.log(chalk.bold.cyan('✅ 所有测试通过！'));
  console.log(chalk.gray('='.repeat(60)) + '\n');
}

runTests().catch(console.error);
