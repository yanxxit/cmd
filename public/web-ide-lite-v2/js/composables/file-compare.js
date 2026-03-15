/**
 * Web IDE Lite v2 - 文件比较功能
 * 
 * 功能：
 * 1. 两文件内容对比
 * 2. 差异高亮显示
 * 3. 统计差异数量
 * 4. 并排/内联视图
 */

/**
 * 比较两个文件的内容
 * @param {string} content1 - 文件 1 内容
 * @param {string} content2 - 文件 2 内容
 * @param {Object} options - 比较选项
 * @returns {Object} 比较结果
 */
export function compareFiles(content1, content2, options = {}) {
  const {
    ignoreWhitespace = false,
    ignoreCase = false
  } = options;
  
  // 预处理内容
  let text1 = content1;
  let text2 = content2;
  
  if (ignoreWhitespace) {
    text1 = text1.replace(/\s+/g, ' ').trim();
    text2 = text2.replace(/\s+/g, ' ').trim();
  }
  
  if (ignoreCase) {
    text1 = text1.toLowerCase();
    text2 = text2.toLowerCase();
  }
  
  // 按行分割
  const lines1 = content1.split('\n');
  const lines2 = content2.split('\n');
  
  // 计算差异
  const diff = computeDiff(lines1, lines2);
  
  // 统计
  const stats = {
    totalLines1: lines1.length,
    totalLines2: lines2.length,
    addedLines: diff.filter(d => d.type === 'added').length,
    removedLines: diff.filter(d => d.type === 'removed').length,
    unchangedLines: diff.filter(d => d.type === 'unchanged').length,
    changed: content1 !== content2
  };
  
  return {
    diff,
    stats,
    isIdentical: !stats.changed
  };
}

/**
 * 计算行差异（简化版 LCS 算法）
 * @param {Array} lines1 - 文件 1 行数组
 * @param {Array} lines2 - 文件 2 行数组
 * @returns {Array} 差异数组
 */
function computeDiff(lines1, lines2) {
  const diff = [];
  const maxLen = Math.max(lines1.length, lines2.length);
  
  let i = 0, j = 0;
  
  while (i < lines1.length || j < lines2.length) {
    if (i >= lines1.length) {
      // 文件 1 已结束，文件 2 剩余的都是新增
      diff.push({
        type: 'added',
        line: j + 1,
        content: lines2[j],
        oldLine: null,
        newLine: j + 1
      });
      j++;
    } else if (j >= lines2.length) {
      // 文件 2 已结束，文件 1 剩余的都是删除
      diff.push({
        type: 'removed',
        line: i + 1,
        content: lines1[i],
        oldLine: i + 1,
        newLine: null
      });
      i++;
    } else if (lines1[i] === lines2[j]) {
      // 内容相同
      diff.push({
        type: 'unchanged',
        line: i + 1,
        content: lines1[i],
        oldLine: i + 1,
        newLine: j + 1
      });
      i++;
      j++;
    } else {
      // 内容不同，需要查找后续匹配
      const match = findNextMatch(lines1, lines2, i, j);
      
      if (match) {
        // 添加删除的行
        for (let k = i; k < match.i; k++) {
          diff.push({
            type: 'removed',
            line: k + 1,
            content: lines1[k],
            oldLine: k + 1,
            newLine: null
          });
        }
        
        // 添加新增的行
        for (let k = j; k < match.j; k++) {
          diff.push({
            type: 'added',
            line: k + 1,
            content: lines2[k],
            oldLine: null,
            newLine: k + 1
          });
        }
        
        i = match.i;
        j = match.j;
      } else {
        // 没有匹配，视为修改
        diff.push({
          type: 'modified',
          line: i + 1,
          content: lines1[i],
          newContent: lines2[j],
          oldLine: i + 1,
          newLine: j + 1
        });
        i++;
        j++;
      }
    }
  }
  
  return diff;
}

/**
 * 查找下一个匹配的行
 * @param {Array} lines1 - 文件 1 行数组
 * @param {Array} lines2 - 文件 2 行数组
 * @param {number} i - 文件 1 当前索引
 * @param {number} j - 文件 2 当前索引
 * @returns {Object|null} 匹配位置
 */
function findNextMatch(lines1, lines2, i, j) {
  const maxLookahead = 10;
  
  for (let offset1 = 0; offset1 < maxLookahead && i + offset1 < lines1.length; offset1++) {
    for (let offset2 = 0; offset2 < maxLookahead && j + offset2 < lines2.length; offset2++) {
      if (offset1 === 0 && offset2 === 0) continue;
      
      if (lines1[i + offset1] === lines2[j + offset2]) {
        return {
          i: i + offset1,
          j: j + offset2
        };
      }
    }
  }
  
  return null;
}

/**
 * 格式化差异用于显示
 * @param {Array} diff - 差异数组
 * @param {Object} options - 格式化选项
 * @returns {Object} 格式化结果
 */
export function formatDiffForDisplay(diff, options = {}) {
  const {
    showUnchanged = false,
    contextLines = 3
  } = options;
  
  const formatted = [];
  let showNext = false;
  let unchangedCount = 0;
  
  for (let i = 0; i < diff.length; i++) {
    const item = diff[i];
    
    if (item.type === 'unchanged') {
      if (showUnchanged || showNext || unchangedCount < contextLines) {
        formatted.push({ ...item, display: true });
        showNext = false;
      } else if (unchangedCount === contextLines) {
        formatted.push({ type: 'ellipsis', display: true });
      }
      unchangedCount++;
    } else {
      showNext = true;
      unchangedCount = 0;
      formatted.push({ ...item, display: true });
      
      // 显示后续的上下文
      for (let j = 1; j <= contextLines && i + j < diff.length; j++) {
        if (diff[i + j].type === 'unchanged') {
          formatted.push({ ...diff[i + j], display: true });
        } else {
          break;
        }
      }
    }
  }
  
  return formatted;
}

/**
 * 创建文件比较状态管理
 * @returns {Object} 状态对象
 */
export function createCompareState() {
  return {
    visible: false,
    file1: null,
    file2: null,
    result: null,
    options: {
      ignoreWhitespace: false,
      ignoreCase: false,
      showUnchanged: true,
      viewMode: 'inline' // 'inline' or 'side-by-side'
    }
  };
}

/**
 * 获取差异样式类
 * @param {Object} item - 差异项
 * @returns {string} CSS 类名
 */
export function getDiffClass(item) {
  switch (item.type) {
    case 'added':
      return 'diff-added';
    case 'removed':
      return 'diff-removed';
    case 'modified':
      return 'diff-modified';
    case 'unchanged':
      return 'diff-unchanged';
    case 'ellipsis':
      return 'diff-ellipsis';
    default:
      return '';
  }
}

/**
 * 获取差异图标
 * @param {Object} item - 差异项
 * @returns {string} 图标
 */
export function getDiffIcon(item) {
  switch (item.type) {
    case 'added':
      return '+';
    case 'removed':
      return '-';
    case 'modified':
      return '~';
    default:
      return ' ';
  }
}
