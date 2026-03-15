/**
 * Web IDE Lite v2 - 最近文件管理
 * 
 * 功能：
 * 1. 记录最近打开的文件
 * 2. 显示最近文件列表
 * 3. 快速访问最近文件
 * 4. 本地存储持久化
 */

const STORAGE_KEY = 'web-ide-recent-files';
const MAX_RECENT_FILES = 10; // 最多保存 10 个最近文件

/**
 * 添加文件到最近列表
 * @param {Object} file - 文件对象
 */
export function addRecentFile(file) {
  if (!file || !file.id || !file.name) return;
  
  const recents = getRecentFiles();
  
  // 移除已存在的相同文件
  const filtered = recents.filter(f => f.id !== file.id);
  
  // 添加到开头
  const newRecent = {
    id: file.id,
    name: file.name,
    folderId: file.folderId,
    openedAt: Date.now()
  };
  
  filtered.unshift(newRecent);
  
  // 限制数量
  if (filtered.length > MAX_RECENT_FILES) {
    filtered.pop();
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * 获取最近文件列表
 * @returns {Array} 最近文件列表
 */
export function getRecentFiles() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('[RecentFiles] 读取失败:', e);
    return [];
  }
}

/**
 * 移除最近文件
 * @param {number} fileId - 文件 ID
 */
export function removeRecentFile(fileId) {
  const recents = getRecentFiles();
  const filtered = recents.filter(f => f.id !== fileId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * 清空最近文件列表
 */
export function clearRecentFiles() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 格式化时间显示
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间
 */
export function formatRecentTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // 1 小时内
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }
  
  // 24 小时内
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }
  
  // 7 天内
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}天前`;
  }
  
  // 显示日期
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

/**
 * 获取最近文件的统计信息
 * @param {Array} recents - 最近文件列表
 * @returns {Object} 统计信息
 */
export function getRecentFilesStats(recents) {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  const oneDayAgo = now - 86400000;
  const oneWeekAgo = now - 604800000;
  
  return {
    total: recents.length,
    today: recents.filter(f => f.openedAt > oneDayAgo).length,
    thisWeek: recents.filter(f => f.openedAt > oneWeekAgo).length,
    thisHour: recents.filter(f => f.openedAt > oneHourAgo).length
  };
}

/**
 * 创建最近文件状态管理（用于 Vue）
 * @returns {Object} 状态对象
 */
export function createRecentFilesState() {
  let recentFiles = [];
  
  return {
    get files() {
      return recentFiles;
    },
    
    load() {
      recentFiles = getRecentFiles();
      return recentFiles;
    },
    
    add(file) {
      addRecentFile(file);
      recentFiles = getRecentFiles();
      return recentFiles;
    },
    
    remove(fileId) {
      removeRecentFile(fileId);
      recentFiles = getRecentFiles();
      return recentFiles;
    },
    
    clear() {
      clearRecentFiles();
      recentFiles = [];
      return recentFiles;
    },
    
    refresh() {
      recentFiles = getRecentFiles();
      return recentFiles;
    }
  };
}

/**
 * 初始化最近文件功能
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 */
export function initRecentFiles(state, actions) {
  console.log('[RecentFiles] 初始化最近文件功能');
  
  // 加载最近文件
  const recents = getRecentFiles();
  state.recentFiles.value = recents;
  
  return {
    add: (file) => {
      addRecentFile(file);
      state.recentFiles.value = getRecentFiles();
    },
    remove: (fileId) => {
      removeRecentFile(fileId);
      state.recentFiles.value = getRecentFiles();
    },
    clear: () => {
      clearRecentFiles();
      state.recentFiles.value = [];
      actions.showToast('✅ 最近文件已清空', 'success');
    }
  };
}
