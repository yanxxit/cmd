/**
 * Web IDE Lite v2 - 操作函数
 */
import { nextTick } from 'vue';
import { fileTypes } from './config.js';
import { formatFileSize } from './utils.js';

export function actions(state) {
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    state.toasts.value.push({ id, message, type });
    setTimeout(() => state.toasts.value = state.toasts.value.filter(t => t.id !== id), 3000);
  };

  const getExtension = (filename) => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };

  const detectLanguage = (filename) => {
    const ext = getExtension(filename);
    const map = {
      'js': 'javascript', 'jsx': 'javascript', 'mjs': 'javascript',
      'ts': 'typescript', 'tsx': 'typescript', 'py': 'python', 'go': 'go',
      'html': 'html', 'htm': 'html', 'css': 'css', 'scss': 'css',
      'json': 'json', 'md': 'markdown', 'yaml': 'yaml', 'yml': 'yaml',
      'sh': 'bash', 'sql': 'sql', 'xml': 'xml'
    };
    return map[ext] || 'plaintext';
  };

  const openFile = (file) => {
    if (!state.openTabs.value.find(t => t.id === file.id)) {
      state.openTabs.value.push({ ...file });
    }
    state.currentFile.value = file;
    state.editorContent.value = file.content || '';
    state.currentLanguage.value = file.language || detectLanguage(file.name);
    file.language = state.currentLanguage.value;
    nextTick(() => state.editorRef.value?.focus());
  };

  const closeTab = (tab) => {
    const index = state.openTabs.value.findIndex(t => t.id === tab.id);
    if (index === -1) return;
    if (tab.modified && !confirm(`${tab.name} 有未保存的修改，确定关闭？`)) return;
    state.openTabs.value.splice(index, 1);
    if (state.currentFile.value?.id === tab.id) {
      state.currentFile.value = state.openTabs.value.length ? state.openTabs.value[state.openTabs.value.length - 1] : null;
    }
  };

  const toggleFolder = (folderId) => {
    const folder = state.folders.value.find(f => f.id === folderId);
    if (folder) folder.expanded = !folder.expanded;
  };

  const onInput = () => {
    if (state.currentFile.value) {
      state.currentFile.value.content = state.editorContent.value;
      state.currentFile.value.modified = true;
      const tab = state.openTabs.value.find(t => t.id === state.currentFile.value.id);
      if (tab) tab.modified = true;
    }
    updateCursorPosition();
  };

  const syncScroll = (e) => {
    const highlight = document.querySelector('.code-highlight');
    if (highlight) {
      highlight.scrollTop = e.target.scrollTop;
      highlight.scrollLeft = e.target.scrollLeft;
    }
  };

  const onTab = (e) => {
    e.preventDefault();
    const textarea = state.editorRef.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    state.editorContent.value = state.editorContent.value.substring(0, start) + '  ' + state.editorContent.value.substring(end);
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    });
  };

  const updateCursorPosition = () => {
    if (state.editorRef.value) {
      const text = state.editorContent.value.substring(0, state.editorRef.value.selectionStart);
      const lines = text.split('\n');
      state.cursorLine.value = lines.length;
      state.cursorColumn.value = lines[lines.length - 1].length + 1;
    }
  };

  const changeLanguage = async () => {
    if (!state.currentFile.value) return;
    if (window.PrismLoader) await window.PrismLoader.loadLanguage(state.currentLanguage.value);
    state.currentFile.value.language = state.currentLanguage.value;
    showToast(`✅ 语言已切换为 ${state.currentLanguage.value}`, 'success');
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

  const handleGlobalClick = () => { if (state.contextMenuVisible.value) closeContextMenu(); };

  const openDirectory = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        state.rootDirectory.value = dirHandle.name;
        state.folders.value = [];
        state.files.value = [];
        state.openTabs.value = [];
        state.currentFile.value = null;
        await readDirectory(dirHandle);
        showToast(`✅ 目录 "${dirHandle.name}" 已打开`, 'success');
      } catch (err) {
        if (err.name !== 'AbortError') showToast('❌ 打开目录失败：' + err.message, 'error');
      }
    } else {
      state.directoryInput.value?.click();
    }
  };

  const readDirectory = async (dirHandle, parentId = null, depth = 0) => {
    const folderId = parentId !== null ? parentId : `${Date.now()}-${dirHandle.name}`;
    const folder = { id: folderId, name: dirHandle.name, expanded: false, files: [], isRoot: !parentId, depth };
    try {
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          try {
            const file = await entry.getFile();
            if (file.size < 1024 * 1024) {
              folder.files.push({
                id: `${folderId}-${file.name}-${Date.now()}-${Math.random()}`,
                name: file.name,
                content: await file.text(),
                modified: false,
                folderId,
                fileHandle: entry
              });
            } else {
              folder.files.push({
                id: `${folderId}-${file.name}-${Date.now()}-${Math.random()}`,
                name: file.name,
                content: `// 文件过大 (${formatFileSize(file.size)})，无法预览`,
                modified: false,
                folderId,
                fileHandle: entry,
                isLarge: true,
                size: file.size
              });
            }
          } catch (e) { console.warn('无法读取文件:', entry.name, e); }
        } else if (entry.kind === 'directory' && depth < 2) {
          await readDirectory(entry, `${Date.now()}-${entry.name}-${Math.random()}`, depth + 1);
        }
      }
    } catch (e) { console.error('读取目录失败:', e); }
    state.folders.value.push(folder);
  };

  const handleDirectorySelect = (event) => {
    const fileList = event.target.files;
    if (!fileList.length) return;
    const folderMap = new Map();
    state.rootDirectory.value = fileList[0].webkitRelativePath.split('/')[0] || 'Selected';
    for (const file of fileList) {
      const parts = file.webkitRelativePath.split('/');
      if (parts.length > 1) {
        const folderName = parts[0];
        if (!folderMap.has(folderName)) folderMap.set(folderName, { id: Date.now() + Math.random(), name: folderName, expanded: true, files: [] });
        const reader = new FileReader();
        reader.onload = (e) => folderMap.get(folderName).files.push({ id: `${folderName}-${Date.now()}`, name: parts.slice(1).join('/'), content: e.target.result, modified: false, folderId: folderMap.get(folderName).id });
        reader.readAsText(file);
      }
    }
    state.folders.value = Array.from(folderMap.values());
    showToast('✅ 目录已打开', 'success');
    event.target.value = '';
  };

  const openFiles = () => { state.showFileTypeDialog.value = true; };
  const selectAllTypes = () => { state.selectedFileTypes.value = fileTypes.map(t => t.value); };
  const deselectAllTypes = () => { state.selectedFileTypes.value = []; };
  const confirmFileType = () => {
    state.fileTypeFilter.value = state.selectedFileTypes.value.join(',');
    state.showFileTypeDialog.value = false;
    setTimeout(() => state.fileInput.value?.click(), 100);
  };
  const closeFileTypeDialog = () => { state.showFileTypeDialog.value = false; };

  const handleFileSelect = (event) => {
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

  const saveCurrentFile = async () => {
    if (!state.currentFile.value) return;
    state.currentFile.value.content = state.editorContent.value;
    if (state.currentFile.value.fileHandle) {
      try {
        const writable = await state.currentFile.value.fileHandle.createWritable();
        await writable.write(state.editorContent.value);
        await writable.close();
        state.currentFile.value.modified = false;
        const tab = state.openTabs.value.find(t => t.id === state.currentFile.value.id);
        if (tab) tab.modified = false;
        showToast('✅ 文件已保存', 'success');
        return;
      } catch (e) { console.error('保存失败:', e); }
    }
    const blob = new Blob([state.editorContent.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.currentFile.value.name;
    a.click();
    URL.revokeObjectURL(url);
    state.currentFile.value.modified = false;
    showToast('✅ 文件已下载', 'success');
  };

  const createNewFile = () => {
    const name = prompt('请输入文件名:', 'untitled.js');
    if (!name) return;
    const file = { id: Date.now(), name, content: '', modified: false };
    state.files.value.push(file);
    openFile(file);
    showToast('✅ 文件已创建', 'success');
  };

  const createNewFolder = () => {
    const name = prompt('请输入文件夹名称:', 'new-folder');
    if (!name) return;
    state.folders.value.push({ id: Date.now(), name, expanded: false, files: [] });
    showToast('✅ 文件夹已创建', 'success');
  };

  const renameFileAction = (file) => {
    closeContextMenu();
    const newName = prompt('请输入新文件名:', file.name);
    if (newName && newName !== file.name) {
      file.name = newName;
      file.modified = true;
      showToast('✅ 文件已重命名', 'success');
    }
  };

  const deleteFileAction = (file) => {
    closeContextMenu();
    if (!confirm(`确定要删除 "${file.name}" 吗？`)) return;
    const index = state.files.value.findIndex(f => f.id === file.id);
    if (index > -1) state.files.value.splice(index, 1);
    const tabIndex = state.openTabs.value.findIndex(t => t.id === file.id);
    if (tabIndex > -1) state.openTabs.value.splice(tabIndex, 1);
    if (state.currentFile.value?.id === file.id) {
      state.currentFile.value = state.openTabs.value.length ? state.openTabs.value[state.openTabs.value.length - 1] : null;
    }
    showToast('✅ 文件已删除', 'success');
  };

  const copyFileContent = async (file) => {
    closeContextMenu();
    try {
      await navigator.clipboard.writeText(file.content || '');
      showToast('✅ 内容已复制', 'success');
    } catch (e) { showToast('❌ 复制失败', 'error'); }
  };

  const downloadFile = (file) => {
    closeContextMenu();
    const blob = new Blob([file.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✅ 文件已下载', 'success');
  };

  const deleteFolderAction = (folder) => {
    if (!confirm(`确定要删除文件夹 "${folder.name}" 吗？`)) return;
    closeContextMenu();
    const index = state.folders.value.findIndex(f => f.id === folder.id);
    if (index > -1) state.folders.value.splice(index, 1);
    showToast('✅ 文件夹已删除', 'success');
  };

  const createFileInFolder = (folder) => {
    closeContextMenu();
    const name = prompt('请输入文件名:', 'untitled.js');
    if (!name) return;
    const file = { id: Date.now(), name, content: '', modified: false, folderId: folder.id };
    folder.files.push(file);
    folder.expanded = true;
    openFile(file);
    showToast('✅ 文件已创建', 'success');
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveCurrentFile();
    }
  };

  return {
    showToast, openFile, closeTab, toggleFolder, onInput, syncScroll, onTab, changeLanguage,
    toggleTheme, loadTheme, closeContextMenu, showTreeContextMenu, showFileContextMenu,
    showFolderContextMenu, handleGlobalClick, openDirectory, readDirectory, handleDirectorySelect,
    openFiles, selectAllTypes, deselectAllTypes, confirmFileType, closeFileTypeDialog,
    handleFileSelect, saveCurrentFile, createNewFile, createNewFolder, renameFileAction,
    deleteFileAction, copyFileContent, downloadFile, deleteFolderAction, createFileInFolder,
    handleKeyDown
  };
}
