/**
 * Web IDE Lite v2 - 搜索和替换功能
 */

/**
 * 在文本中搜索匹配项
 * @param {string} text - 要搜索的文本
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Array} 匹配结果数组
 */
export function searchInText(text, query, options = {}) {
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false
  } = options;

  if (!query) return [];

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

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        text: match[0],
        line: text.substring(0, match.index).split('\n').length - 1,
        column: match.index - text.lastIndexOf('\n', match.index - 1)
      });
    }

    return matches;
  } catch (error) {
    console.error('[Search] 正则表达式错误:', error);
    return [];
  }
}

/**
 * 替换文本
 * @param {string} text - 原始文本
 * @param {string} query - 搜索关键词
 * @param {string} replacement - 替换内容
 * @param {Object} options - 替换选项
 * @returns {Object} 替换结果
 */
export function replaceInText(text, query, replacement, options = {}) {
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false,
    replaceAll = false
  } = options;

  if (!query) return { text, count: 0 };

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
    const flags = caseSensitive ? (replaceAll ? 'g' : '') : (replaceAll ? 'gi' : 'i');
    const regex = new RegExp(pattern, flags);
    
    // 处理替换字符串中的特殊字符
    const replaceStr = useRegex ? replacement : replacement.replace(/\$/g, '$$$$');
    
    const newText = text.replace(regex, replaceStr);
    const count = (text.match(regex) || []).length;

    return {
      text: newText,
      count
    };
  } catch (error) {
    console.error('[Replace] 正则表达式错误:', error);
    return { text, count: 0 };
  }
}

/**
 * 高亮显示匹配项
 * @param {string} text - 原始文本
 * @param {string} query - 搜索关键词
 * @param {Object} options - 高亮选项
 * @returns {string} HTML 格式的高亮文本
 */
export function highlightMatches(text, query, options = {}) {
  const {
    caseSensitive = false,
    wholeWord = false,
    useRegex = false
  } = options;

  if (!query) return escapeHtml(text);

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
    
    // 先转义 HTML，然后高亮
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
    console.error('[Highlight] 错误:', error);
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
 * 跳转到指定行和列
 * @param {HTMLTextAreaElement} textarea - 文本区域元素
 * @param {number} line - 行号（从 1 开始）
 * @param {number} column - 列号（从 1 开始）
 */
export function goToLine(textarea, line, column = 1) {
  if (!textarea) return;

  const lines = textarea.value.split('\n');
  
  // 确保行号在有效范围内
  line = Math.max(1, Math.min(line, lines.length));
  
  // 计算位置
  let position = 0;
  for (let i = 0; i < line - 1; i++) {
    position += lines[i].length + 1; // +1 是换行符
  }
  
  // 确保列号在有效范围内
  const currentLineLength = lines[line - 1]?.length || 0;
  column = Math.max(1, Math.min(column, currentLineLength + 1));
  
  position += column - 1;

  // 设置光标位置
  textarea.setSelectionRange(position, position);
  textarea.focus();

  // 滚动到光标位置
  scrollToLine(textarea, line);
}

/**
 * 滚动到指定行
 * @param {HTMLTextAreaElement} textarea - 文本区域元素
 * @param {number} line - 行号
 */
export function scrollToLine(textarea, line) {
  if (!textarea) return;

  const lineHeight = 20; // 估计的行高
  const visibleLines = Math.floor(textarea.clientHeight / lineHeight);
  const targetScroll = (line - 1) * lineHeight - (visibleLines / 2) * lineHeight;

  textarea.scrollTop = Math.max(0, targetScroll);
}

/**
 * 选中所有匹配项
 * @param {HTMLTextAreaElement} textarea - 文本区域元素
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {number} 选中的匹配数
 */
export function selectAllMatches(textarea, query, options = {}) {
  if (!textarea || !query) return 0;

  const matches = searchInText(textarea.value, query, options);
  
  if (matches.length === 0) return 0;

  // 选中第一个匹配项
  const firstMatch = matches[0];
  textarea.setSelectionRange(firstMatch.index, firstMatch.index + firstMatch.text.length);
  textarea.focus();

  return matches.length;
}

/**
 * 搜索并高亮所有匹配项（用于侧边栏显示）
 * @param {string} text - 文本内容
 * @param {string} query - 搜索关键词
 * @param {Object} options - 搜索选项
 * @returns {Array} 匹配行列表
 */
export function getMatchLines(text, query, options = {}) {
  const matches = searchInText(text, query, options);
  const lines = text.split('\n');
  const result = [];

  matches.forEach(match => {
    const lineNum = match.line + 1; // 转换为从 1 开始的行号
    const lineContent = lines[match.line];
    
    // 检查是否已存在该行
    if (!result.find(r => r.line === lineNum)) {
      result.push({
        line: lineNum,
        content: lineContent,
        matches: matches.filter(m => m.line === match.line)
      });
    }
  });

  return result;
}

/**
 * 创建搜索状态管理
 * @returns {Object} 搜索状态对象
 */
export function createSearchState() {
  let searchQuery = '';
  let replaceQuery = '';
  let searchOptions = {
    caseSensitive: false,
    wholeWord: false,
    useRegex: false
  };
  let currentMatchIndex = -1;
  let matches = [];

  return {
    getQuery: () => searchQuery,
    setQuery: (query) => { searchQuery = query; },
    
    getReplaceQuery: () => replaceQuery,
    setReplaceQuery: (query) => { replaceQuery = query; },
    
    getOptions: () => ({ ...searchOptions }),
    setOptions: (options) => { Object.assign(searchOptions, options); },
    
    getMatches: () => matches,
    setMatches: (newMatches) => { matches = newMatches; },
    
    getCurrentMatchIndex: () => currentMatchIndex,
    setCurrentMatchIndex: (index) => { currentMatchIndex = index; },
    
    reset: () => {
      searchQuery = '';
      replaceQuery = '';
      currentMatchIndex = -1;
      matches = [];
    }
  };
}
