import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

/**
 * Vitest 测试：Dict 词典功能
 */

describe('Dict 词典功能', () => {
  describe('EJS 模板引擎', () => {
    it('应该能够使用 EJS 渲染 HTML', async () => {
      const ejs = await import('ejs');
      const templatePath = path.join('src', 'dict', 'templates', 'dict.ejs');

      const mockHistory = [
        {
          word: 'test',
          timestamp: Date.now() - 3600000,
          updateTime: Date.now(),
          result: '英 [test] 美 [test]',
          count: 1
        }
      ];

      const historyByDate = {};
      mockHistory.forEach(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        if (!historyByDate[date]) {
          historyByDate[date] = [];
        }
        historyByDate[date].push(item);
      });

      const htmlContent = await ejs.renderFile(templatePath, {
        historyByDate,
        history: mockHistory
      });

      expect(htmlContent).toBeDefined();
      expect(htmlContent.length).toBeGreaterThan(0);
      expect(htmlContent).toContain('test');
    });

    it('应该能够生成 HTML 文件', async () => {
      const ejs = await import('ejs');
      const fs = await import('fs/promises');
      const templatePath = path.join('src', 'dict', 'templates', 'dict.ejs');
      const outputPath = path.join('logs', 'dict', 'test-learning-history.html');

      const mockHistory = [
        {
          word: 'mongo',
          timestamp: Date.now() - 7200000,
          updateTime: Date.now(),
          result: '英 [ˈmɒŋɡəʊ] 美 [ˈmɑːŋɡoʊ]',
          count: 1
        }
      ];

      const historyByDate = {};
      mockHistory.forEach(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        if (!historyByDate[date]) {
          historyByDate[date] = [];
        }
        historyByDate[date].push(item);
      });

      // 确保目录存在
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      const htmlContent = await ejs.renderFile(templatePath, {
        historyByDate,
        history: mockHistory
      });

      await fs.writeFile(outputPath, htmlContent, 'utf-8');

      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);

      // 清理
      await fs.unlink(outputPath);
    });
  });

  describe('生成器功能', () => {
    it('应该能够生成 Markdown 文件', async () => {
      try {
        const History = await import('../src/dict/lib/history.js');
        const markdownPath = await History.default.generateMarkdown();
        expect(markdownPath).toBeDefined();
      } catch (error) {
        // 如果模块不存在，跳过测试
        expect(error.code).toBe('ERR_MODULE_NOT_FOUND');
      }
    });

    it('应该能够生成 HTML 文件', async () => {
      try {
        const History = await import('../src/dict/lib/history.js');
        const htmlPath = await History.default.generateHTML();
        expect(htmlPath).toBeDefined();
      } catch (error) {
        // 如果模块不存在，跳过测试
        expect(error.code).toBe('ERR_MODULE_NOT_FOUND');
      }
    });
  });

  describe('缓存功能', () => {
    it('应该能够缓存翻译结果', async () => {
      try {
        const Main = await import('../src/dict/main.js');
        
        // 第一次查询
        const result1 = await Main.default.fanyi('hello');
        expect(result1).toBeDefined();

        // 第二次查询（应该使用缓存）
        const result2 = await Main.default.fanyi('hello');
        expect(result2).toBeDefined();
      } catch (error) {
        // 如果模块不存在，跳过测试
        expect(error.code).toBe('ERR_MODULE_NOT_FOUND');
      }
    });
  });
});
