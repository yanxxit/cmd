/**
 * Web IDE Lite - JavaScript 代码
 * 极简代码编辑器
 */

const { createApp, ref, computed, onMounted, nextTick } = Vue;

createApp({
  setup() {
    const editorRef = ref(null);
    const currentFile = ref(null);
    const openTabs = ref([]);
    const files = ref([]);
    const folders = ref([]);
    const fileInput = ref(null);
    const directoryInput = ref(null);
    const editorContent = ref('');
    const rootDirectory = ref('');
    const toasts = ref([]);
    const cursorLine = ref(1);
    const cursorColumn = ref(1);

    // 当前语言
    const currentLanguage = ref('plaintext');

    // 主题相关
    const isDark = ref(false);

    // 右键菜单相关
    const contextMenuVisible = ref(false);
    const contextMenuPosition = ref({ x: 0, y: 0 });
    const contextMenuType = ref('');
    const currentContextMenuTarget = ref(null);

    const supportsDirectoryPicker = 'showDirectoryPicker' in window;

    // 文件类型配置
    const fileTypes = [
      { value: '.js,.jsx,.mjs', icon: '🟨', label: 'JavaScript' },
      { value: '.ts,.tsx', icon: '🔷', label: 'TypeScript' },
      { value: '.py', icon: '🐍', label: 'Python' },
      { value: '.go', icon: '🔹', label: 'Go' },
      { value: '.html,.htm', icon: '🌐', label: 'HTML' },
      { value: '.css,.scss,.less', icon: '🎨', label: 'CSS' },
      { value: '.json,.yaml,.yml', icon: '📋', label: '数据配置' },
      { value: '.md,.txt', icon: '📝', label: '文档' }
    ];

    // 文件类型选择相关
    const showFileTypeDialog = ref(false);
    const selectedFileTypes = ref([]);
    const fileTypeFilter = ref('');

    // 语言映射
    const languageMap = {
      'js': 'javascript', 'jsx': 'javascript', 'mjs': 'javascript',
      'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'go': 'go',
      'html': 'html', 'htm': 'html',
      'css': 'css', 'scss': 'css', 'less': 'css',
      'json': 'json', 'md': 'markdown',
      'yaml': 'yaml', 'yml': 'yaml',
      'sh': 'bash', 'bash': 'bash',
      'sql': 'sql', 'xml': 'xml', 'txt': 'plaintext'
    };

    const fileIcons = {
      'js': '🟨', 'ts': '🔷', 'py': '🐍', 'go': '🔹',
      'html': '🌐', 'css': '🎨', 'json': '📋',
      'md': '📝', 'yaml': '📋', 'sh': '💻', 'sql': '🗄️',
      'xml': '📄', 'txt': '📄'
    };

    // 高亮代码
    const highlightedCode = computed(() => {
      if (!editorContent.value || !currentLanguage.value) {
        return editorContent.value || '';
      }

      const lang = currentLanguage.value;
      if (window.Prism && window.Prism.languages[lang]) {
        try {
          return window.Prism.highlight(
            editorContent.value,
            window.Prism.languages[lang],
            lang
          );
        } catch (err) {
          console.warn('Prism 高亮失败:', err);
        }
      }

      return editorContent.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    });

    const languageName = computed(() => {
      if (!currentFile.value) return '';
      const ext = getExtension(currentFile.value.name);
      return languageMap[ext] || 'plaintext';
    });

    const getRootFiles = computed(() => {
      return files.value.filter(f => !f.folderId);
    });

    const rootFiles = getRootFiles;

    // 工具函数
    const getExtension = (filename) => {
      const parts = filename.split('.');
      return parts.length > 1 ? parts.pop().toLowerCase() : '';
    };

    const getFileIcon = (filename) => {
      const ext = getExtension(filename);
      return fileIcons[ext] || '📄';
    };

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 主题切换
    const toggleTheme = () => {
      isDark.value = !isDark.value;
      document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
      localStorage.setItem('web-ide-theme', isDark.value ? 'dark' : 'light');
    };

    const loadTheme = () => {
      const savedTheme = localStorage.getItem('web-ide-theme') || 'light';
      isDark.value = savedTheme === 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    };

    // 右键菜单
    const showTreeContextMenu = (e) => {
      e.preventDefault();
      contextMenuPosition.value = { x: e.clientX, y: e.clientY };
      contextMenuType.value = 'tree';
      currentContextMenuTarget.value = null;
      contextMenuVisible.value = true;
    };

    const showFileContextMenu = (e, file, folder) => {
      e.preventDefault();
      e.stopPropagation();
      contextMenuPosition.value = { x: e.clientX, y: e.clientY };
      contextMenuType.value = 'file';
      currentContextMenuTarget.value = { ...file, folderId: folder?.id };
      contextMenuVisible.value = true;
    };

    const showFolderContextMenu = (e, folder) => {
      e.preventDefault();
      e.stopPropagation();
      contextMenuPosition.value = { x: e.clientX, y: e.clientY };
      contextMenuType.value = 'folder';
      currentContextMenuTarget.value = folder;
      contextMenuVisible.value = true;
    };

    const closeContextMenu = () => {
      contextMenuVisible.value = false;
      currentContextMenuTarget.value = null;
    };

    const handleGlobalClick = () => {
      if (contextMenuVisible.value) {
        closeContextMenu();
      }
    };

    // 文件操作
    const openDirectory = async () => {
      if (supportsDirectoryPicker) {
        try {
          const dirHandle = await window.showDirectoryPicker();
          rootDirectory.value = dirHandle.name;
          folders.value = [];
          files.value = [];
          openTabs.value = [];
          currentFile.value = null;
          await readDirectory(dirHandle);
          showToast(`✅ 目录 "${dirHandle.name}" 已打开`, 'success');
        } catch (err) {
          if (err.name !== 'AbortError') {
            showToast('❌ 打开目录失败：' + err.message, 'error');
          }
        }
      } else {
        directoryInput.value?.click();
      }
    };

    const readDirectory = async (dirHandle, parentId = null, depth = 0) => {
      const folderId = parentId !== null ? parentId : `${Date.now()}-${dirHandle.name}`;
      const folder = {
        id: folderId,
        name: dirHandle.name,
        expanded: false,
        files: [],
        isRoot: !parentId,
        depth: depth
      };

      try {
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            try {
              const file = await entry.getFile();
              if (file.size < 1024 * 1024) {
                const content = await file.text();
                folder.files.push({
                  id: `${folderId}-${file.name}-${Date.now()}-${Math.random()}`,
                  name: file.name,
                  content: content,
                  modified: false,
                  folderId: folderId,
                  fileHandle: entry
                });
              } else {
                folder.files.push({
                  id: `${folderId}-${file.name}-${Date.now()}-${Math.random()}`,
                  name: file.name,
                  content: `// 文件过大 (${formatFileSize(file.size)})，无法预览`,
                  modified: false,
                  folderId: folderId,
                  fileHandle: entry,
                  isLarge: true,
                  size: file.size
                });
              }
            } catch (err) {
              console.warn('无法读取文件:', entry.name, err);
            }
          } else if (entry.kind === 'directory' && depth < 2) {
            const subFolderId = `${Date.now()}-${entry.name}-${Math.random()}`;
            await readDirectory(entry, subFolderId, depth + 1);
          }
        }
      } catch (err) {
        console.error('读取目录失败:', err);
      }

      folders.value.push(folder);
      console.log('[目录读取完成]', folder.name, '文件数:', folder.files.length, '深度:', depth);
    };

    const handleDirectorySelect = (event) => {
      const fileList = event.target.files;
      if (!fileList.length) return;

      const folderMap = new Map();
      rootDirectory.value = fileList[0].webkitRelativePath.split('/')[0] || 'Selected';

      for (const file of fileList) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1) {
          const folderName = parts[0];
          const fileName = parts.slice(1).join('/');

          if (!folderMap.has(folderName)) {
            folderMap.set(folderName, {
              id: Date.now() + Math.random(),
              name: folderName,
              expanded: true,
              files: []
            });
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            const folder = folderMap.get(folderName);
            folder.files.push({
              id: `${folder.id}-${fileName}-${Date.now()}`,
              name: fileName,
              content: e.target.result,
              modified: false,
              folderId: folder.id
            });
          };
          reader.readAsText(file);
        }
      }

      folders.value = Array.from(folderMap.values());
      showToast('✅ 目录已打开', 'success');
      event.target.value = '';
    };

    const openFiles = () => {
      showFileTypeDialog.value = true;
    };

    const selectAllTypes = () => {
      selectedFileTypes.value = fileTypes.map(t => t.value);
    };

    const deselectAllTypes = () => {
      selectedFileTypes.value = [];
    };

    const confirmFileType = () => {
      fileTypeFilter.value = selectedFileTypes.value.join(',');
      showFileTypeDialog.value = false;
      setTimeout(() => {
        if (fileInput.value) {
          fileInput.value.click();
        }
      }, 100);
    };

    const handleFileSelect = (event) => {
      const fileList = event.target.files;
      if (!fileList.length) return;

      Array.from(fileList).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newFile = {
            id: Date.now() + Math.random(),
            name: file.name,
            content: e.target.result,
            modified: false,
            fileHandle: null
          };
          files.value.push(newFile);
          openFile(newFile);
        };
        reader.readAsText(file);
      });

      event.target.value = '';
    };

    const detectLanguage = (filename) => {
      const ext = getExtension(filename);
      const langMap = {
        'js': 'javascript', 'jsx': 'javascript', 'mjs': 'javascript',
        'ts': 'typescript', 'tsx': 'typescript',
        'py': 'python', 'go': 'go',
        'html': 'html', 'htm': 'html',
        'css': 'css', 'scss': 'scss', 'less': 'less',
        'json': 'json', 'md': 'markdown',
        'yaml': 'yaml', 'yml': 'yaml',
        'sh': 'bash', 'bash': 'bash',
        'sql': 'sql', 'xml': 'xml',
        'java': 'java', 'c': 'c',
        'cpp': 'cpp', 'cs': 'csharp',
        'rb': 'ruby', 'php': 'php', 'rs': 'rust'
      };
      return langMap[ext] || 'plaintext';
    };

    const openFile = (file) => {
      if (!openTabs.value.find(t => t.id === file.id)) {
        openTabs.value.push({ ...file });
      }
      currentFile.value = file;
      editorContent.value = file.content || '';

      if (file.language) {
        currentLanguage.value = file.language;
      } else {
        currentLanguage.value = detectLanguage(file.name);
        file.language = currentLanguage.value;
      }

      nextTick(async () => {
        if (editorRef.value) {
          editorRef.value.focus();
          const lang = currentLanguage.value;
          if (window.PrismLoader) {
            await window.PrismLoader.loadLanguage(lang);
          }
          highlightEditor();
        }
      });
    };

    const closeTab = (tab) => {
      const index = openTabs.value.findIndex(t => t.id === tab.id);
      if (index === -1) return;
      if (tab.modified && !confirm(`${tab.name} 有未保存的修改，确定关闭？`)) return;
      openTabs.value.splice(index, 1);
      if (currentFile.value?.id === tab.id) {
        if (openTabs.value.length > 0) {
          openFile(openTabs.value[openTabs.value.length - 1]);
        } else {
          currentFile.value = null;
        }
      }
    };

    const toggleFolder = (folderId) => {
      const folder = folders.value.find(f => f.id === folderId);
      if (folder) {
        folder.expanded = !folder.expanded;
        console.log('[切换文件夹]', folder.name, '展开:', folder.expanded);
      }
    };

    const onInput = () => {
      if (currentFile.value) {
        currentFile.value.content = editorContent.value;
        currentFile.value.modified = true;
        const tab = openTabs.value.find(t => t.id === currentFile.value.id);
        if (tab) tab.modified = true;
      }
      updateCursorPosition();
    };

    const highlightEditor = () => {};

    const syncScroll = (e) => {
      const highlight = document.querySelector('.code-highlight');
      if (highlight) {
        highlight.scrollTop = e.target.scrollTop;
        highlight.scrollLeft = e.target.scrollLeft;
      }
    };

    const changeLanguage = async () => {
      if (!currentFile.value) return;
      if (window.PrismLoader) {
        await window.PrismLoader.loadLanguage(currentLanguage.value);
      }
      currentFile.value.language = currentLanguage.value;
      showToast(`✅ 语言已切换为 ${currentLanguage.value}`, 'success');
    };

    const onTab = (e) => {
      e.preventDefault();
      const textarea = editorRef.value;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      editorContent.value = editorContent.value.substring(0, start) + '  ' + editorContent.value.substring(end);
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    };

    const updateCursorPosition = () => {
      if (editorRef.value) {
        const text = editorContent.value.substring(0, editorRef.value.selectionStart);
        const lines = text.split('\n');
        cursorLine.value = lines.length;
        cursorColumn.value = lines[lines.length - 1].length + 1;
      }
    };

    const saveCurrentFile = async () => {
      if (!currentFile.value) return;
      currentFile.value.content = editorContent.value;

      if (currentFile.value.fileHandle) {
        try {
          const writable = await currentFile.value.fileHandle.createWritable();
          await writable.write(editorContent.value);
          await writable.close();
          currentFile.value.modified = false;
          const tab = openTabs.value.find(t => t.id === currentFile.value.id);
          if (tab) tab.modified = false;
          showToast('✅ 文件已保存', 'success');
          return;
        } catch (err) {
          console.error('保存失败:', err);
        }
      }

      const blob = new Blob([editorContent.value], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFile.value.name;
      a.click();
      URL.revokeObjectURL(url);

      currentFile.value.modified = false;
      const tab = openTabs.value.find(t => t.id === currentFile.value.id);
      if (tab) tab.modified = false;
      showToast('✅ 文件已下载', 'success');
    };

    const createNewFile = () => {
      const name = prompt('请输入文件名:', 'untitled.js');
      if (!name) return;
      const file = { id: Date.now(), name, content: '', modified: false };
      files.value.push(file);
      openFile(file);
      showToast('✅ 文件已创建', 'success');
    };

    const createNewFolder = () => {
      const name = prompt('请输入文件夹名称:', 'new-folder');
      if (!name) return;
      folders.value.push({
        id: Date.now(),
        name,
        expanded: false,
        files: []
      });
      showToast('✅ 文件夹已创建', 'success');
    };

    const saveAllFiles = async () => {
      let saved = 0;
      for (const file of files.value) {
        if (file.modified && file.fileHandle) {
          try {
            const writable = await file.fileHandle.createWritable();
            await writable.write(file.content);
            await writable.close();
            file.modified = false;
            saved++;
          } catch (err) {
            console.error('保存失败:', err);
          }
        }
      }
      openTabs.value.forEach(tab => {
        const file = files.value.find(f => f.id === tab.id);
        if (file) tab.modified = file.modified;
      });
      showToast(`✅ 已保存 ${saved} 个文件`, 'success');
    };

    const showToast = (message, type = 'info') => {
      const id = Date.now();
      toasts.value.push({ id, message, type });
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id);
      }, 3000);
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
      }
    };

    // 显示文件右键菜单
    const showFileMenu = (event, file) => {
      const menu = document.createElement('div');
      menu.style.cssText = `
        position: fixed;
        left: ${event.clientX}px;
        top: ${event.clientY}px;
        background: var(--bg-sidebar);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 4px 0;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;

      const items = [
        { icon: '📄', label: '打开', action: () => { openFile(file); menu.remove(); } },
        { icon: '✏️', label: '重命名', action: () => { renameFile(file); menu.remove(); } },
        { icon: '📋', label: '复制内容', action: () => { copyFileContent(file); menu.remove(); } },
        { icon: '💾', label: '下载文件', action: () => { downloadFile(file); menu.remove(); } },
        { type: 'divider' },
        { icon: '🗑️', label: '删除', action: () => { deleteFile(file); menu.remove(); }, danger: true }
      ];

      items.forEach(item => {
        if (item.type === 'divider') {
          const div = document.createElement('div');
          div.style.cssText = 'height: 1px; background: var(--border-color); margin: 4px 0;';
          menu.appendChild(div);
        } else {
          const div = document.createElement('div');
          div.style.cssText = `
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: ${item.danger ? '#ef4444' : 'var(--text-primary)'};
          `;
          div.textContent = `${item.icon} ${item.label}`;
          div.onmouseover = () => div.style.background = 'var(--bg-hover)';
          div.onmouseout = () => div.style.background = 'transparent';
          div.onclick = () => item.action();
          menu.appendChild(div);
        }
      });

      document.body.appendChild(menu);
      const closeMenu = () => {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      };
      setTimeout(() => {
        document.addEventListener('click', closeMenu);
      }, 100);
    };

    // 重命名文件
    const renameFile = (file) => {
      const newName = prompt('请输入新文件名:', file.name);
      if (newName && newName !== file.name) {
        file.name = newName;
        file.modified = true;
        showToast('✅ 文件已重命名', 'success');
      }
    };

    // 删除文件
    const deleteFile = (file) => {
      if (!confirm(`确定要删除 "${file.name}" 吗？`)) return;
      const index = files.value.findIndex(f => f.id === file.id);
      if (index > -1) files.value.splice(index, 1);
      const tabIndex = openTabs.value.findIndex(t => t.id === file.id);
      if (tabIndex > -1) openTabs.value.splice(tabIndex, 1);
      if (currentFile.value?.id === file.id) {
        if (openTabs.value.length > 0) {
          openFile(openTabs.value[openTabs.value.length - 1]);
        } else {
          currentFile.value = null;
        }
      }
      showToast('✅ 文件已删除', 'success');
    };

    // 复制文件内容
    const copyFileContent = async (file) => {
      try {
        await navigator.clipboard.writeText(file.content || '');
        showToast('✅ 内容已复制', 'success');
      } catch (err) {
        showToast('❌ 复制失败', 'error');
      }
    };

    // 下载文件
    const downloadFile = (file) => {
      const blob = new Blob([file.content || ''], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      showToast('✅ 文件已下载', 'success');
    };

    // 右键菜单动作函数
    const renameFileAction = (file) => {
      closeContextMenu();
      renameFile(file);
    };

    const deleteFileAction = (file) => {
      closeContextMenu();
      deleteFile(file);
    };

    const deleteFolderAction = (folder) => {
      if (!confirm(`确定要删除文件夹 "${folder.name}" 及其中的所有文件吗？`)) return;
      closeContextMenu();
      const index = folders.value.findIndex(f => f.id === folder.id);
      if (index > -1) folders.value.splice(index, 1);
      showToast('✅ 文件夹已删除', 'success');
    };

    const createFileInFolder = (folder) => {
      closeContextMenu();
      const name = prompt('请输入文件名:', 'untitled.js');
      if (!name) return;
      const file = {
        id: Date.now(),
        name,
        content: '',
        modified: false,
        folderId: folder.id
      };
      folder.files.push(file);
      folder.expanded = true;
      openFile(file);
      showToast('✅ 文件已创建', 'success');
    };

    const closeFileTypeDialog = () => {
      showFileTypeDialog.value = false;
    };

    onMounted(() => {
      loadTheme();
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleGlobalClick);
    });

    return {
      editorRef, currentFile, openTabs, files, folders, fileInput, directoryInput,
      editorContent, rootDirectory, toasts, cursorLine, cursorColumn, supportsDirectoryPicker,
      languageName, rootFiles, getFileIcon, openDirectory, openFiles, readDirectory,
      handleDirectorySelect, handleFileSelect, openFile, closeTab, toggleFolder,
      onInput, onTab, saveCurrentFile, createNewFile, createNewFolder, saveAllFiles,
      showFileMenu, showFileTypeDialog, selectedFileTypes, fileTypeFilter, fileTypes,
      selectAllTypes, deselectAllTypes, confirmFileType, closeFileTypeDialog,
      showTreeContextMenu, showFileContextMenu, showFolderContextMenu,
      contextMenuVisible, contextMenuPosition, contextMenuType, currentContextMenuTarget,
      renameFileAction, deleteFileAction, deleteFolderAction, createFileInFolder,
      copyFileContent, downloadFile,
      currentLanguage, changeLanguage,
      isDark, toggleTheme,
      highlightedCode, syncScroll
    };
  }
}).mount('#app');
