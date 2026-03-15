/**
 * Web IDE Lite v2 - 文件内容搜索功能
 * 
 * 功能：
 * 1. 多文件内容搜索
 * 2. 正则表达式支持
 * 3. 大小写选项
 * 4. 全词匹配
 * 5. 搜索结果导航
 */

/**
 * 在多个文件中搜索内容
 * @param {Array} files - 文件列表
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Array} 搜索结果
 */
export function searchInFilesContent(files, query, options = {}) {
  if (!query || !query.trim()) return [];
  
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false,
    maxResults = 200
  } = options;
  
  const results = [];
  let totalMatches = 0;
  
  for (const file of files) {
    if (totalMatches >= maxResults) break;
    if (!file.content || typeof file.content !== 'string') continue;
    
    const matches = findContentMatches(file.content, query, {
      caseSensitive,
      wholeWord,
      useRegex
    });
    
    if (matches.length > 0) {
      results.push({
        file: {
          id: file.id,
          name: file.name,
          folderId: file.folderId,
          language: file.language
        },
        matches: matches.slice(0, 20),
        matchCount: matches.length
      });
      totalMatches += matches.length;
    }
  }
  
  return {
    results,
    stats: {
      fileCount: results.length,
      totalMatches,
      query
    }
  };
}

/**
 * 在内容中查找匹配项
 * @param {string} text - 文本内容
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Array} 匹配结果
 */
function findContentMatches(text, query, options = {}) {
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
    
    // 计算行号
    const lines = text.split('\n');
    
    while ((match = regex.exec(text)) !== null && matches.length < 50) {
      const matchIndex = match.index;
      
      // 计算行号和列号
      const position = getIndexPosition(text, matchIndex);
      
      // 获取上下文（前后各一行）
      const context = getContextLines(lines, position.line - 1);
      
      matches.push({
        line: position.line,
        column: position.column,
        text: match[0],
        context: context,
        index: matchIndex
      });
    }
    
    return matches;
  } catch (error) {
    console.error('[ContentSearch] 正则表达式错误:', error);
    return [];
  }
}

/**
 * 转义正则表达式特殊字符
 * @param {string} string - 原始字符串
 * @returns {string} 转义后的字符串
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 获取索引位置的行列信息
 * @param {string} text - 文本内容
 * @param {number} index - 字符索引
 * @returns {Object} 行列信息
 */
function getIndexPosition(text, index) {
  const textBefore = text.substring(0, index);
  const lines = textBefore.split('\n');
  
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

/**
 * 获取上下文行
 * @param {Array} lines - 所有行
 * @param {number} lineIndex - 目标行索引
 * @param {number} range - 上下文范围
 * @returns {Object} 上下文信息
 */
function getContextLines(lines, lineIndex, range = 1) {
  const start = Math.max(0, lineIndex - range);
  const end = Math.min(lines.length, lineIndex + range + 1);
  
  return {
    lines: lines.slice(start, end),
    highlightIndex: lineIndex - start,
    startLine: start + 1
  };
}

/**
 * 替换文件内容中的匹配项
 * @param {string} text - 文本内容
 * @param {string} query - 搜索关键词
 * @param {string} replacement - 替换内容
 * @param {Object} options - 替换选项
 * @returns {Object} 替换结果
 */
export function replaceInFilesContent(text, query, replacement, options = {}) {
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false,
    replaceAll = false
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
    const flags = caseSensitive ? (replaceAll ? 'g' : '') : (replaceAll ? 'gi' : 'i');
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
    console.error('[ContentReplace] 错误:', error);
    return { text, matchCount: 0, success: false };
  }
}

/**
 * 高亮搜索关键词
 * @param {string} text - 文本
 * @param {string} query - 关键词
 * @param {Object} options - 高亮选项
 * @returns {string} HTML 字符串
 */
export function highlightContentMatches(text, query, options = {}) {
  if (!query) return escapeHtml(text);
  
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
    const escapedText = escapeHtml(text);
    const escapedQuery = escapeHtml(query);
    const escapedRegex = new RegExp(
      useRegex ? pattern : escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      flags
    );
    
    return escapedText.replace(escapedRegex, match => 
      `<mark class="search-highlight">${match}</mark>`
    );
  } catch (error) {
    return escapeHtml(text);
  }
}

/**
 * 转义 HTML 特殊字符
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => htmlEntities[char]);
}

/**
 * 创建文件内容搜索状态管理
 * @returns {Object} 搜索状态对象
 */
export function createContentSearchState() {
  let searchQuery = '';
  let searchResults = null;
  let currentFileIndex = -1;
  let currentMatchIndex = -1;
  
  return {
    getQuery: () => searchQuery,
    setQuery: (query) => { searchQuery = query; },
    
    getResults: () => searchResults,
    setResults: (results) => { searchResults = results; },
    
    getCurrentPosition: () => ({ currentFileIndex, currentMatchIndex }),
    setCurrentPosition: (fileIndex, matchIndex) => {
      currentFileIndex = fileIndex;
      currentMatchIndex = matchIndex;
    },
    
    reset: () => {
      searchQuery = '';
      searchResults = null;
      currentFileIndex = -1;
      currentMatchIndex = -1;
    }
  };
}

/**
 * 导航到下一个搜索结果
 * @param {Object} searchResults - 搜索结果
 * @param {Object} position - 当前位置
 * @returns {Object} 下一个结果的位置
 */
export function goToNextMatch(searchResults, position) {
  if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
    return null;
  }
  
  let { currentFileIndex, currentMatchIndex } = position;
  
  // 尝试下一个匹配
  currentMatchIndex++;
  
  const currentResult = searchResults.results[currentFileIndex];
  if (currentResult && currentMatchIndex >= currentResult.matches.length) {
    // 移动到下一个文件
    currentFileIndex++;
    currentMatchIndex = 0;
  }
  
  // 循环回到第一个
  if (currentFileIndex >= searchResults.results.length) {
    currentFileIndex = 0;
    currentMatchIndex = 0;
  }
  
  const result = searchResults.results[currentFileIndex];
  if (result && result.matches[currentMatchIndex]) {
    return {
      fileIndex: currentFileIndex,
      matchIndex: currentMatchIndex,
      file: result.file,
      match: result.matches[currentMatchIndex]
    };
  }
  
  return null;
}

/**
 * 导航到上一个搜索结果
 * @param {Object} searchResults - 搜索结果
 * @param {Object} position - 当前位置
 * @returns {Object} 上一个结果的位置
 */
export function goToPreviousMatch(searchResults, position) {
  if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
    return null;
  }
  
  let { currentFileIndex, currentMatchIndex } = position;
  
  // 尝试上一个匹配
  currentMatchIndex--;
  
  if (currentMatchIndex < 0) {
    // 移动到上一个文件
    currentFileIndex--;
    if (currentFileIndex >= 0) {
      const prevResult = searchResults.results[currentFileIndex];
      currentMatchIndex = prevResult ? prevResult.matches.length - 1 : 0;
    } else {
      // 循环到最后一个
      currentFileIndex = searchResults.results.length - 1;
      const lastResult = searchResults.results[currentFileIndex];
      currentMatchIndex = lastResult ? lastResult.matches.length - 1 : 0;
    }
  }
  
  const result = searchResults.results[currentFileIndex];
  if (result && result.matches[currentMatchIndex]) {
    return {
      fileIndex: currentFileIndex,
      matchIndex: currentMatchIndex,
      file: result.file,
      match: result.matches[currentMatchIndex]
    };
  }
  
  return null;
}
