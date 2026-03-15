/**
 * Web IDE Lite v2 - 组合式函数
 */
import { initAutoSave, onContentChange, getBackupList, restoreBackup, clearBackups } from './composables/auto-save.js';
import { initTheme, toggleTheme, setTheme, getCurrentTheme, getAvailableThemes } from './composables/theme.js';
import { showLoading, hideLoading, watchLoading, isAnyLoading, createProgressBar } from './composables/loading.js';
import {
  initSettings,
  getSetting,
  getAllSettings,
  setSetting,
  setSettings,
  resetSettings,
  exportSettings,
  importSettings,
  SETTINGS_CATEGORIES
} from './composables/settings.js';
import { initEditorSettings, applySetting as applyEditorSetting } from './composables/editor-settings.js';
import { initShortcuts, registerShortcut, startRecording, resetShortcuts } from './composables/shortcuts.js';
import { createEditorContextMenuActions } from './composables/editor-context-menu.js';
import { searchFiles, createFileSearchState } from './composables/file-search.js';
import { initRecentFiles, getRecentFiles } from './composables/recent-files.js';
import { 
  globalSearch, 
  createSearchState, 
  registerSearchShortcut,
  registerNavigationShortcuts,
  goToNextSearchResult,
  goToPreviousSearchResult
} from './composables/global-search.js';

