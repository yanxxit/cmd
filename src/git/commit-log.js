import { execSync } from 'child_process';
import dayjs from 'dayjs';

/**
 * 获取指定日期的 Git 提交列表
 * @param {string} date - 日期字符串，如 '2024-01-01' 或 'yesterday'
 * @returns {Array} - 提交列表
 */
export function getCommitsByDate(date = 'yesterday') {
  let since, until;

  if (date === 'yesterday') {
    // 默认获取昨日的提交
    const yesterday = dayjs().subtract(1, 'day');
    since = yesterday.startOf('day').format('YYYY-MM-DD');
    until = yesterday.endOf('day').format('YYYY-MM-DD');
  } else {
    // 解析指定的日期
    const d = dayjs(date);
    if (d.isValid()) {
      since = d.startOf('day').format('YYYY-MM-DD');
      until = d.endOf('day').format('YYYY-MM-DD');
    } else {
      throw new Error(`无效的日期格式：${date}`);
    }
  }

  try {
    // 获取提交列表，使用自定义格式输出
    const commitLog = execSync(
      `git log --since="${since}" --until="${until}" --pretty=format:"%H|%an|%ae|%ad|%s" --date=format:'%Y-%m-%d %H:%M:%S'`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    if (!commitLog.trim()) {
      return [];
    }

    const commits = commitLog.split('\n').map(line => {
      const [hash, authorName, authorEmail, date, message] = line.split('|');
      return {
        hash,
        shortHash: hash.substring(0, 7),
        authorName,
        authorEmail,
        date,
        message
      };
    });

    return commits;
  } catch (error) {
    if (error.stderr && error.stderr.includes('not a git repository')) {
      throw new Error('当前目录不是 Git 仓库');
    }
    throw error;
  }
}

/**
 * 获取提交的代码变更统计
 * @param {string} hash - 提交 hash
 * @returns {Object} - 变更统计信息
 */
export function getCommitStats(hash) {
  try {
    const stats = execSync(
      `git show --stat --format="" ${hash}`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    const lines = stats.trim().split('\n');
    const files = [];
    let summary = null;

    for (const line of lines) {
      if (!line.trim()) continue;

      // 最后一行是汇总信息
      const summaryMatch = line.match(/(\d+)\s+files?\s+changed(?:,\s+(\d+)\s+insertions?\(\+\))?(?:,\s+(\d+)\s+deletions?\(-\))?/);
      if (summaryMatch) {
        summary = {
          files: parseInt(summaryMatch[1]),
          insertions: summaryMatch[2] ? parseInt(summaryMatch[2]) : 0,
          deletions: summaryMatch[3] ? parseInt(summaryMatch[3]) : 0
        };
        break;
      }

      // 解析文件变更行
      const fileMatch = line.match(/(.+?)\s+\|\s+(\d+)\s+([+\-]+)/);
      if (fileMatch) {
        const [, filePath, changes, sign] = fileMatch;
        const insertions = (sign.match(/\+/g) || []).length;
        const deletions = (sign.match(/-/g) || []).length;
        files.push({
          path: filePath.trim(),
          changes: parseInt(changes),
          insertions,
          deletions
        });
      }
    }

    return { files, summary };
  } catch (error) {
    return { files: [], summary: null };
  }
}

/**
 * 获取提交的详细代码变更（diff）
 * @param {string} hash - 提交 hash
 * @param {number} maxLines - 单个文件最大行数限制
 * @returns {Array} - 文件变更详情
 */
export function getCommitDiff(hash, maxLines = 500) {
  try {
    const diff = execSync(
      `git show --format="" ${hash}`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] }
    );

    const lines = diff.split('\n');
    const files = [];
    let currentFile = null;
    let currentContent = [];

    for (const line of lines) {
      // 检测新文件
      const fileMatch = line.match(/^\+\+\+ b\/(.+)$/);
      if (fileMatch) {
        // 保存上一个文件
        if (currentFile) {
          currentFile.content = currentContent.join('\n');
          files.push(currentFile);
        }

        currentFile = {
          path: fileMatch[1],
          oldPath: null,
          content: ''
        };
        currentContent = [];

        // 检查是否有重命名
        const oldFileMatch = lines[lines.indexOf(line) - 1]?.match(/^--- a\/(.+)$/);
        if (oldFileMatch && oldFileMatch[1] !== fileMatch[1]) {
          currentFile.oldPath = oldFileMatch[1];
        }

        continue;
      }

      // 收集文件内容
      if (currentFile && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
        // 限制每个文件的行数
        if (currentContent.length < maxLines) {
          currentContent.push(line);
        }
      }
    }

    // 保存最后一个文件
    if (currentFile) {
      currentFile.content = currentContent.join('\n');
      files.push(currentFile);
    }

    return files;
  } catch (error) {
    return [];
  }
}

/**
 * 获取指定日期的完整提交信息（包含代码变更）
 * @param {string} date - 日期字符串
 * @param {boolean} includeDiff - 是否包含详细 diff
 * @returns {Array} - 完整的提交信息数组
 */
export function getFullCommitLog(date = 'yesterday', includeDiff = false) {
  const commits = getCommitsByDate(date);

  for (const commit of commits) {
    const stats = getCommitStats(commit.hash);
    commit.files = stats.files;
    commit.summary = stats.summary;

    if (includeDiff) {
      commit.diffs = getCommitDiff(commit.hash);
    }
  }

  return commits;
}
