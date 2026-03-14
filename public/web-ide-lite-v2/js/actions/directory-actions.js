/**
 * Web IDE Lite v2 - 目录操作
 */
import { formatFileSize } from '../utils.js';

export function createDirectoryActions(state, showToast) {
  const openDirectory = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        state.rootDirectory.value = dirHandle.name;
        clearAll(state);
        await readDirectory(dirHandle, state);
        showToast(`✅ 目录 "${dirHandle.name}" 已打开`, 'success');
      } catch (err) {
        if (err.name !== 'AbortError') showToast('❌ 打开目录失败：' + err.message, 'error');
      }
    } else {
      state.directoryInput.value?.click();
    }
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
        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, { id: Date.now() + Math.random(), name: folderName, expanded: true, files: [] });
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          folderMap.get(folderName).files.push({
            id: `${folderName}-${Date.now()}`,
            name: parts.slice(1).join('/'),
            content: e.target.result,
            modified: false,
            folderId: folderMap.get(folderName).id
          });
        };
        reader.readAsText(file);
      }
    }
    
    state.folders.value = Array.from(folderMap.values());
    showToast('✅ 目录已打开', 'success');
    event.target.value = '';
  };

  const createNewFolder = () => {
    const name = prompt('请输入文件夹名称:', 'new-folder');
    if (!name) return;
    state.folders.value.push({ id: Date.now(), name, expanded: false, files: [] });
    showToast('✅ 文件夹已创建', 'success');
  };

  const toggleFolder = (folderId) => {
    const folder = state.folders.value.find(f => f.id === folderId);
    if (folder) folder.expanded = !folder.expanded;
  };

  const deleteFolder = (folder) => {
    if (!confirm(`确定要删除文件夹 "${folder.name}" 吗？`)) return;
    const index = state.folders.value.findIndex(f => f.id === folder.id);
    if (index > -1) state.folders.value.splice(index, 1);
    showToast('✅ 文件夹已删除', 'success');
  };

  const createFileInFolder = (folder) => {
    const name = prompt('请输入文件名:', 'untitled.js');
    if (!name) return;
    const file = { id: Date.now(), name, content: '', modified: false, folderId: folder.id };
    folder.files.push(file);
    folder.expanded = true;
    return file;
  };

  return { openDirectory, handleDirectorySelect, createNewFolder, toggleFolder, deleteFolder, createFileInFolder };
}

// 辅助函数
async function readDirectory(dirHandle, state, parentId = null, depth = 0) {
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
        await readDirectory(entry, state, `${Date.now()}-${entry.name}-${Math.random()}`, depth + 1);
      }
    }
  } catch (e) { console.error('读取目录失败:', e); }
  
  state.folders.value.push(folder);
}

function clearAll(state) {
  state.folders.value = [];
  state.files.value = [];
  state.openTabs.value = [];
  state.currentFile.value = null;
}
