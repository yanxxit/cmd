#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { cloneRepo } from '../src/git/clone.js';
import {
  getStagedFiles,
  getAllChangedFiles,
  getStagedDiff,
  getAllDiff,
  getDiffStats,
  generateCommitMessage,
  interactiveSelectType,
  interactiveConfirm,
  interactiveEdit,
  COMMIT_TYPES
} from '../src/git/commit.js';
import { createGitLogServer } from '../src/git/log-server.js';
import { generateLogReport } from '../src/git/log.js';
import sparseClone from '../src/git/sparseClone.js';
import { execSync } from 'child_process';
import ora from 'ora';
import readline from 'readline';

program
  .name('x-git')
  .description('统一的 Git 命令行工具')
  .version('1.0.0');

// clone 子命令
program
  .command('clone <repository> [destination]')
  .description('克隆 Git 仓库（支持镜像加速）')
  .option('-b, --branch <branch>', '克隆指定分支')
  .option('--single-branch', '仅克隆单个分支')
  .option('-d, --depth <depth>', '浅克隆深度')
  .option('--mirror <mirror>', '指定镜像站点 (kkgithub/ghproxy/gitee/ghapi/gitclone/yumenaka/ghproxynet)')
  .action(async (repository, destination, options) => {
    try {
      try {
        execSync('git --version', { stdio: 'pipe' });
      } catch (error) {
        console.error(chalk.red('错误：Git 未安装或不在 PATH 中'));
        process.exit(1);
      }

      await cloneRepo(repository, destination, {
        branch: options.branch,
        singleBranch: options.singleBranch,
        depth: options.depth ? parseInt(options.depth) : undefined,
        mirror: options.mirror
      });
    } catch (error) {
      console.error(chalk.red('克隆失败:'), error.message);
      process.exit(1);
    }
  });

