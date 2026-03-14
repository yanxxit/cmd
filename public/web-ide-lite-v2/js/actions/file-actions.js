/**
 * Web IDE Lite v2 - 文件操作
 */
import { nextTick } from 'vue';
import { formatFileSize } from '../utils.js';

export function createFileActions(state, showToast) {
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

  const saveCurrentFile = async () => {
    if (!state.currentFile.value) return;
    state.currentFile.value.content = state.editorContent.value;

    if (state.currentFile.value.fileHandle) {
      try {
        const writable = await state.currentFile.value.fileHandle.createWritable();
        await writable.write(state.editorContent.value);
        await writable.close();
        state.currentFile.value.modified = false;
        updateTabModified(state.openTabs.value, state.currentFile.value.id, false);
        showToast('✅ 文件已保存', 'success');
        return;
      } catch (e) { console.error('保存失败:', e); }
    }

    downloadFile(state.currentFile.value.name, state.editorContent.value);
    state.currentFile.value.modified = false;
    updateTabModified(state.openTabs.value, state.currentFile.value.id, false);
    showToast('✅ 文件已下载', 'success');
  };

  const createNewFile = (folderId = null) => {
    const name = prompt('请输入文件名:', 'untitled.js');
    if (!name) return;
    const file = { 
      id: Date.now(), 
      name, 
      content: '', 
      modified: false,
      folderId,
      createdAt: new Date().toISOString()
    };
    state.files.value.push(file);
    openFile(file);
    showToast('✅ 文件已创建', 'success');
    return file;
  };

  const renameFile = (file) => {
    const newName = prompt('请输入新文件名:', file.name);
    if (newName && newName !== file.name) {
      file.name = newName;
      file.modified = true;
      // 更新 tab 名称
      const tab = state.openTabs.value.find(t => t.id === file.id);
      if (tab) tab.name = newName;
      showToast('✅ 文件已重命名', 'success');
    }
  };

  const deleteFile = (file) => {
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

  // 复制文件内容到剪贴板
  const copyFileContent = async (file) => {
    try {
      await navigator.clipboard.writeText(file.content || '');
      showToast('✅ 内容已复制', 'success');
    } catch (e) { showToast('❌ 复制失败', 'error'); }
  };

  // 复制文件（创建副本）
  const duplicateFile = (file) => {
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const ext = file.name.substring(file.name.lastIndexOf('.')) || '';
    const copyName = `${baseName}_copy${ext}`;
    
    const newFile = {
      id: Date.now(),
      name: copyName,
      content: file.content || '',
      modified: false,
      folderId: file.folderId,
      language: file.language,
      createdAt: new Date().toISOString()
    };
    
    state.files.value.push(newFile);
    openFile(newFile);
    showToast(`✅ 文件已复制：${copyName}`, 'success');
    return newFile;
  };

  // 批量删除文件
  const batchDeleteFiles = (fileIds) => {
    if (!confirm(`确定要删除选中的 ${fileIds.length} 个文件吗？`)) return;
    
    let deletedCount = 0;
    fileIds.forEach(id => {
      const fileIndex = state.files.value.findIndex(f => f.id === id);
      if (fileIndex > -1) {
        const file = state.files.value[fileIndex];
        state.files.value.splice(fileIndex, 1);
        
        // 关闭对应的 tab
        const tabIndex = state.openTabs.value.findIndex(t => t.id === id);
        if (tabIndex > -1) state.openTabs.value.splice(tabIndex, 1);
        
        deletedCount++;
      }
    });
    
    if (state.currentFile.value && fileIds.includes(state.currentFile.value.id)) {
      state.currentFile.value = state.openTabs.value.length ? state.openTabs.value[state.openTabs.value.length - 1] : null;
    }
    
    showToast(`✅ 已删除 ${deletedCount} 个文件`, 'success');
    return deletedCount;
  };

  const downloadFileAction = (file) => {
    downloadFile(file.name, file.content);
    showToast('✅ 文件已下载', 'success');
  };

  // 导出文件为 ZIP
  const exportFilesAsZip = async (files) => {
    if (!files || files.length === 0) {
      showToast('❌ 没有可导出的文件', 'error');
      return;
    }
    
    try {
      // 简单实现：逐个下载
      for (const file of files) {
        await new Promise(resolve => setTimeout(resolve, 100));
        downloadFile(file.name, file.content || '');
      }
      showToast(`✅ 已导出 ${files.length} 个文件`, 'success');
    } catch (e) {
      showToast('❌ 导出失败：' + e.message, 'error');
    }
  };

  // 辅助函数
  function detectLanguage(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const map = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'py': 'python',
      'go': 'go', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown',
      'yaml': 'yaml', 'sh': 'bash', 'sql': 'sql', 'xml': 'xml'
    };
    return map[ext] || 'plaintext';
  }

  function updateTabModified(tabs, fileId, modified) {
    const tab = tabs.find(t => t.id === fileId);
    if (tab) tab.modified = modified;
  }

  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    openFile, closeTab, saveCurrentFile, createNewFile,
    renameFile, deleteFile, copyFileContent, duplicateFile,
    batchDeleteFiles, exportFilesAsZip, downloadFileAction
  };
}
