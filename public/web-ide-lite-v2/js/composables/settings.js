/**
 * Web IDE Lite v2 - 设置管理
 * 
 * 功能：
 * 1. 编辑器设置（字体大小、自动换行、Tab 大小等）
 * 2. 外观设置（主题、侧边栏宽度等）
 * 3. 文件设置（自动保存、文件类型等）
 * 4. 快捷键设置
 * 5. 设置持久化（localStorage）
 */

// 默认设置
const DEFAULT_SETTINGS = {
  // 编辑器设置
  editor: {
    fontSize: 14,              // 字体大小
    fontFamily: "'Monaco', 'Consolas', monospace", // 字体
    lineHeight: 1.5,           // 行高
    wordWrap: false,           // 自动换行
    tabSize: 2,                // Tab 大小（空格数）
    useSpaces: true,           // 使用空格代替 Tab
    minimap: false,            // 显示缩略图（待实现）
    lineNumbers: true,         // 显示行号
    highlightActiveLine: true, // 高亮当前行
    bracketMatching: true,     // 括号匹配
    autoClosingBrackets: true, // 自动闭合括号
    autoIndent: true           // 自动缩进
  },
  
  // 外观设置
  appearance: {
    theme: 'dark',             // 主题：dark, light, midnight, monokai
    sidebarWidth: 288,         // 侧边栏宽度 (px)
    statusBarVisible: true,    // 显示状态栏
    activityBarVisible: true,  // 显示活动栏
    fontSize: 14               // UI 字体大小
  },
  
  // 文件设置
  files: {
    autoSave: true,            // 自动保存
    autoSaveDelay: 2000,       // 自动保存延迟 (ms)
    autoSaveInterval: 30000,   // 定时保存间隔 (ms)
    maxBackups: 10,            // 最大备份数
    defaultLanguage: 'plaintext', // 默认语言
    encoding: 'utf-8'          // 文件编码
  },
  
  // 快捷键设置
  shortcuts: {
    save: 'Ctrl+S',            // 保存
    newFile: 'Ctrl+N',         // 新建文件
    openFile: 'Ctrl+O',        // 打开文件
    search: 'Ctrl+F',          // 搜索
    replace: 'Ctrl+H',         // 替换
    toggleSidebar: 'Ctrl+B',   // 切换侧边栏
    toggleTheme: 'Ctrl+Shift+T' // 切换主题
  },
  
  // 其他设置
  other: {
    confirmBeforeDelete: true, // 删除前确认
    showMinimap: false,        // 显示缩略图
    smoothScrolling: true,     // 平滑滚动
    cursorBlinking: true,      // 光标闪烁
    cursorStyle: 'line',       // 光标样式：line, block, underline
    renderWhitespace: 'none',  // 显示空白字符：none, selection, all
    language: 'zh-CN'          // 界面语言
  }
};

// 存储键名
const STORAGE_KEY = 'web-ide-settings';

// 当前设置
let currentSettings = null;

// 设置变更监听器
const changeListeners = [];

/**
 * 初始化设置
 * @returns {Object} 设置对象
 */
export function initSettings() {
  // 从 localStorage 读取
  const saved = localStorage.getItem(STORAGE_KEY);
  
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // 合并默认设置
      currentSettings = deepMerge(DEFAULT_SETTINGS, parsed);
    } catch (e) {
      console.error('[Settings] 读取设置失败:', e);
      currentSettings = { ...DEFAULT_SETTINGS };
    }
  } else {
    currentSettings = { ...DEFAULT_SETTINGS };
  }
  
  console.log('[Settings] 初始化完成', currentSettings);
  return currentSettings;
}

/**
 * 深度合并对象
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * 获取设置
 * @param {string} key - 设置键（支持点号，如 'editor.fontSize'）
 * @returns {any} 设置值
 */
export function getSetting(key) {
  if (!currentSettings) {
    initSettings();
  }
  
  const keys = key.split('.');
  let value = currentSettings;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * 获取所有设置
 * @returns {Object} 设置对象
 */
export function getAllSettings() {
  if (!currentSettings) {
    initSettings();
  }
  return { ...currentSettings };
}

/**
 * 获取默认设置
 * @returns {Object} 默认设置对象
 */
export function getDefaultSettings() {
  return { ...DEFAULT_SETTINGS };
}

/**
 * 设置单个值
 * @param {string} key - 设置键
 * @param {any} value - 设置值
 */
export function setSetting(key, value) {
  if (!currentSettings) {
    initSettings();
  }
  
  const keys = key.split('.');
  let obj = currentSettings;
  
  // 找到倒数第二个对象
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in obj)) {
      obj[k] = {};
    }
    obj = obj[k];
  }
  
  // 设置最后一个值
  const lastKey = keys[keys.length - 1];
  obj[lastKey] = value;
  
  // 保存到 localStorage
  saveSettings();
  
  // 通知监听器
  notifyChangeListeners(key, value);
  
  console.log(`[Settings] 设置更新：${key} = ${value}`);
}

