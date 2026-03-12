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
 * 获取 Git 远程仓库信息
 * @returns {Promise<{platform: string, url: string, repoPath: string} | null>}
 */
async function getRemoteRepoInfo() {
  const { execSync } = await import('child_process');

  try {
    // 获取远程 origin URL
    const remoteUrl = execSync('git remote get-url origin', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    // 解析仓库信息
    let platform = 'github';
    let repoPath = '';
    let baseUrl = '';

    if (remoteUrl.includes('github.com')) {
      platform = 'github';
      baseUrl = 'https://github.com';
    } else if (remoteUrl.includes('gitlab.com')) {
      platform = 'gitlab';
      baseUrl = 'https://gitlab.com';
    } else if (remoteUrl.includes('gitee.com')) {
      platform = 'gitee';
      baseUrl = 'https://gitee.com';
    } else if (remoteUrl.includes('bitbucket.org')) {
      platform = 'bitbucket';
      baseUrl = 'https://bitbucket.org';
    } else {
      // 尝试从 URL 推断
      const match = remoteUrl.match(/@([\w.]+):(.+?)(?:\.git)?$/);
      if (match) {
        platform = match[1];
        repoPath = match[2];
      }
    }

    // 提取仓库路径 (user/repo)
    if (!repoPath) {
      const httpsMatch = remoteUrl.match(/https:\/\/[\w.]+\/(.+?)(?:\.git)?$/);
      const sshMatch = remoteUrl.match(/:(.+?)(?:\.git)?$/);
      repoPath = (httpsMatch || sshMatch || [])[1] || '';
    }

    // 移除 .git 后缀
    repoPath = repoPath.replace(/\.git$/, '');

    return {
      platform,
      url: baseUrl || `https://${platform}`,
      repoPath,
      fullUrl: `${baseUrl || `https://${platform}`}/${repoPath}`
    };
  } catch (error) {
    return null;
  }
}

/**
 * 获取 Git 仓库统计信息
 * @returns {Promise<{firstCommit: string, totalCommits: number, contributors: number, branches: number}>}
 */
async function getRepoStats() {
  const { execSync } = await import('child_process');

  try {
    // 首次提交时间
    const firstCommitRaw = execSync('git log --reverse --format=%ci | head -n 1', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    const firstCommit = firstCommitRaw ? dayjs(firstCommitRaw).format('YYYY-MM-DD') : '未知';

    // 总提交数
    const totalCommits = parseInt(
      execSync('git rev-list --count HEAD', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim()
    );

    // 贡献者人数
    const contributors = parseInt(
      execSync('git log --format=%aN | sort -u | wc -l', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim()
    );

    // 分支数
    const branches = parseInt(
      execSync('git branch | wc -l', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim()
    );

    // 当前分支
    const currentBranch = execSync('git branch --show-current', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim() || 'main';

    return {
      firstCommit,
      totalCommits,
      contributors,
      branches,
      currentBranch
    };
  } catch (error) {
    return null;
  }
}

/**
 * 生成 HTML 报告
 * @param {Array} commits - 提交列表
 * @param {string} date - 日期
 * @param {boolean} includeDiff - 是否包含详细 diff
 * @param {string} outputPath - 输出文件路径
 * @param {boolean} isMonthView - 是否为月度视图
 */
async function generateHTMLReport(commits, date, includeDiff, outputPath, isMonthView = false) {
  // 计算汇总数据
  let totalInsertions = 0;
  let totalDeletions = 0;
  let totalFiles = 0;

  // 作者统计
  const authorStats = {};
  // 文件类型统计
  const fileTypeStats = {};
  // 每小时提交分布
  const hourDistribution = new Array(24).fill(0);
  // 每日提交统计（用于月度视图）
  const dailyStats = {};

  // 只收集文件元数据，不嵌入文件内容（减小 HTML 大小）
  const fileMetadata = {};

  for (const commit of commits) {
    if (commit.summary) {
      totalInsertions += commit.summary.insertions || 0;
      totalDeletions += commit.summary.deletions || 0;
      totalFiles += commit.summary.files || 0;
    }

    // 作者统计
    if (!authorStats[commit.authorName]) {
      authorStats[commit.authorName] = {
        name: commit.authorName,
        email: commit.authorEmail || '',
        commits: 0,
        insertions: 0,
        deletions: 0
      };
    }
    authorStats[commit.authorName].commits += 1;
    authorStats[commit.authorName].insertions += commit.summary?.insertions || 0;
    authorStats[commit.authorName].deletions += commit.summary?.deletions || 0;

    // 文件类型统计
    if (commit.files && commit.files.length > 0) {
      for (const file of commit.files) {
        const ext = file.path.split('.').pop().toLowerCase() || '无扩展名';
        if (!fileTypeStats[ext]) {
          fileTypeStats[ext] = { count: 0, insertions: 0, deletions: 0 };
        }
        fileTypeStats[ext].count += 1;
        fileTypeStats[ext].insertions += file.insertions || 0;
        fileTypeStats[ext].deletions += file.deletions || 0;

        const key = commit.hash + ':' + file.path;
        fileMetadata[key] = {
          commitHash: commit.hash,
          shortHash: commit.shortHash,
          path: file.path,
          insertions: file.insertions || 0,
          deletions: file.deletions || 0,
          changes: file.changes || 0
        };
      }
    }

    // 小时分布统计
    try {
      const hour = new Date(commit.date).getHours();
      hourDistribution[hour] += 1;
    } catch (e) {
      // 忽略日期解析错误
    }

    // 每日统计（月度视图）
    if (isMonthView) {
      try {
        const dateKey = dayjs(commit.date).format('YYYY-MM-DD');
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = {
            date: dateKey,
            commits: 0,
            insertions: 0,
            deletions: 0,
            files: 0
          };
        }
        dailyStats[dateKey].commits += 1;
        dailyStats[dateKey].insertions += commit.summary?.insertions || 0;
        dailyStats[dateKey].deletions += commit.summary?.deletions || 0;
        dailyStats[dateKey].files += commit.summary?.files || 0;
      } catch (e) {
        // 忽略日期解析错误
      }
    }
  }

  // 转换为数组并排序
  const authorStatsArray = Object.values(authorStats).sort((a, b) => b.commits - a.commits);
  const fileTypeStatsArray = Object.entries(fileTypeStats)
    .map(([ext, data]) => ({ ext, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // 只显示前 10 种

  // 每日统计转换为数组（按日期倒序）
  const dailyStatsArray = Object.values(dailyStats).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // 获取远程仓库信息
  const remoteRepoInfo = await getRemoteRepoInfo();

  // 获取仓库统计信息
  const repoStats = await getRepoStats();

  // 加载 EJS 模板
  const templatePath = path.resolve(PROJECT_ROOT, 'templates', 'git-log.ejs');
  const template = await fs.readFile(templatePath, 'utf-8');

  // 文件图标映射函数
  function getFileIcon(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const icons = {
      'js': '🟨', 'jsx': '🟨', 'ts': '📘', 'tsx': '📘',
      'py': '🐍', 'rb': '💎', 'go': '🔷', 'rs': '🦀',
      'java': '☕', 'php': '🐘', 'swift': '🍎', 'kt': '🎯',
      'html': '🌐', 'css': '🎨', 'scss': '🎨', 'less': '🎨',
      'json': '📋', 'xml': '📋', 'yaml': '⚙️', 'yml': '⚙️', 'toml': '⚙️',
      'md': '📝', 'txt': '📄', 'log': '📜',
      'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️', 'svg': '🖼️', 'webp': '🖼️', 'ico': '🖼️',
      'sh': '⚡', 'bash': '⚡', 'zsh': '⚡',
      'sql': '🗄️', 'db': '🗄️', 'sqlite': '🗄️',
      'env': '🔐', 'key': '🔐', 'pem': '🔐', 'crt': '🔐',
      'gitignore': '🙈', 'dockerfile': '🐳', 'makefile': '🔨', 'lock': '🔒'
    };
    const fileName = filePath.split('/').pop().toLowerCase();

    // 特殊文件名
    if (fileName === 'gitignore') return '🙈';
    if (fileName === 'dockerfile') return '🐳';
    if (fileName === 'makefile') return '🔨';
    if (fileName === 'readme.md') return '📖';
    if (fileName === 'license') return '📜';
    if (fileName === 'changelog.md') return '📝';
    if (fileName === 'package.json') return '📦';
    if (fileName === 'package-lock.json') return '🔒';
    if (fileName === 'yarn.lock') return '🔒';
    if (fileName === 'pnpm-lock.yaml') return '🔒';

    // 按扩展名
    return icons[ext] || '📄';
  }

  // 生成仓库链接函数
  function getRepoLink(type, hash, author) {
    if (!remoteRepoInfo) return null;
    
    const { platform, fullUrl } = remoteRepoInfo;
    
    switch (type) {
      case 'commit':
        if (platform === 'github' || platform === 'gitlab' || platform === 'gitee') {
          return `${fullUrl}/commit/${hash}`;
        }
        break;
      case 'author':
        if (platform === 'github' || platform === 'gitlab') {
          return `${fullUrl.replace('/' + remoteRepoInfo.repoPath, '')}/${author}`;
        } else if (platform === 'gitee') {
          return `https://gitee.com/${author}`;
        }
        break;
      case 'repo':
        return fullUrl;
    }
    return null;
  }

  // HTML 转义函数
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text ? String(text).replace(/[&<>"']/g, m => map[m]) : '';
  }

  // 渲染模板 - 不嵌入文件内容，只传递元数据
  const html = ejs.render(template, {
    date,
    commits,
    totalCommits: commits.length,
    totalInsertions,
    totalDeletions,
    totalFiles,
    includeDiff,
    fileMetadata: JSON.stringify(fileMetadata),
    getFileIcon,
    getRepoLink,
    escapeHtml,
    authorStats: JSON.stringify(authorStatsArray),
    fileTypeStats: JSON.stringify(fileTypeStatsArray),
    hourDistribution: JSON.stringify(hourDistribution),
    dailyStats: JSON.stringify(dailyStatsArray),
    remoteRepo: remoteRepoInfo,
    repoStats,
    isMonthView,
    dayjs
  });

  // 计算 diff 统计信息
  const diffStats = {
    totalAdditions: 0,
    totalDeletions: 0,
    filesWithChanges: 0
  };

  for (const commit of commits) {
    if (commit.diffs && commit.diffs.length > 0) {
      diffStats.filesWithChanges += commit.diffs.length;
      for (const diff of commit.diffs) {
        const lines = diff.content.split('\n');
        for (const line of lines) {
          if (line.startsWith('+') && !line.startsWith('+++')) diffStats.totalAdditions++;
          if (line.startsWith('-') && !line.startsWith('---')) diffStats.totalDeletions++;
        }
      }
    }
  }

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
  .option('--all', '生成所有格式的报告（html + json + md）')
  .option('--month', '显示最近一个月的提交记录')
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

        commits = await getFullCommitLog({
          date,
          author: options.author || '',
          includeDiff: options.diff
        });

        spinner.succeed(`找到 ${commits.length} 个提交`);
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
