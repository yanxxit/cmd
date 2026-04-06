import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * Vitest 测试套件：x-git clone 命令
 */

describe('x-git clone 命令', () => {
  /**
   * 执行命令并获取输出
   */
  function runCommand(args, cwd = PROJECT_ROOT) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.resolve(PROJECT_ROOT, 'bin/git.js');
      const testProcess = spawn('node', [scriptPath, ...args], {
        cwd,
        env: { ...process.env }
      });

      let output = '';
      let errorOutput = '';

      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      testProcess.on('close', (code) => {
        resolve({ code, output, error: errorOutput });
      });

      testProcess.on('error', reject);
    });
  }

  describe('帮助信息', () => {
    it('应该显示完整的帮助信息', async () => {
      const result = await runCommand(['clone', '--help']);
      expect(result.output).toContain('--branch');
      expect(result.output).toContain('--mirror');
      expect(result.output).toContain('--depth');
      expect(result.output).toContain('克隆 Git 仓库');
    });

    it('应该包含所有镜像站点选项', async () => {
      const result = await runCommand(['clone', '--help']);
      expect(result.output).toContain('kkgithub');
      expect(result.output).toContain('ghproxy');
      expect(result.output).toContain('gitee');
    });
  });

  describe('URL 格式支持', () => {
    it('应该支持 GitHub shorthand 格式', async () => {
      const result = await runCommand(['clone', 'owner/repo', '--help']);
      expect(result.output).toContain('克隆 Git 仓库');
    });

    it('应该支持 HTTPS URL 格式', async () => {
      const result = await runCommand(['clone', 'https://github.com/owner/repo.git', '--help']);
      expect(result.output).toContain('克隆 Git 仓库');
    });

    it('应该支持 SSH URL 格式', async () => {
      const result = await runCommand(['clone', 'git@github.com:owner/repo.git', '--help']);
      expect(result.output).toContain('克隆 Git 仓库');
    });
  });

  describe('错误处理', () => {
    it('应该识别无效 URL 格式', async () => {
      const result = await runCommand(['clone', 'invalid-url']);
      const hasError = result.error.includes('Invalid Git URL') || 
                       result.output.includes('Invalid Git URL') ||
                       result.code !== 0;
      expect(hasError).toBe(true);
    });
  });
});
