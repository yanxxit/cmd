#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import ejs from 'ejs';
import chalk from 'chalk';
import ora from 'ora';
import dayjs from 'dayjs';
import { getFullCommitLog, getCommitsByDateRange } from '../src/git/commit-log.js';

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
 * 生成 JSON 报告
 * @param {Array} commits - 提交列表
 * @param {string} dateRange - 日期范围描述
 * @param {string} outputPath - 输出文件路径
 */
async function generateJSONReport(commits, dateRange, outputPath) {
  const report = {
    generatedAt: new Date().toISOString(),
    dateRange,
    summary: {
      totalCommits: commits.length,
      totalInsertions: 0,
      totalDeletions: 0,
      totalFiles: 0
    },
    commits
  };

  for (const commit of commits) {
    if (commit.summary) {
      report.summary.totalInsertions += commit.summary.insertions || 0;
      report.summary.totalDeletions += commit.summary.deletions || 0;
      report.summary.totalFiles += commit.summary.files || 0;
    }
  }

  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');

  return outputPath;
}

/**
 * 生成 Markdown 报告
 * @param {Array} commits - 提交列表
 * @param {string} dateRange - 日期范围描述
 * @param {boolean} includeDiff - 是否包含详细 diff
 * @param {string} outputPath - 输出文件路径
 */
async function generateMarkdownReport(commits, dateRange, includeDiff, outputPath) {
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

  let md = `# Git 提交日志\n\n`;
  md += `**日期范围**: ${dateRange}\n\n`;
  md += `## 摘要\n\n`;
  md += `- 提交数：${commits.length}\n`;
  md += `- 修改文件：${totalFiles}\n`;
  md += `- 新增行数：+${totalInsertions}\n`;
  md += `- 删除行数：-${totalDeletions}\n\n`;
  md += `---\n\n`;

  for (const commit of commits) {
    md += `## ${commit.message}\n\n`;
    md += `**作者**: ${commit.authorName}  \n`;
    md += `**时间**: ${commit.date}  \n`;
    md += `**Hash**: \`${commit.shortHash}\`\n\n`;

    if (commit.summary) {
      md += `**变更**: ${commit.summary.files} 个文件，+${commit.summary.insertions} -${commit.summary.deletions}\n\n`;
    }

    if (commit.files && commit.files.length > 0) {
      md += `**文件列表**:\n\n`;
      for (const file of commit.files) {
        md += `- \`${file.path}\` (+${file.insertions} -${file.deletions})\n`;
      }
      md += `\n`;
    }

    if (includeDiff && commit.diffs && commit.diffs.length > 0) {
      md += `**代码变更**:\n\n\`\`\`diff\n`;
      for (const diff of commit.diffs) {
        md += `// ${diff.path}\n`;
        md += diff.content + '\n';
      }
      md += `\`\`\`\n\n`;
    }

    md += `---\n\n`;
  }

  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, md, 'utf-8');

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
  .action(async (options) => {
    const spinner = ora();

    try {
      // 显示正在获取提交
      spinner.text = '正在获取 Git 提交...';
      spinner.start();

      let commits = [];
      let dateRange = '';

      // 判断使用哪种模式
      if (options.since || options.until) {
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
      } else {
        // 单日期模式
        const date = options.date;
        dateRange = formatDateDisplay(date);
        
        commits = await getFullCommitLog({
          date,
          author: options.author || '',
          includeDiff: options.diff
        });
      }

      spinner.succeed(`找到 ${commits.length} 个提交`);

      // 根据格式生成报告
      spinner.text = `正在生成 ${options.format.toUpperCase()} 报告...`;
      spinner.start();

      const outputPath = path.resolve(options.output);
      let finalPath;

      if (options.format === 'json') {
        finalPath = await generateJSONReport(commits, dateRange, outputPath);
      } else if (options.format === 'md') {
        finalPath = await generateMarkdownReport(commits, dateRange, options.diff, outputPath);
      } else {
        // 默认 HTML
        finalPath = await generateHTMLReport(commits, dateRange, options.diff, outputPath);
      }

      spinner.succeed(`${options.format.toUpperCase()} 报告已生成：${chalk.cyan(finalPath)}`);

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
      console.log(`  📄 报告文件：${chalk.cyan(finalPath)}\n`);

    } catch (error) {
      if (spinner.isSpinning) {
        spinner.fail();
      }
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

program.parse();
