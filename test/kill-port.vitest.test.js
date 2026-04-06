import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawn } from 'child_process';
import http from 'http';

/**
 * Vitest 测试：x-kill-port 命令
 */

describe('x-kill-port 命令', () => {
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
   * 检查端口是否被占用
   */
  function isPortOccupied(port) {
    try {
      const result = execCommand(`lsof -ti:${port}`);
      return result.success && result.output.trim().length > 0;
    } catch {
      return false;
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
      const result = execCommand(`node bin/kill-port.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('通过端口号关闭占用端口的应用程序');
    });

    it('应该显示正确的版本号', () => {
      const result = execCommand(`node bin/kill-port.js --version`);
      expect(result.success).toBe(true);
      expect(result.output.trim()).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('端口关闭功能', () => {
    let testServer = null;
    const TEST_PORT = 18866;

    beforeAll(async () => {
      testServer = await startTestServerInChildProcess(TEST_PORT);
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    afterAll(() => {
      if (testServer) {
        testServer.kill();
      }
    });

    it('应该能够强制关闭端口', async () => {
      const result = execCommand(`node bin/kill-port.js ${TEST_PORT} --force --no-log`);
      // 输出包含成功、已释放等关键词
      expect(result.output).toContain('成功');
      expect(result.output).toContain('已释放');

      // 确认端口已释放
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(isPortOccupied(TEST_PORT)).toBe(false);
    });

    it('应该正确处理空闲端口', () => {
      const FREE_PORT = 19977;
      const result = execCommand(`node bin/kill-port.js ${FREE_PORT} --force --no-log`);
      expect(result.output).toContain('未被占用');
    });

    it('应该正确处理无效端口号', () => {
      const result = execCommand(`node bin/kill-port.js 99999 --force --no-log 2>&1`);
      expect(result.output).toMatch(/无效 | 错误/);
    });
  });

  describe('日志记录功能', () => {
    it('应该记录日志到文件', async () => {
      const fs = await import('fs');
      const TEST_PORT = 18867;
      const testServer = await startTestServerInChildProcess(TEST_PORT);
      await new Promise(resolve => setTimeout(resolve, 500));

      execCommand(`node bin/kill-port.js ${TEST_PORT} --force`);
      await new Promise(resolve => setTimeout(resolve, 500));
      testServer.kill();

      const logExists = fs.existsSync('logs/kill-port.log');
      expect(logExists).toBe(true);

      if (logExists) {
        const logContent = fs.readFileSync('logs/kill-port.log', 'utf-8');
        expect(logContent).toContain('命令开始');
        expect(logContent).toContain('执行命令');
        expect(logContent).toContain('执行结果');
      }
    });
  });

  describe('非强制模式', () => {
    it('应该等待用户确认', async () => {
      const TEST_PORT = 18868;
      const testServer = await startTestServerInChildProcess(TEST_PORT);
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const output = execSync(`echo 'y' | node bin/kill-port.js ${TEST_PORT} --no-log`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore']
        });

        expect(output).toMatch(/成功 | 已释放 | 取消/);
      } catch (err) {
        // 管道可能因为进程提前结束而报错，检查端口是否已释放
        await new Promise(resolve => setTimeout(resolve, 500));
        expect(isPortOccupied(TEST_PORT)).toBe(false);
      }

      testServer.kill();
    });
  });

  describe('批量操作', () => {
    it('应该能够批量关闭多个端口', async () => {
      const ports = [18869, 18870, 18871];
      const servers = [];

      // 启动多个测试服务器
      for (const port of ports) {
        try {
          const server = await startTestServerInChildProcess(port);
          servers.push(server);
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          // 忽略启动失败
        }
      }

      // 批量关闭
      let batchSuccess = true;
      for (const port of ports) {
        if (isPortOccupied(port)) {
          const result = execCommand(`node bin/kill-port.js ${port} --force --no-log`);
          if (!result.output.includes('成功') && !result.output.includes('未被占用')) {
            batchSuccess = false;
          }
        }
      }

      expect(batchSuccess).toBe(true);

      // 关闭所有测试服务器
      for (const server of servers) {
        if (server) server.kill();
      }
    });
  });
});
