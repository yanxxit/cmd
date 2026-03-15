/**
 * Monaco Editor Web IDE - 主入口
 * 使用 Monaco Editor AMD loader 方式加载
 */

// 应用状态
let monaco = null;
const state = {
  editor: null,
  files: [],
  folders: [],
  openTabs: [],
  currentFile: null,
  rootDirectory: '',
  contextMenuFileId: null,
  fileContextMenuTarget: null,
  activeView: 'explorer',
  commandPaletteVisible: false,
  selectedCommandIndex: 0
};

// 命令列表
const COMMANDS = [
  { id: 'file.new', label: '新建文件', icon: '📄', shortcut: '', action: () => createNewFile() },
  { id: 'file.open', label: '打开目录', icon: '📂', shortcut: '', action: () => openDirectory() },
  { id: 'file.save', label: '保存文件', icon: '💾', shortcut: 'Ctrl+S', action: () => saveFile() },
  { id: 'file.close', label: '关闭当前文件', icon: '🚫', shortcut: '', action: () => closeCurrentTab() },
  { id: 'file.closeAll', label: '关闭全部文件', icon: '🗑️', shortcut: '', action: () => closeAllTabs() },
  { id: 'edit.undo', label: '撤销', icon: '↩️', shortcut: 'Ctrl+Z', action: () => state.editor && state.editor.trigger('undo') },
  { id: 'edit.redo', label: '重做', icon: '↪️', shortcut: 'Ctrl+Y', action: () => state.editor && state.editor.trigger('redo') },
  { id: 'edit.copy', label: '复制', icon: '📋', shortcut: 'Ctrl+C', action: () => state.editor && state.editor.trigger('copy') },
  { id: 'edit.paste', label: '粘贴', icon: '📥', shortcut: 'Ctrl+V', action: () => state.editor && state.editor.trigger('paste') },
  { id: 'edit.find', label: '查找', icon: '🔍', shortcut: 'Ctrl+F', action: () => state.editor && state.editor.trigger('find') },
  { id: 'edit.replace', label: '替换', icon: '🔄', shortcut: 'Ctrl+H', action: () => state.editor && state.editor.trigger('replace') },
  { id: 'view.explorer', label: '打开资源管理器', icon: '📁', shortcut: 'Ctrl+Shift+E', action: () => switchView('explorer') },
  { id: 'view.search', label: '打开搜索', icon: '🔍', shortcut: 'Ctrl+Shift+F', action: () => switchView('search') },
  { id: 'view.settings', label: '打开设置', icon: '⚙️', shortcut: '', action: () => switchView('settings') },
  { id: 'theme.dark', label: '深色主题', icon: '🌙', shortcut: '', action: () => { monaco.editor.setTheme('vs-dark'); localStorage.setItem('monaco-ide-theme', 'vs-dark'); } },
  { id: 'theme.light', label: '浅色主题', icon: '☀️', shortcut: '', action: () => { monaco.editor.setTheme('vs'); localStorage.setItem('monaco-ide-theme', 'vs'); } },
  { id: 'format.code', label: '格式化代码', icon: '✨', shortcut: '', action: () => state.editor && state.editor.getAction('editor.action.formatDocument').run() },
  { id: 'toggle.minimap', label: '切换小地图', icon: '🗺️', shortcut: '', action: toggleMinimap },
  { id: 'toggle.wordWrap', label: '切换自动换行', icon: '↩️', shortcut: '', action: toggleWordWrap },
  { id: 'language.show', label: '切换语言', icon: '📝', shortcut: '', action: () => showLanguagePicker() }
];

// 文件图标映射
const fileIcons = {
  'js': '🟨', 'jsx': '⚛️', 'ts': '🔷', 'tsx': '⚛️',
  'py': '🐍', 'go': '🔹', 'html': '🌐', 'css': '🎨',
  'json': '📋', 'md': '📝', 'yaml': '📋', 'yml': '📋',
  'sh': '💻', 'sql': '🗄️', 'xml': '📄', 'txt': '📄',
  'vue': '💚', 'rs': '🦀', 'java': '☕', 'c': '⚙️',
  'cpp': '⚙️', 'php': '🐘', 'rb': '💎'
};

// 语言映射
const languageMap = {
  'js': 'javascript', 'jsx': 'javascript', 'mjs': 'javascript',
  'ts': 'typescript', 'tsx': 'typescript',
  'py': 'python', 'go': 'go',
  'html': 'html', 'htm': 'html',
  'css': 'css', 'scss': 'css', 'less': 'css',
  'json': 'json', 'md': 'markdown',
  'yaml': 'yaml', 'yml': 'yaml',
  'sh': 'shell', 'bash': 'shell',
  'sql': 'sql', 'xml': 'xml',
  'vue': 'vue', 'rs': 'rust',
  'java': 'java', 'c': 'c',
  'cpp': 'cpp', 'php': 'php', 'rb': 'ruby'
};

// 语言显示名称
const languageNames = {
  'plaintext': '纯文本',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'python': 'Python',
  'go': 'Go',
  'html': 'HTML',
  'css': 'CSS',
  'json': 'JSON',
  'markdown': 'Markdown',
  'yaml': 'YAML',
  'xml': 'XML',
  'sql': 'SQL',
  'java': 'Java',
  'c': 'C',
  'cpp': 'C++',
  'php': 'PHP',
  'ruby': 'Ruby',
  'rust': 'Rust',
  'shell': 'Shell'
};

// 工具函数
function getExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function getFileIcon(filename) {
  const ext = getExtension(filename);
  return fileIcons[ext] || '📄';
}

function getLanguage(filename) {
  const ext = getExtension(filename);
  return languageMap[ext] || 'plaintext';
}

// Toast 通知
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// 初始化 Monaco Editor
function initEditor() {
  state.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
    value: '',
    language: 'plaintext',
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 14,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    renderWhitespace: 'selection',
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    tabSize: 2,
    wordWrap: 'on',
    padding: { top: 16, bottom: 16 }
  });

  // 监听内容变化
  state.editor.onDidChangeModelContent(() => {
    if (state.currentFile) {
      state.currentFile.content = state.editor.getValue();
      state.currentFile.modified = true;
      updateTab(state.currentFile);
    }
  });

  // 监听光标位置
  state.editor.onDidChangeCursorPosition((e) => {
    const position = document.getElementById('status-position');
    const selection = document.getElementById('status-selection');
    
    position.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
    
    // 显示选择区域
    const sel = state.editor.getSelection();
    if (sel && (!sel.isEmpty())) {
      const startLine = sel.startLineNumber;
      const startCol = sel.startColumn;
      const endLine = sel.endLineNumber;
      const endCol = sel.endColumn;
      const lines = endLine - startLine + 1;
      const cols = endCol - startCol;
      selection.style.display = 'flex';
      selection.textContent = `(${lines}行，${cols}列)`;
    } else {
      selection.style.display = 'none';
    }
  });
}