/**
 * 批量设置
 * @param {Object} settings - 设置对象
 */
export function setSettings(settings) {
  if (!currentSettings) {
    initSettings();
  }
  
  deepMerge(currentSettings, settings);
  saveSettings();
  
  // 通知监听器
  notifyChangeListeners('*', settings);
  
  console.log('[Settings] 批量设置更新', settings);
}

/**
 * 重置为默认值
 * @param {string} key - 可选，指定重置哪个设置
 */
export function resetSettings(key = null) {
  if (!key) {
    // 重置所有
    currentSettings = { ...DEFAULT_SETTINGS };
  } else {
    // 重置指定设置
    const value = getNestedValue(DEFAULT_SETTINGS, key);
    if (value !== undefined) {
      setSetting(key, value);
      return;
    }
  }
  
  saveSettings();
  notifyChangeListeners('*', currentSettings);
  console.log('[Settings] 设置已重置');
}

/**
 * 获取嵌套值
 */
function getNestedValue(obj, key) {
  const keys = key.split('.');
  let value = obj;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * 保存设置到 localStorage
 */
function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
    console.log('[Settings] 设置已保存');
  } catch (e) {
    console.error('[Settings] 保存设置失败:', e);
  }
}

/**
 * 导出设置为 JSON
 * @returns {string} JSON 字符串
 */
export function exportSettings() {
  return JSON.stringify(currentSettings, null, 2);
}

/**
 * 从 JSON 导入设置
 * @param {string} json - JSON 字符串
 */
export function importSettings(json) {
  try {
    const parsed = JSON.parse(json);
    deepMerge(currentSettings, parsed);
    saveSettings();
    notifyChangeListeners('*', currentSettings);
    console.log('[Settings] 设置已导入');
    return true;
  } catch (e) {
    console.error('[Settings] 导入设置失败:', e);
    return false;
  }
}

/**
 * 监听设置变更
 * @param {Function} callback - 回调函数 (key, value) => {}
 * @returns {Function} 取消监听函数
 */
export function watchSettings(callback) {
  changeListeners.push(callback);
  
  return () => {
    const index = changeListeners.indexOf(callback);
    if (index > -1) {
      changeListeners.splice(index, 1);
    }
  };
}

/**
 * 通知监听器
 */
function notifyChangeListeners(key, value) {
  changeListeners.forEach(cb => cb(key, value));
}

/**
 * 应用编辑器设置到 DOM
 * @param {HTMLElement} editor - 编辑器元素
 */
export function applyEditorSettings(editor) {
  if (!editor || !currentSettings) return;
  
  const { editor: editorSettings } = currentSettings;
  
  // 字体大小
  editor.style.fontSize = `${editorSettings.fontSize}px`;
  
  // 字体
  editor.style.fontFamily = editorSettings.fontFamily;
  
  // 行高
  editor.style.lineHeight = String(editorSettings.lineHeight);
  
  // 自动换行
  editor.style.whiteSpace = editorSettings.wordWrap ? 'pre-wrap' : 'pre';
  
  console.log('[Settings] 编辑器设置已应用');
}

/**
 * 应用外观设置到 DOM
 */
export async function applyAppearanceSettings() {
  if (!currentSettings) return;

  const { appearance } = currentSettings;

  // 设置主题
  if (appearance.theme) {
    // 通过 composables/theme.js 应用
    const { setTheme } = await import('./theme.js');
    setTheme(appearance.theme);
  }

  // 设置侧边栏宽度
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.style.width = `${appearance.sidebarWidth}px`;
  }

  // 状态栏可见性
  const statusBar = document.querySelector('footer');
  if (statusBar) {
    statusBar.style.display = appearance.statusBarVisible ? 'flex' : 'none';
  }

  console.log('[Settings] 外观设置已应用');
}

/**
 * 创建设置状态管理（用于 Vue）
 * @returns {Object} 设置状态对象
 */
export function createSettingsState() {
  let settings = getAllSettings();
  const listeners = [];
  
  return {
    get settings() {
      return settings;
    },
    
    getSetting(key) {
      return getSetting(key);
    },
    
    setSetting(key, value) {
      setSetting(key, value);
      settings = getAllSettings();
      notifyVueListeners();
    },
    
    setSettings(newSettings) {
      setSettings(newSettings);
      settings = getAllSettings();
      notifyVueListeners();
    },
    
    resetSettings(key = null) {
      resetSettings(key);
      settings = getAllSettings();
      notifyVueListeners();
    },
    
    subscribe(fn) {
      listeners.push(fn);
      const unsubscribe = watchSettings(() => {
        fn(getAllSettings());
      });
      return () => {
        const index = listeners.indexOf(fn);
        if (index > -1) listeners.splice(index, 1);
        unsubscribe();
      };
    }
  };
  
  function notifyVueListeners() {
    listeners.forEach(fn => fn(settings));
  }
}

