import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawn } from 'child_process';
import http from 'http';

/**
 * Vitest 测试：x-who-port 命令
 */

describe('x-who-port 命令', () => {
  /**
   * 执行命令并返回输出
   */
  function execCommand(command, options = {}) {
    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        ...options
      });
      return { success: true, output, error: null };
    } catch (err) {
      return { success: false, output: err.stdout || '', error: err.message };
    }
  }

  /**
   * 在独立进程中启动测试服务器
   */
  function startTestServerInChildProcess(port) {
    const serverCode = `
      const http = require('http');
      const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('Test Server');
      });
      server.listen(${port}, () => {
        console.log('SERVER_READY');
        setInterval(() => {}, 1000);
      });
    `;

    const child = spawn('node', ['-e', serverCode], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('服务器启动超时'));
      }, 5000);

      child.stdout.on('data', (data) => {
        if (data.toString().includes('SERVER_READY')) {
          clearTimeout(timeout);
          resolve(child);
        }
      });

      child.on('error', reject);
    });
  }

  describe('基本功能', () => {
    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/who-port.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('查询占用指定端口的服务详细信息');
    });

    it('应该正确处理无效端口号', () => {
      const result = execCommand(`node bin/who-port.js 99999 --no-log 2>&1`);
      expect(result.output).toMatch(/无效 | 错误/);
    });
  });

  describe('端口查询功能', () => {
    let testServer = null;
    const TEST_PORT = 18765;

    beforeAll(async () => {
      testServer = await startTestServerInChildProcess(TEST_PORT);
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    afterAll(() => {
      if (testServer) {
        testServer.close();
      }
    });

    it('应该能够查询占用端口', () => {
      const result = execCommand(`node bin/who-port.js ${TEST_PORT} --no-log`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('端口占用信息查询结果');
      expect(result.output).toContain(TEST_PORT.toString());
    });

    it('应该支持 JSON 格式输出', () => {
      const result = execCommand(`node bin/who-port.js ${TEST_PORT} --json --no-log`);
      expect(result.success).toBe(true);

      const json = JSON.parse(result.output);
      expect(json.isOccupied).toBe(true);
      expect(json.port).toBe(TEST_PORT);
      expect(json.processCount).toBeGreaterThan(0);
    });

    it('应该支持详细模式', () => {
      const result = execCommand(`node bin/who-port.js ${TEST_PORT} --verbose --no-log`);
      expect(result.output).toContain('工作目录');
    });

    it('应该能够查询空闲端口', () => {
      const FREE_PORT = 19876;
      const result = execCommand(`node bin/who-port.js ${FREE_PORT} --no-log`);
      expect(result.output).toContain('未被占用');
    });
  });

  describe('日志记录功能', () => {
    it('应该记录日志到文件', async () => {
      const fs = await import('fs');
      const TEST_PORT = 18766;
      const testServer = await startTestServerInChildProcess(TEST_PORT);
      await new Promise(resolve => setTimeout(resolve, 500));

      execCommand(`node bin/who-port.js ${TEST_PORT}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      testServer.kill();

      const logExists = fs.existsSync('logs/who-port.log');
      expect(logExists).toBe(true);

      if (logExists) {
        const logContent = fs.readFileSync('logs/who-port.log', 'utf-8');
        expect(logContent).toContain('命令开始');
        expect(logContent).toContain('查询结果');
      }
    });
  });

  describe('进程信息完整性', () => {
    let testServer = null;
    const TEST_PORT = 18767;

    beforeAll(async () => {
      testServer = await startTestServerInChildProcess(TEST_PORT);
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    afterAll(() => {
      if (testServer) {
        testServer.close();
      }
    });

    it('应该返回完整的进程信息', () => {
      const result = execCommand(`node bin/who-port.js ${TEST_PORT} --json --no-log`);
      expect(result.success).toBe(true);

      const json = JSON.parse(result.output);
      expect(json.processes).toBeDefined();
      expect(json.processes.length).toBeGreaterThan(0);

      const proc = json.processes[0];
      const requiredFields = ['command', 'pid', 'user', 'port', 'startTime', 'processInfo'];
      const missingFields = requiredFields.filter(field => !(field in proc));

      expect(missingFields).toHaveLength(0);
      expect(proc.command).toBeDefined();
      expect(proc.pid).toBeDefined();
      expect(proc.user).toBeDefined();
    });
  });
});
