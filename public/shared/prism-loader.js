/**
 * Prism 语言动态加载器
 * 按需加载语法高亮语言组件
 */

const LOADED_LANGUAGES = new Set(['javascript', 'css', 'markup']); // Prism 核心已包含

// 语言映射
const LANGUAGE_MAP = {
  'js': 'javascript',
  'jsx': 'javascript',
  'mjs': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'py': 'python',
  'go': 'go',
  'html': 'markup',
  'htm': 'markup',
  'xml': 'markup',
  'svg': 'markup',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  'json': 'json',
  'md': 'markdown',
  'yaml': 'yaml',
  'yml': 'yaml',
  'sh': 'bash',
  'bash': 'bash',
  'sql': 'sql',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'cs': 'csharp',
  'rb': 'ruby',
  'php': 'php',
  'rs': 'rust',
  'vue': 'vue',
  'graphql': 'graphql',
  'dockerfile': 'docker',
  'makefile': 'makefile',
  'toml': 'toml',
  'ini': 'ini',
  'txt': 'plaintext'
};

// CDN 基础路径
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/prismjs@1.30.0/components/';

// 全局对象
window.PrismLoader = {
  LOADED_LANGUAGES,
  LANGUAGE_MAP,
  CDN_BASE,
  getLanguageName,
  loadLanguage,
  preloadCommonLanguages,
  highlightCode,
  getSupportedLanguages,
  clearLoadedLanguages
};

/**
 * 获取语言名称
 */
function getLanguageName(extension) {
  return LANGUAGE_MAP[extension?.toLowerCase()] || 'plaintext';
}

/**
 * 动态加载语言组件
 */
async function loadLanguage(language) {
  if (!language || language === 'plaintext') {
    return;
  }
  
  if (LOADED_LANGUAGES.has(language)) {
    return;
  }
  
  try {
    // 检查是否已全局存在
    if (window.Prism && window.Prism.languages[language]) {
      LOADED_LANGUAGES.add(language);
      return;
    }
    
    // 动态加载
    const script = document.createElement('script');
    script.src = `${CDN_BASE}prism-${language}.min.js`;
    script.async = false;
    
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load language: ${language}`));
      document.head.appendChild(script);
    });
    
    LOADED_LANGUAGES.add(language);
    console.log(`[Prism] Loaded language: ${language}`);
  } catch (error) {
    console.warn(`[Prism] Could not load language ${language}:`, error.message);
  }
}

/**
 * 预加载常用语言
 */
async function preloadCommonLanguages() {
  const commonLanguages = [
    'javascript', 'typescript', 'python', 'go',
    'markup', 'css', 'json', 'markdown',
    'yaml', 'bash', 'sql'
  ];
  
  await Promise.all(commonLanguages.map(loadLanguage));
}

/**
 * 高亮代码
 */
function highlightCode(code, language) {
  if (!code || !window.Prism || !window.Prism.languages[language]) {
    return code;
  }
  
  return window.Prism.highlight(code, window.Prism.languages[language], language);
}

/**
 * 获取支持的语言列表
 */
function getSupportedLanguages() {
  return Array.from(LOADED_LANGUAGES);
}

/**
 * 清除已加载的语言（用于调试）
 */
function clearLoadedLanguages() {
  LOADED_LANGUAGES.clear();
}
