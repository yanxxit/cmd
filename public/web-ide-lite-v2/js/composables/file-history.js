/**
 * Web IDE Lite v2 - 文件历史版本功能
 * 
 * 功能：
 * 1. 本地版本记录
 * 2. 版本对比
 * 3. 版本恢复
 * 4. 自动版本快照
 */

const STORAGE_PREFIX = 'web-ide-file-history-';
const MAX_VERSIONS_PER_FILE = 20; // 每个文件最多保存 20 个版本

/**
 * 保存文件版本
 * @param {Object} file - 文件对象
 * @param {string} content - 文件内容
 * @returns {Object} 版本信息
 */
export function saveFileVersion(file, content) {
  if (!file || !file.id) return null;
  
  const historyKey = `${STORAGE_PREFIX}${file.id}`;
  const versions = getFileHistory(file.id);
  
  // 创建新版本
  const newVersion = {
    id: Date.now(),
    timestamp: Date.now(),
    content: content,
    length: content.length,
    lines: content.split('\n').length
  };
  
  // 添加到版本列表开头
  versions.unshift(newVersion);
  
  // 限制版本数量
  if (versions.length > MAX_VERSIONS_PER_FILE) {
    versions.pop();
  }
  
  // 保存到 localStorage
  try {
    localStorage.setItem(historyKey, JSON.stringify(versions));
    console.log(`[FileHistory] 已保存版本：${file.name}`);
  } catch (e) {
    console.warn('[FileHistory] 保存失败，可能超出存储限制:', e);
  }
  
  return newVersion;
}

/**
 * 获取文件历史版本列表
 * @param {string} fileId - 文件 ID
 * @returns {Array} 版本列表
 */
export function getFileHistory(fileId) {
  const historyKey = `${STORAGE_PREFIX}${fileId}`;
  
  try {
    const data = localStorage.getItem(historyKey);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('[FileHistory] 读取历史失败:', e);
    return [];
  }
}

/**
 * 获取指定版本的内容
 * @param {string} fileId - 文件 ID
 * @param {number} versionId - 版本 ID
 * @returns {Object|null} 版本内容
 */
export function getVersionContent(fileId, versionId) {
  const versions = getFileHistory(fileId);
  const version = versions.find(v => v.id === versionId);
  return version || null;
}

/**
 * 恢复文件到指定版本
 * @param {string} fileId - 文件 ID
 * @param {number} versionId - 版本 ID
 * @param {Object} state - Vue 响应式状态
 * @returns {boolean} 是否成功恢复
 */
export function restoreToVersion(fileId, versionId, state) {
  const version = getVersionContent(fileId, versionId);
  if (!version) return false;
  
  // 查找文件
  const file = state.files.value.find(f => f.id === fileId);
  if (!file) return false;
  
  // 恢复内容
  file.content = version.content;
  file.modified = true;
  
  // 如果当前打开的是这个文件，更新编辑器内容
  if (state.currentFile.value?.id === fileId) {
    state.editorContent.value = version.content;
  }
  
  console.log(`[FileHistory] 已恢复到版本：${versionId}`);
  return true;
}

/**
 * 删除文件历史
 * @param {string} fileId - 文件 ID
 * @param {number} versionId - 可选，指定删除的版本
 */
export function deleteFileHistory(fileId, versionId = null) {
  const historyKey = `${STORAGE_PREFIX}${fileId}`;
  
  if (versionId === null) {
    // 删除所有历史
    localStorage.removeItem(historyKey);
    console.log(`[FileHistory] 已删除所有历史：${fileId}`);
  } else {
    // 删除指定版本
    const versions = getFileHistory(fileId);
    const filtered = versions.filter(v => v.id !== versionId);
    localStorage.setItem(historyKey, JSON.stringify(filtered));
    console.log(`[FileHistory] 已删除版本：${versionId}`);
  }
}

/**
 * 清空所有文件历史
 */
export function clearAllHistory() {
  const keys = Object.keys(localStorage);
  const historyKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
  
  historyKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log(`[FileHistory] 已清空所有历史，共 ${historyKeys.length} 个文件`);
}

/**
 * 获取版本统计信息
 * @param {string} fileId - 文件 ID
 * @returns {Object} 统计信息
 */
