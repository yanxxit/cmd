import { execSync } from 'child_process';
import dayjs from 'dayjs';

/**
 * 验证并标准化日期输入，防止命令注入
 * @param {string} date - 日期字符串
 * @returns {Object} - { since, until } 日期范围
 */
function parseDateRange(date) {
  let since, until;

  if (date === 'yesterday') {
    const yesterday = dayjs().subtract(1, 'day');
    since = yesterday.startOf('day').format('YYYY-MM-DD HH:mm:ss');
    until = yesterday.endOf('day').format('YYYY-MM-DD HH:mm:ss');
  } else if (date === 'today') {
    const today = dayjs();
    since = today.startOf('day').format('YYYY-MM-DD HH:mm:ss');
    until = today.endOf('day').format('YYYY-MM-DD HH:mm:ss');
  } else {
    // 严格验证日期格式，只允许 YYYY-MM-DD 格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error(`无效的日期格式：${date}，请使用 YYYY-MM-DD 格式`);
    }

    const d = dayjs(date);
    if (!d.isValid()) {
      throw new Error(`无效的日期：${date}`);
    }

    since = d.startOf('day').format('YYYY-MM-DD HH:mm:ss');
    until = d.endOf('day').format('YYYY-MM-DD HH:mm:ss');
  }

  return { since, until };
}

/**
 * 验证 Git hash，防止命令注入
 * @param {string} hash - Git hash
 * @returns {string} - 清理后的 hash
 */
function sanitizeHash(hash) {
  // 只允许字母、数字和连字符
  if (!/^[a-f0-9]+$/i.test(hash)) {
    throw new Error(`无效的 Git hash: ${hash}`);
  }
  return hash;
}

/**
 * 获取指定日期的 Git 提交列表
 * @param {Object} options - 选项
 * @param {string} options.date - 日期字符串，如 '2024-01-01' 或 'yesterday'
 * @param {string} options.author - 作者过滤（可选）
 * @returns {Array} - 提交列表
 */
export function getCommitsByDate(options = {}) {
  const { date = 'yesterday', author = '' } = options;
  const { since, until } = parseDateRange(date);

  try {
    // 构建命令，支持作者过滤 - 使用 %B 获取完整的提交消息（标题 + 正文）
    let command = `git log --since="${since}" --until="${until}" --pretty=format:"%H|%an|%ae|%ad|%s|%B" --date=format:'%Y-%m-%d %H:%M:%S'`;

    if (author) {
      command += ` --author="${author}"`;
    }

    const commitLog = execSync(
      command,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 50 * 1024 * 1024 }
    );

    if (!commitLog.trim()) {
      return [];
    }

    const commits = [];
    // 使用 commit 分隔符来分割多个提交
    const commitBlocks = commitLog.split('\ncommit ');
    
    for (let i = 0; i < commitBlocks.length; i++) {
      let block = commitBlocks[i];
      // 移除第一个块可能的前缀
      if (i === 0) {
        block = block.replace(/^commit /, '');
      }
      
      const lines = block.split('\n');
      const firstLine = lines[0];
      const [hash, authorName, authorEmail, date, message] = firstLine.split('|');
      
      // 完整的提交消息（包含正文）
      const fullBody = lines.slice(1).join('\n').trim();
      
      commits.push({
        hash,
        shortHash: hash.substring(0, 7),
        authorName,
        authorEmail,
        date,
        message,
        fullBody: fullBody || message  // 如果有正文则使用正文，否则使用标题
      });
    }

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
    const safeHash = sanitizeHash(hash);
    const stats = execSync(
      `git show --stat --format="" ${safeHash}`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 10 * 1024 * 1024 }
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
    const safeHash = sanitizeHash(hash);
    const diff = execSync(
      `git show --format="" ${safeHash}`,
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
export function getFullCommitLog(options = {}) {
  const { date = 'yesterday', author = '', includeDiff = false } = options;
  const commits = getCommitsByDate({ date, author });

  // 并行获取每个提交的详细信息，提升性能
  const commitPromises = commits.map(async (commit) => {
    const stats = getCommitStats(commit.hash);
    commit.files = stats.files;
    commit.summary = stats.summary;

    if (includeDiff) {
      commit.diffs = getCommitDiff(commit.hash);
    }

    return commit;
  });

  // 等待所有并行任务完成
  return Promise.all(commitPromises);
}

/**
 * 获取日期范围内的 Git 提交列表
 * @param {Object} options - 选项
 * @param {string} options.since - 开始日期 YYYY-MM-DD
 * @param {string} options.until - 结束日期 YYYY-MM-DD
 * @param {string} options.author - 作者过滤（可选）
 * @param {boolean} options.includeDiff - 是否包含详细 diff
 * @returns {Promise<Array>} - 完整的提交信息数组
 */
export function getCommitsByDateRange(options = {}) {
  const { since, until, author = '', includeDiff = false } = options;

  // 验证日期范围
  const sinceRegex = /^\d{4}-\d{2}-\d{2}$/;
  const untilRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!sinceRegex.test(since)) {
    throw new Error(`无效的开始日期：${since}，请使用 YYYY-MM-DD 格式`);
  }

  if (!untilRegex.test(until)) {
    throw new Error(`无效的结束日期：${until}，请使用 YYYY-MM-DD 格式`);
  }

  try {
    // 构建命令，since 和 until 都加上时间以确保包含完整的日期范围
    const sinceWithTime = `${since} 00:00:00`;
    const untilWithTime = `${until} 23:59:59`;

    // 使用 %B 获取完整的提交消息（标题 + 正文）
    let command = `git log --since="${sinceWithTime}" --until="${untilWithTime}" --pretty=format:"%H|%an|%ae|%ad|%s|%B" --date=format:'%Y-%m-%d %H:%M:%S'`;

    if (author) {
      command += ` --author="${author}"`;
    }

    const commitLog = execSync(
      command,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 50 * 1024 * 1024 }
    );

    if (!commitLog.trim()) {
      return Promise.resolve([]);
    }

    const commits = [];
    const commitBlocks = commitLog.split('\ncommit ');
    
    for (let i = 0; i < commitBlocks.length; i++) {
      let block = commitBlocks[i];
      if (i === 0) {
        block = block.replace(/^commit /, '');
      }
      
      const lines = block.split('\n');
      const firstLine = lines[0];
      const [hash, authorName, authorEmail, date, message] = firstLine.split('|');
      
      const fullBody = lines.slice(1).join('\n').trim();
      
      commits.push({
        hash,
        shortHash: hash.substring(0, 7),
        authorName,
        authorEmail,
        date,
        message,
        fullBody: fullBody || message
      });
    }

    // 并行获取每个提交的详细信息
    const commitPromises = commits.map(async (commit) => {
      const stats = getCommitStats(commit.hash);
      commit.files = stats.files;
      commit.summary = stats.summary;

      if (includeDiff) {
        commit.diffs = getCommitDiff(commit.hash);
      }

      return commit;
    });

    return Promise.all(commitPromises);
  } catch (error) {
    if (error.stderr && error.stderr.includes('not a git repository')) {
      throw new Error('当前目录不是 Git 仓库');
    }
    throw error;
  }
}