// 更新标签页
function updateTab(file) {
  const tab = document.querySelector(`.tab[data-file-id="${file.id}"]`);
  if (tab) {
    const modifiedSpan = tab.querySelector('.tab-modified');
    if (file.modified && !modifiedSpan) {
      const span = document.createElement('span');
      span.className = 'tab-modified';
      span.textContent = '●';
      tab.appendChild(span);
    } else if (!file.modified && modifiedSpan) {
      modifiedSpan.remove();
    }
  }
}

// 打开文件
function openFile(file) {
  // 如果标签未打开，创建标签
  if (!state.openTabs.find(t => t.id === file.id)) {
    state.openTabs.push(file);
    renderTabs();
  }

  state.currentFile = file;

  // 设置编辑器内容
  const model = state.editor.getModel();
  monaco.editor.setModelLanguage(model, getLanguage(file.name));
  state.editor.setValue(file.content || '');

  // 更新状态栏
  document.getElementById('status-file').textContent = `📄 ${file.name}`;
  document.getElementById('status-language').textContent = getLanguage(file.name).toUpperCase();

  // 更新面包屑
  updateBreadcrumbs(file);

  // 更新文件树激活状态
  document.querySelectorAll('.file-item').forEach(el => {
    el.classList.toggle('active', el.dataset.fileId === file.id);
  });

  // 更新打开的编辑器列表
  renderOpenEditors();
}

// 关闭标签
function closeTab(fileId, event) {
  if (event) event.stopPropagation();

  const index = state.openTabs.findIndex(t => t.id === fileId);
  if (index === -1) return;

  const tab = state.openTabs[index];
  if (tab.modified && !confirm(`${tab.name} 有未保存的修改，确定关闭？`)) {
    return;
  }

  state.openTabs.splice(index, 1);

  // 如果关闭的是当前文件
  if (state.currentFile?.id === fileId) {
    if (state.openTabs.length > 0) {
      openFile(state.openTabs[state.openTabs.length - 1]);
    } else {
      state.currentFile = null;
      state.editor.setValue('');
      document.getElementById('status-file').textContent = '就绪';
    }
  }

  renderTabs();
}

// 显示标签页右键菜单
window.showTabContextMenu = (event, fileId) => {
  event.preventDefault();
  event.stopPropagation();

  state.contextMenuFileId = fileId;

  const menu = document.getElementById('tab-context-menu');
  menu.style.display = 'block';
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;

  // 更新菜单项状态
  updateContextMenuState(fileId);
};

// 更新右键菜单项状态
function updateContextMenuState(fileId) {
  const index = state.openTabs.findIndex(t => t.id === fileId);
  const hasOther = state.openTabs.length > 1;
  const hasRight = index < state.openTabs.length - 1;
  const hasLeft = index > 0;

  setMenuItemDisabled('close-other', !hasOther);
  setMenuItemDisabled('close-right', !hasRight);
  setMenuItemDisabled('close-left', !hasLeft);
}

// 设置菜单项禁用状态
function setMenuItemDisabled(action, disabled) {
  const item = document.querySelector(`.context-menu-item[data-action="${action}"]`);
  if (item) {
    if (disabled) {
      item.classList.add('disabled');
    } else {
      item.classList.remove('disabled');
    }
  }
}

// 隐藏右键菜单
function hideTabContextMenu() {
  const menu = document.getElementById('tab-context-menu');
  menu.style.display = 'none';
  state.contextMenuFileId = null;
}

// 显示文件右键菜单
window.showFileContextMenu = (event, id, type, folderId) => {
  event.preventDefault();
  event.stopPropagation();

  // 查找目标项
  let item = null;
  let folder = null;

  if (type === 'file') {
    item = state.files.find(f => f.id === id) || 
           state.folders.flatMap(f => f.files).find(f => f.id === id);
    if (folderId) {
      folder = state.folders.find(f => f.id === folderId);
    }
  } else {
    item = state.folders.find(f => f.id === id);
  }

  state.fileContextMenuTarget = { type, item, folder: folder || null };

  const menu = document.getElementById('file-context-menu');
  menu.style.display = 'block';
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;

  // 更新菜单项状态
  updateFileContextMenuState(type);
};

// 更新文件右键菜单项状态
function updateFileContextMenuState(type) {
  // 文件夹不能打开、复制内容、下载
  const fileOnlyActions = ['file-open', 'copy', 'download'];
  fileOnlyActions.forEach(action => {
    const item = document.querySelector(`.context-menu-item[data-action="${action}"]`);
    if (item) {
      if (type === 'folder') {
        item.classList.add('disabled');
      } else {
        item.classList.remove('disabled');
      }
    }
  });
}

// 隐藏文件右键菜单
function hideFileContextMenu() {
  const menu = document.getElementById('file-context-menu');
  menu.style.display = 'none';
  state.fileContextMenuTarget = null;
}

// 处理文件右键菜单点击
function handleFileContextMenuClick(event) {
  const target = event.target.closest('.context-menu-item');
  if (!target || target.classList.contains('disabled')) return;

  const action = target.dataset.action;
  const { type, item, folder } = state.fileContextMenuTarget;

  if (!item) return;

  switch (action) {
    case 'file-new':
      createNewFileInFolder(folder);
      break;
    case 'folder-new':
      createNewFolderInFolder(folder);
      break;
    case 'file-open':
      if (type === 'file') openFile(item);
      break;
    case 'rename':
      renameItem(item, type);
      break;
    case 'copy':
      copyFileContent(item);
      break;
    case 'copy-path':
      copyFilePath(item);
      break;
    case 'download':
      downloadFile(item);
      break;
    case 'delete':
      deleteItem(item, type, folder);
      break;
  }

  hideFileContextMenu();
}

