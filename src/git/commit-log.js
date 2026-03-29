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
 * @param {boolean} options.noMerges - 是否排除 merge 提交
 * @param {boolean} options.mine - 是否仅查看自己的提交（排除 merge 记录）
 * @returns {Array} - 提交列表
 */
export function getCommitsByDate(options = {}) {
  const { date = 'yesterday', author = '', noMerges = false, mine = false } = options;
  const { since, until } = parseDateRange(date);

  try {
    // 构建命令，支持作者过滤 - 使用 %B 获取完整的提交消息（标题 + 正文）
    let command = `git log --since="${since}" --until="${until}" --pretty=format:"%H|%an|%ae|%ad|%s|%B" --date=format:'%Y-%m-%d %H:%M:%S'`;

    // 排除 merge 提交
    if (noMerges || mine) {
      command += ' --no-merges';
    }

    if (author) {
      command += ` --author="${author}"`;
    }

    // mine 模式：使用当前 git 配置的用户名和邮箱
    if (mine && !author) {
      try {
        const gitName = execSync('git config user.name', { encoding: 'utf-8' }).trim();
        const gitEmail = execSync('git config user.email', { encoding: 'utf-8' }).trim();
        command += ` --author="${gitName}" --author="${gitEmail}"`;
      } catch (e) {
        // 如果获取不到 git 配置，则不使用作者过滤
      }
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
    let pendingOldPath = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 检测旧文件路径（--- a/ 行）
      const oldFileMatch = line.match(/^--- a\/(.+)$/);
      if (oldFileMatch) {
        pendingOldPath = oldFileMatch[1];
        continue;
      }
      
      // 检测新文件路径（+++ b/ 行）
      const fileMatch = line.match(/^\+\+\+ b\/(.+)$/);
      if (fileMatch) {
        // 保存上一个文件
        if (currentFile) {
          currentFile.content = currentContent.join('\n');
          files.push(currentFile);
        }

        const newPath = fileMatch[1];
        currentFile = {
          path: newPath,
          oldPath: pendingOldPath !== newPath ? pendingOldPath : null,
          content: ''
        };
        currentContent = [];
        pendingOldPath = null;

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
    console.error(`getCommitDiff 错误 (${hash}):`, error.message);
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

/**
 * 获取两个提交之间的 diff（支持多提交对比）
 * @param {string} oldHash - 旧提交 hash
 * @param {string} newHash - 新提交 hash
 * @param {boolean} includeContent - 是否包含完整内容
 * @returns {Array} - 文件变更详情
 */
export function getDiffBetweenCommits(oldHash, newHash, includeContent = true) {
  try {
    const safeOldHash = sanitizeHash(oldHash);
    const safeNewHash = sanitizeHash(newHash);

    const command = includeContent
      ? `git diff ${safeOldHash} ${safeNewHash}`
      : `git diff --stat ${safeOldHash} ${safeNewHash}`;

    const diff = execSync(command, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (!diff.trim()) return [];

    const lines = diff.split('\n');
    const files = [];
    let currentFile = null;
    let currentContent = [];
    let pendingOldPath = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检测 diff --git 行
      const gitDiffMatch = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      if (gitDiffMatch) {
        // 保存上一个文件
        if (currentFile) {
          currentFile.content = currentContent.join('\n');
          files.push(currentFile);
        }

        currentFile = {
          path: gitDiffMatch[2],
          oldPath: gitDiffMatch[1] !== gitDiffMatch[2] ? gitDiffMatch[1] : null,
          content: '',
          hunks: []
        };
        currentContent = [];
        pendingOldPath = null;
        continue;
      }

      // 检测旧文件路径
      const oldFileMatch = line.match(/^--- a\/(.+)$/);
      if (oldFileMatch) {
        pendingOldPath = oldFileMatch[1];
        continue;
      }

      // 检测新文件路径
      const newFileMatch = line.match(/^\+\+\+ b\/(.+)$/);
      if (newFileMatch) {
        if (currentFile) {
          currentFile.oldPath = pendingOldPath !== newFileMatch[1] ? pendingOldPath : null;
        }
        continue;
      }

      // 检测 hunk 头
      const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/);
      if (hunkMatch && currentFile) {
        currentFile.hunks.push({
          oldStart: parseInt(hunkMatch[1]),
          oldLines: parseInt(hunkMatch[2] || 1),
          newStart: parseInt(hunkMatch[3]),
          newLines: parseInt(hunkMatch[4] || 1),
          description: hunkMatch[5].trim(),
          lines: []
        });
        continue;
      }

      // 收集 hunk 内容
      if (currentFile && currentFile.hunks.length > 0 && 
          (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
        const currentHunk = currentFile.hunks[currentFile.hunks.length - 1];
        currentHunk.lines.push(line);
        currentContent.push(line);
      }
    }

    // 保存最后一个文件
    if (currentFile) {
      currentFile.content = currentContent.join('\n');
      files.push(currentFile);
    }

    return files;
  } catch (error) {
    console.error(`getDiffBetweenCommits 错误：`, error.message);
    return [];
  }
}

/**
 * 解析 diff 内容为结构化的行级数据
 * @param {string} diffContent - diff 内容
 * @returns {Array} - 结构化的行数据
 */
export function parseDiffLines(diffContent) {
  if (!diffContent) return [];

  const lines = diffContent.split('\n');
  const result = [];
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of lines) {
    // 跳过 diff 元数据行
    if (line.startsWith('diff --git') || line.startsWith('index ') || 
        line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
      
      // 解析 hunk 头，重置行号
      const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (hunkMatch) {
        oldLineNum = parseInt(hunkMatch[1]);
        newLineNum = parseInt(hunkMatch[3]);
      }
      continue;
    }

    if (line.startsWith('+')) {
      result.push({
        type: 'add',
        content: line.substring(1),
        oldLineNum: null,
        newLineNum: newLineNum++
      });
    } else if (line.startsWith('-')) {
      result.push({
        type: 'delete',
        content: line.substring(1),
        oldLineNum: oldLineNum++,
        newLineNum: null
      });
    } else if (line.startsWith(' ')) {
      result.push({
        type: 'context',
        content: line.substring(1),
        oldLineNum: oldLineNum++,
        newLineNum: newLineNum++
      });
    }
  }

  return result;
}

/**
 * 获取文件变更热力图数据（按小时/星期统计）
 * @param {string} filePath - 文件路径（可选）
 * @param {string} since - 开始日期（可选）
 * @param {string} until - 结束日期（可选）
 * @param {string} cwd - 工作目录（可选）
 * @returns {Object} - 热力图数据
 */
export function getFileChangeHeatmap(filePath = '', since = '', until = '', cwd = process.cwd()) {
  try {
    let command = 'git log --format="%ad" --date=format:"%Y-%m-%d %H"';

    if (filePath) {
      command += ` -- "${filePath}"`;
    }

    if (since) {
      command += ` --since="${since}"`;
    }
    if (until) {
      command += ` --until="${until}"`;
    }

    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      cwd
    }).trim();

    if (!output) return { hourly: {}, daily: {}, weekly: {} };

    // 按小时统计
    const hourly = {};
    // 按星期统计（0-6，0 是周日）
    const weekly = {};
    // 按日期统计
    const daily = {};

    const lines = output.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;

      const date = new Date(line);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const dateStr = date.toISOString().split('T')[0];

      // 小时统计
      hourly[hour] = (hourly[hour] || 0) + 1;

      // 星期统计
      weekly[dayOfWeek] = (weekly[dayOfWeek] || 0) + 1;

      // 日期统计
      daily[dateStr] = (daily[dateStr] || 0) + 1;
    }

    return { hourly, daily, weekly };
  } catch (error) {
    return { hourly: {}, daily: {}, weekly: {} };
  }
}

