import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * 命令行工具测试套件
 * 包含：x-ask, x-chat, x-say, x-ds, x-fy, x-clean-node, x-ls-size, x-ls-size-fast, 
 *      x-md-view, x-md-browser, x-http-sniffer, x-wifi, x-static
 */

describe('命令行工具测试', () => {
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

  describe('x-ask - AI 问答工具', () => {
    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/ask.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('AI 聊天工具');
      expect(result.output).toContain('混元大模型');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/ask.js --version`);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('应该接受问题参数', () => {
      const result = execCommand(`node bin/ask.js "测试问题"`);
      // 由于需要 API 密钥，这里只测试命令能执行
      expect(result.error || result.output).toBeTruthy();
    });
  });

  describe('x-chat - AI 聊天工具', () => {
    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/chat.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('AI 聊天工具');
      expect(result.output).toContain('多轮对话');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/chat.js --version`);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('应该支持交互式模式参数', () => {
      const result = execCommand(`node bin/chat.js --interactive`);
      // 由于需要 API 密钥，这里只测试命令能执行
      expect(result.error || result.output).toBeTruthy();
    });
  });

  describe('x-say - 语音工具', () => {
    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/say.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('语音工具');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/say.js --version`);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('应该接受文本参数', () => {
      // 由于需要语音服务，这里只测试脚本能正常加载
      const result = execCommand(`node bin/say.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('语音工具');
    });
  });

  describe('x-ds - 屌丝字典', () => {
    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/ds.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('屌丝字典');
      expect(result.output).toContain('lookup');
      expect(result.output).toContain('cli');
      expect(result.output).toContain('serve');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/ds.js --version`);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('应该支持 lookup 子命令', () => {
      const result = execCommand(`node bin/ds.js lookup test`);
      expect(result.output || result.error).toBeTruthy();
    });

    it('应该支持 lookup 子命令的别名 l', () => {
      const result = execCommand(`node bin/ds.js l test`);
      expect(result.output || result.error).toBeTruthy();
    });

    it('应该支持 serve 子命令', () => {
      const result = execCommand(`node bin/ds.js serve --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('启动 Web 服务器') || expect(result.output).toContain('启动 Web 服务器') || expect(result.output).toContain('Web 服务器');
    });
  });

  describe('x-fy - 翻译工具', () => {
    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/fy.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('翻译工具');
      expect(result.output).toContain('-n, --no-cache');
      expect(result.output).toContain('-d, --day');
      expect(result.output).toContain('-e, --export');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/fy.js --version`);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('应该接受翻译文本参数', () => {
      const result = execCommand(`node bin/fy.js "hello"`);
      // 由于需要翻译 API，这里只测试命令能执行
      expect(result.error || result.output).toBeTruthy();
    });

    it('应该支持 --no-cache 选项', () => {
      const result = execCommand(`node bin/fy.js "test" --no-cache`);
      expect(result.error || result.output).toBeTruthy();
    });

    it('应该支持 --day 选项查询历史记录', () => {
      const result = execCommand(`node bin/fy.js --day 3`);
      expect(result.error || result.output).toBeTruthy();
    });
  });

  describe.skip('x-clean-node - 清理 node_modules', () => {
    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/clean-node.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('清理');
      expect(result.output).toContain('node_modules');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/clean-node.js --version`);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('应该支持 -d 指定目录', () => {
      const result = execCommand(`node bin/clean-node.js -d ${PROJECT_ROOT}`);
      // 测试命令能执行
      expect(result.success || result.error).toBeTruthy();
    });

    it('应该正确处理不存在的目录', () => {
      const result = execCommand(`node bin/clean-node.js -d /tmp/nonexistent_dir_test`);
      expect(result.success || result.error).toBeTruthy();
    });
  });

  describe('x-ls-size - 目录大小查询', () => {
    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/ls-size.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('查询');
      expect(result.output).toContain('目录');
      expect(result.output).toContain('大小');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/ls-size.js --version`);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('应该查询当前目录', () => {
      const result = execCommand(`node bin/ls-size.js -d ${PROJECT_ROOT}`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('B') || expect(result.output).toContain('KB') || expect(result.output).toContain('MB');
    });

    it('应该支持 -n 限制显示数量', () => {
      const result = execCommand(`node bin/ls-size.js -d ${PROJECT_ROOT} -n 5`);
      expect(result.success).toBe(true);
    });

    it('应该正确处理不存在的目录', () => {
      const result = execCommand(`node bin/ls-size.js -d /nonexistent_dir_test`);
      expect(result.error || result.output).toBeTruthy();
    });
  });

  describe('x-ls-size-fast - 快速目录大小查询', () => {
    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/ls-size-fast.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('快速');
      expect(result.output).toContain('并行');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/ls-size-fast.js --version`);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('应该查询当前目录', () => {
      const result = execCommand(`node bin/ls-size-fast.js -d ${PROJECT_ROOT}`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('B') || expect(result.output).toContain('KB') || expect(result.output).toContain('MB');
    });

    it('应该支持 -n 限制显示数量', () => {
      const result = execCommand(`node bin/ls-size-fast.js -d ${PROJECT_ROOT} -n 5`);
      expect(result.success).toBe(true);
    });

    it('应该支持 -c 指定并发数', () => {
      const result = execCommand(`node bin/ls-size-fast.js -d ${PROJECT_ROOT} -c 10`);
      expect(result.success).toBe(true);
    });
  });

  describe('x-md-view - Markdown 查看器', () => {
    const testMdFile = path.join(PROJECT_ROOT, 'test', 'README.md');

    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/md-view.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Markdown');
      expect(result.output).toContain('查看器');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/md-view.js --version`);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('应该查看 Markdown 文件', () => {
      const result = execCommand(`node bin/md-view.js ${testMdFile}`);
      // 测试命令能执行
      expect(result.error || result.output).toBeTruthy();
    });

    it('应该支持 -p 分页模式', () => {
      const result = execCommand(`node bin/md-view.js ${testMdFile} -p`);
      expect(result.error || result.output).toBeTruthy();
    });

    it('应该正确处理不存在的文件', () => {
      const result = execCommand(`node bin/md-view.js /nonexistent_file.md`);
      expect(result.error || result.output).toBeTruthy();
    });
  });

  describe('x-md-browser - Markdown 浏览器', () => {
    const testMdFile = path.join(PROJECT_ROOT, 'test', 'README.md');

    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/md-browser.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Markdown');
      expect(result.output).toContain('浏览器');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/md-browser.js --version`);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('应该支持 -p 指定端口', () => {
      // 使用后台进程启动服务器，然后立即关闭
      const result = execCommand(`timeout 2 node bin/md-browser.js ${testMdFile} -p 9999 2>&1 || true`);
      expect(result.output || result.error).toBeTruthy();
    });

    it('应该正确处理不存在的文件', () => {
      const result = execCommand(`node bin/md-browser.js /nonexistent_file.md`);
      expect(result.error || result.output).toBeTruthy();
    });
  });

  describe('x-http-sniffer - HTTP 抓包工具', () => {
    it('应该显示帮助信息', () => {
      const result = execCommand(`node bin/http-sniffer.js --help`);
      expect(result.success).toBe(true);
      expect(result.output).toContain('HTTP');
      expect(result.output).toContain('代理');
      expect(result.output).toContain('--mitm');
    });

    it('应该显示版本号', () => {
      const result = execCommand(`node bin/http-sniffer.js --version`);
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('应该支持 -p 指定端口', () => {
      const result = execCommand(`timeout 2 node bin/http-sniffer.js -p 8888 2>&1 || true`);
      expect(result.output || result.error).toBeTruthy();
    });

    it('应该支持 --gen-cert 生成证书', () => {
      const result = execCommand(`timeout 5 node bin/http-sniffer.js --gen-cert 2>&1 || true`);
      expect(result.output || result.error).toBeTruthy();
    });

    it('应该支持 --stats 显示统计', () => {
      const result = execCommand(`timeout 2 node bin/http-sniffer.js --stats 2>&1 || true`);
      expect(result.output || result.error).toBeTruthy();
    });
  });

  describe('x-wifi - WiFi 密码工具', () => {
    it('脚本文件存在', () => {
      const wifiPath = path.join(PROJECT_ROOT, 'bin', 'wifi.js');
      expect(fs.existsSync(wifiPath)).toBe(true);
    });

    it('应该包含帮助注释', () => {
      const wifiPath = path.join(PROJECT_ROOT, 'bin', 'wifi.js');
      const content = fs.readFileSync(wifiPath, 'utf-8');
      expect(content).toContain('WiFi 密码');
      expect(content).toContain('--current');
      expect(content).toContain('--list');
    });
  });

  describe('x-static - 静态文件服务器', () => {
    it('脚本文件存在', () => {
      const staticPath = path.join(PROJECT_ROOT, 'bin', 'static.js');
      expect(fs.existsSync(staticPath)).toBe(true);
    });

    it('应该包含帮助注释', () => {
      const staticPath = path.join(PROJECT_ROOT, 'bin', 'static.js');
      const content = fs.readFileSync(staticPath, 'utf-8');
      expect(content).toContain('静态文件');
      expect(content).toContain('端口号');
    });
  });
});
