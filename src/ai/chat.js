#!/usr/bin/env node

import OpenAI from 'openai';
import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { renderMarkdown, clearLine, ensureLogsDirectory, updateConversationFile as updateLogFileName, checkAndUpdateDate } from './chat.lib.js';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 检查是否设置了 HUNYUAN_API_KEY
if (!process.env['HUNYUAN_API_KEY']) {
  console.error('错误: 未设置 HUNYUAN_API_KEY 环境变量');
  process.exit(1);
}

class EnhancedHunYuanChat {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env['HUNYUAN_API_KEY'], // 混元 APIKey
      baseURL: "https://api.hunyuan.cloud.tencent.com/v1", // 混元 endpoint
    });
    this.messages = [];
    this.logsDir = path.resolve(process.cwd(), 'logs');
    this.ensureLogsDirectory();
    this.conversationFile = updateLogFileName(this.logsDir);
    this.isRendering = false;
    this.setupReadline();
  }

  // 确保日志目录存在
  async ensureLogsDirectory() {
    await ensureLogsDirectory(this.logsDir);
  }

  setupReadline() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.blue('You: ')
    });
  }

  // 流式输出AI回复，支持Markdown渲染
  async getAIResponse(userInput) {
    // 检查是否需要更新日志文件（如果跨天了）
    this.conversationFile = checkAndUpdateDate(this.conversationFile, this.logsDir);

    // 获取当前日期
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    // 创建系统提示词
    const systemPrompt = `你是一个智能助手，今天是 ${formattedDate}。请根据用户的问题提供准确、有用的回答。`;

    // 在第一次消息时添加系统提示
    if (this.messages.length === 0) {
      this.messages.push({ role: 'system', content: systemPrompt });
    }

    this.messages.push({ role: 'user', content: userInput });
    this.isRendering = true;

    try {
      // process.stdout.write(chalk.green('AI: '));

      const stream = await this.client.chat.completions.create({
        model: "hunyuan-lite", // 使用混元Lite模型
        messages: this.messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
        enable_enhancement: true, // 混元特有参数
      });

      let fullResponse = '';
      let buffer = '';
      let lastRenderTime = Date.now();

      for await (const chunk of stream) {
        if (!this.isRendering) break;

        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          buffer += content;

          // 定时渲染或遇到自然断点
          const currentTime = Date.now();
          const shouldRender = buffer.length > 500;

          if (shouldRender) {
            clearLine();
            // process.stdout.write(chalk.green('AI: '));
            const remaining = renderMarkdown(buffer, {
              isPartial: true,
              isCodeBlock: false
            });
            buffer = remaining;
            lastRenderTime = currentTime;
          }
        }
      }

      // 渲染剩余内容
      if (buffer && this.isRendering) {
        clearLine();
        process.stdout.write(chalk.green('AI: '));
        renderMarkdown(buffer, { isPartial: false });
      }

      this.messages.push({ role: 'assistant', content: fullResponse });
      process.stdout.write('\n\n');

      // 保存对话记录
      await this.saveConversation(userInput, fullResponse);

    } catch (error) {
      if (this.isRendering) {
        console.error(chalk.red('\n❌ API调用失败:'), error.message);
        this.messages.pop(); // 移除最后一条用户消息
      }
    } finally {
      this.isRendering = false;
    }
  }

  // 保存Markdown格式的对话记录
  async saveConversation(userInput, aiResponse) {
    try {
      const timestamp = new Date().toLocaleString('zh-CN');
      const logEntry = `## 对话记录 - ${timestamp}\n\n**用户**: ${userInput}\n\n**AI**: ${aiResponse}\n\n---\n\n`;

      console.log(chalk.cyan(aiResponse));
      await fs.appendFile(this.conversationFile, logEntry);

    } catch (error) {
      console.error(chalk.yellow('⚠️ 保存对话记录失败:'), error.message);
    }
  }

  // 显示对话历史
  showConversationHistory() {
    if (this.messages.length === 0) {
      console.log(chalk.yellow('暂无对话历史\n'));
      return;
    }

    console.log(chalk.cyan('\n📚 对话历史:'));
    console.log(chalk.cyan('='.repeat(50)));

    this.messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? chalk.blue('用户') : chalk.green('AI');
      const prefix = chalk.gray(`${index + 1}.`);

      // 限制显示长度，避免终端溢出
      const content = msg.content.length > 200
        ? msg.content.substring(0, 200) + '...'
        : msg.content;

      console.log(`${prefix} ${role}: ${content}`);
    });
    console.log(chalk.cyan('='.repeat(50)) + '\n');
  }

  // 导出对话历史为Markdown文件
  async exportConversation() {
    if (this.messages.length === 0) {
      console.log(chalk.yellow('暂无对话内容可导出\n'));
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `conversation_export_${timestamp}.md`;

      let exportContent = `# DeepSeek 对话导出\n\n`;
      exportContent += `**导出时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
      exportContent += `**对话轮数**: ${this.messages.length / 2}\n\n---\n\n`;

      for (let i = 0; i < this.messages.length; i += 2) {
        if (this.messages[i] && this.messages[i + 1]) {
          exportContent += `## 第${i / 2 + 1}轮对话\n\n`;
          exportContent += `### 用户\n${this.messages[i].content}\n\n`;
          exportContent += `### AI助手\n${this.messages[i + 1].content}\n\n---\n\n`;
        }
      }

      await fs.writeFile(filename, exportContent);
      console.log(chalk.green(`✅ 对话已导出到: ${filename}\n`));
    } catch (error) {
      console.error(chalk.red('❌ 导出失败:'), error.message);
    }
  }

  // 显示帮助信息
  showHelp() {
    const helpText = `
${chalk.cyan('🤖 混元 AI 命令行聊天工具 - 增强版')}
${chalk.cyan('='.repeat(50))}

${chalk.green('可用命令:')}
  - 直接输入问题: 与AI对话，支持Markdown格式显示
  - ${chalk.yellow('clear')}: 清空当前对话历史
  - ${chalk.yellow('history')}: 显示当前对话轮数和简要历史
  - ${chalk.yellow('export')}: 导出完整对话到Markdown文件
  - ${chalk.yellow('help')}: 显示此帮助信息
  - ${chalk.yellow('exit')}: 退出程序

${chalk.green('特色功能:')}
  • ${chalk.cyan('实时Markdown渲染')}: 代码高亮、粗体、斜体等格式
  • ${chalk.cyan('流式输出')}: 实时显示AI思考过程
  • ${chalk.cyan('对话持久化')}: 自动保存对话记录
  • ${chalk.cyan('混元模型')}: 腾讯混元大模型驱动

${chalk.yellow('提示:')} AI回复支持Markdown语法，会自动渲染为美观的终端格式
    `;

    console.log(helpText);
  }

  async start() {
    console.log(chalk.cyan('🚀 混元 AI 命令行聊天工具 (增强版)'));
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
            console.log(chalk.green('感谢使用，再见！✨'));
            this.rl.close();
            return;

          case 'clear':
            this.messages = [];
            console.log(chalk.green('✅ 对话历史已清空\n'));
            break;

          case 'history':
            this.showConversationHistory();
            break;

          case 'export':
            await this.exportConversation();
            break;

          case 'help':
            this.showHelp();
            break;

          case '':
            break;

          default:
            // 处理中断信号
            process.on('SIGINT', () => {
              this.isRendering = false;
              process.stdout.write('\n\n' + chalk.yellow('⏹️ 生成中断\n'));
              this.rl.prompt();
            });

            await this.getAIResponse(input);
            break;
        }
      } catch (error) {
        console.error(chalk.red('发生错误:'), error.message);
      }
    }
  }
}

export default EnhancedHunYuanChat;

// 启动应用
// const chat = new EnhancedHunYuanChat();
// chat.start();