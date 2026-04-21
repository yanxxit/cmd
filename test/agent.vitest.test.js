import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import SimpleAgentCore, { AVAILABLE_TOOLS } from '../src/agent/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('SimpleAgentCore - 单元测试', () => {
  let testDir;
  let agent;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-test-'));
    await fs.writeFile(path.join(testDir, 'test.txt'), '这是一个测试文件');
    agent = new SimpleAgentCore({ apiKey: 'mock_key', baseURL: 'https://mock.url' });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('基本功能测试', () => {
    it('应该初始化正常', () => {
      expect(agent).toBeDefined();
      expect(agent.messages).toEqual([]);
    });

    it('应该有三个可用工具', () => {
      expect(AVAILABLE_TOOLS.length).toBe(3);
      expect(AVAILABLE_TOOLS[0].function.name).toBe('read_file');
      expect(AVAILABLE_TOOLS[1].function.name).toBe('list_directory');
      expect(AVAILABLE_TOOLS[2].function.name).toBe('write_file');
    });

    it('应该能清空和获取历史记录', () => {
      agent.messages = [{ role: 'user', content: 'test' }];
      expect(agent.getHistory().length).toBe(1);
      agent.clearHistory();
      expect(agent.getHistory().length).toBe(0);
    });
  });

  describe('工具函数测试', () => {
    it('应该能读取文件', async () => {
      const result = await agent.readFile(path.join(testDir, 'test.txt'));
      expect(result.success).toBe(true);
      expect(result.content).toBe('这是一个测试文件');
    });

    it('应该能列出目录', async () => {
      const result = await agent.listDirectory(testDir);
      expect(result.success).toBe(true);
      expect(result.files).toContain('test.txt');
    });

    it('应该能写入文件', async () => {
      const outputPath = path.join(testDir, 'output.txt');
      const result = await agent.writeFile(outputPath, 'Hello World');
      expect(result.success).toBe(true);
      
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toBe('Hello World');
    });

    it('应该能执行工具调用', async () => {
      const toolCall = {
        id: 'test_call',
        function: {
          name: 'list_directory',
          arguments: { dirPath: testDir }
        }
      };
      const result = await agent.executeTool(toolCall);
      expect(result.role).toBe('tool');
      expect(result.name).toBe('list_directory');
      expect(result.tool_call_id).toBe('test_call');
    });
  });
});

describe('x-agent CLI 测试', () => {
  it('脚本文件存在', () => {
    const agentPath = path.join(__dirname, '..', 'bin', 'agent.js');
    expect(fsSync.existsSync(agentPath)).toBe(true);
  });
});
