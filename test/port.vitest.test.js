import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawn } from 'child_process';
import http from 'http';

/**
 * Vitest 测试：统一的 port 命令
 */

describe('x-port 统一命令', () => {
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
      const result = execCommand(`node bin/port.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('统一的端口管理工具');
      expect(result.output).toContain('who');
      expect(result.output).toContain('kill');
      expect(result.output).toContain('scan');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/port.js --version`);
      expect(result.success).toBe(true);
      expect(result.output.trim()).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('who 命令 - 查询端口', () => {
    let testServer = null;
    const TEST_PORT = 19001;

    beforeAll(async () => {
      testServer = await startTestServerInChildProcess(TEST_PORT);
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    afterAll(() => {
      if (testServer) {
        testServer.kill();
      }
    });

    it('应该能够查询占用端口', () => {
      const result = execCommand(`node bin/port.js who ${TEST_PORT}`);
      expect(result.output).toContain(`端口 ${TEST_PORT}`);
      expect(result.output).toContain('被占用');
    });

    it('应该支持 JSON 格式输出', () => {
      const result = execCommand(`node bin/port.js who ${TEST_PORT} --json`);
      // JSON 模式下应该输出进程信息
      expect(result.output).toContain('PID');
    });

    it('应该能够查询空闲端口', () => {
      const FREE_PORT = 19999;
      const result = execCommand(`node bin/port.js who ${FREE_PORT}`);
      expect(result.output).toContain('未被占用');
    });

    it('应该正确处理无效端口号', () => {
      const result = execCommand(`node bin/port.js who 99999 2>&1`);
      expect(result.output).toContain('错误');
    });
  });

  describe('kill 命令 - 关闭端口', () => {
    it('应该能够强制关闭端口', async () => {
      const TEST_PORT = 19002;
      const testServer = await startTestServerInChildProcess(TEST_PORT);
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = execCommand(`node bin/port.js kill ${TEST_PORT} --force`);
      expect(result.output).toContain('成功关闭');
      expect(result.output).toContain('已释放');

      // 确认端口已释放
      await new Promise(resolve => setTimeout(resolve, 500));
      testServer.kill();
    });

    it('应该正确处理空闲端口', () => {
      const FREE_PORT = 19998;
      const result = execCommand(`node bin/port.js kill ${FREE_PORT} --force`);
      expect(result.output).toContain('未被占用');
    });

    it('应该正确处理无效端口号', () => {
      const result = execCommand(`node bin/port.js kill 99999 --force 2>&1`);
      expect(result.output).toContain('错误');
    });
  });

  describe('scan 命令 - 扫描端口', () => {
    const START_PORT = 19100;
    const END_PORT = 19110;
    const testServers = [];
    const testPorts = [19101, 19105, 19108];

    beforeAll(async () => {
      // 启动测试服务器
      for (const port of testPorts) {
        try {
          const server = await startTestServerInChildProcess(port);
          testServers.push(server);
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          // 忽略启动失败
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    afterAll(() => {
      // 关闭所有测试服务器
      for (const server of testServers) {
        if (server) server.kill();
      }
    });

    it('应该能够扫描端口范围', () => {
      const result = execCommand(`node bin/port.js scan ${START_PORT} ${END_PORT} --quiet`);
      expect(result.output).toContain('扫描结果汇总');
      expect(result.output).toContain('占用端口');
    });

    it('应该支持 JSON 格式输出', () => {
      const result = execCommand(`node bin/port.js scan ${START_PORT} ${END_PORT} --json --quiet`);
      expect(result.success).toBe(true);

      // 提取 JSON 部分（跳过可能的头部信息）
      const jsonStart = result.output.indexOf('{');
      const jsonStr = result.output.substring(jsonStart);
      const json = JSON.parse(jsonStr);
      
      expect(json.startPort).toBeDefined();
      expect(json.endPort).toBeDefined();
      expect(json.results).toBeDefined();
      expect(json.summary).toBeDefined();
    });

    it('应该支持只显示占用端口', () => {
      const result = execCommand(`node bin/port.js scan ${START_PORT} ${END_PORT} --only-occupied --quiet`);
      expect(result.output).toContain('占用端口');
    });

    it('应该支持安静模式', () => {
      const result = execCommand(`node bin/port.js scan ${START_PORT} ${END_PORT} --quiet`);
      expect(result.success).toBe(true);
    });

    it('应该正确处理无效端口范围', () => {
      const result = execCommand(`node bin/port.js scan 10000 9000 2>&1`);
      expect(result.output).toContain('错误');
    });
  });

  describe('集成测试', () => {
    it('应该能够完成完整的端口管理流程', async () => {
      const TEST_PORT = 19200;
      let testServer = null;

      try {
        // 1. 启动服务器
        testServer = await startTestServerInChildProcess(TEST_PORT);
        await new Promise(resolve => setTimeout(resolve, 500));

        // 2. 查询端口
        let result = execCommand(`node bin/port.js who ${TEST_PORT}`);
        expect(result.output).toContain('被占用');

        // 3. 关闭端口
        result = execCommand(`node bin/port.js kill ${TEST_PORT} --force`);
        expect(result.output).toContain('成功关闭');

        // 4. 验证端口已释放
        await new Promise(resolve => setTimeout(resolve, 500));
        result = execCommand(`node bin/port.js who ${TEST_PORT}`);
        expect(result.output).toContain('未被占用');
      } finally {
        if (testServer) testServer.kill();
      }
    });
  });
});