// 在文件夹中创建文件
function createNewFileInFolder(folder) {
  const name = prompt('请输入文件名:', 'untitled.js');
  if (!name) return;

  const file = {
    id: `${Date.now()}-${Math.random()}`,
    name,
    content: '',
    modified: false,
    folderId: folder?.id
  };

  if (folder) {
    folder.files.push(file);
    folder.expanded = true;
  } else {
    state.files.push(file);
  }

  renderFileTree();
  openFile(file);
  showToast('✅ 文件已创建', 'success');
}

// 在文件夹中创建文件夹
function createNewFolderInFolder(folder) {
  const name = prompt('请输入文件夹名称:', 'new-folder');
  if (!name) return;

  const newFolder = {
    id: `${Date.now()}-${Math.random()}`,
    name,
    expanded: false,
    files: []
  };

  state.folders.push(newFolder);
  renderFileTree();
  showToast('✅ 文件夹已创建', 'success');
}

// 重命名
function renameItem(item, type) {
  const newName = prompt(`请输入新${type === 'file' ? '文件' : '文件夹'}名:`, item.name);
  if (newName && newName !== item.name) {
    item.name = newName;
    item.modified = true;
    renderFileTree();
    renderTabs();
    showToast(`✅ ${type === 'file' ? '文件' : '文件夹'}已重命名`, 'success');
  }
}

// 复制文件内容
async function copyFileContent(file) {
  try {
    await navigator.clipboard.writeText(file.content || '');
    showToast('✅ 内容已复制到剪贴板', 'success');
  } catch (err) {
    showToast('❌ 复制失败', 'error');
  }
}

// 复制文件路径
function copyFilePath(file) {
  const path = state.rootDirectory ? `${state.rootDirectory}/${file.name}` : file.name;
  navigator.clipboard.writeText(path).then(() => {
    showToast('✅ 路径已复制到剪贴板', 'success');
  }).catch(() => {
    showToast('❌ 复制失败', 'error');
  });
}

