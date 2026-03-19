#!/usr/bin/env node

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import { program } from 'commander';
import {
  getCommitsByDate,
  getCommitsByDateRange,
  getCommitDiff,
  getCommitStats,
  getCurrentGitUser,
  getRemoteRepoInfo,
  getRepoStats
} from '../src/git/index.js';
import dayjs from 'dayjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * 执行 git 命令并返回结果
 */
function execGitCommand(command) {
  const { execSync } = import('child_process');
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (error) {
    return '';
  }
}

/**
 * 获取两个提交之间的 diff
 */
function getDiffBetweenCommits(oldHash, newHash, filePath) {
  const { execSync } = import('child_process');
  try {
    let command = `git diff ${oldHash} ${newHash}`;
    if (filePath) {
      command += ` -- "${filePath}"`;
    }
    return execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }).trim();
  } catch (error) {
    return '';
  }
}

/**
 * 获取文件的完整内容
 */
function getFileContent(hash, filePath) {
  const { execSync } = import('child_process');
  try {
    const content = execSync(`git show ${hash}:"${filePath}"`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
    return content;
  } catch (error) {
    return null;
  }
}

program
  .name('x-git-log-server')
  .description('启动 Git 日志可视化服务器，支持在线查看提交和代码差异')
  .version('1.0.0')
  .option('-p, --port <port>', '服务器端口', '3000')
  .option('--host <host>', '服务器主机', '127.0.0.1')
  .option('--open', '启动后自动打开浏览器')
  .action(async (options) => {
    const spinner = ora();
    const port = parseInt(options.port);
    const host = options.host;

    const app = express();
    const publicDir = path.join(PROJECT_ROOT, 'public', 'git-log');

    // 中间件
    app.use(express.json());
    app.use(express.static(publicDir));

    // API 路由

    /**
     * 获取提交列表
     * GET /api/commits?date=yesterday&since=2024-01-01&until=2024-01-31&author=xxx&noMerges=true&mine=true
     */
    app.get('/api/commits', async (req, res) => {
      try {
        const { date = 'yesterday', since, until, author, noMerges, mine } = req.query;

        let commits = [];

        if (since || until) {
          commits = await getCommitsByDateRange({
            since: since || dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
            until: until || dayjs().format('YYYY-MM-DD'),
            author: author || '',
            includeDiff: false
          });
        } else {
          // 处理 mine 选项
          let filterAuthor = author || '';
          if (mine === 'true' && !filterAuthor) {
            const gitUser = getCurrentGitUser();
            filterAuthor = gitUser.name || gitUser.email;
          }

          commits = await getCommitsByDate({
            date,
            author: filterAuthor,
            noMerges: noMerges === 'true' || mine === 'true',
            mine: mine === 'true'
          });
        }

        // 为每个提交添加统计信息
        const commitsWithStats = await Promise.all(commits.map(async (commit) => {
          const stats = getCommitStats(commit.hash);
          return {
            ...commit,
            files: stats.files,
            summary: stats.summary
          };
        }));

        res.json({
          success: true,
          data: commitsWithStats
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    /**
     * 获取单个提交的详细信息
     * GET /api/commits/:hash
     */
    app.get('/api/commits/:hash', async (req, res) => {
      try {
        const { hash } = req.params;
        const stats = getCommitStats(hash);
        const diffs = getCommitDiff(hash);

        res.json({
          success: true,
          data: {
            hash,
            shortHash: hash.substring(0, 7),
            files: stats.files,
            summary: stats.summary,
            diffs
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    /**
     * 获取两个提交之间的 diff
     * GET /api/diff?oldHash=xxx&newHash=yyy&filePath=zzz
     */
    app.get('/api/diff', async (req, res) => {
      try {
        const { oldHash, newHash, filePath } = req.query;

        if (!oldHash || !newHash) {
          return res.status(400).json({
            success: false,
            error: '缺少 oldHash 或 newHash 参数'
          });
        }

        const diff = await getDiffBetweenCommits(oldHash, newHash, filePath);

        res.json({
          success: true,
          data: {
            oldHash,
            newHash,
            filePath,
            diff
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    /**
     * 获取提交中某个文件的 diff（备用端点，使用查询参数）
     * GET /api/commit-diff?hash=xxx&filePath=yyy
     */
    app.get('/api/commit-diff', async (req, res) => {
      try {
        const { hash, filePath } = req.query;

        if (!hash || !filePath) {
          return res.status(400).json({
            success: false,
            error: '缺少 hash 或 filePath 参数'
          });
        }

        console.log(`[DEBUG] 获取 diff (query): hash=${hash}, filePath=${filePath}`);

        const diffs = getCommitDiff(hash);
        console.log(`[DEBUG] 找到 ${diffs.length} 个文件 diff`);

        // 尝试多种匹配方式
        let fileDiff = diffs.find(d => d.path === filePath);
        
        if (!fileDiff) {
          // 尝试解码后匹配
          const decodedPath = decodeURIComponent(filePath);
          fileDiff = diffs.find(d => d.path === decodedPath);
          console.log(`[DEBUG] 尝试解码匹配：${decodedPath}`);
        }
        
        if (!fileDiff) {
          // 尝试 basename 匹配
          const pathBasename = filePath.split('/').pop();
          fileDiff = diffs.find(d => d.path.split('/').pop() === pathBasename);
          console.log(`[DEBUG] 尝试 basename 匹配：${pathBasename}`);
        }

        if (!fileDiff) {
          console.log(`[DEBUG] 未找到文件 diff，可用文件：`, diffs.map(d => d.path));
          return res.status(404).json({
            success: false,
            error: `未找到该文件的 diff: ${filePath}`,
            availableFiles: diffs.map(d => d.path)
          });
        }

        console.log(`[DEBUG] 找到文件 diff, content length: ${fileDiff.content?.length || 0}`);

        res.json({
          success: true,
          data: {
            path: fileDiff.path,
            content: fileDiff.content || '',
            oldPath: fileDiff.oldPath
          }
        });
      } catch (error) {
        console.error(`[ERROR] 获取 diff 失败:`, error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    /**
     * 获取提交中某个文件的 diff
     * GET /api/commits/:hash/diff/:filePath(*)
     */
    app.get('/api/commits/:hash/diff/:filePath(*)', async (req, res) => {
      try {
        const { hash, filePath } = req.params;
        const decodedFilePath = decodeURIComponent(filePath);

        console.log(`[DEBUG] 获取 diff: hash=${hash}, filePath=${decodedFilePath}`);

        const diffs = getCommitDiff(hash);
        console.log(`[DEBUG] 找到 ${diffs.length} 个文件 diff`);
        
        const fileDiff = diffs.find(d => {
          console.log(`[DEBUG] 比较路径：${d.path} === ${decodedFilePath} ? ${d.path === decodedFilePath}`);
          return d.path === decodedFilePath;
        });

        if (!fileDiff) {
          console.log(`[DEBUG] 未找到文件 diff`);
          return res.status(404).json({
            success: false,
            error: `未找到该文件的 diff: ${decodedFilePath}`
          });
        }

        console.log(`[DEBUG] 找到文件 diff, content length: ${fileDiff.content?.length || 0}`);

        res.json({
          success: true,
          data: {
            path: fileDiff.path,
            content: fileDiff.content || '',
            oldPath: fileDiff.oldPath
          }
        });
      } catch (error) {
        console.error(`[ERROR] 获取 diff 失败:`, error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    /**
     * 获取文件内容
     * GET /api/file/:hash/:filePath(*)
     */
    app.get('/api/file/:hash/:filePath(*)', async (req, res) => {
      try {
        const { hash, filePath } = req.params;
        const decodedFilePath = decodeURIComponent(filePath);

        const content = getFileContent(hash, decodedFilePath);

        if (content === null) {
          return res.status(404).json({
            success: false,
            error: '无法获取文件内容'
          });
        }

        res.json({
          success: true,
          data: {
            hash,
            filePath: decodedFilePath,
            content
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    /**
     * 获取仓库信息
     * GET /api/repo
     */
    app.get('/api/repo', async (req, res) => {
      try {
        const [remoteInfo, stats, currentUser] = await Promise.all([
          getRemoteRepoInfo(),
          getRepoStats(),
          Promise.resolve(getCurrentGitUser())
        ]);

        res.json({
          success: true,
          data: {
            remote: remoteInfo,
            stats,
            currentUser
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    /**
     * 获取所有分支
     * GET /api/branches
     */
    app.get('/api/branches', async (req, res) => {
      try {
        const { getBranches } = await import('../src/git/index.js');
        const branches = await getBranches();
        res.json({
          success: true,
          data: branches
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // 启动服务器
    const server = app.listen(port, host, () => {
      const url = `http://${host}:${port}`;
      spinner.succeed(`Git 日志服务器已启动：${chalk.cyan(url)}`);
      console.log(chalk.gray('  访问地址:'));
      console.log(chalk.gray(`    📊 可视化界面：${url}/`));
      console.log(chalk.gray(`    📡 API 文档：${url}/api/commits`));
      console.log('');
      console.log(chalk.gray('  按 Ctrl+C 停止服务器'));
      console.log('');

      // 自动打开浏览器
      if (options.open) {
        const { execSync } = import('child_process');
        try {
          if (process.platform === 'darwin') {
            execSync(`open "${url}"`);
          } else if (process.platform === 'win32') {
            execSync(`start "" "${url}"`);
          } else {
            execSync(`xdg-open "${url}"`);
          }
        } catch (error) {
          // 忽略打开浏览器失败
        }
      }
    });

    // 优雅关闭
    process.on('SIGINT', () => {
      console.log('\n' + chalk.yellow('正在关闭服务器...'));
      server.close(() => {
        console.log(chalk.green('服务器已关闭'));
        process.exit(0);
      });
    });
  });

program.parse();
