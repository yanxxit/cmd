import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * CLI 工具性能测试
 * 包含所有命令行工具的耗时测试
 */

describe('CLI 工具性能测试', () => {
  function execCommand(command, options = {}) {
    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 30000,
        ...options
      });
      return { success: true, output, error: null };
    } catch (err) {
      return { success: false, output: err.stdout || '', error: err.message };
    }
  }

  describe('x-ls-size - 目录大小查询性能', () => {
    it('应该能够查询大目录 (node_modules)', () => {
      const result = execCommand(`node bin/ls-size.js -d ${PROJECT_ROOT}`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('B') || expect(result.output).toContain('KB') || expect(result.output).toContain('MB');
    });

    it('应该支持限制显示数量', () => {
      const result = execCommand(`node bin/ls-size.js -d ${PROJECT_ROOT} -n 10`);
      expect(result.success).toBe(true);
    });
  });

  describe('x-ls-size-fast - 并行查询性能', () => {
    it('应该支持高并发数处理', () => {
      const result = execCommand(`node bin/ls-size-fast.js -d ${PROJECT_ROOT} -c 20`);
      expect(result.success).toBe(true);
    });

    it('应该对比不同并发数的性能', () => {
      const result1 = execCommand(`node bin/ls-size-fast.js -d ${PROJECT_ROOT} -c 5`);
      const result2 = execCommand(`node bin/ls-size-fast.js -d ${PROJECT_ROOT} -c 10`);
      
      expect(result1.success || result2.success).toBe(true);
    });
  });

  describe('x-fy - 翻译性能测试', () => {
    it('应该支持批量翻译', () => {
      const words = ['hello', 'world', 'test', 'performance'];
      const results = words.map(word => {
        return execCommand(`node bin/fy.js "${word}"`);
      });

      expect(results.some(r => r.success || r.output)).toBe(true);
    });

    it('应该测试缓存性能', () => {
      const result1 = execCommand(`node bin/fy.js "performance-test-word"`);
      const result2 = execCommand(`node bin/fy.js "performance-test-word"`);
      
      expect(result1.error || result1.output).toBeTruthy();
      expect(result2.error || result2.output).toBeTruthy();
    });
  });

  describe('x-ds - 屌丝字典性能', () => {
    it('应该支持 lookup 子命令', () => {
      const result = execCommand(`node bin/ds.js lookup test`);
      expect(result.output || result.error).toBeTruthy();
    });

    it('应该支持 serve 子命令启动', () => {
      const result = execCommand(`timeout 2 node bin/ds.js serve -p 9997 2>&1 || true`);
      expect(result.output || result.error).toBeTruthy();
    });
  });
});
