/**
 * Web IDE Lite v2 - 自动保存功能
 * 
 * 功能：
 * 1. 定时自动保存（默认 30 秒）
 * 2. 失去焦点时保存
 * 3. 内容变化时延迟保存
 * 4. 本地备份功能
 * 5. 支持设置配置
 */

import { getSetting, setSetting } from './settings.js';

// 自动保存配置（从设置读取）
let AUTO_SAVE_CONFIG = {
  enabled: true,                    // 是否启用
  interval: 30000,                  // 定时保存间隔（毫秒）
  debounceDelay: 2000,              // 内容变化后延迟保存（毫秒）
  maxBackups: 10,                   // 最大备份数量
  storageKey: 'web-ide-autosave'    // localStorage 键名
};

// 保存定时器
let autoSaveTimer = null;
let debounceTimer = null;

/**
 * 从设置加载配置
 */
function loadSettings() {
  const autoSave = getSetting('files.autoSave');
  const autoSaveDelay = getSetting('files.autoSaveDelay');
  const autoSaveInterval = getSetting('files.autoSaveInterval');
  const maxBackups = getSetting('files.maxBackups');
  
  AUTO_SAVE_CONFIG = {
    ...AUTO_SAVE_CONFIG,
    enabled: autoSave !== undefined ? autoSave : AUTO_SAVE_CONFIG.enabled,
    debounceDelay: autoSaveDelay !== undefined ? autoSaveDelay : AUTO_SAVE_CONFIG.debounceDelay,
    interval: autoSaveInterval !== undefined ? autoSaveInterval : AUTO_SAVE_CONFIG.interval,
    maxBackups: maxBackups !== undefined ? maxBackups : AUTO_SAVE_CONFIG.maxBackups
  };
  
  console.log('[AutoSave] 配置已加载', AUTO_SAVE_CONFIG);
}

/**
 * 初始化自动保存
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 */
export function initAutoSave(state, actions) {
  // 从设置加载配置
  loadSettings();
  
  if (!AUTO_SAVE_CONFIG.enabled) {
    console.log('[AutoSave] 自动保存已禁用');
    return () => {};
  }

  console.log('[AutoSave] 初始化自动保存', AUTO_SAVE_CONFIG);

  // 恢复未保存的文件
  recoverUnsavedFiles(state);

  // 设置定时保存
  setupIntervalSave(state, actions);

  // 监听页面可见性变化
  setupVisibilityListener(state, actions);

  // 监听窗口失去焦点
  setupBlurListener(state, actions);
  
  // 监听设置变更
  const unsubscribeSettings = watchSettings((key, value) => {
    if (key.startsWith('files.')) {
      handleSettingsChange(state, actions, key, value);
    }
  });

  return () => {
    destroyAutoSave();
    unsubscribeSettings();
  };
}

/**
 * 处理设置变更
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 * @param {string} key - 设置键
 * @param {any} value - 设置值
 */
function handleSettingsChange(state, actions, key, value) {
  console.log('[AutoSave] 设置变更，重新初始化', key, value);
  
  // 重新加载配置
  loadSettings();
  
  // 重新初始化
  destroyAutoSave();
  
  if (AUTO_SAVE_CONFIG.enabled) {
    setupIntervalSave(state, actions);
  }
}

/**
 * 销毁自动保存
 */
function destroyAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

/**
 * 设置定时保存
 */
function setupIntervalSave(state, actions) {
  autoSaveTimer = setInterval(() => {
    if (state.currentFile.value && state.editorContent.value) {
      console.log('[AutoSave] 定时保存');
      saveToLocalStorage(state);
    }
  }, AUTO_SAVE_CONFIG.interval);
}

/**
 * 监听页面可见性变化
 */
function setupVisibilityListener(state, actions) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // 页面隐藏时保存
      if (state.currentFile.value && state.editorContent.value) {
        console.log('[AutoSave] 页面隐藏时保存');
        saveToLocalStorage(state);
      }
    }
  });
}

/**
 * 监听窗口失去焦点
 */
function setupBlurListener(state, actions) {
  window.addEventListener('blur', () => {
    if (state.currentFile.value && state.editorContent.value) {
      console.log('[AutoSave] 窗口失去焦点时保存');
      saveToLocalStorage(state);
    }
  });
}

/**
 * 内容变化时触发延迟保存
 * @param {Object} state - Vue 响应式状态
 */
export function onContentChange(state) {
  if (!AUTO_SAVE_CONFIG.enabled) return;

  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // 设置新的定时器
  debounceTimer = setTimeout(() => {
    if (state.currentFile.value && state.editorContent.value) {
      console.log('[AutoSave] 内容变化后保存');
      saveToLocalStorage(state);
    }
  }, AUTO_SAVE_CONFIG.debounceDelay);
}

/**
 * 保存到 localStorage
 * @param {Object} state - Vue 响应式状态
 */
function saveToLocalStorage(state) {
  try {
    const backups = getBackups();
    const currentFile = state.currentFile.value;
    
    if (!currentFile || !state.editorContent.value) return;

    // 创建备份
    const backup = {
      fileId: currentFile.id,
      fileName: currentFile.name,
      content: state.editorContent.value,
      language: state.currentLanguage.value,
      timestamp: Date.now()
    };

    // 查找是否已有相同文件的备份
    const existingIndex = backups.findIndex(b => b.fileId === currentFile.id);
    if (existingIndex > -1) {
      // 更新现有备份
      backups[existingIndex] = backup;
    } else {
      // 添加新备份
      backups.push(backup);
    }

    // 限制备份数量
    while (backups.length > AUTO_SAVE_CONFIG.maxBackups) {
      backups.shift();
    }

    // 保存到 localStorage
    localStorage.setItem(AUTO_SAVE_CONFIG.storageKey, JSON.stringify(backups));
    
    console.log(`[AutoSave] 已保存 ${backups.length} 个文件备份`);
  } catch (error) {
    console.error('[AutoSave] 保存失败:', error);
  }
}

