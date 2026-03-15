/**
 * Web IDE Lite v2 - 多标签页管理功能
 * 
 * 功能：
 * 1. 标签拖拽排序
 * 2. 关闭全部标签
 * 3. 关闭其他标签
 * 4. 关闭右侧标签
 * 5. 标签右键菜单
 */

/**
 * 关闭标签页
 * @param {Array} tabs - 标签页数组
 * @param {Object} tabToClose - 要关闭的标签
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 * @returns {boolean} 是否成功关闭
 */
export function closeTab(tabs, tabToClose, state, actions) {
  const index = tabs.findIndex(t => t.id === tabToClose.id);
  if (index === -1) return false;
  
  // 检查是否有未保存的修改
  if (tabToClose.modified && !confirm(`${tabToClose.name} 有未保存的修改，确定关闭？`)) {
    return false;
  }
  
  tabs.splice(index, 1);
  
  // 如果关闭的是当前标签，切换到相邻标签
  if (state.currentFile.value?.id === tabToClose.id) {
    if (tabs.length > 0) {
      const newIndex = Math.min(index, tabs.length - 1);
      actions.openFile(tabs[newIndex]);
    } else {
      state.currentFile.value = null;
    }
  }
  
  return true;
}

/**
 * 关闭全部标签页
 * @param {Array} tabs - 标签页数组
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 * @returns {number} 关闭的标签数
 */
export function closeAllTabs(tabs, state, actions) {
  // 检查是否有未保存的修改
  const modifiedTabs = tabs.filter(t => t.modified);
  if (modifiedTabs.length > 0 && !confirm(`有 ${modifiedTabs.length} 个文件有未保存的修改，确定关闭全部？`)) {
    return 0;
  }
  
  const count = tabs.length;
  tabs.splice(0, tabs.length);
  state.currentFile.value = null;
  
  return count;
}

/**
 * 关闭其他标签页
 * @param {Array} tabs - 标签页数组
 * @param {Object} keepTab - 保留的标签
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 * @returns {number} 关闭的标签数
 */
export function closeOtherTabs(tabs, keepTab, state, actions) {
  // 检查是否有未保存的修改
  const tabsToClose = tabs.filter(t => t.id !== keepTab.id && t.modified);
  if (tabsToClose.length > 0 && !confirm(`有 ${tabsToClose.length} 个文件有未保存的修改，确定关闭？`)) {
    return 0;
  }
  
  const count = tabs.filter(t => t.id !== keepTab.id).length;
  
  // 保留当前标签，关闭其他
  const index = tabs.findIndex(t => t.id === keepTab.id);
  tabs.splice(0, tabs.length, keepTab);
  
  if (state.currentFile.value?.id !== keepTab.id) {
    actions.openFile(keepTab);
  }
  
  return count;
}

/**
 * 关闭右侧标签页
 * @param {Array} tabs - 标签页数组
 * @param {Object} fromTab - 起始标签
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 * @returns {number} 关闭的标签数
 */
export function closeRightTabs(tabs, fromTab, state, actions) {
  const index = tabs.findIndex(t => t.id === fromTab.id);
  if (index === -1) return 0;
  
  // 检查是否有未保存的修改
  const tabsToClose = tabs.slice(index + 1).filter(t => t.modified);
  if (tabsToClose.length > 0 && !confirm(`有 ${tabsToClose.length} 个文件有未保存的修改，确定关闭？`)) {
    return 0;
  }
  
  const count = tabs.length - index - 1;
  tabs.splice(index + 1);
  
  return count;
}

/**
 * 关闭左侧标签页
 * @param {Array} tabs - 标签页数组
 * @param {Object} fromTab - 起始标签
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 * @returns {number} 关闭的标签数
 */
