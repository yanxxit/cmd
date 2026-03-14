/**
 * Web IDE Lite v2 - 主题管理
 * 
 * 功能：
 * 1. 深色/浅色主题切换
 * 2. 主题持久化
 * 3. 自定义主题色
 * 4. 系统主题自动检测
 */

// 预定义主题
const THEMES = {
  dark: {
    name: '深色模式',
    colors: {
      bg: '#1e1e1e',
      sidebar: '#252526',
      activity: '#333333',
      status: '#007acc',
      text: '#cccccc',
      textMuted: '#858585',
      border: '#404040',
      hover: '#2a2d2e',
      active: '#37373d',
      accent: '#0e639c'
    }
  },
  light: {
    name: '浅色模式',
    colors: {
      bg: '#ffffff',
      sidebar: '#f3f3f3',
      activity: '#e8e8e8',
      status: '#007acc',
      text: '#333333',
      textMuted: '#6c6c6c',
      border: '#e0e0e0',
      hover: '#e8e8e8',
      active: '#d4d4d4',
      accent: '#0066cc'
    }
  },
  midnight: {
    name: '午夜蓝',
    colors: {
      bg: '#1a1a2e',
      sidebar: '#16213e',
      activity: '#0f3460',
      status: '#e94560',
      text: '#eaeaea',
      textMuted: '#a0a0a0',
      border: '#2a2a4a',
      hover: '#1f4068',
      active: '#533483',
      accent: '#e94560'
    }
  },
  monokai: {
    name: 'Monokai',
    colors: {
      bg: '#272822',
      sidebar: '#1e1f1c',
      activity: '#3e3d32',
      status: '#a6e22e',
      text: '#f8f8f2',
      textMuted: '#75715e',
      border: '#49483e',
      hover: '#3e3d32',
      active: '#66d9ef',
      accent: '#f92672'
    }
  }
};

// 存储键名
const STORAGE_KEY = 'web-ide-theme';

// 当前主题
let currentTheme = 'dark';

/**
 * 初始化主题
 * @returns {string} 当前主题名称
 */
export function initTheme() {
  // 从 localStorage 读取
  const saved = localStorage.getItem(STORAGE_KEY);
  
  if (saved && THEMES[saved]) {
    currentTheme = saved;
  } else {
    // 检测系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentTheme = prefersDark ? 'dark' : 'light';
  }
  
  applyTheme(currentTheme);
  return currentTheme;
}

/**
 * 应用主题
 * @param {string} themeName - 主题名称
 */
export function applyTheme(themeName) {
  const theme = THEMES[themeName];
  if (!theme) {
    console.error('[Theme] 主题不存在:', themeName);
    return;
  }
  
  currentTheme = themeName;
  
  // 设置 CSS 变量
  const root = document.documentElement;
  root.style.setProperty('--ide-bg', theme.colors.bg);
  root.style.setProperty('--ide-sidebar', theme.colors.sidebar);
  root.style.setProperty('--ide-activity', theme.colors.activity);
  root.style.setProperty('--ide-status', theme.colors.status);
  root.style.setProperty('--ide-text', theme.colors.text);
  root.style.setProperty('--ide-text-muted', theme.colors.textMuted);
  root.style.setProperty('--ide-border', theme.colors.border);
  root.style.setProperty('--ide-hover', theme.colors.hover);
  root.style.setProperty('--ide-active', theme.colors.active);
  root.style.setProperty('--ide-accent', theme.colors.accent);
  
  // 保存到 localStorage
  localStorage.setItem(STORAGE_KEY, themeName);
  
  // 更新 body class
  document.body.classList.remove('theme-dark', 'theme-light', 'theme-midnight', 'theme-monokai');
  document.body.classList.add(`theme-${themeName}`);
  
  console.log('[Theme] 已应用主题:', theme.name);
}

/**
 * 切换主题
 * @returns {string} 新主题名称
 */
export function toggleTheme() {
  // 在深色和浅色之间切换
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  return newTheme;
}

/**
 * 设置主题
 * @param {string} themeName - 主题名称
 */
export function setTheme(themeName) {
  if (THEMES[themeName]) {
    applyTheme(themeName);
  }
}

/**
 * 获取当前主题
 * @returns {string} 当前主题名称
 */
export function getCurrentTheme() {
  return currentTheme;
}

/**
 * 获取所有可用主题
 * @returns {Object} 主题列表
 */
export function getAvailableThemes() {
  return { ...THEMES };
}

/**
 * 获取当前主题配置
 * @returns {Object} 主题配置
 */
export function getCurrentThemeConfig() {
  return THEMES[currentTheme];
}

/**
 * 添加自定义主题
 * @param {string} name - 主题名称
 * @param {Object} colors - 颜色配置
 */
export function addCustomTheme(name, colors) {
  const themeName = name.toLowerCase().replace(/\s+/g, '-');
  THEMES[themeName] = {
    name,
    colors: {
      ...THEMES.dark.colors,
      ...colors
    }
  };
  console.log('[Theme] 已添加自定义主题:', name);
}

/**
 * 监听系统主题变化
 * @param {Function} callback - 回调函数
 * @returns {Function} 取消监听函数
 */
export function watchSystemTheme(callback) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e) => {
    const newTheme = e.matches ? 'dark' : 'light';
    if (currentTheme !== 'dark' && currentTheme !== 'light') {
      // 如果当前使用的是自定义主题，不自动切换
      return;
    }
    callback(newTheme);
  };
  
  mediaQuery.addEventListener('change', handler);
  
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}

/**
 * 创建主题状态管理（用于 Vue）
 * @returns {Object} 主题状态对象
 */
export function createThemeState() {
  let isDark = currentTheme !== 'light';
  const listeners = [];
  
  return {
    get isDark() {
      return isDark;
    },
    
    toggle() {
      const newTheme = toggleTheme();
      isDark = newTheme !== 'light';
      notifyListeners();
      return isDark;
    },
    
    set(themeName) {
      applyTheme(themeName);
      isDark = themeName !== 'light';
      notifyListeners();
    },
    
    subscribe(fn) {
      listeners.push(fn);
      return () => {
        const index = listeners.indexOf(fn);
        if (index > -1) listeners.splice(index, 1);
      };
    }
  };
  
  function notifyListeners() {
    listeners.forEach(fn => fn(isDark));
  }
}

// 初始化时自动应用主题
initTheme();