export function useComposables(state, actions) {
  // 初始化引用
  let destroyAutoSave = null;
  let destroyEditorSettings = null;
  let destroyShortcuts = null;

  // 自动保存
  const initAutoSaveFeature = () => {
    if (destroyAutoSave) destroyAutoSave();
    destroyAutoSave = initAutoSave(state, actions);
  };

  // 监听内容变化以触发自动保存
  const handleContentChange = () => {
    onContentChange(state);
  };

  // 获取备份列表
  const getBackups = () => {
    return getBackupList();
  };

  // 恢复备份
  const restoreBackupFile = (fileId) => {
    return restoreBackup(fileId, state);
  };

  // 清除备份
  const clearBackup = (fileId = null) => {
    clearBackups(fileId);
  };

  // 主题管理
  const initThemeFeature = () => {
    const theme = initTheme();
    state.isDark.value = theme !== 'light';
    return theme;
  };

  const handleToggleTheme = () => {
    const newTheme = toggleTheme();
    state.isDark.value = newTheme !== 'light';
    return newTheme;
  };

  const handleChangeTheme = (themeName) => {
    setTheme(themeName);
    state.isDark.value = themeName !== 'light';
  };

  // 设置管理
  const initSettingsFeature = () => {
    const settings = initSettings();
    state.settings.value = settings;
    return settings;
  };

  // 编辑器设置
  const initEditorSettingsFeature = () => {
    if (destroyEditorSettings) destroyEditorSettings();
    destroyEditorSettings = initEditorSettings(state, actions);
  };

  // 快捷键管理
  const initShortcutsFeature = () => {
    if (destroyShortcuts) destroyShortcuts();
    destroyShortcuts = initShortcuts();
    
    // 注册默认快捷键
    registerShortcut('toggleTheme', () => {
      handleToggleTheme();
    });
    
    registerShortcut('toggleSidebar', () => {
      state.sidebarOpen.value = !state.sidebarOpen.value;
    });
  };

  const openSettingsPanel = () => {
    state.settingsVisible.value = true;
    state.currentSettingsCategory.value = 'editor';
  };

  const closeSettingsPanel = () => {
    state.settingsVisible.value = false;
  };

  const getSettingValue = (key) => {
    return getSetting(key);
  };

  const setSettingValue = (key, value) => {
    setSetting(key, value);
    state.settings.value = getAllSettings();
    
    // 应用设置变更
    applySettingChange(key, value);
  };

  const resetAllSettings = () => {
    if (confirm('确定要重置所有设置吗？')) {
      resetSettings();
      state.settings.value = getAllSettings();
      showToast('✅ 设置已重置', 'success');
    }
  };

  const resetAllShortcuts = () => {
    if (confirm('确定要重置所有快捷键吗？')) {
      resetShortcuts();
      state.settings.value = getAllSettings();
      showToast('✅ 快捷键已重置', 'success');
    }
  };

  const exportSettingsToFile = () => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'web-ide-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ 设置已导出', 'success');
  };

  const triggerImportSettings = () => {
    state.importSettingsFile?.value?.click();
  };

  const importSettingsFromFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const success = importSettings(e.target.result);
      if (success) {
        state.settings.value = getAllSettings();
        showToast('✅ 设置已导入', 'success');
      } else {
        showToast('❌ 导入失败', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const recordShortcut = (key) => {
    showToast('⌨️ 请按下新的快捷键组合（按 Esc 取消）', 'info');
    startRecording(key, (shortcut) => {
      showToast(`✅ 快捷键已设置：${shortcut}`, 'success');
    });
  };

  // 编辑器右键菜单
  const showEditorContextMenu = (e) => {
    state.editorContextMenuVisible.value = true;
    state.editorContextMenuPosition.value = { x: e.clientX, y: e.clientY };
  };

  const hideEditorContextMenu = () => {
    state.editorContextMenuVisible.value = false;
  };

  const editorActions = createEditorContextMenuActions(state);

  // 文件搜索功能
  const fileSearchState = createFileSearchState();
  
  const handleFileSearch = () => {
    const query = state.fileSearchQuery.value;
    if (!query || !query.trim()) {
      state.searchResults.value = [];
      state.filteredFiles.value = [];
      return;
    }
    
    const allFiles = state.files.value;
    const results = searchFiles(allFiles, query, { fuzzyMatch: true });
    state.searchResults.value = results;
    state.filteredFiles.value = results;
  };
  
  const clearFileSearch = () => {
    state.fileSearchQuery.value = '';
    state.searchResults.value = [];
    state.filteredFiles.value = [];
  };

  // 最近文件功能
  let recentFilesActions = null;
  
  const initRecentFilesFeature = () => {
    recentFilesActions = initRecentFiles(state, actions);
    // 加载最近文件
    state.recentFiles.value = getRecentFiles();
  };
  
  const addRecentFile = (file) => {
    if (recentFilesActions) {
      recentFilesActions.add(file);
    }
  };
  
  const clearRecentFiles = () => {
    if (recentFilesActions) {
      recentFilesActions.clear();
    }
  };

  // 全局搜索功能
  const openSearchPanel = () => {
    state.searchPanelVisible.value = true;
    state.searchQuery.value = '';
    state.searchResults.value = null;
    // 聚焦到输入框（需要 nextTick）
    setTimeout(() => {
      const input = document.querySelector('.search-panel input');
      if (input) input.focus();
    }, 100);
  };
  
  const closeSearchPanel = () => {
    state.searchPanelVisible.value = false;
  };
  
  const performSearch = () => {
    const query = state.searchQuery.value;
    if (!query || !query.trim()) {
      state.searchResults.value = null;
      return;
    }
    
    const files = state.files.value;
    const results = globalSearch(files, query, state.searchOptions.value);
    state.searchResults.value = results;
  };
  
  const navigateToNext = () => {
    // 实现导航到下一个搜索结果
    showToast('导航到下一个匹配项', 'info');
  };
  
  const navigateToPrevious = () => {
    // 实现导航到上一个搜索结果
    showToast('导航到上一个匹配项', 'info');
  };
  
  const goToMatch = (file, match) => {
    // 打开文件并定位到匹配位置
    actions.openFile(file);
    showToast(`跳转到第 ${match.line} 行`, 'info');
  };
  
  // 注册搜索快捷键
  const initSearchShortcuts = () => {
    registerSearchShortcut(() => {
      openSearchPanel();
    });
    
    registerNavigationShortcuts(() => {
      navigateToNext();
    }, () => {
      navigateToPrevious();
    });
  };

  // 应用设置变更
  function applySettingChange(key, value) {
    // 主题变更
    if (key === 'appearance.theme') {
      setTheme(value);
    }
    
    // 侧边栏宽度
    if (key === 'appearance.sidebarWidth') {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.style.width = `${value}px`;
      }
    }
    
    // 状态栏可见性
    if (key === 'appearance.statusBarVisible') {
      const statusBar = document.querySelector('footer');
      if (statusBar) {
        statusBar.style.display = value ? 'flex' : 'none';
      }
    }
    
    // 编辑器设置
    if (key.startsWith('editor.') || key.startsWith('other.')) {
      applyEditorSetting(key, value, state);
    }
    
    // 自动保存重新初始化
    if (key.startsWith('files.')) {
      if (destroyAutoSave) {
        destroyAutoSave();
      }
      initAutoSaveFeature();
    }
    
    console.log('[Settings] 应用设置变更:', key, value);
  }

  // 加载状态
  const loading = {
    show: showLoading,
    hide: hideLoading,
    watch: watchLoading,
    isAny: isAnyLoading,
    createProgressBar
  };

  return {
    getFileIcon: (filename) => {
      const ext = filename.split('.').pop()?.toLowerCase();
      const icons = { js: '🟨', ts: '🔷', py: '🐍', go: '🔹', html: '🌐', css: '🎨', json: '📋', md: '📝', yaml: '📋', sh: '💻', sql: '🗄️', xml: '📄', txt: '📄' };
      return icons[ext] || '📄';
    },
    // 自动保存
    initAutoSaveFeature,
    handleContentChange,
    getBackups,
    restoreBackupFile,
    clearBackup,
    destroyAutoSave,
    // 主题管理
    initThemeFeature,
    toggleTheme: handleToggleTheme,
    setTheme: handleChangeTheme,
    getCurrentTheme,
    getAvailableThemes,
    // 设置管理
    initSettingsFeature,
    openSettings: openSettingsPanel,
    closeSettings: closeSettingsPanel,
    getSettingValue,
    setSettingValue,
    resetAllSettings,
    resetAllShortcuts,
    exportSettingsToFile,
    triggerImportSettings,
    importSettingsFromFile,
    recordShortcut,
    settingsCategories: SETTINGS_CATEGORIES,
    // 编辑器设置
    initEditorSettingsFeature,
    // 快捷键
    initShortcutsFeature,
    // 编辑器右键菜单
    showEditorContextMenu,
    hideEditorContextMenu,
    editorActions,
    // 文件搜索
    handleFileSearch,
    clearFileSearch,
    // 最近文件
    initRecentFilesFeature,
    addRecentFile,
    clearRecentFiles,
    // 全局搜索
    openSearchPanel,
    closeSearchPanel,
    performSearch,
    navigateToNext,
    navigateToPrevious,
    goToMatch,
    initSearchShortcuts,
    // 加载状态
    loading
  };
}