/**
 * 按文件路径搜索提交历史
 * @param {string} filePath - 文件路径（支持通配符）
 * @param {number} limit - 限制返回数量
 * @param {string} cwd - 工作目录
 * @returns {Array} - 提交列表
 */
export function getCommitsByFilePath(filePath, limit = 50, cwd = process.cwd()) {
  try {
    // 使用 --all 搜索所有分支，使用 -- 分隔路径
    const command = `git log --all --oneline --follow -- "${filePath}"`;

    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      maxBuffer: 10 * 1024 * 1024,
      cwd
    }).trim();

    if (!output) return [];

    const commits = [];
    const lines = output.split('\n');

    for (let i = 0; i < Math.min(lines.length, limit); i++) {
      const line = lines[i];
      const match = line.match(/^([a-f0-9]+)\s+(.+)$/);
      if (match) {
        commits.push({
          hash: match[1],
          shortHash: match[1],
          message: match[2]
        });
      }
    }

    return commits;
  } catch (error) {
    return [];
  }
}

/**
 * 按关键词搜索提交消息
 * @param {string} keyword - 搜索关键词
 * @param {Object} options - 选项
 * @param {string} options.since - 开始日期（可选）
 * @param {string} options.until - 结束日期（可选）
 * @param {string} options.author - 作者过滤（可选）
 * @param {number} options.limit - 限制返回数量
 * @param {string} options.cwd - 工作目录（可选）
 * @returns {Array} - 提交列表
 */
export function searchCommitsByMessage(keyword, options = {}) {
  try {
    const { since = '', until = '', author = '', limit = 50, cwd = process.cwd() } = options;

    // 使用 --grep 搜索提交消息，-i 忽略大小写
    let command = `git log --grep="${keyword}" -i --pretty=format:"%H|%an|%ae|%ad|%s" --date=format:'%Y-%m-%d %H:%M:%S'`;

    if (since) {
      command += ` --since="${since}"`;
    }
    if (until) {
      command += ` --until="${until}"`;
    }
    if (author) {
      command += ` --author="${author}"`;
    }

    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      maxBuffer: 10 * 1024 * 1024,
      cwd
    }).trim();

    if (!output) return [];

    const commits = [];
    const lines = output.split('\n');

    for (let i = 0; i < Math.min(lines.length, limit); i++) {
      const line = lines[i];
      const [hash, authorName, authorEmail, date, message] = line.split('|');
      
      commits.push({
        hash,
        shortHash: hash.substring(0, 7),
        authorName,
        authorEmail,
        date,
        message
      });
    }

    return commits;
  } catch (error) {
    return [];
  }
}