// 下载文件
function downloadFile(file) {
  const blob = new Blob([file.content || ''], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ 文件已下载', 'success');
}

// 删除项目
function deleteItem(item, type, folder) {
  const itemName = type === 'file' ? '文件' : '文件夹';
  if (!confirm(`确定要删除 "${item.name}" ${type === 'folder' ? '及其中的所有内容吗？' : ''}？`)) {
    return;
  }

  if (type === 'file') {
    // 从 files 数组删除
    const fileIndex = state.files.findIndex(f => f.id === item.id);
    if (fileIndex > -1) {
      state.files.splice(fileIndex, 1);
    }

    // 从文件夹删除
    if (folder) {
      const folderFileIndex = folder.files.findIndex(f => f.id === item.id);
      if (folderFileIndex > -1) {
        folder.files.splice(folderFileIndex, 1);
      }
    } else {
      // 从所有文件夹中查找删除
      state.folders.forEach(f => {
        const idx = f.files.findIndex(file => file.id === item.id);
        if (idx > -1) f.files.splice(idx, 1);
      });
    }

    // 关闭相关标签
    const tabIndex = state.openTabs.findIndex(t => t.id === item.id);
    if (tabIndex > -1) {
      state.openTabs.splice(tabIndex, 1);
      if (state.currentFile?.id === item.id) {
        if (state.openTabs.length > 0) {
          openFile(state.openTabs[state.openTabs.length - 1]);
        } else {
          state.currentFile = null;
          state.editor.setValue('');
          document.getElementById('status-file').textContent = '就绪';
        }
      }
    }
  } else {
    // 删除文件夹
    const folderIndex = state.folders.findIndex(f => f.id === item.id);
    if (folderIndex > -1) {
      state.folders.splice(folderIndex, 1);
    }
  }

  renderFileTree();
  renderTabs();
  showToast(`✅ ${itemName}已删除`, 'success');
}

// 处理右键菜单点击
function handleTabContextMenuClick(event) {
  const target = event.target.closest('.context-menu-item');
  if (!target || target.classList.contains('disabled')) return;

  const action = target.dataset.action;
  const fileId = state.contextMenuFileId;

  if (!fileId) return;

  switch (action) {
    case 'close':
      closeTab(fileId);
      break;
    case 'close-other':
      closeOtherTabs(fileId);
      break;
    case 'close-right':
      closeRightTabs(fileId);
      break;
    case 'close-left':
      closeLeftTabs(fileId);
      break;
    case 'close-all':
      closeAllTabs();
      break;
  }

  hideTabContextMenu();
}

// 关闭其他标签
function closeOtherTabs(fileId) {
  const fileToKeep = state.openTabs.find(t => t.id === fileId);
  if (!fileToKeep) return;

  // 检查是否有未保存的文件
  const unsavedTabs = state.openTabs.filter(t => t.id !== fileId && t.modified);
  if (unsavedTabs.length > 0) {
    if (!confirm(`有 ${unsavedTabs.length} 个未保存的文件，确定关闭其他标签？`)) {
      return;
    }
  }

  state.openTabs = state.openTabs.filter(t => t.id === fileId);

  // 如果当前文件被关闭，切换到保留的文件
  if (state.currentFile?.id !== fileId) {
    state.currentFile = fileToKeep;
    openFile(fileToKeep);
  } else {
    renderTabs();
  }
}

// 关闭右侧标签
function closeRightTabs(fileId) {
  const index = state.openTabs.findIndex(t => t.id === fileId);
  if (index === -1) return;

  const tabsToClose = state.openTabs.slice(index + 1);
  const unsavedTabs = tabsToClose.filter(t => t.modified);

  if (unsavedTabs.length > 0) {
    if (!confirm(`有 ${unsavedTabs.length} 个未保存的文件，确定关闭右侧标签？`)) {
      return;
    }
  }

  state.openTabs = state.openTabs.slice(0, index + 1);

  // 如果当前文件被关闭，切换到最后一个保留的文件
  if (state.currentFile && !state.openTabs.find(t => t.id === state.currentFile.id)) {
    state.currentFile = state.openTabs[state.openTabs.length - 1];
    openFile(state.currentFile);
  } else {
    renderTabs();
  }
}

// 关闭左侧标签
function closeLeftTabs(fileId) {
  const index = state.openTabs.findIndex(t => t.id === fileId);
  if (index === -1) return;

  const tabsToClose = state.openTabs.slice(0, index);
  const unsavedTabs = tabsToClose.filter(t => t.modified);

  if (unsavedTabs.length > 0) {
    if (!confirm(`有 ${unsavedTabs.length} 个未保存的文件，确定关闭左侧标签？`)) {
      return;
    }
  }

  state.openTabs = state.openTabs.slice(index);

  // 如果当前文件被关闭，切换到第一个保留的文件
  if (state.currentFile && !state.openTabs.find(t => t.id === state.currentFile.id)) {
    state.currentFile = state.openTabs[0];
    openFile(state.currentFile);
  } else {
    renderTabs();
  }
}

// 关闭全部标签
function closeAllTabs() {
  const unsavedTabs = state.openTabs.filter(t => t.modified);
  if (unsavedTabs.length > 0) {
    if (!confirm(`有 ${unsavedTabs.length} 个未保存的文件，确定关闭全部标签？`)) {
      return;
    }
  }

  state.openTabs = [];
  state.currentFile = null;
  state.editor.setValue('');
  document.getElementById('status-file').textContent = '就绪';
  renderTabs();
}

// 更新面包屑
function updateBreadcrumbs(file) {
  const breadcrumbFile = document.getElementById('breadcrumb-file');
  if (breadcrumbFile) {
    breadcrumbFile.textContent = file.name;
  }
}

// 渲染打开的编辑器列表
function renderOpenEditors() {
  const count = document.getElementById('open-editors-count');
  const list = document.getElementById('open-editors-list');

  count.textContent = state.openTabs.length;

  list.innerHTML = state.openTabs.map(file => `
    <div class="open-editor-item ${state.currentFile?.id === file.id ? 'active' : ''} ${file.modified ? 'modified' : ''}" onclick="openFileById('${file.id}')">
      <span class="open-editor-icon">${getFileIcon(file.name)}</span>
      <span class="open-editor-name">${file.name}</span>
      <span class="open-editor-close" onclick="closeTab('${file.id}', event)">×</span>
    </div>
  `).join('');
}

// 切换视图
function switchView(viewName) {
  // 更新活动栏
  document.querySelectorAll('.activity-item').forEach(item => {
    item.classList.toggle('active', item.dataset.action === viewName);
  });

  // 更新侧边栏标题
  const titles = {
    'explorer': '📁 资源管理器',
    'search': '🔍 搜索',
    'settings': '⚙️ 设置'
  };
  document.getElementById('sidebar-title').textContent = titles[viewName] || '资源管理器';

  // 切换视图
  document.querySelectorAll('.sidebar-view').forEach(view => {
    view.style.display = 'none';
  });
  document.getElementById(`view-${viewName}`).style.display = 'flex';

  state.activeView = viewName;

  // 加载设置
  if (viewName === 'settings') {
    loadSettings();
  }
}

// 执行搜索
function performSearch() {
  const query = document.getElementById('search-input').value.trim();
  const caseSensitive = document.getElementById('search-case-sensitive').checked;
  const wholeWord = document.getElementById('search-whole-word').checked;
  const useRegex = document.getElementById('search-regex').checked;
  const resultsContainer = document.getElementById('search-results');

  if (!query) {
    resultsContainer.innerHTML = '';
    return;
  }

  const results = [];
  const flags = caseSensitive ? 'g' : 'gi';
  let regex;

  try {
    regex = useRegex ? new RegExp(query, flags) : new RegExp(escapeRegExp(query), flags);
  } catch (e) {
    resultsContainer.innerHTML = '<div class="search-result-item">❌ 正则表达式无效</div>';
    return;
  }

  // 搜索所有文件
  const allFiles = [...state.files, ...state.folders.flatMap(f => f.files)];

  allFiles.forEach(file => {
    if (!file.content) return;

    const lines = file.content.split('\n');
    lines.forEach((line, index) => {
      const matches = line.match(regex);
      if (matches) {
        results.push({
          file,
          line: index + 1,
          content: line,
          matches: matches.length
        });
      }
    });
  });

  // 限制结果数量
  const limitedResults = results.slice(0, 50);

  if (limitedResults.length === 0) {
    resultsContainer.innerHTML = '<div class="search-result-item">未找到匹配结果</div>';
    return;
  }

  resultsContainer.innerHTML = limitedResults.map(result => {
    const highlightedContent = highlightSearch(result.content, query, caseSensitive, useRegex);
    return `
      <div class="search-result-item" onclick="openFileAndHighlight('${result.file.id}', ${result.line})">
        <div class="search-result-file">${getFileIcon(result.file.name)} ${result.file.name}</div>
        <div class="search-result-line">
          <span class="search-result-match">Line ${result.line}:</span>
          ${highlightedContent}
        </div>
      </div>
    `;
  }).join('');

  showToast(`🔍 找到 ${results.length} 个匹配结果`, 'info');
}

// 转义正则表达式
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 高亮搜索结果
function highlightSearch(text, query, caseSensitive, useRegex) {
  const escaped = escapeRegExp(query);
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = useRegex ? new RegExp(query, flags) : new RegExp(escaped, flags);
  return text.replace(regex, '<span class="search-result-match">$&</span>');
}

// 打开文件并高亮
window.openFileAndHighlight = (fileId, line) => {
  const file = findFile(fileId);
  if (file) {
    openFile(file);
    // 滚动到指定行
    setTimeout(() => {
      if (state.editor) {
        const position = { lineNumber: line, column: 1 };
        state.editor.revealLineInCenter(line);
        state.editor.setPosition(position);
      }
    }, 100);
  }
};

// 加载设置
function loadSettings() {
  const theme = localStorage.getItem('monaco-ide-theme') || 'vs-dark';
  const fontSize = localStorage.getItem('monaco-ide-font-size') || '14';
  const minimap = localStorage.getItem('monaco-ide-minimap') === 'true';
  const wordWrap = localStorage.getItem('monaco-ide-word-wrap') === 'true';
  const lineNumbers = localStorage.getItem('monaco-ide-line-numbers') !== 'false';

  document.getElementById('setting-theme').value = theme;
  document.getElementById('setting-font-size').value = fontSize;
  document.getElementById('setting-minimap').checked = minimap;
  document.getElementById('setting-word-wrap').checked = wordWrap;
  document.getElementById('setting-line-numbers').checked = lineNumbers;
}
function renderTabs() {
  const container = document.getElementById('tabs');
  container.innerHTML = state.openTabs.map((file, index) => `
    <div class="tab ${state.currentFile?.id === file.id ? 'active' : ''}" 
         data-file-id="${file.id}" 
         data-tab-index="${index}"
         draggable="true"
         onclick="openFileById('${file.id}')" 
         oncontextmenu="showTabContextMenu(event, '${file.id}')"
         ondragstart="handleTabDragStart(event, '${file.id}')"
         ondragover="handleTabDragOver(event)"
         ondrop="handleTabDrop(event, '${file.id}')">
      <span>${getFileIcon(file.name)}</span>
      <span>${file.name}</span>
      ${file.modified ? '<span class="tab-modified">●</span>' : ''}
      <span class="tab-close" onclick="closeTab('${file.id}', event)">×</span>
    </div>
  `).join('');
}

// 标签页拖拽相关
let draggedTabId = null;

// 处理标签拖拽开始
window.handleTabDragStart = (event, fileId) => {
  draggedTabId = fileId;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', fileId);
  event.target.classList.add('dragging');
};

// 处理标签拖拽经过
window.handleTabDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  event.target.closest('.tab')?.classList.add('drag-over');
};

