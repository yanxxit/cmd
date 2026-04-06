import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import path from 'path';
import dayjs from 'dayjs';
import {
  getFullCommitLog,
  getCommitsByDateRange,
  generateHTMLReport,
  generateJSONReport,
  generateMarkdownReport,
  getCurrentGitUser
} from './index.js';

export function formatDateDisplay(date) {
  if (date === 'yesterday') {
    return dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  }
  if (date === 'today') {
    return dayjs().format('YYYY-MM-DD');
  }
  return dayjs(date).format('YYYY-MM-DD');
}

export async function generateLogReport(options = {}) {
  const {
    date = 'yesterday',
    since,
    until,
    author,
    output = './git-log.html',
    format = 'html',
    diff = false,
    open = false,
    all = false,
    month = false,
    noMerges = false,
    mine = false
  } = options;

  const spinner = ora();
  const PROJECT_ROOT = process.cwd();

  try {
    let commits = [];
    let dateRange = '';
    let isMonthView = false;

    if (month) {
      const untilDate = dayjs().format('YYYY-MM-DD');
      const sinceDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
      dateRange = `最近 30 天 (${sinceDate} ~ ${untilDate})`;
      isMonthView = true;

      commits = await getCommitsByDateRange({
        since: sinceDate,
        until: untilDate,
        author: author || '',
        includeDiff: diff
      });

      console.log(chalk.green(`✓ 找到 ${commits.length} 个提交（最近 30 天）`));
    } else if (since || until) {
      const sinceDate = since || dayjs().subtract(7, 'day').format('YYYY-MM-DD');
      const untilDate = until || dayjs().format('YYYY-MM-DD');
      dateRange = `${sinceDate} ~ ${untilDate}`;

      commits = await getCommitsByDateRange({
        since: sinceDate,
        until: untilDate,
        author: author || '',
        includeDiff: diff
      });

      console.log(chalk.green(`✓ 找到 ${commits.length} 个提交`));
    } else {
      dateRange = formatDateDisplay(date);

      let filterAuthor = author || '';
      if (mine && !filterAuthor) {
        const gitUser = getCurrentGitUser();
        if (gitUser.name || gitUser.email) {
          filterAuthor = gitUser.name || gitUser.email;
          console.log(chalk.blue(`ℹ 使用当前 Git 用户：${chalk.cyan(gitUser.name || gitUser.email)}`));
        }
      }

      commits = await getFullCommitLog({
        date,
        author: filterAuthor,
        includeDiff: diff,
        noMerges: noMerges || mine,
        mine
      });

      const mineInfo = mine ? '（仅自己的提交）' : '';
      console.log(chalk.green(`✓ 找到 ${commits.length} 个提交${mineInfo}`));
    }

    const outputPath = path.resolve(output);
    let finalPath;
    const generatedFiles = [];

    if (all) {
      spinner.text = '正在生成 HTML 报告...';
      spinner.start();
      finalPath = await generateHTMLReport(commits, dateRange, true, outputPath, isMonthView);
      generatedFiles.push(finalPath);

      spinner.text = '正在生成 JSON 报告...';
      spinner.start();
      const jsonPath = outputPath.replace(/\.html$/, '.json');
      await generateJSONReport(commits, dateRange, jsonPath);
      generatedFiles.push(jsonPath);

      spinner.text = '正在生成 Markdown 报告...';
      spinner.start();
      const mdPath = outputPath.replace(/\.html$/, '.md');
      await generateMarkdownReport(commits, dateRange, diff, mdPath);
      generatedFiles.push(mdPath);

      spinner.succeed(`已生成 ${generatedFiles.length} 个文件`);
    } else {
      spinner.text = `正在生成 ${format.toUpperCase()} 报告...`;
      spinner.start();

      if (format === 'json') {
        finalPath = await generateJSONReport(commits, dateRange, outputPath);
      } else if (format === 'md') {
        finalPath = await generateMarkdownReport(commits, dateRange, diff, outputPath);
      } else {
        finalPath = await generateHTMLReport(commits, dateRange, true, outputPath, isMonthView);
      }

      spinner.succeed(`${format.toUpperCase()} 报告已生成：${chalk.cyan(finalPath)}`);
      generatedFiles.push(finalPath);
    }

    if (open && format === 'html') {
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

    return {
      commits,
      dateRange,
      generatedFiles,
      stats: {
        totalFiles,
        totalInsertions,
        totalDeletions
      }
    };
  } catch (error) {
    if (spinner.isSpinning) {
      spinner.fail();
    }
    console.error(chalk.red('错误:'), error.message);
    throw error;
  }
}
