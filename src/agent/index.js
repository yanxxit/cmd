import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载项目根目录下的 .env 文件
const env_file = path.resolve(__dirname, '../../', '.env');
dotenv.config({ path: env_file, quiet: true });

export const AVAILABLE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: '读取指定文件的内容',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: '要读取的文件路径'
          }
        },
        required: ['filePath']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_directory',
      description: '列出指定目录的内容',
      parameters: {
        type: 'object',
        properties: {
          dirPath: {
            type: 'string',
            description: '要列出的目录路径，默认为当前目录'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: '向指定文件写入内容',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: '要写入的文件路径'
          },
          content: {
            type: 'string',
            description: '要写入的内容'
          }
        },
        required: ['filePath', 'content']
      }
    }
  }
];

export class SimpleAgentCore {
  constructor({ apiKey, baseURL } = {}) {
    // 优先级：1. 传入的 apiKey 参数 2. .env 文件中的 HUNYUAN_API_KEY 3. 环境变量中的 HUNYUAN_API_KEY
    const finalApiKey = apiKey || process.env['HUNYUAN_API_KEY'];
    
    if (!finalApiKey) {
      throw new Error('错误: 未设置 HUNYUAN_API_KEY，请在 .env 文件中配置或设置环境变量');
    }
    
    this.client = new OpenAI({
      apiKey: finalApiKey,
      baseURL: baseURL || 'https://api.hunyuan.cloud.tencent.com/v1'
    });
    this.messages = [];
  }

  async readFile(filePath) {
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      return { success: true, content: content.substring(0, 4000) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listDirectory(dirPath = '.') {
    try {
      const absolutePath = path.resolve(dirPath);
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });
      const files = [];
      const dirs = [];
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          dirs.push(entry.name + '/');
        } else {
          files.push(entry.name);
        }
      }
      
      return { success: true, directories: dirs, files };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async writeFile(filePath, content) {
    try {
      const absolutePath = path.resolve(filePath);
      await fs.writeFile(absolutePath, content, 'utf-8');
      return { success: true, message: `文件已写入: ${absolutePath}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async executeTool(toolCall) {
    const { name, arguments: args } = toolCall.function;
    let result;

    switch (name) {
      case 'read_file':
        result = await this.readFile(args.filePath);
        break;
      case 'list_directory':
        result = await this.listDirectory(args.dirPath);
        break;
      case 'write_file':
        result = await this.writeFile(args.filePath, args.content);
        break;
      default:
        result = { success: false, error: `未知工具: ${name}` };
    }

    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      name,
      content: JSON.stringify(result)
    };
  }

  async getAgentResponse(userInput) {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const systemPrompt = `你是一个有用的 AI 助手，今天是 ${formattedDate}。你可以使用以下工具帮助用户：
- read_file: 读取文件内容
- list_directory: 列出目录内容
- write_file: 写入文件

请根据用户的需求决定是否使用工具，或直接回答。`;

    if (this.messages.length === 0) {
      this.messages.push({ role: 'system', content: systemPrompt });
    }

    this.messages.push({ role: 'user', content: userInput });

    try {
      while (true) {
        const response = await this.client.chat.completions.create({
          model: 'hunyuan-lite',
          messages: this.messages,
          tools: AVAILABLE_TOOLS,
          temperature: 0.7,
          max_tokens: 4000,
          enable_enhancement: true
        });

        const message = response.choices[0].message;
        this.messages.push(message);

        if (!message.tool_calls || message.tool_calls.length === 0) {
          return { type: 'response', content: message.content };
        }

        const toolResponses = [];
        for (const toolCall of message.tool_calls) {
          const toolResponse = await this.executeTool(toolCall);
          toolResponses.push(toolResponse);
        }

        this.messages.push(...toolResponses);
      }
    } catch (error) {
      this.messages.pop();
      throw error;
    }
  }

  clearHistory() {
    this.messages = [];
  }

  getHistory() {
    return [...this.messages];
  }
}

export default SimpleAgentCore;
