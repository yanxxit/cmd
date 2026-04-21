import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIHarness } from '../src/harness/index.js';

// 设置测试环境变量
process.env.HUNYUAN_API_KEY = 'test-api-key-123';

// 模拟 OpenAI 客户端
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: '模拟的 AI 回复'
                }
              }
            ]
          })
        }
      }
    }))
  };
});

// 模拟 dotenv 和 fs
vi.mock('dotenv', () => ({
  parse: vi.fn().mockReturnValue({})
}));

vi.mock('fs/promises', () => ({
  access: vi.fn().mockRejectedValue(new Error('文件不存在')),
  readFile: vi.fn().mockRejectedValue(new Error('文件不存在'))
}));

describe('AIHarness 单元测试', () => {
  let harness;

  beforeEach(() => {
    // 每个测试前创建新实例并清除所有 mock
    harness = new AIHarness();
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该能够初始化 AIHarness 实例', () => {
      expect(harness).toBeDefined();
      expect(harness.model).toBe('hunyuan-lite');
      expect(harness.temperature).toBe(0.7);
      expect(harness.maxTokens).toBe(2048);
    });

    it('应该接受自定义选项', () => {
      const customHarness = new AIHarness({
        model: 'custom-model',
        temperature: 0.5,
        maxTokens: 1000
      });
      expect(customHarness.model).toBe('custom-model');
      expect(customHarness.temperature).toBe(0.5);
      expect(customHarness.maxTokens).toBe(1000);
    });
  });

  describe('ask() 方法', () => {
    it('应该能够发送单轮对话并返回回复', async () => {
      const response = await harness.ask('测试问题');
      
      expect(response).toBe('模拟的 AI 回复');
      
      // 验证 OpenAI 被正确调用
      const OpenAI = (await import('openai')).default;
      expect(OpenAI).toHaveBeenCalled();
    });

    it('应该使用自定义的系统提示词', async () => {
      await harness.ask('测试问题', '自定义系统提示');
      
      // 验证调用参数（通过 mock 间接验证）
      const OpenAI = (await import('openai')).default;
      const mockInstance = OpenAI.mock.results[0].value;
      expect(mockInstance.chat.completions.create).toHaveBeenCalled();
    });
  });

  describe('chat() 方法', () => {
    it('应该能够进行多轮对话', async () => {
      const response1 = await harness.chat('第一轮对话');
      const response2 = await harness.chat('第二轮对话');
      
      expect(response1).toBe('模拟的 AI 回复');
      expect(response2).toBe('模拟的 AI 回复');
      
      // 验证历史记录被维护
      expect(harness.history.length).toBe(5); // 系统提示 + 2轮对话（用户+助手）
    });

    it('应该在历史记录为空时添加系统提示', async () => {
      await harness.chat('测试对话');
      
      expect(harness.history[0].role).toBe('system');
    });
  });

  describe('clearHistory() 方法', () => {
    it('应该能够清空对话历史', async () => {
      await harness.chat('第一轮');
      expect(harness.history.length).toBeGreaterThan(0);
      
      harness.clearHistory();
      expect(harness.history.length).toBe(0);
    });
  });

  describe('batchTest() 方法', () => {
    it('应该能够批量测试多个提示词', async () => {
      const prompts = ['问题1', '问题2', '问题3'];
      const results = await harness.batchTest(prompts);
      
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.answer).toBe('模拟的 AI 回复');
      });
    });

    it('应该能够处理测试失败的情况', async () => {
      // 临时模拟失败
      const originalAsk = harness.ask;
      harness.ask = vi.fn().mockRejectedValue(new Error('API 调用失败'));
      
      const prompts = ['问题1'];
      const results = await harness.batchTest(prompts);
      
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('API 调用失败');
      
      // 恢复原方法
      harness.ask = originalAsk;
    });
  });

  describe('testFromFile() 方法', () => {
    it('应该能够从文件读取提示词并测试', async () => {
      // 临时 mock fs.readFile
      const originalReadFile = (await import('fs/promises')).readFile;
      (await import('fs/promises')).readFile = vi.fn().mockResolvedValue(
        '问题1\n问题2\n问题3'
      );
      
      const results = await harness.testFromFile('fake-path.txt');
      
      expect(results.length).toBe(3);
      
      // 恢复原方法
      (await import('fs/promises')).readFile = originalReadFile;
    });
  });
});
