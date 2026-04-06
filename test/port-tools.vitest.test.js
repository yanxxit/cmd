import { describe, it, expect } from 'vitest';
import { execSync, spawn } from 'child_process';
import http from 'http';

/**
 * Vitest 测试：端口管理工具集综合测试
 * 包含：who-port, kill-port 集成测试
 */

describe('端口管理工具集 - 集成测试', () => {
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

  describe('完整工作流程：查询 -> 关闭 -> 验证', () => {
    it('应该能够完成完整的端口管理流程', async () => {
      const TEST_PORT = 18904;
      let testServer = null;

      try {
        // 1. 启动服务器
        testServer = await startTestServerInChildProcess(TEST_PORT);
        await new Promise(resolve => setTimeout(resolve, 500));

        // 2. 查询端口
        let result = execCommand(`node bin/who-port.js ${TEST_PORT} --no-log`);
        expect(result.output).toContain('端口占用信息查询结果');

        // 3. 关闭端口
        result = execCommand(`node bin/kill-port.js ${TEST_PORT} --force --no-log`);
        expect(result.output).toMatch(/成功 | 已释放/);

        // 4. 验证端口已释放
        await new Promise(resolve => setTimeout(resolve, 500));
        result = execCommand(`node bin/who-port.js ${TEST_PORT} --no-log`);
        expect(result.output).toContain('未被占用');
      } finally {
        if (testServer) testServer.kill();
      }
    });
  });
});
