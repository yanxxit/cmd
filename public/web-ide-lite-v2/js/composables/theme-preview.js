/**
 * Web IDE Lite v2 - 主题预览功能
 * 
 * 功能：
 * 1. 主题切换实时预览
 * 2. 主题预览卡片
 * 3. 自定义主题色
 * 4. 主题收藏功能
 */

// 预定义主题
export const THEMES = {
  dark: {
    id: 'dark',
    name: '深色模式',
    icon: '🌙',
    colors: {
      bg: '#1e1e1e',
      sidebar: '#252526',
      activity: '#333333',
      status: '#007acc',
      text: '#cccccc',
      textMuted: '#858585',
      border: '#404040',
      hover: '#2a2d2e',
      accent: '#0e639c'
    },
    description: '经典的深色主题，适合夜间使用'
  },
  light: {
    id: 'light',
    name: '浅色模式',
    icon: '☀️',
    colors: {
      bg: '#ffffff',
      sidebar: '#f3f3f3',
      activity: '#e8e8e8',
      status: '#007acc',
      text: '#333333',
      textMuted: '#6c6c6c',
      border: '#e0e0e0',
      hover: '#e8e8e8',
      accent: '#0066cc'
    },
    description: '清爽的浅色主题，适合白天使用'
  },
  midnight: {
    id: 'midnight',
    name: '午夜蓝',
    icon: '🌃',
    colors: {
      bg: '#1a1a2e',
      sidebar: '#16213e',
      activity: '#0f3460',
      status: '#e94560',
      text: '#eaeaea',
      textMuted: '#a0a0a0',
      border: '#2a2a4a',
      hover: '#1f4068',
      accent: '#e94560'
    },
    description: '深蓝色调，护眼舒适'
  },
  monokai: {
    id: 'monokai',
    name: 'Monokai',
    icon: '🎨',
    colors: {
      bg: '#272822',
      sidebar: '#1e1f1c',
      activity: '#3e3d32',
      status: '#a6e22e',
      text: '#f8f8f2',
      textMuted: '#75715e',
      border: '#49483e',
      hover: '#3e3d32',
      accent: '#f92672'
    },
    description: '经典的编辑器配色方案'
  },
  github: {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    colors: {
      bg: '#ffffff',
      sidebar: '#f6f8fa',
      activity: '#f3f3f3',
      status: '#24292e',
      text: '#24292e',
      textMuted: '#586069',
      border: '#e1e4e8',
      hover: '#f3f3f3',
      accent: '#0366d6'
    },
    description: 'GitHub 风格的主题'
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    icon: '🧛',
    colors: {
      bg: '#282a36',
      sidebar: '#21222c',
      activity: '#44475a',
      status: '#bd93f9',
      text: '#f8f8f2',
      textMuted: '#6272a4',
      border: '#6272a4',
      hover: '#44475a',
      accent: '#ff79c6'
    },
    description: '流行的暗色主题'
  }
};

/**
 * 应用主题
 * @param {string} themeId - 主题 ID
 * @param {Object} state - Vue 响应式状态
 */
export function applyTheme(themeId, state) {
  const theme = THEMES[themeId];
  if (!theme) {
    console.error('[Theme] 主题不存在:', themeId);
    return false;
  }
  
  // 设置 CSS 变量
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--ide-${key}`, value);
  });
  
  // 更新状态
  if (state) {
    state.isDark.value = themeId !== 'light';
  }
  
  // 保存到 localStorage
  localStorage.setItem('web-ide-theme', themeId);
  
  console.log('[Theme] 已应用主题:', theme.name);
  return true;
}

/**
 * 获取当前主题
 * @returns {string} 当前主题 ID
 */
export function getCurrentTheme() {
  return localStorage.getItem('web-ide-theme') || 'dark';
}

/**
 * 获取所有可用主题
 * @returns {Array} 主题列表
 */
export function getAvailableThemes() {
  return Object.values(THEMES);
}

/**
 * 获取主题预览数据
 * @param {string} themeId - 主题 ID
 * @returns {Object} 主题预览数据
 */
export function getThemePreview(themeId) {
  const theme = THEMES[themeId];
  if (!theme) return null;
  
  return {
    ...theme,
    previewText: 'Preview Text',
    previewCode: `function hello() {\n  console.log("Hello World!");\n}`
  };
}

/**
 * 创建主题状态管理
 * @returns {Object} 状态对象
 */
export function createThemeState() {
  return {
    currentTheme: getCurrentTheme(),
    previewTheme: null,
    isPreviewing: false,
    favorites: JSON.parse(localStorage.getItem('web-ide-theme-favorites') || '[]')
  };
}

/**
 * 预览主题（临时应用，可取消）
 * @param {string} themeId - 主题 ID
 * @param {Object} state - Vue 响应式状态
 */
export function previewTheme(themeId, state) {
  const savedTheme = getCurrentTheme();
  applyTheme(themeId, state);
  
  return () => {
    // 返回原主题
    applyTheme(savedTheme, state);
  };
}

/**
 * 收藏主题
 * @param {string} themeId - 主题 ID
 */
export function favoriteTheme(themeId) {
  const favorites = JSON.parse(localStorage.getItem('web-ide-theme-favorites') || '[]');
  
  if (!favorites.includes(themeId)) {
    favorites.push(themeId);
    localStorage.setItem('web-ide-theme-favorites', JSON.stringify(favorites));
  }
}

/**
 * 取消收藏主题
 * @param {string} themeId - 主题 ID
 */
export function unfavoriteTheme(themeId) {
  const favorites = JSON.parse(localStorage.getItem('web-ide-theme-favorites') || '[]');
  const index = favorites.indexOf(themeId);
  
  if (index > -1) {
    favorites.splice(index, 1);
    localStorage.setItem('web-ide-theme-favorites', JSON.stringify(favorites));
  }
}

/**
 * 获取收藏的主题
 * @returns {Array} 收藏的主题列表
 */
export function getFavoriteThemes() {
  const favorites = JSON.parse(localStorage.getItem('web-ide-theme-favorites') || '[]');
  return favorites.map(id => THEMES[id]).filter(Boolean);
}

/**
 * 检查主题是否已收藏
 * @param {string} themeId - 主题 ID
 * @returns {boolean} 是否已收藏
 */
export function isThemeFavorite(themeId) {
  const favorites = JSON.parse(localStorage.getItem('web-ide-theme-favorites') || '[]');
  return favorites.includes(themeId);
}

/**
 * 主题切换动画
 * @param {HTMLElement} container - 容器元素
 */
export function animateThemeChange(container) {
  if (!container) return;
  
  container.style.transition = 'background-color 0.3s ease';
  container.style.filter = 'brightness(1.2)';
  
  setTimeout(() => {
    container.style.filter = 'brightness(1)';
  }, 150);
}
