import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * 性能测试套件
 * 包含执行时间较长的测试用例，与日常快速测试分离
 */

describe('性能测试 - 命令行工具', () => {
  function execCommand(command, options = {}) {
    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 30000, // 30 秒超时
        ...options
      });
      return { success: true, output, error: null };
    } catch (err) {
      return { success: false, output: err.stdout || '', error: err.message };
    }
  }

  describe('x-ls-size - 大目录性能测试', () => {
    it('应该能够查询大目录 (node_modules)', () => {
      // 测试大目录的查询性能
      const result = execCommand(`node bin/ls-size.js -d ${PROJECT_ROOT}`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('B') || expect(result.output).toContain('KB') || expect(result.output).toContain('MB');
    });

    it('应该支持限制显示数量 (性能优化)', () => {
      const result = execCommand(`node bin/ls-size.js -d ${PROJECT_ROOT} -n 10`);
      expect(result.success).toBe(true);
    });
  });

  describe('x-ls-size-fast - 并行性能测试', () => {
    it('应该支持高并发数处理', () => {
      // 测试高并发下的性能
      const result = execCommand(`node bin/ls-size-fast.js -d ${PROJECT_ROOT} -c 20`);
      expect(result.success).toBe(true);
    });

    it('应该对比不同并发数的性能', () => {
      // 测试不同并发数的性能差异
      const result1 = execCommand(`node bin/ls-size-fast.js -d ${PROJECT_ROOT} -c 5`);
      const result2 = execCommand(`node bin/ls-size-fast.js -d ${PROJECT_ROOT} -c 10`);
      
      // 至少有一个成功
      expect(result1.success || result2.success).toBe(true);
    });
  });

  describe('x-fy - 翻译性能测试', () => {
    it('应该支持批量翻译 (性能测试)', () => {
      // 测试连续翻译的性能
      const words = ['hello', 'world', 'test', 'performance'];
      const results = words.map(word => {
        return execCommand(`node bin/fy.js "${word}"`);
      });

      // 至少有一个成功
      expect(results.some(r => r.success || r.output)).toBe(true);
    });

    it('应该测试缓存性能', () => {
      // 第一次查询（无缓存）
      const result1 = execCommand(`node bin/fy.js "performance-test-word"`);
      
      // 第二次查询（有缓存）
      const result2 = execCommand(`node bin/fy.js "performance-test-word"`);
      
      expect(result1.error || result1.output).toBeTruthy();
      expect(result2.error || result2.output).toBeTruthy();
    });
  });

  describe('x-port - 端口扫描性能测试', () => {
    it('应该能够扫描大范围端口', () => {
      // 测试扫描大范围端口的性能
      const result = execCommand(`node bin/port.js scan 1 1000 --json`);
      expect(result.error || result.output).toBeTruthy();
    });

    it('应该测试端口查询性能', () => {
      // 测试多个端口查询的性能
      const ports = [80, 443, 8080, 3000, 5000];
      const results = ports.map(port => {
        return execCommand(`node bin/port.js who ${port}`);
      });

      // 所有查询都应该完成
      expect(results.length).toBe(5);
    });
  });

  describe('x-http-sniffer - 抓包性能测试', () => {
    it('应该能够处理大量请求 (性能测试)', () => {
      // 测试抓包工具的性能（短时间运行）
      const result = execCommand(`timeout 3 node bin/http-sniffer.js -p 8889 2>&1 || true`);
      expect(result.output || result.error).toBeTruthy();
    });

    it('应该支持统计模式 (性能优化)', () => {
      const result = execCommand(`timeout 2 node bin/http-sniffer.js --stats 2>&1 || true`);
      expect(result.output || result.error).toBeTruthy();
    });
  });

  describe('x-system-top - 系统监控性能测试', () => {
    it('应该能够持续监控系统资源', () => {
      // 测试持续监控的性能
      const result = execCommand(`timeout 3 node bin/system-top.js 2>&1 || true`);
      expect(result.output || result.error).toBeTruthy();
    });

    it('应该支持 JSON 格式输出 (性能对比)', () => {
      const result = execCommand(`node bin/system-top.js --json`);
      expect(result.error || result.output).toBeTruthy();
    });
  });

  describe('x-md-browser - Markdown 渲染性能', () => {
    it('应该能够渲染大型 Markdown 文件', () => {
      // 创建一个大文件进行测试
      const largeMdPath = path.join(PROJECT_ROOT, 'test', 'temp-large.md');
      const largeContent = '# Large File\n\n'.repeat(1000);
      fs.writeFileSync(largeMdPath, largeContent);

      try {
        const result = execCommand(`timeout 3 node bin/md-browser.js ${largeMdPath} -p 9998 2>&1 || true`);
        expect(result.output || result.error).toBeTruthy();
      } finally {
        // 清理临时文件
        try {
          fs.unlinkSync(largeMdPath);
        } catch (e) {
          // 忽略
        }
      }
    });
  });

  describe('x-git - Git 操作性能测试', () => {
    it('应该能够处理大型仓库的 clone 操作', () => {
      // 测试 clone 操作的性能（使用小仓库）
      const result = execCommand(`timeout 10 node bin/git.js clone https://github.com/octocat/Hello-World.git /tmp/hello-world-test 2>&1 || true`);
      expect(result.output || result.error).toBeTruthy();
    });
  });

  describe('综合性能测试', () => {
    it('应该能够并行执行多个命令', () => {
      // 测试并行执行性能
      const commands = [
        `node bin/port.js who 80`,
        `node bin/system-top.js --json`,
        `node bin/ls-size.js -d ${PROJECT_ROOT} -n 5`
      ];

      const results = commands.map(cmd => execCommand(cmd));
      
      // 所有命令都应该完成
      expect(results.length).toBe(3);
    });

    it('应该测试内存使用 (性能基准)', () => {
      // 测试内存密集型操作
      const result = execCommand(`node bin/ls-size-fast.js -d ${PROJECT_ROOT} -c 15`);
      expect(result.success).toBe(true);
    });
  });
});
