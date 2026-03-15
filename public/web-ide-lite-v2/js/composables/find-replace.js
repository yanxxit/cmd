/**
 * Web IDE Lite v2 - 查找替换功能
 * 
 * 功能：
 * 1. 当前文件查找
 * 2. 当前文件替换
 * 3. 批量替换
 * 4. 高亮显示
 * 5. 导航匹配项
 */

/**
 * 在文本中查找所有匹配项
 * @param {string} text - 文本内容
 * @param {string} query - 搜索关键词
 * @param {Object} options - 查找选项
 * @returns {Array} 匹配项数组
 */
export function findAllMatches(text, query, options = {}) {
  if (!query) return [];
  
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false
  } = options;
  
  let pattern = query;
  
  // 转义正则特殊字符
  if (!useRegex) {
    pattern = escapeRegExp(query);
  }
  
  // 全词匹配
  if (wholeWord) {
    pattern = `\\b${pattern}\\b`;
  }
  
  try {
    const flags = caseSensitive ? 'gm' : 'gim';
    const regex = new RegExp(pattern, flags);
    const matches = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const startPos = match.index;
      const endPos = startPos + match[0].length;
      
      // 计算行列位置
      const startLine = text.substring(0, startPos).split('\n').length;
      const startCol = startPos - text.lastIndexOf('\n', startPos - 1);
      
      matches.push({
        index: startPos,
        length: match[0].length,
        text: match[0],
        line: startLine,
        column: startCol,
        endIndex: endPos
      });
    }
    
    return matches;
  } catch (error) {
    console.error('[FindReplace] 错误:', error);
    return [];
  }
}

/**
 * 替换文本中的匹配项
 * @param {string} text - 原始文本
 * @param {string} query - 搜索关键词
 * @param {string} replacement - 替换内容
 * @param {Object} options - 替换选项
 * @returns {Object} 替换结果
 */
export function replaceAll(text, query, replacement, options = {}) {
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false
  } = options;
  
  let pattern = query;
  
  // 转义正则特殊字符
  if (!useRegex) {
    pattern = escapeRegExp(query);
  }
  
  // 全词匹配
  if (wholeWord) {
    pattern = `\\b${pattern}\\b`;
  }
  
  try {
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(pattern, flags);
    
    // 处理替换字符串中的特殊字符
    const replaceStr = useRegex ? replacement : replacement.replace(/\$/g, '$$$$');
    
    const newText = text.replace(regex, replaceStr);
    const matchCount = (text.match(regex) || []).length;
    
    return {
      text: newText,
      matchCount,
      success: newText !== text
    };
  } catch (error) {
    console.error('[FindReplace] 替换错误:', error);
    return { text, matchCount: 0, success: false };
  }
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 高亮显示匹配项
 * @param {string} text - 文本
 * @param {string} query - 关键词
 * @param {Object} options - 高亮选项
 * @returns {string} HTML 字符串
 */
export function highlightMatches(text, query, options = {}) {
  if (!query) return escapeHtml(text);
  
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false
  } = options;
  
  let pattern = query;
  
  if (!useRegex) {
    pattern = escapeRegExp(query);
  }
  
  if (wholeWord) {
    pattern = `\\b${pattern}\\b`;
  }
  
  try {
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(pattern, flags);
    const escapedText = escapeHtml(text);
    const escapedQuery = escapeHtml(query);
    const escapedRegex = new RegExp(
      escapeRegExp(escapedQuery),
      flags
    );
    
    return escapedText.replace(escapedRegex, match => 
      `<mark class="find-highlight">${match}</mark>`
    );
  } catch (error) {
    return escapeHtml(text);
  }
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 创建查找替换状态管理
 * @returns {Object} 状态对象
 */
export function createFindReplaceState() {
  return {
    visible: false,
    findQuery: '',
    replaceQuery: '',
    matches: [],
    currentMatchIndex: -1,
    options: {
      caseSensitive: false,
      wholeWord: false,
      useRegex: false
    }
  };
}

/**
 * 导航到下一个匹配项
 * @param {Array} matches - 匹配项数组
 * @param {number} currentIndex - 当前索引
 * @returns {Object} 下一个匹配项
 */
export function goToNextMatch(matches, currentIndex) {
  if (matches.length === 0) return null;
  
  const nextIndex = (currentIndex + 1) % matches.length;
  return {
    match: matches[nextIndex],
    index: nextIndex
  };
}

/**
 * 导航到上一个匹配项
 * @param {Array} matches - 匹配项数组
 * @param {number} currentIndex - 当前索引
 * @returns {Object} 上一个匹配项
 */
export function goToPreviousMatch(matches, currentIndex) {
  if (matches.length === 0) return null;
  
  const prevIndex = currentIndex <= 0 ? matches.length - 1 : currentIndex - 1;
  return {
    match: matches[prevIndex],
    index: prevIndex
  };
}
