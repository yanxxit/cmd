#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import dayjs from 'dayjs';
import {
  getFullCommitLog,
  getCommitsByDateRange,
  generateHTMLReport,
  generateJSONReport,
  generateMarkdownReport,
  getCurrentGitUser
} from '../src/git/index.js';

/**
 * 格式化日期显示
 * @param {string} date - 日期字符串
 * @returns {string} - 格式化后的日期
 */
function formatDateDisplay(date) {
  if (date === 'yesterday') {
    return dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  }
  if (date === 'today') {
    return dayjs().format('YYYY-MM-DD');
  }
  return dayjs(date).format('YYYY-MM-DD');
}

// 配置 Commander.js
program
  .name('x-git-log')
  .description('读取指定日期的 Git 提交并生成 HTML/JSON/Markdown 报告')
  .version('1.0.0')
  .option('-d, --date <date>', '指定日期，格式：YYYY-MM-DD 或 yesterday/today (默认：yesterday)', 'yesterday')
  .option('--since <date>', '开始日期（日期范围），格式：YYYY-MM-DD')
  .option('--until <date>', '结束日期（日期范围），格式：YYYY-MM-DD')
  .option('-a, --author <author>', '按作者过滤（支持邮箱或姓名）')
  .option('-o, --output <path>', '输出文件路径', './git-log.html')
  .option('-f, --format <format>', '输出格式：html/json/md', 'html')
  .option('--diff', '包含详细的代码变更内容')
  .option('--open', '生成后自动在浏览器中打开（仅 HTML 格式）')
  .option('--all', '生成所有格式的报告（html + json + md）')
  .option('--month', '显示最近一个月的提交记录')
  .option('--no-merges', '排除 merge 提交')
  .option('--mine', '仅查看自己的提交记录（排除 merge 记录，自动使用 git config user.name/email）')
  .action(async (options) => {
    const spinner = ora();

    try {
      // 显示正在获取提交
      spinner.text = '正在获取 Git 提交...';
      spinner.start();

      let commits = [];
      let dateRange = '';
      let isMonthView = false;

      // 判断使用哪种模式
      if (options.month) {
        // 月度视图模式
        const until = dayjs().format('YYYY-MM-DD');
        const since = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        dateRange = `最近 30 天 (${since} ~ ${until})`;
        isMonthView = true;

        commits = await getCommitsByDateRange({
          since,
          until,
          author: options.author || '',
          includeDiff: options.diff
        });

        spinner.succeed(`找到 ${commits.length} 个提交（最近 30 天）`);
      } else if (options.since || options.until) {
        // 日期范围模式
        const since = options.since || dayjs().subtract(7, 'day').format('YYYY-MM-DD');
        const until = options.until || dayjs().format('YYYY-MM-DD');
        dateRange = `${since} ~ ${until}`;

        commits = await getCommitsByDateRange({
          since,
          until,
          author: options.author || '',
          includeDiff: options.diff
        });

        spinner.succeed(`找到 ${commits.length} 个提交`);
      } else {
        // 单日期模式
        const date = options.date;
        dateRange = formatDateDisplay(date);

        // 使用 mine 选项时，自动获取当前 git 用户
        let author = options.author || '';
        if (options.mine && !author) {
          const gitUser = getCurrentGitUser();
          if (gitUser.name || gitUser.email) {
            author = gitUser.name || gitUser.email;
            console.log(chalk.blue(`ℹ 使用当前 Git 用户：${chalk.cyan(gitUser.name || gitUser.email)}`));
          }
        }

        commits = await getFullCommitLog({
          date,
          author,
          includeDiff: options.diff,
          noMerges: options.noMerges || options.mine,
          mine: options.mine
        });

        const mineInfo = options.mine ? '（仅自己的提交）' : '';
        spinner.succeed(`找到 ${commits.length} 个提交${mineInfo}`);
      }

      // 根据格式生成报告
      const outputPath = path.resolve(options.output);
      let finalPath;
      const generatedFiles = [];

      // 批量导出模式
      if (options.all) {
        spinner.text = '正在生成 HTML 报告...';
        spinner.start();
        finalPath = await generateHTMLReport(commits, dateRange, options.diff, outputPath, isMonthView);
        generatedFiles.push(finalPath);

        spinner.text = '正在生成 JSON 报告...';
        spinner.start();
        const jsonPath = outputPath.replace(/\.html$/, '.json');
        await generateJSONReport(commits, dateRange, jsonPath);
        generatedFiles.push(jsonPath);

        spinner.text = '正在生成 Markdown 报告...';
        spinner.start();
        const mdPath = outputPath.replace(/\.html$/, '.md');
        await generateMarkdownReport(commits, dateRange, options.diff, mdPath);
        generatedFiles.push(mdPath);

        spinner.succeed(`已生成 ${generatedFiles.length} 个文件`);
      } else {
        spinner.text = `正在生成 ${options.format.toUpperCase()} 报告...`;
        spinner.start();

        if (options.format === 'json') {
          finalPath = await generateJSONReport(commits, dateRange, outputPath);
        } else if (options.format === 'md') {
          finalPath = await generateMarkdownReport(commits, dateRange, options.diff, outputPath);
        } else {
          // 默认 HTML
          finalPath = await generateHTMLReport(commits, dateRange, options.diff, outputPath, isMonthView);
        }

        spinner.succeed(`${options.format.toUpperCase()} 报告已生成：${chalk.cyan(finalPath)}`);
        generatedFiles.push(finalPath);
      }

      // 如果需要打开浏览器（仅 HTML 格式）
      if (options.open && options.format === 'html') {
        const { execSync } = await import('child_process');
        try {
          if (process.platform === 'darwin') {
            execSync(`open "${finalPath}"`);
          } else if (process.platform === 'win32') {
            execSync(`start "" "${finalPath}"`);
          } else {
            execSync(`xdg-open "${finalPath}"`);
          }
          console.log(chalk.green('✓ 已在浏览器中打开'));
        } catch (error) {
          console.log(chalk.yellow('⚠ 无法自动打开浏览器，请手动打开文件'));
        }
      }

      // 打印摘要信息
      console.log('\n' + chalk.bold('提交摘要:'));
      console.log(`  📅 日期范围：${dateRange}`);
      console.log(`  📝 提交数：${chalk.blue(commits.length.toString())}`);

      let totalInsertions = 0;
      let totalDeletions = 0;
      let totalFiles = 0;

      for (const commit of commits) {
        if (commit.summary) {
          totalInsertions += commit.summary.insertions || 0;
          totalDeletions += commit.summary.deletions || 0;
          totalFiles += commit.summary.files || 0;
        }
      }

      console.log(`  📁 修改文件：${chalk.green(totalFiles.toString())}`);
      console.log(`  ➕ 新增行数：${chalk.green('+' + totalInsertions)}`);
      console.log(`  ➖ 删除行数：${chalk.red('-' + totalDeletions)}`);

      console.log('\n' + chalk.bold('生成文件:'));
      for (const file of generatedFiles) {
        console.log(`  📄 ${chalk.cyan(file)}`);
      }
      console.log('');

    } catch (error) {
      if (spinner.isSpinning) {
        spinner.fail();
      }
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

program.parse();
