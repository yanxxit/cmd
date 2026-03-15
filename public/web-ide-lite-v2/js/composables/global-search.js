/**
 * Web IDE Lite v2 - 全局搜索功能
 * 
 * 功能：
 * 1. 文件名搜索（文件查询）
 * 2. 文件内容搜索（内容查询）
 * 3. 快捷键支持（Ctrl+Shift+F）
 * 4. 搜索结果导航
 * 5. 高亮显示
 */

// ==================== 文件名搜索 ====================

/**
 * 搜索文件（按文件名）
 * @param {Array} files - 文件列表
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Array} 匹配的文件列表
 */
export function searchFilesByName(files, query, options = {}) {
  if (!query || !query.trim()) return [];
  
  const {
    caseSensitive = false,
    fuzzyMatch = true,
    limit = 50
  } = options;
  
  const searchTerm = caseSensitive ? query : query.toLowerCase();
  const results = [];
  
  for (const file of files) {
    if (results.length >= limit) break;
    
    const fileName = caseSensitive ? file.name : file.name.toLowerCase();
    let matched = false;
    
    if (fuzzyMatch) {
      // 模糊匹配：检查搜索词是否包含在文件名中
      matched = fileName.includes(searchTerm);
    } else {
      // 精确匹配：文件名等于搜索词
      matched = fileName === searchTerm;
    }
    
    if (matched) {
      results.push({
        type: 'file',
        file: {
          id: file.id,
          name: file.name,
          folderId: file.folderId,
          language: file.language
        },
        matchType: 'filename',
        score: calculateMatchScore(fileName, searchTerm)
      });
    }
  }
  
  // 按匹配度排序
  return results.sort((a, b) => b.score - a.score);
}

/**
 * 计算匹配分数
 */
function calculateMatchScore(fileName, searchTerm) {
  let score = 0;
  
  // 完全匹配得分最高
  if (fileName === searchTerm) {
    score += 100;
  }
  
  // 从开头匹配得分高
  if (fileName.startsWith(searchTerm)) {
    score += 50;
  }
  
  // 包含匹配
  if (fileName.includes(searchTerm)) {
    score += 10;
  }
  
  // 文件名越短得分越高
  score += Math.max(0, 20 - fileName.length);
  
  return score;
}

// ==================== 文件内容搜索 ====================

/**
 * 在多个文件中搜索内容
 * @param {Array} files - 文件列表
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Object} 搜索结果
 */