// 设置分类（用于 UI 渲染）
export const SETTINGS_CATEGORIES = [
  {
    id: 'editor',
    name: '编辑器',
    icon: '📝',
    settings: [
      { key: 'editor.fontSize', label: '字体大小', type: 'number', min: 8, max: 72, unit: 'px' },
      { key: 'editor.lineHeight', label: '行高', type: 'number', min: 1, max: 3, step: 0.1 },
      { key: 'editor.wordWrap', label: '自动换行', type: 'boolean' },
      { key: 'editor.tabSize', label: 'Tab 大小', type: 'number', min: 1, max: 8, unit: '空格' },
      { key: 'editor.useSpaces', label: '使用空格代替 Tab', type: 'boolean' },
      { key: 'editor.lineNumbers', label: '显示行号', type: 'boolean' },
      { key: 'editor.highlightActiveLine', label: '高亮当前行', type: 'boolean' },
      { key: 'editor.bracketMatching', label: '括号匹配', type: 'boolean' },
      { key: 'editor.autoClosingBrackets', label: '自动闭合括号', type: 'boolean' },
      { key: 'editor.autoIndent', label: '自动缩进', type: 'boolean' }
    ]
  },
  {
    id: 'appearance',
    name: '外观',
    icon: '🎨',
    settings: [
      { key: 'appearance.theme', label: '主题', type: 'select', options: [
        { value: 'dark', label: '深色模式' },
        { value: 'light', label: '浅色模式' },
        { value: 'midnight', label: '午夜蓝' },
        { value: 'monokai', label: 'Monokai' }
      ]},
      { key: 'appearance.sidebarWidth', label: '侧边栏宽度', type: 'number', min: 200, max: 500, step: 10, unit: 'px' },
      { key: 'appearance.statusBarVisible', label: '显示状态栏', type: 'boolean' },
      { key: 'appearance.fontSize', label: 'UI 字体大小', type: 'number', min: 12, max: 24, unit: 'px' }
    ]
  },
  {
    id: 'files',
    name: '文件',
    icon: '📁',
    settings: [
      { key: 'files.autoSave', label: '自动保存', type: 'boolean' },
      { key: 'files.autoSaveDelay', label: '自动保存延迟', type: 'number', min: 500, max: 10000, step: 500, unit: 'ms' },
      { key: 'files.autoSaveInterval', label: '定时保存间隔', type: 'number', min: 10000, max: 300000, step: 5000, unit: 'ms' },
      { key: 'files.maxBackups', label: '最大备份数', type: 'number', min: 1, max: 50 },
      { key: 'files.defaultLanguage', label: '默认语言', type: 'select', options: [
        { value: 'plaintext', label: '纯文本' },
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'python', label: 'Python' },
        { value: 'html', label: 'HTML' },
        { value: 'css', label: 'CSS' }
      ]}
    ]
  },
  {
    id: 'shortcuts',
    name: '快捷键',
    icon: '⌨️',
    settings: [
      { key: 'shortcuts.save', label: '保存', type: 'shortcut' },
      { key: 'shortcuts.newFile', label: '新建文件', type: 'shortcut' },
      { key: 'shortcuts.openFile', label: '打开文件', type: 'shortcut' },
      { key: 'shortcuts.search', label: '搜索', type: 'shortcut' },
      { key: 'shortcuts.replace', label: '替换', type: 'shortcut' },
      { key: 'shortcuts.toggleSidebar', label: '切换侧边栏', type: 'shortcut' },
      { key: 'shortcuts.toggleTheme', label: '切换主题', type: 'shortcut' }
    ]
  },
  {
    id: 'other',
    name: '其他',
    icon: '⚙️',
    settings: [
      { key: 'other.confirmBeforeDelete', label: '删除前确认', type: 'boolean' },
      { key: 'other.smoothScrolling', label: '平滑滚动', type: 'boolean' },
      { key: 'other.cursorBlinking', label: '光标闪烁', type: 'boolean' },
      { key: 'other.cursorStyle', label: '光标样式', type: 'select', options: [
        { value: 'line', label: '线' },
        { value: 'block', label: '块' },
        { value: 'underline', label: '下划线' }
      ]},
      { key: 'other.renderWhitespace', label: '显示空白字符', type: 'select', options: [
        { value: 'none', label: '不显示' },
        { value: 'selection', label: '选中时' },
        { value: 'all', label: '始终' }
      ]},
      { key: 'other.language', label: '界面语言', type: 'select', options: [
        { value: 'zh-CN', label: '简体中文' },
        { value: 'en', label: 'English' }
      ]}
    ]
  }
];

// 自动初始化
initSettings();