// 处理标签放置
window.handleTabDrop = (event, targetId) => {
  event.preventDefault();
  event.stopPropagation();
  
  // 清除拖拽样式
  document.querySelectorAll('.tab.drag-over').forEach(el => el.classList.remove('drag-over'));
  
  if (!draggedTabId || draggedTabId === targetId) return;
  
  const draggedIndex = state.openTabs.findIndex(t => t.id === draggedTabId);
  const targetIndex = state.openTabs.findIndex(t => t.id === targetId);
  
  if (draggedIndex > -1 && targetIndex > -1) {
    const [draggedTab] = state.openTabs.splice(draggedIndex, 1);
    state.openTabs.splice(targetIndex + (draggedIndex < targetIndex ? 1 : 0), 0, draggedTab);
    renderTabs();
  }
  
  draggedTabId = null;
};

// 处理标签拖拽结束
document.addEventListener('dragend', (e) => {
  if (e.target.classList.contains('tab')) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.tab.drag-over').forEach(el => el.classList.remove('drag-over'));
  }
});

// 通过 ID 打开文件（供全局调用）
window.openFileById = (fileId) => {
  const file = findFile(fileId);
  if (file) openFile(file);
};

// 查找文件
function findFile(fileId) {
  return state.files.find(f => f.id === fileId) ||
         state.folders.flatMap(f => f.files).find(f => f.id === fileId);
}

