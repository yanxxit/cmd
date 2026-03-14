/**
 * Web IDE Lite v2 - UI 操作
 */
export function createUIActions(state) {
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    state.toasts.value.push({ id, message, type });
    setTimeout(() => state.toasts.value = state.toasts.value.filter(t => t.id !== id), 3000);
  };

  const toggleTheme = () => {
    state.isDark.value = !state.isDark.value;
    document.documentElement.classList.toggle('dark', state.isDark.value);
    localStorage.setItem('web-ide-v2-theme', state.isDark.value ? 'dark' : 'light');
  };

  const loadTheme = () => {
    const saved = localStorage.getItem('web-ide-v2-theme') || 'dark';
    state.isDark.value = saved === 'dark';
    document.documentElement.classList.toggle('dark', state.isDark.value);
  };

  const closeContextMenu = () => {
    state.contextMenuVisible.value = false;
    state.currentContextMenuTarget.value = null;
  };

  const showTreeContextMenu = (e) => {
    e.preventDefault();
    state.contextMenuPosition.value = { x: e.clientX, y: e.clientY };
    state.contextMenuType.value = 'tree';
    state.contextMenuVisible.value = true;
  };

  const showFileContextMenu = (e, file, folder) => {
    e.preventDefault();
    e.stopPropagation();
    state.contextMenuPosition.value = { x: e.clientX, y: e.clientY };
    state.contextMenuType.value = 'file';
    state.currentContextMenuTarget.value = { ...file, folderId: folder?.id };
    state.contextMenuVisible.value = true;
  };

  const showFolderContextMenu = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    state.contextMenuPosition.value = { x: e.clientX, y: e.clientY };
    state.contextMenuType.value = 'folder';
    state.currentContextMenuTarget.value = folder;
    state.contextMenuVisible.value = true;
  };

  const handleGlobalClick = () => {
    if (state.contextMenuVisible.value) closeContextMenu();
    if (state.editorContextMenuVisible.value) closeEditorContextMenu();
  };

  const closeEditorContextMenu = () => {
    state.editorContextMenuVisible.value = false;
  };

  const openFiles = () => { state.showFileTypeDialog.value = true; };
  const selectAllTypes = () => { state.selectedFileTypes.value = state.fileTypes.value.map(t => t.value); };
  const deselectAllTypes = () => { state.selectedFileTypes.value = []; };
  
  const confirmFileType = () => {
    state.fileTypeFilter.value = state.selectedFileTypes.value.join(',');
    state.showFileTypeDialog.value = false;
    setTimeout(() => state.fileInput.value?.click(), 100);
  };

  const closeFileTypeDialog = () => { state.showFileTypeDialog.value = false; };

  const handleFileSelect = (event, openFile) => {
    Array.from(event.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile = { id: Date.now() + Math.random(), name: file.name, content: e.target.result, modified: false };
        state.files.value.push(newFile);
        openFile(newFile);
      };
      reader.readAsText(file);
    });
    event.target.value = '';
  };

  const handleKeyDown = (saveCurrentFile) => (e) => {
    // Ctrl+S 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveCurrentFile();
    }
    
    // Esc 关闭菜单和弹框
    if (e.key === 'Escape') {
      handleEscapeKey();
    }
  };

  const handleEscapeKey = () => {
    // 关闭文件右键菜单
    if (state.contextMenuVisible.value) {
      closeContextMenu();
    }
    
    // 关闭编辑器右键菜单
    if (state.editorContextMenuVisible.value) {
      closeEditorContextMenu();
    }
    
    // 关闭文件类型选择弹框
    if (state.showFileTypeDialog.value) {
      closeFileTypeDialog();
    }
    
    // 关闭设置面板
    if (state.settingsVisible) {
      state.settingsVisible.value = false;
    }
  };

  return {
    showToast, toggleTheme, loadTheme, closeContextMenu, closeEditorContextMenu,
    showTreeContextMenu, showFileContextMenu, showFolderContextMenu, handleGlobalClick,
    openFiles, selectAllTypes, deselectAllTypes, confirmFileType, closeFileTypeDialog,
    handleFileSelect, handleKeyDown, handleEscapeKey
  };
}