/**
 * 获取所有备份
 * @returns {Array} 备份列表
 */
function getBackups() {
  try {
    const data = localStorage.getItem(AUTO_SAVE_CONFIG.storageKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[AutoSave] 读取备份失败:', error);
    return [];
  }
}

/**
 * 恢复未保存的文件
 * @param {Object} state - Vue 响应式状态
 */
function recoverUnsavedFiles(state) {
  try {
    const backups = getBackups();
    
    if (backups.length === 0) return;

    console.log(`[AutoSave] 发现 ${backups.length} 个备份文件`);

    // 将备份恢复到 files 列表
    backups.forEach(backup => {
      const existingFile = state.files.value.find(f => f.id === backup.fileId);
      
      if (existingFile) {
        // 更新现有文件
        existingFile.content = backup.content;
        existingFile.language = backup.language;
      } else {
        // 添加新文件
        state.files.value.push({
          id: backup.fileId,
          name: backup.fileName,
          content: backup.content,
          language: backup.language,
          modified: true,
          folderId: null,
          createdAt: new Date(backup.timestamp).toISOString()
        });
      }
    });

    // 显示恢复提示
    console.log('[AutoSave] 已恢复备份文件到文件列表');
  } catch (error) {
    console.error('[AutoSave] 恢复备份失败:', error);
  }
}

/**
 * 获取备份列表
 * @returns {Array} 备份列表
 */
export function getBackupList() {
  return getBackups().map(backup => ({
    fileId: backup.fileId,
    fileName: backup.fileName,
    timestamp: backup.timestamp,
    formattedTime: formatTime(backup.timestamp)
  }));
}

/**
 * 恢复指定备份
 * @param {number} fileId - 文件 ID
 * @param {Object} state - Vue 响应式状态
 * @returns {Object|null} 恢复的备份内容
 */
export function restoreBackup(fileId, state) {
  const backups = getBackups();
  const backup = backups.find(b => b.fileId === fileId);
  
  if (!backup) {
    console.error('[AutoSave] 未找到备份');
    return null;
  }

  // 更新或创建文件
  const existingFile = state.files.value.find(f => f.id === fileId);
  
  if (existingFile) {
    existingFile.content = backup.content;
    existingFile.language = backup.language;
    existingFile.modified = true;
  } else {
    state.files.value.push({
      id: backup.fileId,
      name: backup.fileName,
      content: backup.content,
      language: backup.language,
      modified: true,
      folderId: null,
      createdAt: new Date(backup.timestamp).toISOString()
    });
  }

  console.log('[AutoSave] 已恢复备份');
  return backup;
}

/**
 * 清除备份
 * @param {number|null} fileId - 文件 ID，null 表示清除所有
 */
export function clearBackups(fileId = null) {
  try {
    if (fileId === null) {
      // 清除所有备份
      localStorage.removeItem(AUTO_SAVE_CONFIG.storageKey);
      console.log('[AutoSave] 已清除所有备份');
    } else {
      // 清除指定文件的备份
      const backups = getBackups();
      const filtered = backups.filter(b => b.fileId !== fileId);
      localStorage.setItem(AUTO_SAVE_CONFIG.storageKey, JSON.stringify(filtered));
      console.log('[AutoSave] 已清除文件备份');
    }
  } catch (error) {
    console.error('[AutoSave] 清除备份失败:', error);
  }
}

/**
 * 格式化时间
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // 1 分钟内
  if (diff < 60000) {
    return '刚刚';
  }
  
  // 1 小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  
  // 24 小时内
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }
  
  // 显示日期时间
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${month}月${day}日 ${hours}:${minutes}`;
}

/**
 * 监听设置变更
 * @param {Function} callback - 回调函数
 * @returns {Function} 取消监听函数
 */
function watchSettings(callback) {
  const listeners = window.__settingsListeners || [];
  const wrapper = (key, value) => callback(key, value);
  listeners.push(wrapper);
  window.__settingsListeners = listeners;
  
  return () => {
    const index = listeners.indexOf(wrapper);
    if (index > -1) listeners.splice(index, 1);
    window.__settingsListeners = listeners;
  };
}

/**
 * 获取自动保存配置
 * @returns {Object} 配置对象
 */
export function getAutoSaveConfig() {
  return { ...AUTO_SAVE_CONFIG };
}

/**
 * 更新自动保存配置
 * @param {Object} newConfig - 新配置
 */
export function updateAutoSaveConfig(newConfig) {
  Object.assign(AUTO_SAVE_CONFIG, newConfig);
  console.log('[AutoSave] 配置已更新', AUTO_SAVE_CONFIG);
  
  // 如果启用了自动保存，重新启动
  if (AUTO_SAVE_CONFIG.enabled && !autoSaveTimer) {
    // 需要通过外部调用重新初始化
    console.log('[AutoSave] 请重新调用 initAutoSave 以应用新配置');
  }
}
