/**
 * AI 聊天 API
 * 基于混元大模型
 */

import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const router = express.Router();

// 初始化 AI 客户端
let client = null;

function getClient() {
  if (!client) {
    if (!process.env.HUNYUAN_API_KEY) {
      console.warn('⚠️ 未设置 HUNYUAN_API_KEY 环境变量');
    }
    client = new OpenAI({
      apiKey: process.env.HUNYUAN_API_KEY || 'demo',
      baseURL: "https://api.hunyuan.cloud.tencent.com/v1",
    });
  }
  return client;
}

/**
 * POST /api/ai/chat
 * AI 聊天接口
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.json({
        success: false,
        error: '请提供消息列表'
      });
    }
    
    // 获取当前日期
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    // 构建系统提示
    const systemPrompt = `你是一个智能助手，今天是 ${formattedDate}。请根据用户的问题提供准确、有用的回答。回答要简洁明了。`;
    
    // 构建完整的消息列表
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];
    
    // 限制上下文长度（最近 2 条 + 系统提示）
    const limitedMessages = fullMessages.slice(-3);
    
    const aiClient = getClient();
    
    const completion = await aiClient.chat.completions.create({
      model: "hunyuan-lite",
      messages: limitedMessages,
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    const aiResponse = completion.choices[0].message.content;
    
    res.json({
      success: true,
      data: {
        content: aiResponse,
        model: 'hunyuan-lite',
        usage: completion.usage
      }
    });
    
  } catch (err) {
    console.error('AI 聊天错误:', err.message);
    res.json({
      success: false,
      error: err.message || 'AI 服务暂时不可用'
    });
  }
});

/**
 * GET /api/ai/status
 * 检查 AI 服务状态
 */
router.get('/status', (req, res) => {
  const hasApiKey = !!process.env.HUNYUAN_API_KEY;
  
  res.json({
    success: true,
    data: {
      available: hasApiKey,
      model: 'hunyuan-lite',
      endpoint: 'https://api.hunyuan.cloud.tencent.com/v1'
    }
  });
});

export default router;
