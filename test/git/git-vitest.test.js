import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { spawn, execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * Vitest 测试套件：x-git 统一命令
 */

describe('x-git CLI', () => {
  const testDir = path.join(PROJECT_ROOT, 'test-git-temp');

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

  /**
   * 清理测试目录
   */
  async function cleanupTestDir(dir) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (e) {
      // 忽略清理错误
    }
  }

  /**
   * 创建测试 Git 仓库
   */
  async function setupTestRepo(dir) {
    await cleanupTestDir(dir);
    await fs.mkdir(dir, { recursive: true });

    execSync('git init', { cwd: dir, stdio: 'pipe' });
    execSync('git config user.name "Test User"', { cwd: dir, stdio: 'pipe' });
    execSync('git config user.email "test@example.com"', { cwd: dir, stdio: 'pipe' });

    await fs.writeFile(path.join(dir, 'README.md'), '# Test Repo\n');
    execSync('git add README.md', { cwd: dir, stdio: 'pipe' });
    execSync('git commit -m "Initial commit"', { cwd: dir, stdio: 'pipe' });
  }

  // 清理钩子
  afterAll(async () => {
    await cleanupTestDir(testDir);
  });

  describe('基本功能', () => {
    it('应该显示主帮助信息', async () => {
      const result = await runCommand(['--help']);
      expect(result.output).toContain('clone');
      expect(result.output).toContain('commit');
      expect(result.output).toContain('log');
      expect(result.output).toContain('log-server');
      expect(result.output).toContain('sparse');
    });

    it('应该显示正确的版本号', async () => {
      const result = await runCommand(['--version']);
      expect(result.output).toContain('1.0.0');
    });
  });

  describe('clone 命令', () => {
    it('应该显示帮助信息', async () => {
      const result = await runCommand(['clone', '--help']);
      expect(result.output).toContain('--branch');
      expect(result.output).toContain('--mirror');
      expect(result.output).toContain('--depth');
    });

    it('应该支持 GitHub shorthand 格式', async () => {
      const result = await runCommand(['clone', 'owner/repo', '--help']);
      expect(result.output).toContain('克隆 Git 仓库');
    });
  });

  describe('commit 命令', () => {
    it('应该显示帮助信息', async () => {
      const result = await runCommand(['commit', '--help']);
      expect(result.output).toContain('--staged');
      expect(result.output).toContain('--all');
      expect(result.output).toContain('--type');
      expect(result.output).toContain('--interactive');
    });

    it('应该正确识别非 Git 仓库', async () => {
      const os = await import('os');
      const nonGitDir = await fs.mkdtemp(path.join(os.tmpdir(), 'non-git-'));
      
      try {
        const result = await runCommand(['commit'], nonGitDir);
        const hasError = result.error.includes('当前目录不是 Git 仓库') || 
                         result.output.includes('当前目录不是 Git 仓库') ||
                         result.code === 1;
        expect(hasError).toBe(true);
      } finally {
        await fs.rm(nonGitDir, { recursive: true, force: true });
      }
    });

    it('应该正确处理暂存区无变更', async () => {
      await setupTestRepo(testDir);
      const result = await runCommand(['commit'], testDir);
      
      const hasNoChange = result.output.includes('暂存区没有变更') || 
                          result.output.includes('没有变更') ||
                          result.output.includes('git add');
      expect(hasNoChange).toBe(true);
    });

    it('应该正确识别暂存区变更', async () => {
      await setupTestRepo(testDir);
      
      await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("hello");\n');
      execSync('git add test.js', { cwd: testDir, stdio: 'pipe' });
      
      const result = await runCommand(['commit', '--no-api'], testDir);
      expect(result.output).toMatch(/test\.js|变更统计/);
    });

    it('应该支持详细模式显示文件列表', async () => {
      await setupTestRepo(testDir);
      
      await fs.writeFile(path.join(testDir, 'stats.js'), 'console.log(1);\n');
      execSync('git add stats.js', { cwd: testDir, stdio: 'pipe' });
      
      const result = await runCommand(['commit', '-v', '--no-api'], testDir);
      const fullOutput = result.output + result.error;
      // 在详细模式下，应该显示文件列表或统计信息
      expect(fullOutput).toMatch(/stats\.js|文件数|变更统计/);
    });

    it('应该支持指定 type 选项', async () => {
      await setupTestRepo(testDir);
      
      await fs.writeFile(path.join(testDir, 'fix.js'), 'const x = 1;\n');
      execSync('git add fix.js', { cwd: testDir, stdio: 'pipe' });
      
      const result = await runCommand(['commit', '--type', 'fix', '--no-api'], testDir);
      const fullOutput = result.output + result.error;
      // --no-api 模式下主要验证命令能正常执行
      expect(result.code).toBe(0);
    });
  });

  describe('log 命令', () => {
    it('应该显示帮助信息', async () => {
      const result = await runCommand(['log', '--help']);
      expect(result.output).toContain('--date');
      expect(result.output).toContain('--since');
      expect(result.output).toContain('--month');
      expect(result.output).toContain('--format');
    });

    it('应该生成今天的报告', async () => {
      await setupTestRepo(testDir);
      const outputPath = path.join(testDir, 'test-today.html');
      const result = await runCommand(['log', '-d', 'today', '-o', outputPath], testDir);
      
      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('应该生成 JSON 格式报告', async () => {
      await setupTestRepo(testDir);
      const outputPath = path.join(testDir, 'test-report.json');
      await runCommand(['log', '-d', 'today', '-f', 'json', '-o', outputPath], testDir);
      
      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);
      // JSON 文件应该有内容
      expect(stats.size).toBeGreaterThan(0);
    });

    it('应该支持日期范围查询', async () => {
      await setupTestRepo(testDir);
      const outputPath = path.join(testDir, 'test-range.html');
      const result = await runCommand([
        'log', 
        '--since', '2020-01-01', 
        '--until', '2030-12-31',
        '-o', outputPath
      ], testDir);
      
      const stats = await fs.stat(outputPath);
      expect(stats.isFile()).toBe(true);
    });
  });

  describe('log-server 命令', () => {
    it('应该显示帮助信息', async () => {
      const result = await runCommand(['log-server', '--help']);
      expect(result.output).toContain('--port');
      expect(result.output).toContain('--host');
      expect(result.output).toContain('--open');
    });

    it('应该能够启动服务器', async () => {
      return new Promise((resolve, reject) => {
        const serverProcess = spawn('node', [path.resolve(PROJECT_ROOT, 'bin/git.js'), 'log-server'], {
          cwd: PROJECT_ROOT,
          env: { ...process.env }
        });

        let started = false;
        const timeout = setTimeout(() => {
          if (!started) {
            serverProcess.kill();
            reject(new Error('服务器启动超时'));
          }
        }, 5000);

        serverProcess.stdout.on('data', (data) => {
          const output = data.toString();
          if (output.includes('Git 日志服务器已启动') || output.includes('localhost:3000')) {
            started = true;
            clearTimeout(timeout);
            serverProcess.kill();
            resolve();
          }
        });

        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });
  });

  describe('sparse 命令', () => {
    it('应该显示帮助信息', async () => {
      const result = await runCommand(['sparse', '--help']);
      expect(result.output).toContain('--repo-url');
      expect(result.output).toContain('--target-path');
      expect(result.output).toContain('--output-dir');
    });

    it('应该有正确的默认参数', async () => {
      const result = await runCommand(['sparse', '--help']);
      expect(result.output).toContain('https://gitee.com/yanxxit/conf.git');
      expect(result.output).toContain('main');
      expect(result.output).toContain('vim');
    });
  });
});
