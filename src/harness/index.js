import OpenAI from "openai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 读取 HUNYUAN_API_KEY：先从项目目录的 .env 文件读取，再从环境变量读取
 * @returns {string} API key
 */
async function loadApiKey() {
  const projectEnvPath = path.resolve(__dirname, '../../', '.env');
  
  try {
    await fs.access(projectEnvPath);
    const envConfig = dotenv.parse(await fs.readFile(projectEnvPath, 'utf-8'));
    
    if (envConfig.HUNYUAN_API_KEY) {
      return envConfig.HUNYUAN_API_KEY;
    }
  } catch {
  }
  
  if (process.env.HUNYUAN_API_KEY) {
    return process.env.HUNYUAN_API_KEY;
  }
  
  throw new Error('未找到 HUNYUAN_API_KEY，请在项目目录创建 .env 文件或设置环境变量');
}

/**
 * AI Harness - 简单的 AI 测试和调用框架
 */

export class AIHarness {
  constructor(options = {}) {
    this.client = null;
    this.apiKey = null;
    this.model = options.model || "hunyuan-lite";
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 2048;
    this.history = [];
  }

  /**
   * 初始化 OpenAI 客户端
   */
  async init() {
    if (!this.apiKey) {
      this.apiKey = await loadApiKey();
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: "https://api.hunyuan.cloud.tencent.com/v1",
    });

    return this;
  }

  /**
   * 发送单轮对话请求
   * @param {string} userQuestion - 用户问题
   * @param {string} systemPrompt - 系统提示词（可选）
   * @returns {Promise<string>} AI 回答
   */
  async ask(userQuestion, systemPrompt = null) {
    if (!this.client) {
      await this.init();
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const finalSystemPrompt = systemPrompt || `你是一个智能助手，今天是 ${formattedDate}。请根据用户的问题提供准确、有用的回答。`;

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: finalSystemPrompt },
        { role: "user", content: userQuestion },
      ],
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      enable_enhancement: true,
    });

    return completion.choices[0].message.content;
  }

  /**
   * 多轮对话
   * @param {string} userQuestion - 用户问题
   * @param {string} systemPrompt - 系统提示词（可选）
   * @returns {Promise<string>} AI 回答
   */
  async chat(userQuestion, systemPrompt = null) {
    if (!this.client) {
      await this.init();
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const finalSystemPrompt = systemPrompt || `你是一个智能助手，今天是 ${formattedDate}。请根据用户的问题提供准确、有用的回答。`;

    if (this.history.length === 0) {
      this.history.push({ role: "system", content: finalSystemPrompt });
    }

    this.history.push({ role: "user", content: userQuestion });

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: this.history,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      enable_enhancement: true,
    });

    const answer = completion.choices[0].message.content;
    this.history.push({ role: "assistant", content: answer });

    return answer;
  }

  /**
   * 清空对话历史
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * 批量测试多个提示词
   * @param {Array<string>} prompts - 提示词数组
   * @param {string} systemPrompt - 系统提示词
   * @returns {Promise<Array>} 测试结果
   */
  async batchTest(prompts, systemPrompt = null) {
    const results = [];
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      try {
        const answer = await this.ask(prompt, systemPrompt);
        results.push({
          index: i,
          prompt,
          answer,
          success: true
        });
      } catch (error) {
        results.push({
          index: i,
          prompt,
          error: error.message,
          success: false
        });
      }
    }

    return results;
  }

  /**
   * 从文件读取提示词并测试
   * @param {string} filePath - 文件路径
   * @param {string} systemPrompt - 系统提示词
   * @returns {Promise<Array>} 测试结果
   */
  async testFromFile(filePath, systemPrompt = null) {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    const prompts = content.split('\n').filter(line => line.trim());
    return this.batchTest(prompts, systemPrompt);
  }
}

export default AIHarness;
