/**
 * Web IDE Lite v2 - 文件搜索功能
 * 
 * 功能：
 * 1. 文件名搜索（支持模糊匹配）
 * 2. 文件内容搜索
 * 3. 搜索结果高亮
 * 4. 搜索结果导航
 */

/**
 * 搜索文件（按文件名）
 * @param {Array} files - 文件列表
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Array} 匹配的文件列表
 */
export function searchFiles(files, query, options = {}) {
  if (!query || !query.trim()) return [];
  
  const {
    caseSensitive = false,
    fuzzyMatch = true  // 模糊匹配
  } = options;
  
  const searchTerm = caseSensitive ? query : query.toLowerCase();
  
  return files.filter(file => {
    const fileName = caseSensitive ? file.name : file.name.toLowerCase();
    
    if (fuzzyMatch) {
      // 模糊匹配：检查搜索词是否包含在文件名中
      return fileName.includes(searchTerm);
    } else {
      // 精确匹配
      return fileName === searchTerm;
    }
  });
}

/**
 * 在文件内容中搜索
 * @param {Array} files - 文件列表
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Array} 搜索结果
 */
export function searchInFiles(files, query, options = {}) {
  if (!query || !query.trim()) return [];
  
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false,
    maxResults = 100
  } = options;
  
  const results = [];
  let resultCount = 0;
  
  for (const file of files) {
    if (resultCount >= maxResults) break;
    if (!file.content) continue;
    
    const matches = findMatches(file.content, query, {
      caseSensitive,
      wholeWord,
      useRegex
    });
    
    if (matches.length > 0) {
      results.push({
        file: {
          id: file.id,
          name: file.name,
          folderId: file.folderId
        },
        matches: matches.slice(0, 10) // 每个文件最多 10 个匹配
      });
      resultCount++;
    }
  }
  
  return results;
}

/**
 * 在文本中查找匹配项
 * @param {string} text - 文本内容
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Array} 匹配结果
 */
function findMatches(text, query, options = {}) {
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false
  } = options;
  
  let pattern = query;
  
  // 转义正则特殊字符
  if (!useRegex) {
    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  // 全词匹配
  if (wholeWord) {
    pattern = `\\b${pattern}\\b`;
  }
  
  try {
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(pattern, flags);
    const matches = [];
    let match;
    
    // 计算行号
    const lines = text.split('\n');
    let currentPosition = 0;
    
    while ((match = regex.exec(text)) !== null && matches.length < 50) {
      const matchIndex = match.index;
      
      // 计算行号和列号
      let lineNumber = 1;
      let columnNumber = 1;
      
      for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length + 1; // +1 是换行符
        if (currentPosition + lineLength > matchIndex) {
          lineNumber = i + 1;
          columnNumber = matchIndex - currentPosition + 1;
          break;
        }
        currentPosition += lineLength;
      }
      
      matches.push({
        line: lineNumber,
        column: columnNumber,
        text: match[0],
        context: getLineContent(lines, lineNumber - 1)
      });
    }
    
    return matches;
  } catch (error) {
    console.error('[Search] 正则表达式错误:', error);
    return [];
  }
}

/**
 * 获取指定行的内容
 * @param {Array} lines - 行数组
 * @param {number} index - 行索引
 * @returns {string} 行内容
 */
function getLineContent(lines, index) {
  if (index >= 0 && index < lines.length) {
    return lines[index].trim();
  }
  return '';
}

/**
 * 高亮搜索关键词
 * @param {string} text - 文本
 * @param {string} query - 关键词
 * @param {Object} options - 高亮选项
 * @returns {string} HTML 字符串
 */
export function highlightSearchTerm(text, query, options = {}) {
  if (!query) return escapeHtml(text);
  
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false
  } = options;
  
  let pattern = query;
  
  // 转义正则特殊字符
  if (!useRegex) {
    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * 创建文件搜索状态管理
 * @returns {Object} 搜索状态对象
 */
export function createFileSearchState() {
  let searchQuery = '';
  let searchResults = [];
  let currentResultIndex = -1;
  
  return {
    getQuery: () => searchQuery,
    setQuery: (query) => { searchQuery = query; },
    
    getResults: () => searchResults,
    setResults: (results) => { searchResults = results; },
    
    getCurrentIndex: () => currentResultIndex,
    setCurrentIndex: (index) => { currentResultIndex = index; },
    
    reset: () => {
      searchQuery = '';
      searchResults = [];
      currentResultIndex = -1;
    }
  };
}

/**
 * 获取搜索结果统计信息
 * @param {Array} results - 搜索结果
 * @returns {Object} 统计信息
 */
export function getSearchStats(results) {
  const fileCount = results.length;
  const matchCount = results.reduce((sum, r) => sum + r.matches.length, 0);
  
  return {
    fileCount,
    matchCount,
    summary: `在 ${fileCount} 个文件中找到 ${matchCount} 处匹配`
  };
}

/**
 * 导航到下一个搜索结果
 * @param {Array} results - 搜索结果
 * @param {number} currentIndex - 当前索引
 * @returns {Object} 下一个结果的位置
 */
export function goToNextResult(results, currentIndex) {
  if (results.length === 0) return null;
  
  let fileIndex = 0;
  let matchIndex = currentIndex;
  
  matchIndex++;
  
  if (matchIndex >= results[fileIndex]?.matches?.length) {
    fileIndex++;
    matchIndex = 0;
  }
  
  if (fileIndex >= results.length) {
    // 循环回到第一个
    fileIndex = 0;
    matchIndex = 0;
  }
  
  const result = results[fileIndex];
  if (result && result.matches[matchIndex]) {
    return {
      file: result.file,
      match: result.matches[matchIndex],
      index: matchIndex
    };
  }
  
  return null;
}

/**
 * 导航到上一个搜索结果
 * @param {Array} results - 搜索结果
 * @param {number} currentIndex - 当前索引
 * @returns {Object} 上一个结果的位置
 */
export function goToPreviousResult(results, currentIndex) {
  if (results.length === 0) return null;
  
  let fileIndex = 0;
  let matchIndex = currentIndex;
  
  matchIndex--;
  
  if (matchIndex < 0) {
    fileIndex--;
    if (fileIndex < 0) {
      fileIndex = results.length - 1;
    }
    matchIndex = results[fileIndex]?.matches?.length - 1 || 0;
  }
  
  const result = results[fileIndex];
  if (result && result.matches[matchIndex]) {
    return {
      file: result.file,
      match: result.matches[matchIndex],
      index: matchIndex
    };
  }
  
  return null;
}