export function closeLeftTabs(tabs, fromTab, state, actions) {
  const index = tabs.findIndex(t => t.id === fromTab.id);
  if (index === -1 || index === 0) return 0;
  
  // 检查是否有未保存的修改
  const tabsToClose = tabs.slice(0, index).filter(t => t.modified);
  if (tabsToClose.length > 0 && !confirm(`有 ${tabsToClose.length} 个文件有未保存的修改，确定关闭？`)) {
    return 0;
  }
  
  const count = index;
  tabs.splice(0, index);
  
  // 调整当前文件索引
  if (state.currentFile.value) {
    const currentIndex = tabs.findIndex(t => t.id === state.currentFile.value.id);
    if (currentIndex === -1 && tabs.length > 0) {
      actions.openFile(tabs[0]);
    }
  }
  
  return count;
}

/**
 * 标签拖拽排序
 * @param {Array} tabs - 标签页数组
 * @param {number} fromIndex - 原始索引
 * @param {number} toIndex - 目标索引
 */
export function reorderTabs(tabs, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
      fromIndex >= tabs.length || toIndex >= tabs.length) {
    return;
  }
  
  const [removed] = tabs.splice(fromIndex, 1);
  tabs.splice(toIndex, 0, removed);
}

/**
 * 创建标签页状态管理
 * @returns {Object} 状态对象
 */
export function createTabsState() {
  return {
    tabs: [],
    currentTab: null,
    contextMenuVisible: false,
    contextMenuPosition: { x: 0, y: 0 },
    contextMenuTarget: null,
    draggedTab: null,
    dragOverIndex: -1
  };
}

/**
 * 获取标签页统计信息
 * @param {Array} tabs - 标签页数组
 * @returns {Object} 统计信息
 */
export function getTabsStats(tabs) {
  const total = tabs.length;
  const modified = tabs.filter(t => t.modified).length;
  const saved = total - modified;
  
  return {
    total,
    modified,
    saved
  };
}

/**
 * 查找或创建标签页
 * @param {Array} tabs - 标签页数组
 * @param {Object} file - 文件对象
 * @returns {Object} 标签页对象
 */
export function findOrCreateTab(tabs, file) {
  // 查找已存在的标签
  const existing = tabs.find(t => t.id === file.id);
  if (existing) {
    return existing;
  }
  
  // 创建新标签
  const newTab = {
    id: file.id,
    name: file.name,
    content: file.content || '',
    modified: file.modified || false,
    language: file.language || 'plaintext',
    folderId: file.folderId
  };
  
  tabs.push(newTab);
  return newTab;
}

/**
 * 切换标签页
 * @param {Array} tabs - 标签页数组
 * @param {Object} tab - 目标标签
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 */
export function switchToTab(tabs, tab, state, actions) {
  if (!tab) return;
  actions.openFile(tab);
}

/**
 * 导航到下一个标签
 * @param {Array} tabs - 标签页数组
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 */
export function nextTab(tabs, state, actions) {
  if (tabs.length < 2 || !state.currentFile.value) return;
  
  const currentIndex = tabs.findIndex(t => t.id === state.currentFile.value.id);
  const nextIndex = (currentIndex + 1) % tabs.length;
  actions.openFile(tabs[nextIndex]);
}

/**
 * 导航到上一个标签
 * @param {Array} tabs - 标签页数组
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 */
export function previousTab(tabs, state, actions) {
  if (tabs.length < 2 || !state.currentFile.value) return;
  
  const currentIndex = tabs.findIndex(t => t.id === state.currentFile.value.id);
  const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  actions.openFile(tabs[prevIndex]);
}

/**
 * 注册标签页快捷键
 * @param {Array} tabs - 标签页数组
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 * @param {Function} closeCurrent - 关闭当前标签回调
 */
export function registerTabsShortcuts(tabs, state, actions, closeCurrent) {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Tab - 下一个标签
    if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      nextTab(tabs, state, actions);
    }
    
    // Ctrl+Shift+Tab - 上一个标签
    if (e.ctrlKey && e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      previousTab(tabs, state, actions);
    }
    
    // Ctrl+W - 关闭当前标签
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
      e.preventDefault();
      if (state.currentFile.value) {
        closeCurrent();
      }
    }
  });
}