export function getVersionStats(fileId) {
  const versions = getFileHistory(fileId);
  
  if (versions.length === 0) {
    return {
      total: 0,
      oldest: null,
      newest: null,
      totalSize: 0
    };
  }
  
  const totalSize = versions.reduce((sum, v) => sum + (v.content?.length || 0), 0);
  
  return {
    total: versions.length,
    oldest: versions[versions.length - 1],
    newest: versions[0],
    totalSize
  };
}

/**
 * 比较两个版本
 * @param {string} fileId - 文件 ID
 * @param {number} versionId1 - 版本 1 ID
 * @param {number} versionId2 - 版本 2 ID
 * @returns {Object} 比较结果
 */
export function compareVersions(fileId, versionId1, versionId2) {
  const version1 = getVersionContent(fileId, versionId1);
  const version2 = getVersionContent(fileId, versionId2);
  
  if (!version1 || !version2) {
    return null;
  }
  
  const lines1 = version1.content.split('\n');
  const lines2 = version2.content.split('\n');
  
  const added = [];
  const removed = [];
  
  // 简单比较
  lines1.forEach((line, i) => {
    if (!lines2.includes(line)) {
      removed.push({ line: i + 1, content: line });
    }
  });
  
  lines2.forEach((line, i) => {
    if (!lines1.includes(line)) {
      added.push({ line: i + 1, content: line });
    }
  });
  
  return {
    version1: {
      id: versionId1,
      timestamp: version1.timestamp,
      lines: lines1.length
    },
    version2: {
      id: versionId2,
      timestamp: version2.timestamp,
      lines: lines2.length
    },
    changes: {
      added,
      removed,
      addedCount: added.length,
      removedCount: removed.length
    }
  };
}

/**
 * 格式化版本时间
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间
 */
export function formatVersionTime(timestamp) {
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
  
  // 7 天内
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }
  
  // 显示日期时间
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${month}月${day}日 ${hours}:${minutes}`;
}

/**
 * 创建文件历史状态管理
 * @returns {Object} 状态对象
 */
export function createFileHistoryState() {
  return {
    visible: false,
    currentFileId: null,
    versions: [],
    selectedVersion: null,
    compareMode: false,
    compareVersions: []
  };
}

/**
 * 自动保存版本（防抖）
 * @param {Object} file - 文件对象
 * @param {string} content - 文件内容
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 取消函数
 */
export function createAutoSaveVersion(file, content, delay = 60000) {
  let timeoutId = null;
  
  const scheduleSave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      saveFileVersion(file, content);
    }, delay);
  };
  
  // 立即调度一次
  scheduleSave();
  
  // 返回取消函数
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * 导出文件历史
 * @param {string} fileId - 文件 ID
 * @param {string} fileName - 文件名
 * @returns {string} JSON 字符串
 */
export function exportFileHistory(fileId, fileName) {
  const versions = getFileHistory(fileId);
  
  return JSON.stringify({
    fileId,
    fileName,
    exportedAt: Date.now(),
    versions: versions.map(v => ({
      id: v.id,
      timestamp: v.timestamp,
      content: v.content,
      length: v.length,
      lines: v.lines
    }))
  }, null, 2);
}

/**
 * 导入文件历史
 * @param {string} fileId - 文件 ID
 * @param {string} jsonData - JSON 数据
 * @returns {boolean} 是否成功导入
 */
export function importFileHistory(fileId, jsonData) {
  try {
    const data = JSON.parse(jsonData);
    const historyKey = `${STORAGE_PREFIX}${fileId}`;
    
    // 合并现有历史
    const existing = getFileHistory(fileId);
    const imported = data.versions || [];
    
    // 合并并去重
    const merged = [...imported, ...existing].filter(
      (v, i, arr) => arr.findIndex(x => x.id === v.id) === i
    ).sort((a, b) => b.timestamp - a.timestamp);
    
    // 限制数量
    if (merged.length > MAX_VERSIONS_PER_FILE) {
      merged.splice(MAX_VERSIONS_PER_FILE);
    }
    
    localStorage.setItem(historyKey, JSON.stringify(merged));
    console.log(`[FileHistory] 已导入 ${imported.length} 个版本`);
    return true;
  } catch (e) {
    console.error('[FileHistory] 导入失败:', e);
    return false;
  }
}