// 渲染文件树
function renderFileTree() {
  const container = document.getElementById('file-tree');

  if (state.folders.length === 0 && state.files.length === 0) {
    container.innerHTML = `
      <div class="welcome-page">
        <div class="welcome-icon">📂</div>
        <div class="welcome-desc">暂无文件</div>
      </div>
    `;
    return;
  }

  let html = '';

  // 根目录文件
  state.files.forEach(file => {
    html += `
      <div class="file-item ${state.currentFile?.id === file.id ? 'active' : ''}" 
           data-file-id="${file.id}" 
           data-type="file"
           draggable="true"
           onclick="openFileById('${file.id}')"
           oncontextmenu="showFileContextMenu(event, '${file.id}', 'file', null)"
           ondragstart="handleFileDragStart(event, '${file.id}')"
           ondragover="handleFileDragOver(event)"
           ondrop="handleFileDrop(event, '${file.id}')">
        <span class="file-icon">${getFileIcon(file.name)}</span>
        <span>${file.name}</span>
      </div>
    `;
  });

  // 文件夹
  state.folders.forEach(folder => {
    html += `
      <div class="folder-section" data-folder-id="${folder.id}">
        <div class="folder-item" 
             data-type="folder"
             draggable="true"
             onclick="toggleFolder('${folder.id}')" 
             oncontextmenu="showFileContextMenu(event, '${folder.id}', 'folder', null)"
             ondragstart="handleFileDragStart(event, '${folder.id}')"
             ondragover="handleFileDragOver(event)"
             ondrop="handleFolderDrop(event, '${folder.id}')">
          <span class="folder-icon ${folder.expanded ? 'expanded' : ''}">▶</span>
          <span>📁 ${folder.name}</span>
        </div>
        <div class="folder-children ${folder.expanded ? 'expanded' : ''}"
             ondragover="handleFileDragOver(event)"
             ondrop="handleFolderDrop(event, '${folder.id}')">
          ${folder.files.map(file => `
            <div class="file-item ${state.currentFile?.id === file.id ? 'active' : ''}" 
                 data-file-id="${file.id}" 
                 data-type="file"
                 draggable="true"
                 onclick="openFileById('${file.id}')"
                 oncontextmenu="showFileContextMenu(event, '${file.id}', 'file', '${folder.id}')"
                 ondragstart="handleFileDragStart(event, '${file.id}')"
                 ondragover="handleFileDragOver(event)"
                 ondrop="handleFileDrop(event, '${file.id}')">
              <span class="file-icon">${getFileIcon(file.name)}</span>
              <span>${file.name}</span>
            </div>
          `).join('')}
          ${folder.files.length === 0 ? '<div class="empty-folder" style="padding: 4px 16px 4px 36px; color: var(--text-secondary); font-size: 12px;">空文件夹</div>' : ''}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// 拖拽相关变量
let draggedItem = null;
let draggedType = null; // 'file' or 'folder'

// 处理拖拽开始
window.handleFileDragStart = (event, id) => {
  const item = state.files.find(f => f.id === id) || 
               state.folders.find(f => f.id === id) ||
               state.folders.flatMap(f => f.files).find(f => f.id === id);
  
  if (item) {
    draggedItem = item;
    draggedType = event.target.dataset.type || 'file';
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
    event.target.classList.add('dragging');
  }
};

// 处理拖拽经过
window.handleFileDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
};

// 处理文件放置
window.handleFileDrop = (event, targetId) => {
  event.preventDefault();
  const sourceId = event.dataTransfer.getData('text/plain');
  
  if (!draggedItem || sourceId === targetId) return;
  
  // 找到源文件和目标文件
  const sourceIndex = state.files.findIndex(f => f.id === sourceId);
  const targetIndex = state.files.findIndex(f => f.id === targetId);
  
  if (sourceIndex > -1 && targetIndex > -1) {
    // 在根目录文件中重新排序
    state.files.splice(sourceIndex, 1);
    const newTargetIndex = state.files.findIndex(f => f.id === targetId);
    state.files.splice(newTargetIndex + (sourceIndex < targetIndex ? 1 : 0), 0, draggedItem);
  }
  
  // 清除拖拽状态
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
  draggedItem = null;
  draggedType = null;
  
  renderFileTree();
};

// 处理文件夹放置
window.handleFolderDrop = (event, targetFolderId) => {
  event.preventDefault();
  const sourceId = event.dataTransfer.getData('text/plain');
  
  if (!draggedItem || sourceId === targetFolderId) return;
  
  const targetFolder = state.folders.find(f => f.id === targetFolderId);
  if (!targetFolder) return;
  
  // 如果是文件，移动到目标文件夹
  if (draggedType === 'file') {
    // 从原位置移除
    const sourceFileIndex = state.files.findIndex(f => f.id === sourceId);
    if (sourceFileIndex > -1) {
      state.files.splice(sourceFileIndex, 1);
    } else {
      // 从其他文件夹移除
      state.folders.forEach(folder => {
        const idx = folder.files.findIndex(f => f.id === sourceId);
        if (idx > -1) folder.files.splice(idx, 1);
      });
    }
    
    // 添加到目标文件夹
    targetFolder.files.push({
      ...draggedItem,
      folderId: targetFolderId
    });
    targetFolder.expanded = true;
    
    showToast(`✅ 文件已移动到 ${targetFolder.name}`, 'success');
  }
  
  // 清除拖拽状态
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
  draggedItem = null;
  draggedType = null;
  
  renderFileTree();
};

// 切换文件夹展开状态
window.toggleFolder = (folderId) => {
  const folder = state.folders.find(f => f.id === folderId);
  if (folder) {
    folder.expanded = !folder.expanded;
    renderFileTree();
  }
};

// 打开目录
async function openDirectory() {
  if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await window.showDirectoryPicker();
      state.rootDirectory = dirHandle.name;
      state.folders = [];
      state.files = [];
      state.openTabs = [];
      state.currentFile = null;

      await readDirectory(dirHandle);
      renderFileTree();
      renderTabs();
      showToast(`✅ 目录 "${dirHandle.name}" 已打开`, 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('❌ 打开目录失败：' + err.message, 'error');
      }
    }
  } else {
    document.getElementById('directory-input').click();
  }
}

// 读取目录
async function readDirectory(dirHandle, parentId = null, depth = 0) {
  const folderId = parentId !== null ? parentId : `${Date.now()}-${dirHandle.name}`;
  const folder = {
    id: folderId,
    name: dirHandle.name,
    expanded: depth < 2,
    files: [],
    isRoot: !parentId,
    depth: depth
  };

  try {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        try {
          const file = await entry.getFile();
          if (file.size < 1024 * 1024) { // 限制 1MB
            const content = await file.text();
            folder.files.push({
              id: `${folderId}-${file.name}-${Date.now()}-${Math.random()}`,
              name: file.name,
              content: content,
              modified: false,
              folderId: folderId,
              fileHandle: entry
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

  state.folders.push(folder);
}

// 处理目录选择（input 方式）
function handleDirectorySelect(event) {
  const fileList = event.target.files;
  if (!fileList.length) return;

  const folderMap = new Map();
  state.rootDirectory = fileList[0].webkitRelativePath.split('/')[0] || 'Selected';

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
        renderFileTree();
      };
      reader.readAsText(file);
    }
  }

  state.folders = Array.from(folderMap.values());
  renderFileTree();
  showToast('✅ 目录已打开', 'success');
  event.target.value = '';
}

// 创建新文件
function createNewFile() {
  const name = prompt('请输入文件名:', 'untitled.js');
  if (!name) return;

  const file = {
    id: `${Date.now()}-${Math.random()}`,
    name,
    content: '',
    modified: false
  };

  state.files.push(file);
  renderFileTree();
  openFile(file);
  showToast('✅ 文件已创建', 'success');
}

// 保存文件
async function saveFile() {
  if (!state.currentFile) {
    showToast('⚠️ 没有打开的文件', 'warning');
    return;
  }

  state.currentFile.content = state.editor.getValue();

  // 如果有 fileHandle，直接保存
  if (state.currentFile.fileHandle) {
    try {
      const writable = await state.currentFile.fileHandle.createWritable();
      await writable.write(state.currentFile.content);
      await writable.close();
      state.currentFile.modified = false;
      updateTab(state.currentFile);
      showToast('✅ 文件已保存', 'success');
      return;
    } catch (err) {
      console.error('保存失败:', err);
    }
  }

  // 否则下载文件
  const blob = new Blob([state.currentFile.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = state.currentFile.name;
  a.click();
  URL.revokeObjectURL(url);

  state.currentFile.modified = false;
  updateTab(state.currentFile);
  showToast('✅ 文件已下载', 'success');
}

// 绑定事件
function bindEvents() {
  document.getElementById('btn-open-dir').addEventListener('click', openDirectory);
  document.getElementById('btn-new-file').addEventListener('click', createNewFile);
  document.getElementById('btn-save').addEventListener('click', saveFile);
  document.getElementById('btn-new-file-sidebar').addEventListener('click', createNewFile);
  document.getElementById('btn-new-folder-sidebar').addEventListener('click', () => {
    const name = prompt('请输入文件夹名称:', 'new-folder');
    if (name) {
      state.folders.push({
        id: `${Date.now()}-${Math.random()}`,
        name,
        expanded: false,
        files: []
      });
      renderFileTree();
      showToast('✅ 文件夹已创建', 'success');
    }
  });

  document.getElementById('directory-input').addEventListener('change', handleDirectorySelect);

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveFile();
    }
    // Ctrl+Shift+E 切换资源管理器
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'e') {
      e.preventDefault();
      switchView('explorer');
    }
    // Ctrl+Shift+F 切换搜索
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
      e.preventDefault();
      switchView('search');
    }
  });

  // 全局点击关闭右键菜单
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#tab-context-menu') && !e.target.closest('#file-context-menu')) {
      hideTabContextMenu();
      hideFileContextMenu();
    }
  });

  // 标签页右键菜单点击
  document.getElementById('tab-context-menu').addEventListener('click', handleTabContextMenuClick);
  
  // 文件列表右键菜单点击
  document.getElementById('file-context-menu').addEventListener('click', handleFileContextMenuClick);

  // 活动栏点击
  document.querySelectorAll('.activity-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      if (action) {
        switchView(action);
      }
    });
  });

  // 搜索功能
  document.getElementById('btn-search').addEventListener('click', performSearch);
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  // 设置功能
  document.getElementById('setting-theme').addEventListener('change', (e) => {
    if (state.editor) {
      monaco.editor.setTheme(e.target.value);
      localStorage.setItem('monaco-ide-theme', e.target.value);
    }
  });

  document.getElementById('setting-font-size').addEventListener('change', (e) => {
    if (state.editor) {
      state.editor.updateOptions({ fontSize: parseInt(e.target.value) });
      localStorage.setItem('monaco-ide-font-size', e.target.value);
    }
  });

  document.getElementById('setting-minimap').addEventListener('change', (e) => {
    if (state.editor) {
      state.editor.updateOptions({ minimap: { enabled: e.target.checked } });
      localStorage.setItem('monaco-ide-minimap', e.target.checked);
    }
  });

  document.getElementById('setting-word-wrap').addEventListener('change', (e) => {
    if (state.editor) {
      state.editor.updateOptions({ wordWrap: e.target.checked ? 'on' : 'off' });
      localStorage.setItem('monaco-ide-word-wrap', e.target.checked);
    }
  });

  document.getElementById('setting-line-numbers').addEventListener('change', (e) => {
    if (state.editor) {
      state.editor.updateOptions({ lineNumbers: e.target.checked ? 'on' : 'off' });
      localStorage.setItem('monaco-ide-line-numbers', e.target.checked);
    }
  });

  // 命令面板快捷键 Ctrl+Shift+P
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
      e.preventDefault();
      showCommandPalette();
    }
  });

  // 命令面板输入事件
  const commandInput = document.getElementById('command-input');
  if (commandInput) {
    commandInput.addEventListener('input', (e) => {
      state.selectedCommandIndex = 0;
      renderCommandList(e.target.value);
    });

    commandInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectCommand(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectCommand(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const list = document.getElementById('command-list');
        const selectedItem = list.querySelector('.command-item.selected');
        if (selectedItem) {
          const index = selectedItem.dataset.index;
          const filtered = COMMANDS.filter(cmd => 
            cmd.label.toLowerCase().includes(commandInput.value.toLowerCase()) ||
            cmd.id.toLowerCase().includes(commandInput.value.toLowerCase())
          ).slice(0, 10);
          if (filtered[index]) {
            executeCommand(filtered[index].id);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        hideCommandPalette();
      }
    });
  }

  // 点击命令面板外部关闭
  document.addEventListener('click', (e) => {
    const palette = document.getElementById('command-palette');
    if (state.commandPaletteVisible && !palette.contains(e.target)) {
      hideCommandPalette();
    }
  });
}

// 初始化 Monaco Editor（使用 AMD loader）
function loadMonacoAndInit() {
  // 配置 Monaco Editor 的 AMD loader
  window.require = {
    paths: {
      vs: '/libs/monaco-editor/min/vs'
    }
  };

  // 加载 loader.js
  const script = document.createElement('script');
  script.src = '/libs/monaco-editor/min/vs/loader.js';
  script.onload = () => {
    // 使用 require 加载 Monaco Editor
    window.require(['vs/editor/editor.main'], function (monacoModule) {
      monaco = monacoModule;
      
      // 加载保存的设置
      loadSavedSettings();
      
      initEditor();
      bindEvents();
      renderFileTree();
      console.log('✅ Monaco Editor Web IDE 已初始化');
    });
  };
  document.head.appendChild(script);
}

// 加载保存的设置
function loadSavedSettings() {
  const theme = localStorage.getItem('monaco-ide-theme') || 'vs-dark';
  const fontSize = localStorage.getItem('monaco-ide-font-size') || '14';
  const minimap = localStorage.getItem('monaco-ide-minimap') === 'true';
  const wordWrap = localStorage.getItem('monaco-ide-word-wrap') === 'true';
  const lineNumbers = localStorage.getItem('monaco-ide-line-numbers') !== 'false';

  // 这些设置会在 initEditor 后应用
  setTimeout(() => {
    if (monaco && state.editor) {
      monaco.editor.setTheme(theme);
      state.editor.updateOptions({
        fontSize: parseInt(fontSize),
        minimap: { enabled: minimap },
        wordWrap: wordWrap ? 'on' : 'off',
        lineNumbers: lineNumbers ? 'on' : 'off'
      });
    }
  }, 100);
}

// 命令面板功能
function showCommandPalette() {
  const palette = document.getElementById('command-palette');
  const input = document.getElementById('command-input');
  const list = document.getElementById('command-list');
  
  state.commandPaletteVisible = true;
  state.selectedCommandIndex = 0;
  palette.style.display = 'block';
  input.value = '';
  input.focus();
  
  renderCommandList('');
}

function hideCommandPalette() {
  const palette = document.getElementById('command-palette');
  palette.style.display = 'none';
  state.commandPaletteVisible = false;
}

function renderCommandList(query) {
  const list = document.getElementById('command-list');
  const filtered = COMMANDS.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);
  
  if (filtered.length === 0) {
    list.innerHTML = '<div class="command-item" style="cursor: default; color: var(--text-secondary);">无匹配命令</div>';
    return;
  }
  
  list.innerHTML = filtered.map((cmd, index) => `
    <div class="command-item ${index === state.selectedCommandIndex ? 'selected' : ''}" 
         data-index="${index}"
         onclick="executeCommand('${cmd.id}')">
      <span class="command-item-icon">${cmd.icon}</span>
      <span class="command-item-label">${cmd.label}</span>
      ${cmd.shortcut ? `<span class="command-item-shortcut">${cmd.shortcut}</span>` : ''}
    </div>
  `).join('');
}

function executeCommand(commandId) {
  const command = COMMANDS.find(c => c.id === commandId);
  if (command) {
    command.action();
    hideCommandPalette();
  }
}

function selectCommand(direction) {
  const list = document.getElementById('command-list');
  const items = list.querySelectorAll('.command-item');
  if (items.length <= 1) return;
  
  state.selectedCommandIndex = (state.selectedCommandIndex + direction + items.length - 1) % (items.length - 1);
  renderCommandList(document.getElementById('command-input').value);
}

function toggleMinimap() {
  if (!state.editor) return;
  const current = state.editor.getOption(108); // minimap option
  state.editor.updateOptions({ minimap: { enabled: !current } });
  localStorage.setItem('monaco-ide-minimap', !current);
  showToast(`✅ 小地图已${!current ? '开启' : '关闭'}`, 'info');
}

function toggleWordWrap() {
  if (!state.editor) return;
  const current = state.editor.getOption(119); // wordWrap option
  const newValue = current === 0 ? 'on' : 'off';
  state.editor.updateOptions({ wordWrap: newValue });
  localStorage.setItem('monaco-ide-word-wrap', newValue === 'on');
  showToast(`✅ 自动换行已${newValue === 'on' ? '开启' : '关闭'}`, 'info');
}

// 关闭当前标签
function closeCurrentTab() {
  if (state.currentFile) {
    closeTab(state.currentFile.id);
  }
}

// 语言选择器功能
function showLanguagePicker() {
  if (!state.currentFile) {
    showToast('⚠️ 请先打开文件', 'warning');
    return;
  }
  const picker = document.getElementById('language-picker');
  picker.style.display = 'block';
}

function hideLanguagePicker() {
  const picker = document.getElementById('language-picker');
  picker.style.display = 'none';
}

function selectLanguage(lang) {
  if (!state.currentFile || !monaco) return;
  
  const model = state.editor.getModel();
  monaco.editor.setModelLanguage(model, lang);
  
  // 更新当前文件的语言
  state.currentFile.language = lang;
  
  // 更新状态栏
  document.getElementById('status-language').textContent = lang.toUpperCase();
  
  hideLanguagePicker();
  showToast(`✅ 语言已切换为 ${languageNames[lang] || lang}`, 'success');
}

// 状态栏点击事件
document.addEventListener('click', (e) => {
  if (e.target.id === 'status-language') {
    showLanguagePicker();
  } else if (!e.target.closest('#language-picker') && !e.target.closest('#status-language')) {
    hideLanguagePicker();
  }
});

// 暴露全局函数供 HTML onclick 使用
window.showLanguagePicker = showLanguagePicker;
window.hideLanguagePicker = hideLanguagePicker;
window.selectLanguage = selectLanguage;
window.toggleMenuDropdown = toggleMenuDropdown;
window.executeEditorAction = executeEditorAction;
window.formatCode = formatCode;
window.saveAllFiles = saveAllFiles;
window.showAbout = showAbout;
window.showShortcuts = showShortcuts;

// 切换下拉菜单
function toggleMenuDropdown(menuId) {
  event.stopPropagation();
  
  // 关闭所有菜单
  document.querySelectorAll('.menu-dropdown').forEach(menu => {
    if (menu.id !== menuId) {
      menu.style.display = 'none';
    }
  });
  
  // 切换当前菜单
  const menu = document.getElementById(menuId);
  const isHidden = menu.style.display === 'none';
  
  // 定位菜单 - 相对于菜单项左侧
  const menuItem = event.target.closest('.menu-item');
  const rect = menuItem.getBoundingClientRect();
  menu.style.left = rect.left + 'px';
  menu.style.display = isHidden ? 'block' : 'none';
}

// 执行编辑器操作
function executeEditorAction(action) {
  if (!state.editor) return;
  
  const actions = {
    'undo': () => state.editor.trigger('undo'),
    'redo': () => state.editor.trigger('redo'),
    'copy': () => state.editor.trigger('copy'),
    'paste': () => state.editor.trigger('paste'),
    'find': () => state.editor.trigger('find'),
    'replace': () => state.editor.trigger('replace')
  };
  
  if (actions[action]) {
    actions[action]();
  }
  
  // 关闭所有菜单
  closeAllMenus();
}

// 格式化代码
function formatCode() {
  if (!state.editor) return;
  state.editor.getAction('editor.action.formatDocument').run();
  closeAllMenus();
}

// 保存所有文件
function saveAllFiles() {
  let saved = 0;
  state.openTabs.forEach(tab => {
    if (tab.modified) {
      tab.content = state.editor.getValue();
      saved++;
    }
  });
  
  if (saved > 0) {
    showToast(`✅ 已保存 ${saved} 个文件`, 'success');
  } else {
    showToast('ℹ️ 没有需要保存的文件', 'info');
  }
  
  closeAllMenus();
}

// 显示关于
function showAbout() {
  alert('Monaco Editor Web IDE\n\n一个基于 Monaco Editor 的在线代码编辑器\n\n功能：\n- 语法高亮（20+ 语言）\n- 智能补全\n- 文件管理\n- 全文搜索\n- 命令面板');
  closeAllMenus();
}

// 显示快捷键
function showShortcuts() {
  alert('常用快捷键：\n\nCtrl+S - 保存\nCtrl+F - 查找\nCtrl+H - 替换\nCtrl+Z - 撤销\nCtrl+Y - 重做\nCtrl+Shift+E - 资源管理器\nCtrl+Shift+F - 搜索\nCtrl+Shift+P - 命令面板');
  closeAllMenus();
}

// 关闭所有菜单
function closeAllMenus() {
  document.querySelectorAll('.menu-dropdown').forEach(menu => {
    menu.style.display = 'none';
  });
}

// 点击外部关闭菜单
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-item') && !e.target.closest('.menu-dropdown')) {
    closeAllMenus();
  }
});

// 阻止 Vimium 等浏览器扩展的键盘快捷键
document.addEventListener('keydown', (e) => {
  // 如果焦点在编辑器或输入框中，不拦截
  if (document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.isContentEditable) {
    return;
  }

  // 拦截 Vimium 常用快捷键
  const vimiumKeys = ['j', 'k', 'l', 'h', 'G', 'f', 'F', 'v', 'V', 'p', 'P', 'r', 'R', 'n', 'N', 'x', 'X', 'o', 'O', 'I', 'gi', 'g0', 'g$', 'gT', 'gt', 'gg', 'G', '/', '?', 'zz', 'zt', 'zb'];

  // 如果是单键且没有修饰键，可能是 Vimium 快捷键
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    // 在编辑器页面，拦截所有单键以防止 Vimium 干扰
    if (state.editor && document.getElementById('monaco-editor').contains(document.activeElement)) {
      e.stopPropagation();
    }
  }
}, true);

// 启动应用
loadMonacoAndInit();
