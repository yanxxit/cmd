import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import ejs from 'ejs';
import dayjs from 'dayjs';
import { getRemoteRepoInfo, getRepoStats } from './repo-info.js';
import { getCommitDiff } from './commit-log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 项目根目录是 src 的父目录的父目录 (src/git -> src -> project root)
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * 生成 HTML 报告
 * @param {Array} commits - 提交列表
 * @param {string} date - 日期
 * @param {boolean} includeDiff - 是否包含详细 diff
 * @param {string} outputPath - 输出文件路径
 * @param {boolean} isMonthView - 是否为月度视图
 */
export async function generateHTMLReport(commits, date, includeDiff, outputPath, isMonthView = false) {
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

  // 为每个 commit 添加 diff 数据（用于嵌入到 HTML）- HTML 报告始终包含 diff
  for (const commit of commits) {
    if (commit.hash) {
      // 获取 diff 数据
      try {
        commit.diffs = getCommitDiff(commit.hash);
      } catch (e) {
        commit.diffs = [];
      }
    }
  }

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
export async function generateJSONReport(commits, dateRange, outputPath) {
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
export async function generateMarkdownReport(commits, dateRange, includeDiff, outputPath) {
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
