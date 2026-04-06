import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawn } from 'child_process';

/**
 * Vitest 测试：x-scan-ports 命令
 */

describe('x-scan-ports 命令', () => {
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
      const result = execCommand(`node bin/scan-ports.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('扫描指定范围内的端口占用情况');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/scan-ports.js --version`);
      expect(result.success).toBe(true);
      expect(result.output.trim()).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('扫描功能', () => {
    const START_PORT = 18800;
    const END_PORT = 18810;
    const testServers = [];
    const testPorts = [18801, 18805, 18808];

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
      const result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --no-log --quiet`);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/端口扫描汇总 | ┌/);
    });

    it('应该支持 JSON 格式输出', () => {
      const result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --json --no-log --quiet`);
      expect(result.success).toBe(true);

      const json = JSON.parse(result.output);
      expect(json.summary).toBeDefined();
      expect(json.results).toBeDefined();
      expect(Array.isArray(json.results)).toBe(true);
    });

    it('应该支持简洁模式', () => {
      const result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --simple --no-log`);
      expect(result.success).toBe(true);
    });

    it('应该支持只显示占用端口', () => {
      const result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --only-occupied --no-log --quiet`);
      expect(result.success).toBe(true);
    });

    it('应该支持安静模式', () => {
      const result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --quiet --no-log`);
      expect(result.success).toBe(true);
    });
  });

  describe('日志记录功能', () => {
    it('应该记录日志到文件', async () => {
      const fs = await import('fs');
      const START_PORT = 18820;
      const END_PORT = 18830;

      execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --quiet`);
      await new Promise(resolve => setTimeout(resolve, 500));

      const logExists = fs.existsSync('logs/scan-ports.log');
      expect(logExists).toBe(true);

      if (logExists) {
        const logContent = fs.readFileSync('logs/scan-ports.log', 'utf-8');
        expect(logContent).toContain('命令开始');
        expect(logContent).toContain('扫描完成');
      }
    });
  });

  describe('文件保存功能', () => {
    it('应该能够保存到文件', async () => {
      const fs = await import('fs');
      const START_PORT = 18840;
      const END_PORT = 18850;
      const outputFile = 'test-scan-result.txt';

      const result = execCommand(`node bin/scan-ports.js ${START_PORT} ${END_PORT} --file ${outputFile} --no-log`);
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(result.success).toBe(true);
      expect(fs.existsSync(outputFile)).toBe(true);

      if (fs.existsSync(outputFile)) {
        const content = fs.readFileSync(outputFile, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
        fs.unlinkSync(outputFile);
      }
    });
  });

  describe('错误处理', () => {
    it('应该正确处理无效端口范围', () => {
      const result = execCommand(`node bin/scan-ports.js 10000 9000 --no-log 2>&1`);
      expect(result.output).toMatch(/错误 | 无效/);
      expect(result.success).toBe(false);
    });
  });

  describe('扫描准确性', () => {
    const testPorts = [18801, 18805, 18808];
    const testServers = [];

    beforeAll(async () => {
      for (const port of testPorts) {
        try {
          const server = await startTestServerInChildProcess(port);
          testServers.push(server);
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          // 忽略
        }
      }
    });

    afterAll(() => {
      for (const server of testServers) {
        if (server) server.kill();
      }
    });

    it('应该准确检测占用端口', () => {
      const result = execCommand(`node bin/scan-ports.js 18800 18810 --json --no-log --quiet`);
      expect(result.success).toBe(true);

      const json = JSON.parse(result.output);
      const occupiedPorts = json.results.filter(r => r.isOccupied).map(r => r.port);

      // 检查是否检测到了测试端口
      const foundTestPorts = testPorts.filter(port => occupiedPorts.includes(port));
      expect(foundTestPorts.length).toBeGreaterThanOrEqual(2);
    });
  });
});