// commit 子命令
program
  .command('commit')
  .description('根据当前变更生成符合规范的 git commit 信息')
  .option('-s, --staged', '仅使用暂存区的变更（默认）')
  .option('-a, --all', '使用所有工作区的变更')
  .option('-c, --copy', '生成后自动复制到剪贴板')
  .option('-v, --verbose', '显示详细信息')
  .option('-t, --type <type>', '指定 commit type')
  .option('--scope <scope>', '指定 commit scope')
  .option('-i, --interactive', '交互模式')
  .option('--no-api', '不使用 AI，仅显示变更文件列表')
  .action(async (options) => {
    const spinner = ora();

    try {
      try {
        execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      } catch (error) {
        console.error(chalk.red('错误：当前目录不是 Git 仓库'));
        process.exit(1);
      }

      spinner.text = '正在分析变更...';
      spinner.start();

      let files = [];
      let diff = '';
      const useStaged = options.staged || !options.all;

      if (useStaged) {
        files = getStagedFiles();
        diff = getStagedDiff();

        if (files.length === 0) {
          spinner.warn('暂存区没有变更');
          console.log(chalk.yellow('提示：使用 git add 添加文件到暂存区，或使用 -a 参数查看所有变更'));
          return;
        }
      } else {
        files = getAllChangedFiles();
        diff = getAllDiff();

        if (files.length === 0) {
          spinner.warn('没有任何变更');
          return;
        }
      }

      const stats = getDiffStats(diff);

      if (options.api === false) {
        if (spinner.isSpinning) spinner.stop();
        console.log(chalk.cyan('\n变更统计:'));
        console.log(chalk.gray(`  文件数：${files.length}`));
        console.log(chalk.gray(`  新增行数：+${stats.additions}`));
        console.log(chalk.gray(`  删除行数：-${stats.deletions}`));
        console.log(chalk.gray(`  提示：使用 -s 或 -a 参数生成 commit message\n`));
        return;
      }

      if (options.verbose) {
        spinner.stop();
        console.log(chalk.cyan('\n变更文件:'));
        files.forEach(file => console.log(`  - ${file}`));
        console.log('');
        spinner.start('正在生成提交信息...');
      }

      let selectedType = options.type;
      if (options.interactive && !selectedType) {
        spinner.stop();
        selectedType = await interactiveSelectType();
        spinner.start('正在生成提交信息...');
      }

      const lastCommitMessage = (() => {
        try {
          return execSync('git log -1 --pretty=%B', {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
          }).trim();
        } catch (error) {
          return '';
        }
      })();

      const commitMessage = await generateCommitMessage(diff, files, lastCommitMessage, {
        type: selectedType,
        scope: options.scope
      });

      spinner.succeed('生成完成');

      if (options.interactive) {
        console.log('\n' + chalk.green('📝 建议的 commit message:'));
        console.log(chalk.cyan('='.repeat(50)));
        console.log(chalk.white(commitMessage));
        console.log(chalk.cyan('='.repeat(50)));

        let finalMessage = commitMessage;
        let confirm = await interactiveConfirm(finalMessage);

        while (confirm === 'edit') {
          finalMessage = await interactiveEdit(finalMessage);
          confirm = await interactiveConfirm(finalMessage);
        }

        if (confirm === 'no') {
          console.log(chalk.yellow('已取消提交'));
          return;
        }

        console.log('\n' + chalk.green('✅ 最终 commit message:'));
        console.log(chalk.cyan('='.repeat(50)));
        console.log(chalk.white(finalMessage));
        console.log(chalk.cyan('='.repeat(50)));

        if (options.copy) {
          try {
            if (process.platform === 'darwin') {
              execSync(`echo "${finalMessage}" | pbcopy`);
            } else if (process.platform === 'win32') {
              execSync(`echo ${finalMessage} | clip`);
            } else {
              try {
                execSync(`echo "${finalMessage}" | xclip -selection clipboard`);
              } catch (e) {
                console.log(chalk.yellow('⚠ 无法复制到剪贴板（需要安装 xclip）'));
              }
            }
            console.log(chalk.green('✓ 已复制到剪贴板'));
          } catch (error) {
            console.log(chalk.yellow('⚠ 复制失败，请手动复制'));
          }
        }

        console.log('\n' + chalk.gray('使用方法:'));
        console.log(`  git commit -m "${finalMessage}"\n`);
      } else {
        console.log('\n' + chalk.green('📝 建议的 commit message:'));
        console.log(chalk.cyan('='.repeat(50)));
        console.log(chalk.white(commitMessage));
        console.log(chalk.cyan('='.repeat(50)));

        if (options.copy) {
          try {
            if (process.platform === 'darwin') {
              execSync(`echo "${commitMessage}" | pbcopy`);
            } else if (process.platform === 'win32') {
              execSync(`echo ${commitMessage} | clip`);
            } else {
              try {
                execSync(`echo "${commitMessage}" | xclip -selection clipboard`);
              } catch (e) {
                console.log(chalk.yellow('⚠ 无法复制到剪贴板（需要安装 xclip）'));
              }
            }
            console.log(chalk.green('✓ 已复制到剪贴板'));
          } catch (error) {
            console.log(chalk.yellow('⚠ 复制失败，请手动复制'));
          }
        }

        console.log('\n' + chalk.gray('使用方法:'));
        console.log(`  git commit -m "${commitMessage}"`);
        if (options.copy) {
          console.log('  或直接粘贴：git commit -m "<Cmd+V>"');
        }
        console.log('');
      }

    } catch (error) {
      if (spinner.isSpinning) {
        spinner.fail();
      }
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

// log 子命令
program
  .command('log')
  .description('生成 Git 提交日志报告')
  .option('-d, --date <date>', '指定日期 (默认：yesterday)', 'yesterday')
  .option('--since <date>', '开始日期')
  .option('--until <date>', '结束日期')
  .option('-a, --author <author>', '按作者过滤')
  .option('-o, --output <path>', '输出文件路径', './git-log.html')
  .option('-f, --format <format>', '输出格式：html/json/md', 'html')
  .option('--diff', '包含详细的代码变更内容')
  .option('--open', '生成后自动在浏览器中打开（仅 HTML 格式）')
  .option('--all', '生成所有格式的报告（html + json + md）')
  .option('--month', '显示最近一个月的提交记录')
  .option('--no-merges', '排除 merge 提交')
  .option('--mine', '仅查看自己的提交记录')
  .action(async (options) => {
    try {
      await generateLogReport(options);
    } catch (error) {
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

// log-server 子命令
program
  .command('log-server')
  .description('启动 Git 日志可视化服务器')
  .option('-p, --port <port>', '服务器端口', '3000')
  .option('--host <host>', '服务器主机', '127.0.0.1')
  .option('--open', '启动后自动打开浏览器')
  .action(async (options) => {
    try {
      const server = createGitLogServer({
        port: parseInt(options.port),
        host: options.host,
        open: options.open
      });
      await server.start();
    } catch (error) {
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

// sparse 子命令
program
  .command('sparse')
  .description('Git 稀疏检出工具 - 拉取特定文件或目录')
  .option('-u, --repo-url <url>', '远程仓库地址', 'https://gitee.com/yanxxit/conf.git')
  .option('-b, --branch <branch>', '分支名称', 'main')
  .option('-t, --target-path <path>', '想要拉取的特定文件或文件夹名', 'vim')
  .option('-d, --local-dir <dir>', '本地文件夹名称')
  .option('-o, --output-dir <dir>', '最终输出目录', process.cwd())
  .option('-v, --verbose', '显示详细输出')
  .action(async (options) => {
    try {
      await sparseClone(options);
    } catch (error) {
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

program.parse();
