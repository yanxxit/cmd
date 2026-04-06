import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

/**
 * Vitest 测试：x-system-top 命令
 */

describe('x-system-top 命令', () => {
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

  describe('基本功能', () => {
    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/system-top.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('查询系统资源占用前列的进程');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/system-top.js --version`);
      expect(result.success).toBe(true);
      expect(result.output.trim()).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('查询功能', () => {
    it('应该能够查询系统资源', () => {
      const result = execCommand(`node bin/system-top.js -n 5 --no-log`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('系统资源概览');
    });

    it('应该支持按 CPU 排序', () => {
      const result = execCommand(`node bin/system-top.js -n 5 -s cpu --no-log`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('CPU');
    });

    it('应该支持按内存排序', () => {
      const result = execCommand(`node bin/system-top.js -n 5 -s memory --no-log`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Memory');
    });
  });

  describe('JSON 格式输出', () => {
    it('应该支持 JSON 格式', () => {
      const result = execCommand(`node bin/system-top.js -n 3 -j --no-log`);
      expect(result.success).toBe(true);

      const json = JSON.parse(result.output);
      expect(json.system).toBeDefined();
      expect(json.processes).toBeDefined();
      expect(Array.isArray(json.processes)).toBe(true);
    });
  });

  describe('显示选项', () => {
    it('应该支持不显示头部', () => {
      const result = execCommand(`node bin/system-top.js -n 3 --no-header --no-log`);
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('系统资源概览');
      expect(result.output).toContain('┌');
    });
  });

  describe('日志记录功能', () => {
    it('应该记录日志到文件', async () => {
      const fs = await import('fs');

      execCommand(`node bin/system-top.js -n 3`);
      await new Promise(resolve => setTimeout(resolve, 500));

      const logExists = fs.existsSync('logs/system-top.log');
      expect(logExists).toBe(true);

      if (logExists) {
        const logContent = fs.readFileSync('logs/system-top.log', 'utf-8');
        expect(logContent).toContain('命令开始');
        expect(logContent).toContain('查询完成');
      }
    });
  });

  describe('文件保存功能', () => {
    it('应该能够保存到文件', async () => {
      const fs = await import('fs');
      const outputFile = 'test-system-top-result.txt';

      const result = execCommand(`node bin/system-top.js -n 5 --file ${outputFile} --no-log`);
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(result.success).toBe(true);
      expect(fs.existsSync(outputFile)).toBe(true);

      if (fs.existsSync(outputFile)) {
        const content = fs.readFileSync(outputFile, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
        expect(content).toContain('系统资源概览');
        fs.unlinkSync(outputFile);
      }
    });
  });

  describe('进程信息完整性', () => {
    it('应该返回完整的进程信息', () => {
      const result = execCommand(`node bin/system-top.js -n 3 -j --no-log`);
      expect(result.success).toBe(true);

      const json = JSON.parse(result.output);
      expect(json.processes).toBeDefined();
      expect(json.processes.length).toBeGreaterThan(0);

      const proc = json.processes[0];
      const requiredFields = ['pid', 'command', 'cpu', 'mem', 'rss', 'user'];
      const missingFields = requiredFields.filter(field => !(field in proc));

      expect(missingFields).toHaveLength(0);
      expect(proc.pid).toBeDefined();
      expect(proc.command).toBeDefined();
    });
  });
});
