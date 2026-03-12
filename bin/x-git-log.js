#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import ejs from 'ejs';
import chalk from 'chalk';
import ora from 'ora';
import dayjs from 'dayjs';
import { getFullCommitLog } from '../src/git/commit-log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * 生成 HTML 报告
 * @param {Array} commits - 提交列表
 * @param {string} date - 日期
 * @param {boolean} includeDiff - 是否包含详细 diff
 * @param {string} outputPath - 输出文件路径
 */
async function generateHTMLReport(commits, date, includeDiff, outputPath) {
  // 计算汇总数据
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

  // 加载 EJS 模板
  const templatePath = path.resolve(PROJECT_ROOT, 'templates', 'git-log.ejs');
  const template = await fs.readFile(templatePath, 'utf-8');

  // 渲染模板
  const html = ejs.render(template, {
    date,
    commits,
    totalCommits: commits.length,
    totalInsertions,
    totalDeletions,
    totalFiles,
    includeDiff
  });

  // 确保输出目录存在
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // 写入文件
  await fs.writeFile(outputPath, html, 'utf-8');

  return outputPath;
}

/**
 * 格式化日期显示
 * @param {string} date - 日期字符串
 * @returns {string} - 格式化后的日期
 */
function formatDateDisplay(date) {
  if (date === 'yesterday') {
    return dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  }
  return dayjs(date).format('YYYY-MM-DD');
}

// 配置 Commander.js
program
  .name('x-git-log')
  .description('读取指定日期的 Git 提交并生成 HTML 报告')
  .version('1.0.0')
  .option('-d, --date <date>', '指定日期，格式：YYYY-MM-DD 或 yesterday (默认：yesterday)', 'yesterday')
  .option('-o, --output <path>', '输出文件路径', './git-log.html')
  .option('--diff', '包含详细的代码变更内容')
  .option('--open', '生成后自动在浏览器中打开')
  .action(async (options) => {
    const spinner = ora();

    try {
      // 显示正在获取提交
      spinner.text = '正在获取 Git 提交...';
      spinner.start();

      const date = options.date;
      const dateDisplay = formatDateDisplay(date);
      
      // 获取提交数据
      const commits = getFullCommitLog(date, options.diff);
      
      spinner.succeed(`找到 ${commits.length} 个提交`);

      // 生成 HTML 报告
      spinner.text = '正在生成 HTML 报告...';
      spinner.start();

      const outputPath = path.resolve(options.output);
      await generateHTMLReport(commits, dateDisplay, options.diff, outputPath);

      spinner.succeed(`HTML 报告已生成：${chalk.cyan(outputPath)}`);

      // 如果需要打开浏览器
      if (options.open) {
        const { execSync } = await import('child_process');
        try {
          if (process.platform === 'darwin') {
            execSync(`open "${outputPath}"`);
          } else if (process.platform === 'win32') {
            execSync(`start "" "${outputPath}"`);
          } else {
            execSync(`xdg-open "${outputPath}"`);
          }
          console.log(chalk.green('✓ 已在浏览器中打开'));
        } catch (error) {
          console.log(chalk.yellow('⚠ 无法自动打开浏览器，请手动打开文件'));
        }
      }

      // 打印摘要信息
      console.log('\n' + chalk.bold('提交摘要:'));
      console.log(`  📅 日期：${dateDisplay}`);
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
      console.log(`  📄 报告文件：${chalk.cyan(outputPath)}\n`);

    } catch (error) {
      if (spinner.isSpinning) {
        spinner.fail();
      }
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

program.parse();