export function searchFilesByContent(files, query, options = {}) {
  if (!query || !query.trim()) return { results: [], stats: { fileCount: 0, matchCount: 0 } };
  
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false,
    maxResults = 500,
    maxPerFile = 20
  } = options;
  
  const results = [];
  let totalMatches = 0;
  
  for (const file of files) {
    if (totalMatches >= maxResults) break;
    if (!file.content || typeof file.content !== 'string') continue;
    
    const matches = findContentMatches(file.content, query, {
      caseSensitive,
      wholeWord,
      useRegex,
      limit: maxPerFile
    });
    
    if (matches.length > 0) {
      results.push({
        type: 'file-content',
        file: {
          id: file.id,
          name: file.name,
          folderId: file.folderId,
          language: file.language
        },
        matches: matches,
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
      query,
      options
    }
  };
}

/**
 * 在内容中查找匹配项
 */
function findContentMatches(text, query, options = {}) {
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false,
    limit = 20
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
    
    while ((match = regex.exec(text)) !== null && matches.length < limit) {
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
    console.error('[Search] 正则表达式错误:', error);
    return [];
  }
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 获取索引位置的行列信息
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

// ==================== 组合搜索 ====================

/**
 * 全局搜索（文件名 + 内容）
 * @param {Array} files - 文件列表
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Object} 搜索结果
 */
export function globalSearch(files, query, options = {}) {
  const {
    searchInFilename = true,
    searchInContent = true,
    ...searchOptions
  } = options;
  
  const results = {
    fileMatches: [],
    contentMatches: [],
    stats: {
      fileCount: 0,
      contentFileCount: 0,
      totalMatches: 0
    }
  };
  
  // 文件名搜索
  if (searchInFilename) {
    results.fileMatches = searchFilesByName(files, query, searchOptions);
    results.stats.fileCount = results.fileMatches.length;
  }
  
  // 内容搜索
  if (searchInContent) {
    const contentResults = searchFilesByContent(files, query, searchOptions);
    results.contentMatches = contentResults.results;
    results.stats.contentFileCount = contentResults.stats.fileCount;
    results.stats.totalMatches = contentResults.stats.totalMatches;
  }
  
  return results;
}

// ==================== 搜索结果导航 ====================

/**
 * 创建搜索状态管理
 * @returns {Object} 状态对象
 */
export function createSearchState() {
  return {
    visible: false,
    query: '',
    results: null,
    currentFileIndex: -1,
    currentMatchIndex: -1,
    options: {
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
      searchInFilename: true,
      searchInContent: true
    }
  };
}

/**
 * 导航到下一个搜索结果
 * @param {Object} searchResults - 搜索结果
 * @param {Object} position - 当前位置
 * @returns {Object} 下一个结果
 */
export function goToNextSearchResult(searchResults, position) {
  if (!searchResults || !searchResults.contentMatches || searchResults.contentMatches.length === 0) {
    return null;
  }
  
  let { currentFileIndex, currentMatchIndex } = position;
  
  // 尝试下一个匹配
  currentMatchIndex++;
  
  const currentResult = searchResults.contentMatches[currentFileIndex];
  if (currentResult && currentMatchIndex >= currentResult.matches.length) {
    // 移动到下一个文件
    currentFileIndex++;
    currentMatchIndex = 0;
  }
  
  // 循环回到第一个
  if (currentFileIndex >= searchResults.contentMatches.length) {
    currentFileIndex = 0;
    currentMatchIndex = 0;
  }
  
  const result = searchResults.contentMatches[currentFileIndex];
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
 * @returns {Object} 上一个结果
 */
export function goToPreviousSearchResult(searchResults, position) {
  if (!searchResults || !searchResults.contentMatches || searchResults.contentMatches.length === 0) {
    return null;
  }
  
  let { currentFileIndex, currentMatchIndex } = position;
  
  // 尝试上一个匹配
  currentMatchIndex--;
  
  if (currentMatchIndex < 0) {
    // 移动到上一个文件
    currentFileIndex--;
    if (currentFileIndex >= 0) {
      const prevResult = searchResults.contentMatches[currentFileIndex];
      currentMatchIndex = prevResult ? prevResult.matches.length - 1 : 0;
    } else {
      // 循环到最后一个
      currentFileIndex = searchResults.contentMatches.length - 1;
      const lastResult = searchResults.contentMatches[currentFileIndex];
      currentMatchIndex = lastResult ? lastResult.matches.length - 1 : 0;
    }
  }
  
  const result = searchResults.contentMatches[currentFileIndex];
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

// ==================== 高亮显示 ====================

/**
 * 高亮搜索关键词
 * @param {string} text - 文本
 * @param {string} query - 关键词
 * @param {Object} options - 高亮选项
 * @returns {string} HTML 字符串
 */
export function highlightSearchMatches(text, query, options = {}) {
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
      `<mark class="search-highlight">${match}</mark>`
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

// ==================== 快捷键支持 ====================

/**
 * 注册搜索快捷键
 * @param {Function} callback - 回调函数
 */
export function registerSearchShortcut(callback) {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+F 或 Cmd+Shift+F
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      callback();
    }
  });
}

/**
 * 注册搜索结果导航快捷键
 * @param {Function} onNext - 下一个回调
 * @param {Function} onPrevious - 上一个回调
 */
export function registerNavigationShortcuts(onNext, onPrevious) {
  document.addEventListener('keydown', (e) => {
    // F3 或 Enter - 下一个
    if (e.key === 'F3' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
      if (!e.shiftKey) {
        e.preventDefault();
        onNext();
      } else {
        e.preventDefault();
        onPrevious();
      }
    }
  });
}
