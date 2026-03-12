/**
 * 本地文件查看器 - 前端交互逻辑
 */

// 全局状态
const state = {
  currentPath: '',
  rootPath: '',
  history: [],
  theme: 'light',
  isSearching: false,
  searchResults: [],
  searchMode: 'filename', // 'filename' or 'code'
  codeSearchResults: [],
  // 文件管理相关状态
  contextMenuItem: null,
  confirmCallback: null,
  // 缓存相关
  fileCache: new Map(), // 文件列表缓存
  cacheMaxAge: 5 * 60 * 1000, // 缓存有效期 5 分钟
  // 键盘导航相关
  selectedIndex: -1, // 当前选中的文件索引
  currentItems: [], // 当前文件列表项
  // 筛选和排序相关
  filterType: 'all', // 筛选类型
  sortType: 'name', // 排序类型
  sortOrderAsc: true, // 升序/降序
  // 多选相关
  selectedFiles: [], // 已选择的文件列表
  lastClickedIndex: -1, // 上次点击的文件索引（用于 Shift 连选）
  // 复制/粘贴相关
  clipboardFiles: [], // 剪贴板中的文件
  clipboardAction: null // 复制操作类型：'copy' 或 'cut'
};

// DOM 元素
const elements = {
  fileList: document.getElementById('fileList'),
  breadcrumb: document.getElementById('breadcrumb'),
  currentPathText: document.getElementById('currentPathText'),
  backBtn: document.getElementById('backBtn'),
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  errorText: document.getElementById('errorText'),
  empty: document.getElementById('empty'),
  themeToggle: document.getElementById('themeToggle'),
  fileModal: document.getElementById('fileModal'),
  modalTitle: document.getElementById('modalTitle'),
  codeContent: document.getElementById('codeContent'),
  fileContent: document.getElementById('fileContent'),
  docxPreview: document.getElementById('docxPreview'),
  xlsxPreview: document.getElementById('xlsxPreview'),
  xlsxToolbar: document.getElementById('xlsxToolbar'),
  xlsxSheetTabs: document.getElementById('xlsxSheetTabs'),
  xlsxSheetContent: document.getElementById('xlsxSheetContent'),
  xlsxSheetSearch: document.getElementById('xlsxSheetSearch'),
  xlsxSheetSearchResults: document.getElementById('xlsxSheetSearchResults'),
  closeModal: document.getElementById('closeModal'),
  downloadBtn: document.getElementById('downloadBtn'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  fileSize: document.getElementById('fileSize'),
  fileModified: document.getElementById('fileModified'),
  // 搜索相关元素
  searchInput: document.getElementById('searchInput'),
  searchResults: document.getElementById('searchResults'),
  searchResultsList: document.getElementById('searchResultsList'),
  searchInfo: document.getElementById('searchInfo'),
  clearSearch: document.getElementById('clearSearch'),
  closeSearch: document.getElementById('closeSearch'),
  searchSubdir: document.getElementById('searchSubdir'),
  // 筛选和排序相关元素
  filterType: document.getElementById('filterType'),
  sortType: document.getElementById('sortType'),
  sortOrder: document.getElementById('sortOrder'),
  // 多选相关元素
  selectionToolbar: document.getElementById('selectionToolbar'),
  selectedCount: document.getElementById('selectedCount'),
  batchDownloadBtn: document.getElementById('batchDownloadBtn'),
  batchDeleteBtn: document.getElementById('batchDeleteBtn'),
  clearSelectionBtn: document.getElementById('clearSelectionBtn'),
  // 快速预览相关元素
  quickPreview: document.getElementById('quickPreview'),
  quickPreviewTitle: document.getElementById('quickPreviewTitle'),
  quickPreviewContent: document.getElementById('quickPreviewContent'),
  quickPreviewImage: document.getElementById('quickPreviewImage'),
  quickPreviewMessage: document.getElementById('quickPreviewMessage'),
  quickPreviewInfo: document.getElementById('quickPreviewInfo'),
  quickPreviewPrev: document.getElementById('quickPreviewPrev'),
  quickPreviewNext: document.getElementById('quickPreviewNext'),
  quickPreviewClose: document.getElementById('quickPreviewClose'),
  // 代码搜索相关元素
  searchModeToggle: document.getElementById('searchModeToggle'),
  searchModeText: document.getElementById('searchModeText'),
  codeSearchOptions: document.getElementById('codeSearchOptions'),
  codeSearchResults: document.getElementById('codeSearchResults'),
  codeSearchResultsList: document.getElementById('codeSearchResultsList'),
  codeSearchInfo: document.getElementById('codeSearchInfo'),
  switchSearchType: document.getElementById('switchSearchType'),
  switchToFileSearch: document.getElementById('switchToFileSearch'),
  closeCodeSearch: document.getElementById('closeCodeSearch'),
  searchCaseSensitive: document.getElementById('searchCaseSensitive'),
  searchWholeWord: document.getElementById('searchWholeWord'),
  searchUseRegex: document.getElementById('searchUseRegex'),
  // 媒体文件预览元素
  fileContent: document.getElementById('fileContent'),
  codeContent: document.getElementById('codeContent'),
  imagePreview: document.getElementById('imagePreview'),
  imageElement: document.getElementById('imageElement'),
  videoPreview: document.getElementById('videoPreview'),
  videoElement: document.getElementById('videoElement'),
  audioPreview: document.getElementById('audioPreview'),
  audioElement: document.getElementById('audioElement'),
  binaryInfo: document.getElementById('binaryInfo'),
  binaryDetails: document.getElementById('binaryDetails'),
  fileType: document.getElementById('fileType'),
  // 上传相关元素
  dropZone: document.getElementById('dropZone'),
  uploadBtn: document.getElementById('uploadBtn'),
  refreshListBtn: document.getElementById('refreshListBtn'),
  uploadProgress: document.getElementById('uploadProgress'),
  progressBar: document.getElementById('progressBar'),
  progressInfo: document.getElementById('progressInfo'),
  cancelUpload: document.getElementById('cancelUpload'),
  fileInput: document.getElementById('fileInput'),
  // PDF 预览元素
  pdfPreview: document.getElementById('pdfPreview'),
  pdfCanvas: document.getElementById('pdfCanvas'),
  pdfContainer: document.getElementById('pdfContainer'),
  pdfZoomOut: document.getElementById('pdfZoomOut'),
  pdfZoomIn: document.getElementById('pdfZoomIn'),
  pdfZoomLevel: document.getElementById('pdfZoomLevel'),
  pdfPrev: document.getElementById('pdfPrev'),
  pdfNext: document.getElementById('pdfNext'),
  pdfPageInfo: document.getElementById('pdfPageInfo'),
  pdfFit: document.getElementById('pdfFit'),
  pdfDownload: document.getElementById('pdfDownload'),
  // 文件管理相关元素
  contextMenu: document.getElementById('contextMenu'),
  confirmDialog: document.getElementById('confirmDialog'),
  confirmTitle: document.getElementById('confirmTitle'),
  confirmMessage: document.getElementById('confirmMessage'),
  confirmCancel: document.getElementById('confirmCancel'),
  confirmOk: document.getElementById('confirmOk'),
  inputDialog: document.getElementById('inputDialog'),
  inputTitle: document.getElementById('inputTitle'),
  inputField: document.getElementById('inputField'),
  inputCancel: document.getElementById('inputCancel'),
  inputOk: document.getElementById('inputOk')
};

// PDF 相关状态
let pdfDoc = null;
let pdfCurrentPage = 1;
let pdfScale = 1.5;
let pdfFitPage = false;

// XLSX 相关状态
let xlsxWorkbook = null;
let xlsxCurrentSheet = 0;

// 当前查看的文件信息
let currentFile = null;

/**
 * 初始化应用
 */
function init() {
  // 加载主题
  loadTheme();

  // 绑定事件
  elements.backBtn.addEventListener('click', goBack);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.closeModal.addEventListener('click', closeModal);
  elements.downloadBtn.addEventListener('click', downloadCurrentFile);
  elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
  elements.refreshBtn.addEventListener('click', refreshCurrentFile);
  elements.fileModal.querySelector('.modal-overlay').addEventListener('click', closeModal);

  // 搜索相关事件
  elements.searchInput.addEventListener('input', debounce(handleSearchInput, 300));
  elements.searchInput.addEventListener('keydown', handleSearchKeyDown);
  elements.clearSearch.addEventListener('click', clearSearch);
  elements.closeSearch.addEventListener('click', closeSearchResults);
  elements.closeCodeSearch.addEventListener('click', closeCodeSearchResults);
  elements.searchSubdir.addEventListener('change', () => {
    // 重新搜索
    const query = elements.searchInput.value.trim();
    if (query) {
      performSearch(query);
    }
  });

  // 搜索模式切换
  elements.searchModeToggle.addEventListener('click', toggleSearchMode);
  elements.switchSearchType.addEventListener('click', toggleSearchMode);
  elements.switchToFileSearch.addEventListener('click', toggleSearchMode);

  // 代码搜索选项变化
  [elements.searchCaseSensitive, elements.searchWholeWord, elements.searchUseRegex].forEach(el => {
    el.addEventListener('change', () => {
      const query = elements.searchInput.value.trim();
      if (query) {
        performCodeSearch(query);
      }
    });
  });

  // 上传相关事件
  initUploadHandlers();

  // 文件管理相关事件
  initFileManagement();

  // 监听键盘事件
  document.addEventListener('keydown', (e) => {
    // 如果模态框打开，不处理文件列表键盘事件
    const isModalOpen = !elements.fileModal.classList.contains('hidden');
    const isInputDialogOpen = !elements.inputDialog.classList.contains('hidden');
    const isConfirmDialogOpen = !elements.confirmDialog.classList.contains('hidden');
    
    if (e.key === 'Escape') {
      closeModal();
      if (state.isSearching) {
        closeSearchResults();
        closeCodeSearchResults();
      }
      hideDropZone();
      hideContextMenu();
      hideInputDialog();
    }
    // Ctrl/Cmd + F 聚焦搜索框（文件名搜索）
    if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) {
      e.preventDefault();
      setSearchMode('filename');
      elements.searchInput.focus();
    }
    // Ctrl/Cmd + Shift + F 聚焦搜索框（代码搜索）
    if ((e.ctrlKey || e.metaKey) && e.key === 'F') {
      e.preventDefault();
      setSearchMode('code');
      elements.searchInput.focus();
    }
    // Ctrl/Cmd + U 打开上传对话框
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      elements.fileInput.click();
    }
    // F 键切换全屏（在模态框打开时）
    if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !isModalOpen) {
      e.preventDefault();
      toggleFullscreen();
    }
    // F5 刷新文件（在模态框打开时）
    if (e.key === 'F5' && !isModalOpen) {
      e.preventDefault();
      refreshCurrentFile();
    }
    // Ctrl/Cmd + C 复制选中的文件
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isModalOpen && !isInputDialogOpen) {
      const selectedItem = state.currentItems[state.selectedIndex];
      if (selectedItem) {
        e.preventDefault();
        state.clipboardFiles = [selectedItem];
        state.clipboardAction = 'copy';
        showToast(`已复制：${selectedItem.name}`, 'info');
        updatePasteMenu();
      }
    }
    // Ctrl/Cmd + V 粘贴文件
    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !isModalOpen && !isInputDialogOpen) {
      if (state.clipboardFiles.length > 0 && state.clipboardAction) {
        e.preventDefault();
        const targetDir = state.currentItems[state.selectedIndex];
        if (targetDir && targetDir.type === 'directory') {
          pasteFiles(targetDir);
        } else {
          // 粘贴到当前目录
          const currentDir = { path: state.currentPath, type: 'directory' };
          pasteFiles(currentDir);
        }
      }
    }

    // 文件列表键盘导航（仅在搜索框未聚焦且模态框未打开时）
    if (document.activeElement !== elements.searchInput && !isModalOpen && !isInputDialogOpen && !isConfirmDialogOpen) {
      // 方向键上
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (state.selectedIndex > 0) {
          updateSelectedIndex(state.selectedIndex - 1);
        }
      }
      // 方向键下
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (state.selectedIndex < state.currentItems.length - 1) {
          updateSelectedIndex(state.selectedIndex + 1);
        }
      }
      // Enter 键 - 打开文件/进入目录
      if (e.key === 'Enter' && state.selectedIndex >= 0) {
        e.preventDefault();
        const selectedItem = state.currentItems[state.selectedIndex];
        if (selectedItem) {
          if (selectedItem.type === 'directory') {
            loadFiles(selectedItem.path);
          } else {
            viewFile(selectedItem);
          }
        }
      }
      // Backspace 键 - 返回上级
      if (e.key === 'Backspace' && !elements.backBtn.disabled) {
        e.preventDefault();
        goBack();
      }
      // Delete 键 - 删除文件
      if (e.key === 'Delete' && state.selectedIndex >= 0) {
        e.preventDefault();
        const selectedItem = state.currentItems[state.selectedIndex];
        if (selectedItem) {
          const isDir = selectedItem.type === 'directory';
          showConfirmDialog(
            '确认删除',
            `确定要删除${isDir ? '目录' : '文件'} "${selectedItem.name}" 吗？${isDir ? '\n\n注意：目录及其所有内容将被删除！' : ''}`,
            async () => {
              await deleteFile(selectedItem);
              state.selectedIndex = -1;
            }
          );
        }
      }
      // F2 键 - 重命名
      if (e.key === 'F2' && state.selectedIndex >= 0) {
        e.preventDefault();
        const selectedItem = state.currentItems[state.selectedIndex];
        if (selectedItem) {
          showInputDialog('重命名', '请输入新名称', selectedItem.name, async (newName) => {
            await renameFile(selectedItem, newName);
          });
        }
      }
    }
  });

  // 从 URL 获取初始路径
  const params = new URLSearchParams(window.location.search);
  const initialPath = params.get('path') || '';

  // 加载筛选和排序设置
  loadFilterSettings();

  // 绑定批量操作事件
  bindBatchOperations();

  // 绑定快速预览事件
  bindQuickPreview();

  // 加载文件列表
  loadFiles(initialPath);
}

/**
 * 绑定批量操作事件
 */
function bindBatchOperations() {
  // 批量下载
  elements.batchDownloadBtn.addEventListener('click', () => {
    if (state.selectedFiles.length === 0) return;
    
    // 逐个下载选中的文件
    state.selectedFiles.forEach(file => {
      const downloadUrl = `/api/file/download?path=${encodeURIComponent(file.path)}`;
      window.open(downloadUrl, '_blank');
    });
    
    showToast(`已开始下载 ${state.selectedFiles.length} 个文件`, 'success');
    clearFileSelection();
  });
  
  // 批量删除
  elements.batchDeleteBtn.addEventListener('click', () => {
    if (state.selectedFiles.length === 0) return;
    
    const count = state.selectedFiles.length;
    const hasDir = state.selectedFiles.some(f => f.type === 'directory');
    
    showConfirmDialog(
      '确认批量删除',
      `确定要删除选中的 ${count} 个文件${hasDir ? '（包含目录）' : ''} 吗？\n\n注意：此操作不可恢复！`,
      async () => {
        let successCount = 0;
        let failCount = 0;
        
        for (const file of state.selectedFiles) {
          try {
            const url = `/api/file?path=${encodeURIComponent(file.path)}`;
            const response = await fetch(url, { method: 'DELETE' });
            const result = await response.json();
            
            if (result.success) {
              successCount++;
            } else {
              failCount++;
              console.error('删除失败:', file.name, result.error);
            }
          } catch (err) {
            failCount++;
            console.error('删除失败:', file.name, err);
          }
        }
        
        clearFileCache();
        showToast(`删除完成：成功 ${successCount} 个，失败 ${failCount} 个`, failCount > 0 ? 'warning' : 'success');
        clearFileSelection();
        loadFiles(state.currentPath);
      }
    );
  });
  
  // 清除选择
  elements.clearSelectionBtn.addEventListener('click', () => {
    clearFileSelection();
  });
  
  // Esc 键清除选择
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.selectedFiles.length > 0) {
      clearFileSelection();
    }
  });
}

/**
 * 绑定快速预览事件
 */
function bindQuickPreview() {
  // 空格键打开快速预览
  document.addEventListener('keydown', (e) => {
    const isModalOpen = !elements.fileModal.classList.contains('hidden');
    const isInputDialogOpen = !elements.inputDialog.classList.contains('hidden');
    const isConfirmDialogOpen = !elements.confirmDialog.classList.contains('hidden');
    const isQuickPreviewOpen = !elements.quickPreview.classList.contains('hidden');
    
    if (e.key === ' ' && !isModalOpen && !isInputDialogOpen && !isConfirmDialogOpen && !isQuickPreviewOpen) {
      e.preventDefault();
      if (state.selectedIndex >= 0 && state.currentItems[state.selectedIndex]) {
        openQuickPreview(state.currentItems[state.selectedIndex]);
      }
    }
    
    // 快速预览中切换文件
    if (isQuickPreviewOpen) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        quickPreviewPrev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        quickPreviewNext();
      }
    }
  });
  
  // 关闭按钮
  elements.quickPreviewClose.addEventListener('click', closeQuickPreview);
  
  // 点击遮罩关闭
  elements.quickPreview.querySelector('.quick-preview-overlay').addEventListener('click', closeQuickPreview);
  
  // 上一个/下一个
  elements.quickPreviewPrev.addEventListener('click', quickPreviewPrev);
  elements.quickPreviewNext.addEventListener('click', quickPreviewNext);
}

/**
 * 打开快速预览
 */
async function openQuickPreview(item) {
  elements.quickPreview.classList.remove('hidden');
  elements.quickPreviewTitle.textContent = item.name;
  
  // 重置内容
  elements.quickPreviewContent.classList.add('hidden');
  elements.quickPreviewImage.classList.add('hidden');
  elements.quickPreviewMessage.textContent = '';
  
  try {
    if (item.type === 'directory') {
      elements.quickPreviewMessage.textContent = '目录无法预览';
      elements.quickPreviewInfo.textContent = '';
      return;
    }
    
    // 获取文件元数据
    const metaResponse = await fetch(`/api/file/meta?path=${encodeURIComponent(item.path)}`);
    const metaResult = await metaResponse.json();
    
    if (!metaResult.success) {
      elements.quickPreviewMessage.textContent = '无法获取文件信息';
      return;
    }
    
    const meta = metaResult.data;
    elements.quickPreviewInfo.textContent = `${meta.size?.formatted || '未知'} | ${formatDate(meta.modified)}`;
    
    // 根据文件类型显示内容
    if (meta.fileType === 'image' && !meta.isBinary) {
      elements.quickPreviewImage.classList.remove('hidden');
      elements.quickPreviewImage.querySelector('img').src = meta.previewUrl + '&t=' + Date.now();
    } else if (meta.fileType === 'text' || !meta.isBinary) {
      // 文本文件
      const contentResponse = await fetch(`/api/file/content?path=${encodeURIComponent(item.path)}`);
      const contentResult = await contentResponse.json();
      
      if (contentResult.success) {
        elements.quickPreviewContent.classList.remove('hidden');
        elements.quickPreviewContent.querySelector('code').textContent = contentResult.data.content;
      } else {
        elements.quickPreviewMessage.textContent = '无法读取文件内容';
      }
    } else {
      elements.quickPreviewMessage.textContent = '二进制文件无法预览';
    }
  } catch (err) {
    console.error('快速预览失败:', err);
    elements.quickPreviewMessage.textContent = '预览失败';
  }
}

/**
 * 关闭快速预览
 */
function closeQuickPreview() {
  elements.quickPreview.classList.add('hidden');
}

/**
 * 上一个文件
 */
function quickPreviewPrev() {
  if (state.selectedIndex > 0) {
    state.selectedIndex--;
    openQuickPreview(state.currentItems[state.selectedIndex]);
  }
}

/**
 * 下一个文件
 */
function quickPreviewNext() {
  if (state.selectedIndex < state.currentItems.length - 1) {
    state.selectedIndex++;
    openQuickPreview(state.currentItems[state.selectedIndex]);
  }
}

/**
 * 加载筛选和排序设置
 */
function loadFilterSettings() {
  // 从 localStorage 加载设置
  const savedFilter = localStorage.getItem('fileViewerFilterType');
  const savedSort = localStorage.getItem('fileViewerSortType');
  const savedOrder = localStorage.getItem('fileViewerSortOrder');

  if (savedFilter) {
    state.filterType = savedFilter;
    elements.filterType.value = savedFilter;
  }

  if (savedSort) {
    state.sortType = savedSort;
    elements.sortType.value = savedSort;
  }

  if (savedOrder) {
    state.sortOrderAsc = savedOrder === 'asc';
    elements.sortOrder.querySelector('.icon').textContent = state.sortOrderAsc ? '↑' : '↓';
    elements.sortOrder.title = state.sortOrderAsc ? '升序' : '降序';
  }

  // 绑定事件
  elements.filterType.addEventListener('change', (e) => {
    state.filterType = e.target.value;
    localStorage.setItem('fileViewerFilterType', e.target.value);
    // 重新渲染文件列表
    const currentPath = state.currentPath;
    if (currentPath) {
      // 从缓存或 API 获取数据后重新渲染
      const cachedData = state.fileCache.get(currentPath || 'root');
      if (cachedData) {
        renderFileList(cachedData.data.items);
      }
    }
  });

  elements.sortType.addEventListener('change', (e) => {
    state.sortType = e.target.value;
    localStorage.setItem('fileViewerSortType', e.target.value);
    // 重新渲染文件列表
    const currentPath = state.currentPath;
    if (currentPath) {
      const cachedData = state.fileCache.get(currentPath || 'root');
      if (cachedData) {
        renderFileList(cachedData.data.items);
      }
    }
  });

  elements.sortOrder.addEventListener('click', () => {
    state.sortOrderAsc = !state.sortOrderAsc;
    localStorage.setItem('fileViewerSortOrder', state.sortOrderAsc ? 'asc' : 'desc');
    elements.sortOrder.querySelector('.icon').textContent = state.sortOrderAsc ? '↑' : '↓';
    elements.sortOrder.title = state.sortOrderAsc ? '升序' : '降序';
    // 重新渲染文件列表
    const currentPath = state.currentPath;
    if (currentPath) {
      const cachedData = state.fileCache.get(currentPath || 'root');
      if (cachedData) {
        renderFileList(cachedData.data.items);
      }
    }
  });
}

/**
 * 初始化上传处理器
 */
function initUploadHandlers() {
  // 点击上传按钮
  elements.uploadBtn.addEventListener('click', () => {
    elements.fileInput.click();
  });

  // 点击刷新列表按钮
  elements.refreshListBtn.addEventListener('click', () => {
    refreshFileList();
  });

  // 文件选择变化
  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
    // 重置 input 以允许重复选择同一文件
    elements.fileInput.value = '';
  });

  // 拖拽事件
  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    showDropZone();
  });

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.addEventListener('dragleave', (e) => {
    // 只有当拖拽离开整个文档时才隐藏
    if (e.relatedTarget === null) {
      hideDropZone();
    }
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    hideDropZone();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFiles(files);
    }
  });

  // 取消上传
  elements.cancelUpload.addEventListener('click', () => {
    cancelUpload();
  });

  // PDF 工具栏事件
  initPDFHandlers();
}

/**
 * 初始化 PDF 处理器
 */
function initPDFHandlers() {
  elements.pdfZoomOut.addEventListener('click', () => {
    if (pdfScale > 0.5) {
      pdfScale -= 0.25;
      pdfFitPage = false;
      renderPDFPage();
    }
  });

  elements.pdfZoomIn.addEventListener('click', () => {
    pdfScale += 0.25;
    pdfFitPage = false;
    renderPDFPage();
  });

  elements.pdfPrev.addEventListener('click', () => {
    if (pdfCurrentPage > 1) {
      pdfCurrentPage--;
      renderPDFPage();
    }
  });

  elements.pdfNext.addEventListener('click', () => {
    if (pdfDoc && pdfCurrentPage < pdfDoc.numPages) {
      pdfCurrentPage++;
      renderPDFPage();
    }
  });

  elements.pdfFit.addEventListener('click', () => {
    pdfFitPage = !pdfFitPage;
    renderPDFPage();
  });

  elements.pdfDownload.addEventListener('click', () => {
    if (currentFile) {
      downloadCurrentFile();
    }
  });

  // 键盘事件
  document.addEventListener('keydown', (e) => {
    if (elements.pdfPreview && !elements.pdfPreview.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') {
        elements.pdfPrev.click();
      } else if (e.key === 'ArrowRight') {
        elements.pdfNext.click();
      } else if (e.key === '+' || e.key === '=') {
        elements.pdfZoomIn.click();
      } else if (e.key === '-') {
        elements.pdfZoomOut.click();
      }
    }
  });
}

/**
 * 显示拖拽区域
 */
function showDropZone() {
  elements.dropZone.classList.remove('hidden');
}

/**
 * 隐藏拖拽区域
 */
function hideDropZone() {
  elements.dropZone.classList.add('hidden');
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 加载文件列表
 */
async function loadFiles(path = '') {
  showLoading();

  try {
    const cacheKey = path || 'root';
    const cachedData = state.fileCache.get(cacheKey);
    const now = Date.now();

    // 检查缓存是否有效
    if (cachedData && (now - cachedData.timestamp) < state.cacheMaxAge) {
      console.log('使用缓存数据:', cacheKey);
      
      const { currentPath, parentPath, rootPath, items } = cachedData.data;

      // 更新状态
      state.currentPath = currentPath;
      state.rootPath = rootPath;

      // 更新 UI
      renderBreadcrumb(currentPath, parentPath, rootPath);
      renderFileList(items);
      updateCurrentPath(currentPath);
      updateBackButton(parentPath !== null);

      // 添加到历史记录
      if (state.history[state.history.length - 1] !== currentPath) {
        state.history.push(currentPath);
      }

      hideLoading();
      return;
    }

    // 从 API 加载
    const url = path
      ? `/api/files?path=${encodeURIComponent(path)}`
      : '/api/files';

    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      showError(result.error || '加载失败');
      return;
    }

    const { currentPath, parentPath, rootPath, items } = result.data;

    // 更新缓存
    state.fileCache.set(cacheKey, {
      data: result.data,
      timestamp: now
    });

    // 清理过期缓存（保留最近 10 个）
    if (state.fileCache.size > 10) {
      const entries = Array.from(state.fileCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      for (let i = 10; i < entries.length; i++) {
        state.fileCache.delete(entries[i][0]);
      }
    }

    // 更新状态
    state.currentPath = currentPath;
    state.rootPath = rootPath;

    // 更新 UI
    renderBreadcrumb(currentPath, parentPath, rootPath);
    renderFileList(items);
    updateCurrentPath(currentPath);
    updateBackButton(parentPath !== null);

    // 添加到历史记录
    if (state.history[state.history.length - 1] !== currentPath) {
      state.history.push(currentPath);
    }

    // 隐藏加载状态
    hideLoading();

  } catch (err) {
    console.error('加载文件列表失败:', err);
    showError('网络错误，请稍后重试');
  }
}

/**
 * 渲染文件列表
 */
function renderFileList(items) {
  elements.fileList.innerHTML = '';

  // 筛选和排序
  let filteredItems = filterFiles(items);
  filteredItems = sortFiles(filteredItems);

  // 保存当前文件列表项
  state.currentItems = filteredItems;
  state.selectedIndex = -1; // 重置选中索引

  if (filteredItems.length === 0) {
    elements.empty.classList.remove('hidden');
    elements.fileList.classList.add('hidden');
    return;
  }

  elements.empty.classList.add('hidden');
  elements.fileList.classList.remove('hidden');

  for (let i = 0; i < filteredItems.length; i++) {
    const item = filteredItems[i];
    const fileItem = createFileItem(item, i);
    elements.fileList.appendChild(fileItem);
  }
}

/**
 * 筛选文件
 */
function filterFiles(items) {
  const filterType = state.filterType;
  
  if (filterType === 'all') {
    return items;
  }
  
  // 定义类型映射
  const typeMap = {
    'directory': ['directory'],
    'image': ['image'],
    'text': ['text', 'document'],
    'code': ['text'], // 代码文件也是文本类型，需要额外判断
    'media': ['video', 'audio'],
    'archive': ['archive']
  };
  
  const allowedTypes = typeMap[filterType] || [];
  
  return items.filter(item => {
    if (allowedTypes.includes(item.type)) {
      // 对于 code 类型，需要额外判断扩展名
      if (filterType === 'code') {
        const codeExts = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.html', '.css', '.scss', '.less', '.py', '.java', '.c', '.cpp', '.go', '.rs', '.php', '.rb', '.sh', '.sql'];
        const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
        return codeExts.includes(ext);
      }
      return true;
    }
    return false;
  });
}

/**
 * 排序文件
 */
function sortFiles(items) {
  const sortType = state.sortType;
  const asc = state.sortOrderAsc;
  const direction = asc ? 1 : -1;

  return [...items].sort((a, b) => {
    // 文件夹始终在前
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;

    // 同类型文件按指定方式排序
    let comparison = 0;

    switch (sortType) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'zh');
        break;
      case 'size':
        const aSize = a.size?.bytes || 0;
        const bSize = b.size?.bytes || 0;
        comparison = aSize - bSize;
        break;
      case 'date':
        comparison = new Date(a.modified) - new Date(b.modified);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }

    return comparison * direction;
  });
}

/**
 * 创建文件项元素
 */
function createFileItem(item, index) {
  const div = document.createElement('div');
  div.className = 'file-item';
  div.dataset.path = item.path;
  div.dataset.name = item.name;
  div.dataset.type = item.type;
  div.dataset.index = index;
  div.innerHTML = `
    <span class="file-icon">${item.icon}</span>
    <span class="file-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
    <div class="file-meta">
      ${item.size ? `<span class="file-size">${item.size.formatted}</span>` : ''}
      <span class="file-date">${formatDate(item.modified)}</span>
    </div>
    <div class="file-actions">
      <button class="file-action-btn" title="下载" data-action="download">
        <span>⬇️</span>
      </button>
      <button class="file-action-btn" title="重命名" data-action="rename">
        <span>✏️</span>
      </button>
      <button class="file-action-btn" title="删除" data-action="delete">
        <span>🗑️</span>
      </button>
    </div>
  `;

  // 绑定点击事件（排除操作按钮区域）
  div.addEventListener('click', (e) => {
    if (e.target.closest('.file-actions')) {
      return;
    }
    handleFileClickWithSelect(item, index, e);
  });

  // 绑定操作按钮事件
  const actionBtns = div.querySelectorAll('.file-action-btn');
  actionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      handleFileAction(action, item);
    });
  });

  // 绑定双击事件（打开文件）
  div.addEventListener('dblclick', () => {
    if (item.type === 'directory') {
      loadFiles(item.path);
    } else {
      viewFile(item);
    }
  });

  return div;
}

/**
 * 处理文件点击（支持多选）
 */
function handleFileClickWithSelect(item, index, event) {
  const isCtrlClick = event.ctrlKey || event.metaKey;
  const isShiftClick = event.shiftKey;
  
  if (isCtrlClick) {
    // Ctrl + 点击：切换选择状态
    toggleFileSelection(item, index);
  } else if (isShiftClick && state.lastClickedIndex >= 0) {
    // Shift + 点击：连选范围
    selectRange(item, index);
  } else {
    // 普通点击：取消其他选择，只选当前
    if (state.selectedFiles.length > 0) {
      clearFileSelection();
    }
    state.lastClickedIndex = index;
  }
  
  updateSelectionUI();
}

/**
 * 切换文件选择状态
 */
function toggleFileSelection(item, index) {
  const selectedIndex = state.selectedFiles.findIndex(f => f.path === item.path);
  
  if (selectedIndex >= 0) {
    // 已选择，取消选择
    state.selectedFiles.splice(selectedIndex, 1);
  } else {
    // 未选择，添加
    state.selectedFiles.push(item);
  }
  
  updateFileItemSelectionStyle(index);
}

/**
 * 选择范围（Shift + 点击）
 */
function selectRange(item, endIndex) {
  const startIndex = state.lastClickedIndex;
  const items = state.currentItems;
  
  if (startIndex < 0 || endIndex < 0) return;
  
  const min = Math.min(startIndex, endIndex);
  const max = Math.max(startIndex, endIndex);
  
  // 清除当前选择
  state.selectedFiles = [];
  
  // 添加范围内的所有文件
  for (let i = min; i <= max; i++) {
    state.selectedFiles.push(items[i]);
    updateFileItemSelectionStyle(i);
  }
  
  state.lastClickedIndex = endIndex;
}

/**
 * 更新文件项选择样式
 */
function updateFileItemSelectionStyle(index) {
  const items = elements.fileList.querySelectorAll('.file-item');
  if (items[index]) {
    const isSelected = state.selectedFiles.some(f => f.path === state.currentItems[index].path);
    if (isSelected) {
      items[index].classList.add('file-item-selected');
    } else {
      items[index].classList.remove('file-item-selected');
    }
  }
}

/**
 * 清除文件选择
 */
function clearFileSelection() {
  state.selectedFiles = [];
  state.lastClickedIndex = -1;
  
  const items = elements.fileList.querySelectorAll('.file-item');
  items.forEach(item => {
    item.classList.remove('file-item-selected');
  });
  
  updateSelectionUI();
}

/**
 * 更新选择 UI
 */
function updateSelectionUI() {
  const count = state.selectedFiles.length;
  
  if (count > 0) {
    elements.selectionToolbar.classList.remove('hidden');
    elements.selectedCount.textContent = count;
  } else {
    elements.selectionToolbar.classList.add('hidden');
  }
}

/**
 * 更新选中状态
 */
function updateSelectedIndex(index) {
  // 清除之前的选中状态
  const previousSelected = elements.fileList.querySelector('.file-item-selected');
  if (previousSelected) {
    previousSelected.classList.remove('file-item-selected');
  }
  
  // 设置新的选中状态
  if (index >= 0 && index < state.currentItems.length) {
    state.selectedIndex = index;
    const items = elements.fileList.querySelectorAll('.file-item');
    if (items[index]) {
      items[index].classList.add('file-item-selected');
      items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  } else {
    state.selectedIndex = -1;
  }
}

/**
 * 处理文件点击
 */
function handleFileClick(item) {
  if (item.type === 'directory') {
    // 进入目录
    loadFiles(item.path);
  } else {
    // 查看文件内容
    viewFile(item);
  }
}

/**
 * 查看文件内容
 */
async function viewFile(item) {
  currentFile = item;

  // 显示加载状态
  elements.fileModal.classList.remove('hidden');
  elements.modalTitle.textContent = item.name;
  
  // 重置所有预览区域
  resetModalContent();

  try {
    // 首先获取文件元数据
    const metaResponse = await fetch(`/api/file/meta?path=${encodeURIComponent(item.path)}`);
    const metaResult = await metaResponse.json();

    if (!metaResult.success) {
      // 如果获取元数据失败，尝试直接获取内容
      await viewFileContent(item);
      return;
    }

    const meta = metaResult.data;
    
    // 更新文件信息
    elements.fileSize.textContent = `大小：${meta.size?.formatted || '未知'}`;
    elements.fileModified.textContent = `修改时间：${formatDate(meta.modified)}`;
    elements.fileType.textContent = `类型：${meta.fileType || '未知'}`;
    elements.downloadBtn.disabled = false;

    // 根据文件类型显示不同内容
    if (meta.extension === '.pdf') {
      showPDFPreview(meta);
    } else if (meta.extension === '.docx') {
      await showDocxPreview(meta);
    } else if (meta.extension === '.xlsx' || meta.extension === '.xls') {
      await showXlsxPreview(meta);
    } else if (meta.mediaType === 'image') {
      showImagePreview(meta);
    } else if (meta.mediaType === 'video') {
      showVideoPreview(meta);
    } else if (meta.mediaType === 'audio') {
      showAudioPreview(meta);
    } else if (meta.isBinary || (meta.fileType !== 'text' && meta.fileType !== 'directory')) {
      showBinaryInfo(meta);
    } else {
      // 文本文件
      await viewFileContent(item);
    }

  } catch (err) {
    console.error('加载文件内容失败:', err);
    showBinaryInfo({ name: item.name, error: '无法识别文件类型' });
    elements.downloadBtn.disabled = true;
  }
}

/**
 * 重置模态框内容
 */
function resetModalContent() {
  elements.fileContent.classList.add('hidden');
  elements.docxPreview.classList.add('hidden');
  elements.xlsxPreview.classList.add('hidden');
  elements.xlsxToolbar.classList.add('hidden');
  elements.imagePreview.classList.add('hidden');
  elements.videoPreview.classList.add('hidden');
  elements.audioPreview.classList.add('hidden');
  elements.pdfPreview.classList.add('hidden');
  elements.binaryInfo.classList.add('hidden');
  elements.codeContent.textContent = '';
  elements.docxPreview.innerHTML = '';
  // 不要清空 xlsxPreview.innerHTML，因为它包含结构
  elements.xlsxSheetContent.innerHTML = '';
  elements.xlsxSheetSearchResults.innerHTML = '';
  elements.xlsxSheetSearchResults.classList.add('hidden');
  elements.imageElement.src = '';
  elements.videoElement.src = '';
  elements.audioElement.src = '';

  // 重置 PDF 状态
  pdfDoc = null;
  pdfCurrentPage = 1;
  pdfScale = 1.5;
  pdfFitPage = false;
  const ctx = elements.pdfCanvas.getContext('2d');
  ctx.clearRect(0, 0, elements.pdfCanvas.width, elements.pdfCanvas.height);
  
  // 重置 XLSX 状态
  xlsxWorkbook = null;
  xlsxCurrentSheet = 0;
  
  console.log('🔄 模态框内容已重置');
}

/**
 * 显示图片预览
 */
function showImagePreview(meta) {
  elements.imagePreview.classList.remove('hidden');
  elements.imageElement.src = meta.previewUrl + '&t=' + Date.now();
  elements.imageElement.alt = meta.name;
}

/**
 * 显示视频预览
 */
function showVideoPreview(meta) {
  elements.videoPreview.classList.remove('hidden');
  elements.videoElement.src = meta.previewUrl + '&t=' + Date.now();
  elements.videoElement.querySelector('source').type = meta.mimeType || 'video/mp4';
}

/**
 * 显示音频预览
 */
function showAudioPreview(meta) {
  elements.audioPreview.classList.remove('hidden');
  elements.audioElement.src = meta.previewUrl + '&t=' + Date.now();
  elements.audioElement.querySelector('source').type = meta.mimeType || 'audio/mpeg';
}

/**
 * 显示二进制文件信息
 */
function showBinaryInfo(meta) {
  elements.binaryInfo.classList.remove('hidden');
  
  let detailsHtml = `
    <div class="binary-detail-item binary-header-detail">
      <span class="binary-detail-label">文件名称</span>
      <span class="binary-detail-value">${escapeHtml(meta.name)}</span>
    </div>
    <div class="binary-detail-item">
      <span class="binary-detail-label">文件大小</span>
      <span class="binary-detail-value">${meta.size?.formatted || '未知'}</span>
    </div>
    <div class="binary-detail-item">
      <span class="binary-detail-label">文件扩展名</span>
      <span class="binary-detail-value">${escapeHtml(meta.extension || '未知')}</span>
    </div>
    <div class="binary-detail-item">
      <span class="binary-detail-label">文件类型</span>
      <span class="binary-detail-value">${escapeHtml(meta.detectedType || meta.fileType || '未知')}</span>
    </div>
    <div class="binary-detail-item">
      <span class="binary-detail-label">MIME 类型</span>
      <span class="binary-detail-value">${escapeHtml(meta.mimeType || 'application/octet-stream')}</span>
    </div>
    <div class="binary-detail-item">
      <span class="binary-detail-label">修改时间</span>
      <span class="binary-detail-value">${formatDate(meta.modified)}</span>
    </div>
    <div class="binary-detail-item">
      <span class="binary-detail-label">创建时间</span>
      <span class="binary-detail-value">${formatDate(meta.created)}</span>
    </div>
    <div class="binary-detail-item">
      <span class="binary-detail-label">访问时间</span>
      <span class="binary-detail-value">${formatDate(meta.accessed)}</span>
    </div>
  `;
  
  if (meta.header) {
    detailsHtml += `
      <div class="binary-detail-item">
        <span class="binary-detail-label">文件头 (Hex)</span>
        <span class="binary-detail-value">${meta.header}</span>
      </div>
    `;
  }
  
  if (meta.isBinary !== undefined) {
    detailsHtml += `
      <div class="binary-detail-item">
        <span class="binary-detail-label">二进制文件</span>
        <span class="binary-detail-value">${meta.isBinary ? '是' : '否'}</span>
      </div>
    `;
  }
  
  elements.binaryDetails.innerHTML = detailsHtml;
}

/**
 * 查看文件内容（文本）
 */
async function viewFileContent(item) {
  elements.fileContent.classList.remove('hidden');
  elements.codeContent.textContent = '加载中...';

  try {
    const response = await fetch(`/api/file/content?path=${encodeURIComponent(item.path)}`);
    const result = await response.json();

    if (!result.success) {
      elements.codeContent.textContent = `错误：${result.error}`;
      return;
    }

    const { content, language, size, modified } = result.data;
    
    // 设置代码语言和类名
    const codeElement = elements.codeContent;
    codeElement.className = `language-${language || 'plaintext'}`;
    codeElement.textContent = content;
    
    // 使用 Prism 高亮
    if (typeof Prism !== 'undefined') {
      Prism.highlightElement(codeElement);
    }
    
    elements.fileSize.textContent = `大小：${size.formatted}`;
    elements.fileModified.textContent = `修改时间：${formatDate(modified)}`;
    elements.fileType.textContent = `类型：文本文件 (${language || 'plaintext'})`;

  } catch (err) {
    console.error('加载文件内容失败:', err);
    elements.codeContent.textContent = '加载失败，请稍后重试';
  }
}

/**
 * 下载当前文件
 */
function downloadCurrentFile() {
  if (!currentFile) return;
  
  const downloadUrl = `/api/file/download?path=${encodeURIComponent(currentFile.path)}`;
  window.open(downloadUrl, '_blank');
}

/**
 * 关闭模态框
 */
function closeModal() {
  // 如果是全屏模式，先退出全屏
  const modalContent = elements.fileModal.querySelector('.modal-content');
  if (modalContent.classList.contains('modal-fullscreen')) {
    modalContent.classList.remove('modal-fullscreen');
    document.body.style.overflow = '';
  }

  elements.fileModal.classList.add('hidden');
  currentFile = null;
}

/**
 * 刷新当前文件
 */
async function refreshCurrentFile() {
  if (!currentFile) return;
  
  // 显示加载状态
  const codeElement = elements.codeContent;
  const originalText = codeElement.textContent;
  codeElement.textContent = '刷新中...';
  
  try {
    // 重新获取文件内容
    const response = await fetch(`/api/file/content?path=${encodeURIComponent(currentFile.path)}&t=${Date.now()}`);
    const result = await response.json();
    
    if (!result.success) {
      codeElement.textContent = `错误：${result.error}`;
      return;
    }
    
    const { content, language, size, modified } = result.data;
    
    // 更新代码内容
    codeElement.className = `language-${language || 'plaintext'}`;
    codeElement.textContent = content;
    
    // 使用 Prism 高亮
    if (typeof Prism !== 'undefined') {
      Prism.highlightElement(codeElement);
    }
    
    // 更新文件信息
    elements.fileSize.textContent = `大小：${size.formatted}`;
    elements.fileModified.textContent = `修改时间：${formatDate(modified)}`;
    
    showToast('文件已刷新', 'success');
  } catch (err) {
    console.error('刷新文件失败:', err);
    codeElement.textContent = originalText;
    showToast('刷新失败，请稍后重试', 'error');
  }
}

/**
 * 切换全屏模式
 */
function toggleFullscreen() {
  const modal = elements.fileModal;
  const modalContent = modal.querySelector('.modal-content');
  
  if (modal.classList.contains('hidden')) {
    return;
  }
  
  // 检查是否已经是全屏
  const isFullscreen = modalContent.classList.contains('modal-fullscreen');
  
  if (isFullscreen) {
    // 退出全屏
    modalContent.classList.remove('modal-fullscreen');
    document.body.style.overflow = '';
  } else {
    // 进入全屏
    modalContent.classList.add('modal-fullscreen');
    document.body.style.overflow = 'hidden';
  }
  
  // 更新按钮图标和提示
  const btn = elements.fullscreenBtn;
  const icon = btn.querySelector('.icon');
  icon.textContent = isFullscreen ? '⛶' : '❐';
  btn.dataset.fullscreen = isFullscreen ? 'false' : 'true';
  btn.title = isFullscreen ? '全屏 (F)' : '退出全屏 (F)';
}

/**
 * 渲染面包屑导航
 */
function renderBreadcrumb(currentPath, parentPath, rootPath) {
  elements.breadcrumb.innerHTML = '';
  
  // 根目录
  const rootItem = createBreadcrumbItem('🏠 根目录', rootPath);
  elements.breadcrumb.appendChild(rootItem);
  
  // 计算相对路径
  const relativePath = currentPath.replace(rootPath, '').replace(/^\/+/, '');
  
  if (relativePath) {
    const segments = relativePath.split('/');
    let accumulatedPath = rootPath;
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      accumulatedPath = i === 0 
        ? pathJoin(rootPath, segment)
        : pathJoin(accumulatedPath, segment);
      
      const isLast = i === segments.length - 1;
      
      if (!isLast) {
        const item = createBreadcrumbItem(segment, accumulatedPath);
        elements.breadcrumb.appendChild(createSeparator());
        elements.breadcrumb.appendChild(item);
      } else {
        // 当前目录，不可点击
        const span = document.createElement('span');
        span.className = 'breadcrumb-item';
        span.textContent = segment;
        elements.breadcrumb.appendChild(createSeparator());
        elements.breadcrumb.appendChild(span);
      }
    }
  }
}

/**
 * 创建面包屑项
 */
function createBreadcrumbItem(text, path) {
  const span = document.createElement('span');
  span.className = 'breadcrumb-item clickable';
  span.textContent = text;
  span.addEventListener('click', () => {
    loadFiles(path);
  });
  return span;
}

/**
 * 创建分隔符
 */
function createSeparator() {
  const span = document.createElement('span');
  span.className = 'breadcrumb-separator';
  span.textContent = '/';
  return span;
}

/**
 * 更新当前路径显示
 */
function updateCurrentPath(path) {
  elements.currentPathText.textContent = path;
}

/**
 * 更新返回按钮状态
 */
function updateBackButton(enabled) {
  elements.backBtn.disabled = !enabled;
}

/**
 * 返回上级目录
 */
function goBack() {
  if (elements.backBtn.disabled) return;
  
  // 从历史记录中获取上一个路径
  if (state.history.length > 1) {
    state.history.pop(); // 移除当前
    const previousPath = state.history[state.history.length - 1];
    loadFiles(previousPath);
  }
}

/**
 * 显示加载状态
 */
function showLoading() {
  elements.loading.classList.remove('hidden');
  elements.error.classList.add('hidden');
  elements.fileList.classList.add('hidden');
  elements.empty.classList.add('hidden');
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
  elements.loading.classList.add('hidden');
}

/**
 * 显示错误信息
 */
function showError(message) {
  elements.loading.classList.add('hidden');
  elements.error.classList.remove('hidden');
  elements.errorText.textContent = message;
  elements.fileList.classList.add('hidden');
  elements.empty.classList.add('hidden');
}

/**
 * 切换主题
 */
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);

  // 更新图标
  const icon = elements.themeToggle.querySelector('.icon');
  icon.textContent = state.theme === 'light' ? '🌙' : '☀️';

  // 同步切换 Prism 代码高亮主题
  const lightTheme = document.getElementById('prism-light-theme');
  const darkTheme = document.getElementById('prism-dark-theme');
  if (lightTheme && darkTheme) {
    if (state.theme === 'light') {
      lightTheme.disabled = false;
      darkTheme.disabled = true;
    } else {
      lightTheme.disabled = true;
      darkTheme.disabled = false;
    }
  }

  // 保存主题设置
  localStorage.setItem('fileViewerTheme', state.theme);
}

/**
 * 加载主题
 */
function loadTheme() {
  const savedTheme = localStorage.getItem('fileViewerTheme');
  if (savedTheme) {
    state.theme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);

    const icon = elements.themeToggle.querySelector('.icon');
    icon.textContent = savedTheme === 'light' ? '🌙' : '☀️';

    // 同步加载 Prism 代码高亮主题
    const lightTheme = document.getElementById('prism-light-theme');
    const darkTheme = document.getElementById('prism-dark-theme');
    if (lightTheme && darkTheme) {
      if (savedTheme === 'light') {
        lightTheme.disabled = false;
        darkTheme.disabled = true;
      } else {
        lightTheme.disabled = true;
        darkTheme.disabled = false;
      }
    }
  }
}

/**
 * 格式化日期
 */
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  
  // 今天
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 7 天内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  }
  
  // 默认格式
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 路径拼接
 */
function pathJoin(...parts) {
  return parts.filter(p => p).join('/').replace(/\/+/g, '/');
}

/**
 * 处理搜索输入
 */
function handleSearchInput(e) {
  const query = e.target.value.trim();
  
  if (query.length === 0) {
    clearSearch();
    return;
  }
  
  performSearch(query);
}

/**
 * 执行搜索
 */
async function performSearch(query) {
  if (!query) return;

  showSearchLoading();

  try {
    const searchPath = state.currentPath || state.rootPath;
    const searchSubdir = elements.searchSubdir?.checked || true;
    const url = `/api/files/search?q=${encodeURIComponent(query)}&path=${encodeURIComponent(searchPath)}${searchSubdir ? '' : '&depth=1'}`;

    const response = await fetch(url);
    const result = await response.json();

    if (!result.success) {
      showError('搜索失败：' + (result.error || '未知错误'));
      return;
    }

    state.isSearching = true;
    state.searchResults = result.data.results;
    state.searchQuery = query; // 保存搜索关键词用于高亮

    renderSearchResults(result.data);

  } catch (err) {
    console.error('搜索失败:', err);
    showError('网络错误，请稍后重试');
  }
}

/**
 * 显示搜索加载状态
 */
function showSearchLoading() {
  elements.searchResults.classList.add('hidden');
  elements.fileList.classList.add('hidden');
  elements.empty.classList.add('hidden');
  elements.error.classList.add('hidden');
  elements.loading.classList.remove('hidden');
}

/**
 * 渲染搜索结果
 */
function renderSearchResults(data) {
  const { query, results, count, searchPath } = data;
  
  elements.loading.classList.add('hidden');
  elements.fileList.classList.add('hidden');
  elements.empty.classList.add('hidden');
  elements.searchResults.classList.remove('hidden');
  
  elements.searchInfo.textContent = `在 "${searchPath}" 中搜索 "${query}"，找到 ${count} 个文件`;
  
  elements.searchResultsList.innerHTML = '';
  
  if (results.length === 0) {
    elements.searchResultsList.innerHTML = `
      <div class="empty" style="padding: 40px 20px;">
        <span class="empty-icon">🔍</span>
        <p>未找到匹配的文件</p>
      </div>
    `;
    return;
  }
  
  for (const item of results) {
    const fileItem = createSearchResultItem(item);
    elements.searchResultsList.appendChild(fileItem);
  }
}

/**
 * 创建搜索结果项
 */
function createSearchResultItem(item) {
  const div = document.createElement('div');
  div.className = 'file-item';

  // 显示相对路径
  const pathDisplay = item.relativePath || item.path;
  
  // 高亮搜索关键词
  const query = state.searchQuery || '';
  const highlightedName = highlightText(item.name, query);
  const highlightedPath = highlightText(pathDisplay, query);

  div.innerHTML = `
    <span class="file-icon">${item.icon}</span>
    <div style="flex: 1; overflow: hidden;">
      <div class="file-name" title="${escapeHtml(item.name)}">${highlightedName}</div>
      <div class="file-path" style="font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${highlightedPath}
      </div>
    </div>
    <div class="file-meta">
      ${item.size ? `<span class="file-size">${item.size.formatted}</span>` : ''}
    </div>
  `;

  // 绑定点击事件
  div.addEventListener('click', () => handleSearchResultClick(item));

  return div;
}

/**
 * 高亮文本中的关键词
 */
function highlightText(text, query) {
  if (!query) return escapeHtml(text);
  
  const escapedText = escapeHtml(text);
  const escapedQuery = escapeHtml(query);
  
  try {
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
  } catch (err) {
    return escapedText;
  }
}

/**
 * 处理搜索结果点击
 */
function handleSearchResultClick(item) {
  if (item.type === 'directory') {
    // 进入目录
    loadFiles(item.path);
    closeSearchResults();
  } else {
    // 查看文件内容
    viewFile(item);
  }
}

/**
 * 清除搜索
 */
function clearSearch() {
  elements.searchInput.value = '';
  closeSearchResults();
}

/**
 * 关闭搜索结果
 */
function closeSearchResults() {
  state.isSearching = false;
  state.searchResults = [];
  elements.searchResults.classList.add('hidden');
  elements.fileList.classList.remove('hidden');

  // 检查文件列表是否为空
  const hasItems = elements.fileList.children.length > 0;
  if (!hasItems) {
    elements.empty.classList.remove('hidden');
  }
}

/**
 * 处理搜索键盘事件
 */
function handleSearchKeyDown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const query = elements.searchInput.value.trim();
    if (query) {
      if (state.searchMode === 'code') {
        performCodeSearch(query);
      } else {
        performSearch(query);
      }
    }
  }
}

/**
 * 切换搜索模式
 */
function toggleSearchMode() {
  setSearchMode(state.searchMode === 'filename' ? 'code' : 'filename');
}

/**
 * 设置搜索模式
 */
function setSearchMode(mode) {
  state.searchMode = mode;
  
  if (mode === 'code') {
    elements.searchModeText.textContent = '代码内容';
    elements.searchModeToggle.querySelector('.icon').textContent = '💻';
    elements.searchInput.placeholder = '搜索代码内容 (Enter 执行搜索)...';
    elements.codeSearchOptions.classList.remove('hidden');
    elements.switchSearchText.textContent = '切换到文件名搜索';
  } else {
    elements.searchModeText.textContent = '文件名';
    elements.searchModeToggle.querySelector('.icon').textContent = '📄';
    elements.searchInput.placeholder = '搜索文件名 (Enter 执行搜索)...';
    elements.codeSearchOptions.classList.add('hidden');
    elements.switchSearchText.textContent = '切换到代码搜索';
  }
  
  // 清除当前搜索结果
  closeSearchResults();
  closeCodeSearchResults();
}

/**
 * 执行代码搜索
 */
async function performCodeSearch(query) {
  if (!query) return;
  
  showCodeSearchLoading();
  
  try {
    const searchPath = state.currentPath || state.rootPath;
    const caseSensitive = elements.searchCaseSensitive?.checked || false;
    const wholeWord = elements.searchWholeWord?.checked ?? true; // 默认全字匹配
    const useRegex = elements.searchUseRegex?.checked || false;
    
    const url = `/api/files/search-content?q=${encodeURIComponent(query)}&path=${encodeURIComponent(searchPath)}` +
      `&case=${caseSensitive}&word=${wholeWord}&regex=${useRegex}`;
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success) {
      showError('代码搜索失败：' + (result.error || '未知错误'));
      return;
    }
    
    state.isSearching = true;
    state.codeSearchResults = result.data.results;
    
    renderCodeSearchResults(result.data);
    
  } catch (err) {
    console.error('代码搜索失败:', err);
    showError('网络错误，请稍后重试');
  }
}

/**
 * 显示代码搜索加载状态
 */
function showCodeSearchLoading() {
  elements.codeSearchResults.classList.add('hidden');
  elements.searchResults.classList.add('hidden');
  elements.fileList.classList.add('hidden');
  elements.empty.classList.add('hidden');
  elements.error.classList.add('hidden');
  elements.loading.classList.remove('hidden');
}

/**
 * 渲染代码搜索结果
 */
function renderCodeSearchResults(data) {
  const { query, results, count, filesSearched } = data;
  
  elements.loading.classList.add('hidden');
  elements.fileList.classList.add('hidden');
  elements.empty.classList.add('hidden');
  elements.searchResults.classList.add('hidden');
  elements.codeSearchResults.classList.remove('hidden');
  
  elements.codeSearchInfo.textContent = `在 ${filesSearched} 个文件中搜索 "${query}"，找到 ${count} 个匹配的文件`;
  
  elements.codeSearchResultsList.innerHTML = '';
  
  if (results.length === 0) {
    elements.codeSearchResultsList.innerHTML = `
      <div class="empty" style="padding: 60px 20px;">
        <span class="empty-icon">💻</span>
        <p>未在代码内容中找到匹配</p>
        <p style="font-size: 13px; margin-top: 8px; color: var(--text-muted);">尝试其他关键词或调整搜索选项</p>
      </div>
    `;
    return;
  }
  
  for (const fileResult of results) {
    const fileElement = createCodeResultFile(fileResult);
    elements.codeSearchResultsList.appendChild(fileElement);
  }
}

/**
 * 创建代码结果文件元素
 */
function createCodeResultFile(fileResult) {
  const container = document.createElement('div');
  container.className = 'code-result-file';
  
  // 文件头部
  const header = document.createElement('div');
  header.className = 'code-result-file-header';
  header.innerHTML = `
    <span class="code-result-file-icon">${getFileIconForExtension(fileResult.extension)}</span>
    <div style="flex: 1; overflow: hidden;">
      <div class="code-result-file-name">${escapeHtml(fileResult.name)}</div>
      <div class="code-result-file-path">${escapeHtml(fileResult.relativePath)}</div>
    </div>
    <span class="code-result-file-count">${fileResult.matchCount} 处匹配</span>
  `;
  
  container.appendChild(header);
  
  // 匹配内容
  const matchesContainer = document.createElement('div');
  matchesContainer.className = 'code-result-matches';
  
  for (const match of fileResult.matches) {
    const matchElement = createCodeMatchElement(match);
    matchesContainer.appendChild(matchElement);
  }
  
  container.appendChild(matchesContainer);
  
  // 点击文件头跳转到文件
  header.addEventListener('click', () => {
    // 可以在这里添加展开/折叠功能
  });
  
  return container;
}

/**
 * 创建代码匹配元素
 */
function createCodeMatchElement(match) {
  const div = document.createElement('div');
  div.className = 'code-result-match';

  // 高亮匹配内容
  const highlightedLine = highlightCodeMatches(match.line, match.lineMatches);

  div.innerHTML = `
    <span class="code-result-line-num">${match.lineNumber}</span>
    <span class="code-result-line-content">${highlightedLine}</span>
  `;

  return div;
}

/**
 * 高亮代码匹配位置
 */
function highlightCodeMatches(line, lineMatches) {
  if (!lineMatches || lineMatches.length === 0) {
    return escapeHtml(line);
  }
  
  const escapedLine = escapeHtml(line);
  
  // 按照匹配位置高亮
  let result = escapedLine;
  // 从后向前替换，避免索引偏移
  const sortedMatches = [...lineMatches].sort((a, b) => b.start - a.start);
  
  for (const m of sortedMatches) {
    const start = m.start;
    const end = m.end;
    const originalText = escapedLine.substring(start, end);
    const highlighted = `<mark class="code-result-highlight">${originalText}</mark>`;
    result = result.substring(0, start) + highlighted + result.substring(end);
  }
  
  return result;
}

/**
 * 根据扩展名获取文件图标
 */
function getFileIconForExtension(ext) {
  const icons = {
    '.js': '📜', '.jsx': '📜', '.ts': '📘', '.tsx': '📘',
    '.vue': '💚', '.html': '🌐', '.htm': '🌐',
    '.css': '🎨', '.scss': '🎨', '.less': '🎨',
    '.json': '📋', '.xml': '📋', '.yaml': '⚙️', '.yml': '⚙️',
    '.md': '📝', '.markdown': '📝',
    '.py': '🐍', '.java': '☕', '.c': '🔧', '.cpp': '🔧',
    '.go': '🔹', '.rs': '🦀', '.php': '🐘',
    '.rb': '💎', '.sh': '💻', '.bash': '💻',
    '.sql': '🗄️',
    '.pdf': '📕'
  };
  return icons[ext] || '📄';
}

/**
 * 关闭代码搜索结果
 */
function closeCodeSearchResults() {
  state.isSearching = false;
  state.codeSearchResults = [];
  elements.codeSearchResults.classList.add('hidden');
  elements.fileList.classList.remove('hidden');

  // 检查文件列表是否为空
  const hasItems = elements.fileList.children.length > 0;
  if (!hasItems) {
    elements.empty.classList.remove('hidden');
  }
}

/**
 * 上传文件
 */
let currentUploadXhr = null;

function uploadFiles(files) {
  if (!files || files.length === 0) return;

  // 使用相对路径上传（相对于 rootPath）
  const uploadPath = getRelativePath(state.currentPath, state.rootPath);
  let uploaded = 0;
  let failed = 0;
  let totalSize = 0;
  let loadedSize = 0;

  // 计算总大小
  for (const file of files) {
    totalSize += file.size;
  }

  // 显示上传进度
  showUploadProgress(files.length, totalSize);

  // 逐个上传文件
  const uploadQueue = Array.from(files);

  function uploadNext() {
    if (uploadQueue.length === 0) {
      // 上传完成
      setTimeout(() => {
        hideUploadProgress();
        showUploadComplete(uploaded, failed);
        // 清除缓存并刷新文件列表
        clearFileCache();
        loadFiles(state.currentPath);
      }, 500);
      return;
    }

    const file = uploadQueue.shift();
    uploadFile(file, uploadPath)
      .then(() => {
        uploaded++;
        loadedSize += file.size;
        updateProgress(uploaded + failed, files.length, loadedSize, totalSize);
        uploadNext();
      })
      .catch((err) => {
        console.error('上传文件失败:', file.name, err);
        failed++;
        updateProgress(uploaded + failed, files.length, loadedSize, totalSize);
        uploadNext();
      });
  }

  // 开始上传（最多 3 个并发）
  const concurrent = Math.min(3, uploadQueue.length);
  for (let i = 0; i < concurrent; i++) {
    uploadNext();
  }
}

/**
 * 获取相对路径
 */
function getRelativePath(absolutePath, rootPath) {
  if (!absolutePath || !rootPath) return '';
  
  // 如果已经是相对路径，直接返回
  if (!pathIsAbsolute(absolutePath)) {
    return absolutePath;
  }
  
  // 计算相对路径
  if (absolutePath.startsWith(rootPath)) {
    let relative = absolutePath.substring(rootPath.length);
    // 移除开头的斜杠
    if (relative.startsWith('/')) {
      relative = relative.substring(1);
    }
    return relative || '';
  }
  
  return '';
}

/**
 * 判断路径是否为绝对路径
 */
function pathIsAbsolute(p) {
  return p && typeof p === 'string' && (p.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(p));
}

/**
 * 上传单个文件
 */
function uploadFile(file, uploadPath) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    currentUploadXhr = xhr;

    xhr.open('POST', `/api/file/upload-to?path=${encodeURIComponent(uploadPath)}`, true);

    xhr.onload = () => {
      currentUploadXhr = null;
      if (xhr.status === 200) {
        try {
          const result = JSON.parse(xhr.responseText);
          if (result.success) {
            resolve(result.data);
          } else {
            reject(new Error(result.error || '上传失败'));
          }
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error('上传失败：' + xhr.status));
      }
    };

    xhr.onerror = () => {
      currentUploadXhr = null;
      reject(new Error('网络错误'));
    };

    xhr.send(formData);
  });
}

/**
 * 显示上传进度
 */
function showUploadProgress(fileCount, totalSize) {
  elements.uploadProgress.classList.remove('hidden');
  elements.progressBar.style.width = '0%';
  elements.progressInfo.textContent = `准备上传 ${fileCount} 个文件，总大小 ${formatSize(totalSize)}`;
}

/**
 * 更新上传进度
 */
function updateProgress(completed, total, loadedSize, totalSize) {
  const percent = Math.round((completed / total) * 100);
  elements.progressBar.style.width = percent + '%';
  elements.progressInfo.textContent = `已上传 ${completed}/${total} 个文件 (${formatSize(loadedSize)}/${formatSize(totalSize)})`;
}

/**
 * 隐藏上传进度
 */
function hideUploadProgress() {
  elements.uploadProgress.classList.add('hidden');
}

/**
 * 取消上传
 */
function cancelUpload() {
  if (currentUploadXhr) {
    currentUploadXhr.abort();
    currentUploadXhr = null;
  }
  hideUploadProgress();
}

/**
 * 显示上传完成提示
 */
function showUploadComplete(uploaded, failed) {
  // 可以在这里添加 toast 提示
  console.log(`上传完成：成功 ${uploaded} 个，失败 ${failed} 个`);
}

/**
 * 刷新文件列表
 */
function refreshFileList() {
  // 清除缓存
  clearFileCache();
  // 重新加载文件列表
  loadFiles(state.currentPath);
  // 显示 Toast 提示
  showToast('文件列表已刷新', 'success');
}

/**
 * 格式化大小
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * 显示 DOCX 预览
 */
async function showDocxPreview(meta) {
  console.log('📄 开始加载 DOCX:', meta.name);
  console.log('📄 docx 对象:', typeof docx);
  console.log('📄 JSZip 对象:', typeof JSZip);

  elements.docxPreview.classList.remove('hidden');
  elements.docxPreview.innerHTML = '<div class="loading"><div class="spinner"></div><span>加载 DOCX 文档...</span></div>';

  try {
    // 获取文件二进制数据
    console.log('📄 获取文件二进制数据:', meta.path);
    const response = await fetch(`/api/file/binary?path=${encodeURIComponent(meta.path)}&t=${Date.now()}`);
    console.log('📄 响应状态:', response.status);

    const blob = await response.blob();
    console.log('📄 Blob 类型:', blob.type);
    console.log('📄 Blob 大小:', blob.size, 'bytes');

    // 使用 docx-preview 渲染
    if (typeof docx !== 'undefined') {
      console.log('📄 开始渲染...');
      elements.docxPreview.innerHTML = '';

      // 使用简化的配置
      await docx.renderAsync(blob, elements.docxPreview, null, {
        className: 'docx',
        inWrapper: false
      });

      console.log('📄 渲染完成');

      elements.fileSize.textContent = `大小：${meta.size?.formatted || '未知'}`;
      elements.fileModified.textContent = `修改时间：${formatDate(meta.modified)}`;
      elements.fileType.textContent = `类型：Word 文档 (.docx)`;
    } else {
      console.error('📄 DOCX 库未加载');
      elements.docxPreview.innerHTML = '<div class="empty"><p>DOCX 预览库未加载，请检查网络连接</p></div>';
    }

  } catch (err) {
    console.error('📄 加载 DOCX 失败:', err);
    console.error('📄 错误堆栈:', err.stack);
    elements.docxPreview.innerHTML = `<div class="empty"><p>加载失败：${err.message}</p><p style="margin-top:10px;font-size:12px;color:var(--text-muted)">提示：某些 DOCX 文件可能包含不支持的特性</p></div>`;
  }
}

/**
 * 显示 XLSX 预览
 */
async function showXlsxPreview(meta) {
  console.log('📊 开始加载 XLSX:', meta.name);
  console.log('📊 XLSX 对象:', typeof XLSX);
  
  elements.xlsxPreview.classList.remove('hidden');
  elements.xlsxPreview.innerHTML = '<div class="loading"><div class="spinner"></div><span>加载 Excel 表格...</span></div>';

  try {
    // 获取文件二进制数据
    console.log('📊 获取文件二进制数据:', meta.path);
    const response = await fetch(`/api/file/binary?path=${encodeURIComponent(meta.path)}&t=${Date.now()}`);
    console.log('📊 响应状态:', response.status);
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('📊 ArrayBuffer 大小:', arrayBuffer.byteLength, 'bytes');

    // 使用 XLSX 读取
    if (typeof XLSX !== 'undefined') {
      console.log('📊 开始解析...');
      xlsxWorkbook = XLSX.read(arrayBuffer, { type: 'array' });
      xlsxCurrentSheet = 0;
      
      console.log('📊 工作表数量:', xlsxWorkbook.SheetNames.length);
      console.log('📊 工作表名称:', xlsxWorkbook.SheetNames);

      // 重建 HTML 结构
      elements.xlsxPreview.innerHTML = `
        <div class="xlsx-toolbar hidden" id="xlsxToolbar">
          <div class="xlsx-sheet-tabs" id="xlsxSheetTabs"></div>
          <div class="xlsx-sheet-search">
            <input type="text" id="xlsxSheetSearch" class="xlsx-search-input" placeholder="搜索工作表...">
            <div id="xlsxSheetSearchResults" class="xlsx-search-results hidden"></div>
          </div>
        </div>
        <div class="xlsx-sheet-content" id="xlsxSheetContent"></div>
      `;
      
      // 重新获取元素引用
      elements.xlsxToolbar = document.getElementById('xlsxToolbar');
      elements.xlsxSheetTabs = document.getElementById('xlsxSheetTabs');
      elements.xlsxSheetContent = document.getElementById('xlsxSheetContent');
      elements.xlsxSheetSearch = document.getElementById('xlsxSheetSearch');
      elements.xlsxSheetSearchResults = document.getElementById('xlsxSheetSearchResults');

      // 显示工具栏（仅当有多个工作表时）
      if (xlsxWorkbook.SheetNames.length > 1) {
        elements.xlsxToolbar.classList.remove('hidden');
        renderSheetTabs();
        bindSheetSearch();
      } else {
        elements.xlsxToolbar.classList.add('hidden');
      }

      // 渲染当前工作表
      console.log('📊 渲染工作表:', xlsxWorkbook.SheetNames[0]);
      renderCurrentSheet();
      
      console.log('📊 渲染完成');

      elements.fileSize.textContent = `大小：${meta.size?.formatted || '未知'}`;
      elements.fileModified.textContent = `修改时间：${formatDate(meta.modified)}`;
      elements.fileType.textContent = `类型：Excel 表格 (${meta.extension}) - ${xlsxWorkbook.SheetNames.length} 个工作表`;

    } else {
      console.error('📊 XLSX 库未加载');
      elements.xlsxPreview.innerHTML = '<div class="empty"><p>XLSX 预览库未加载，请检查网络连接</p></div>';
    }

  } catch (err) {
    console.error('📊 加载 XLSX 失败:', err);
    console.error('📊 错误堆栈:', err.stack);
    elements.xlsxPreview.innerHTML = `<div class="empty"><p>加载失败：${err.message}</p></div>`;
  }
}

/**
 * 渲染工作表选项卡
 */
function renderSheetTabs() {
  if (!xlsxWorkbook) return;
  
  const tabsContainer = elements.xlsxSheetTabs;
  tabsContainer.innerHTML = '';
  
  xlsxWorkbook.SheetNames.forEach((sheetName, index) => {
    const tab = document.createElement('div');
    tab.className = `xlsx-sheet-tab${index === xlsxCurrentSheet ? ' active' : ''}`;
    tab.textContent = sheetName;
    tab.title = sheetName;
    tab.addEventListener('click', () => switchToSheet(index));
    tabsContainer.appendChild(tab);
  });
}

/**
 * 切换到指定工作表
 */
function switchToSheet(index) {
  if (index < 0 || index >= xlsxWorkbook.SheetNames.length) return;
  
  xlsxCurrentSheet = index;
  renderSheetTabs();
  renderCurrentSheet();
}

/**
 * 渲染当前工作表
 */
function renderCurrentSheet() {
  if (!xlsxWorkbook) return;

  const sheetName = xlsxWorkbook.SheetNames[xlsxCurrentSheet];
  const worksheet = xlsxWorkbook.Sheets[sheetName];
  const html = XLSX.utils.sheet_to_html(worksheet);

  elements.xlsxSheetContent.innerHTML = `
    <div class="xlsx-sheet-name">
      <span>📊 ${escapeHtml(sheetName)}</span>
      <span class="xlsx-sheet-index">(${xlsxCurrentSheet + 1}/${xlsxWorkbook.SheetNames.length})</span>
    </div>
    <div class="xlsx-table-container">${html}</div>
  `;

  // 如果有多个工作表，显示提示
  if (xlsxWorkbook.SheetNames.length > 1) {
    const info = `共 ${xlsxWorkbook.SheetNames.length} 个工作表，当前显示第 ${xlsxCurrentSheet + 1} 个`;
    elements.xlsxSheetContent.innerHTML += `<div class="xlsx-info">${info}</div>`;
  }
}

/**
 * 绑定工作表搜索
 */
function bindSheetSearch() {
  if (!elements.xlsxSheetSearch) return;
  
  // 移除旧的事件监听器
  const newElement = elements.xlsxSheetSearch.cloneNode(true);
  elements.xlsxSheetSearch.parentNode.replaceChild(newElement, elements.xlsxSheetSearch);
  elements.xlsxSheetSearch = newElement;
  
  // 添加输入事件
  elements.xlsxSheetSearch.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    if (!query) {
      elements.xlsxSheetSearchResults.classList.add('hidden');
      return;
    }
    
    // 搜索匹配的工作表
    const matches = xlsxWorkbook.SheetNames
      .map((name, index) => ({ name, index }))
      .filter(item => item.name.toLowerCase().includes(query));
    
    // 显示搜索结果
    const resultsContainer = elements.xlsxSheetSearchResults;
    resultsContainer.innerHTML = '';
    
    if (matches.length === 0) {
      resultsContainer.innerHTML = '<div class="xlsx-search-empty">未找到匹配的工作表</div>';
    } else {
      matches.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'xlsx-search-item';
        resultItem.innerHTML = `
          <span class="xlsx-search-icon">📊</span>
          <span class="xlsx-search-name">${highlightSearchText(item.name, query)}</span>
        `;
        resultItem.addEventListener('click', () => {
          switchToSheet(item.index);
          elements.xlsxSheetSearchResults.classList.add('hidden');
          elements.xlsxSheetSearch.value = '';
        });
        resultsContainer.appendChild(resultItem);
      });
    }
    
    resultsContainer.classList.remove('hidden');
  });
  
  // 点击外部关闭搜索结果
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.xlsx-sheet-search')) {
      elements.xlsxSheetSearchResults.classList.add('hidden');
    }
  });
}

/**
 * 高亮搜索文本
 */
function highlightSearchText(text, query) {
  if (!query) return escapeHtml(text);
  
  const regex = new RegExp(`(${escapeHtml(query)})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark class="xlsx-search-highlight">$1</mark>');
}

/**
 * 显示 PDF 预览
 */
async function showPDFPreview(meta) {
  if (typeof pdfjsLib === 'undefined') {
    elements.binaryInfo.classList.remove('hidden');
    elements.binaryDetails.innerHTML = `
      <div class="binary-detail-item binary-header-detail">
        <span class="binary-detail-label">提示</span>
        <span class="binary-detail-value">PDF.js 库未加载，无法预览 PDF 文件</span>
      </div>
    `;
    return;
  }

  elements.pdfPreview.classList.remove('hidden');
  
  try {
    // 加载 PDF 文档
    const pdfUrl = meta.previewUrl + '&t=' + Date.now();
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    pdfDoc = await loadingTask.promise;
    
    // 更新页面信息
    updatePDFToolbar();
    
    // 渲染第一页
    pdfCurrentPage = 1;
    renderPDFPage();
    
  } catch (err) {
    console.error('加载 PDF 失败:', err);
    elements.binaryInfo.classList.remove('hidden');
    elements.binaryDetails.innerHTML = `
      <div class="binary-detail-item binary-header-detail">
        <span class="binary-detail-label">错误</span>
        <span class="binary-detail-value">加载 PDF 失败：${err.message}</span>
      </div>
    `;
  }
}

/**
 * 更新 PDF 工具栏
 */
function updatePDFToolbar() {
  if (!pdfDoc) return;
  
  elements.pdfPageInfo.textContent = `${pdfCurrentPage} / ${pdfDoc.numPages}`;
  elements.pdfZoomLevel.textContent = `${Math.round(pdfScale * 100)}%`;
  
  // 更新按钮状态
  elements.pdfPrev.disabled = pdfCurrentPage <= 1;
  elements.pdfNext.disabled = pdfCurrentPage >= pdfDoc.numPages;
}

/**
 * 渲染 PDF 页面
 */
async function renderPDFPage() {
  if (!pdfDoc) return;

  try {
    const page = await pdfDoc.getPage(pdfCurrentPage);

    // 获取视口
    let viewport = page.getViewport({ scale: pdfScale });

    // 适应页面宽度
    if (pdfFitPage) {
      const containerWidth = elements.pdfContainer.clientWidth - 40;
      const unscaledViewport = page.getViewport({ scale: 1 });
      const containerScale = containerWidth / unscaledViewport.width;
      viewport = page.getViewport({ scale: containerScale });
      pdfScale = containerScale;
    }

    // 设置 canvas 尺寸（使用高分辨率渲染）
    const canvas = elements.pdfCanvas;
    const context = canvas.getContext('2d');
    
    // 设置实际渲染尺寸（高分辨率）
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // 设置 CSS 显示尺寸（与 canvas 尺寸一致，避免缩放）
    canvas.style.height = viewport.height + 'px';
    canvas.style.width = viewport.width + 'px';

    // 配置渲染上下文（优化文本渲染质量）
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    // 渲染页面
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      intent: 'display' // 使用显示模式（更好的质量）
    };

    await page.render(renderContext).promise;

    // 更新工具栏
    updatePDFToolbar();

  } catch (err) {
    console.error('渲染 PDF 页面失败:', err);
  }
}

/**
 * 初始化文件管理功能
 */
function initFileManagement() {
  // 右键菜单事件
  document.addEventListener('contextmenu', (e) => {
    const fileItem = e.target.closest('.file-item');
    if (fileItem) {
      e.preventDefault();
      
      // 从 data 属性获取文件信息
      state.contextMenuItem = {
        path: fileItem.dataset.path,
        name: fileItem.dataset.name,
        type: fileItem.dataset.type,
        icon: fileItem.querySelector('.file-icon')?.textContent || '📄'
      };
      
      showContextMenu(e.clientX, e.clientY, state.contextMenuItem);
    } else {
      hideContextMenu();
    }
  });

  // 点击其他地方关闭菜单
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu')) {
      hideContextMenu();
    }
  });

  // 菜单项点击事件
  elements.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      handleContextMenuAction(action);
      hideContextMenu();
    });
  });

  // 确认对话框事件
  elements.confirmCancel.addEventListener('click', hideConfirmDialog);
  elements.confirmOk.addEventListener('click', () => {
    if (state.confirmCallback) {
      state.confirmCallback();
    }
    hideConfirmDialog();
  });

  // 输入对话框事件
  elements.inputCancel.addEventListener('click', hideInputDialog);
  elements.inputOk.addEventListener('click', handleInputOk);
  elements.inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleInputOk();
    }
  });
}

/**
 * 获取当前路径的文件列表
 */
function getCurrentPathItems() {
  // 从 DOM 中获取当前显示的文件列表
  const items = [];
  elements.fileList.querySelectorAll('.file-item').forEach(el => {
    items.push({
      name: el.querySelector('.file-name')?.textContent || '',
      type: el.querySelector('.file-icon')?.textContent === '📁' ? 'directory' : 'file'
    });
  });
  return items;
}

/**
 * 显示右键菜单
 */
function showContextMenu(x, y, item) {
  const menu = elements.contextMenu;
  menu.classList.remove('hidden');
  
  // 调整菜单位置，确保不超出屏幕
  const rect = menu.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 10;
  const maxY = window.innerHeight - rect.height - 10;
  
  menu.style.left = Math.min(x, maxX) + 'px';
  menu.style.top = Math.min(y, maxY) + 'px';
  
  // 根据文件类型显示/隐藏菜单项
  const isDirectory = item?.type === 'directory';
  const newFileItem = menu.querySelector('[data-action="new-file"]');
  const newDirItem = menu.querySelector('[data-action="new-dir"]');
  
  if (newFileItem && newDirItem) {
    if (isDirectory) {
      newFileItem.style.display = 'flex';
      newDirItem.style.display = 'flex';
    } else {
      newFileItem.style.display = 'none';
      newDirItem.style.display = 'none';
    }
  }
}

/**
 * 隐藏右键菜单
 */
function hideContextMenu() {
  elements.contextMenu.classList.add('hidden');
  state.contextMenuItem = null;
}

/**
 * 处理右键菜单操作
 */
async function handleContextMenuAction(action) {
  const item = state.contextMenuItem;
  if (!item) return;

  switch (action) {
    case 'open':
      if (item.type === 'directory') {
        loadFiles(item.path);
      } else {
        viewFile(item);
      }
      break;
    case 'copy':
      // 复制到剪贴板
      state.clipboardFiles = [item];
      state.clipboardAction = 'copy';
      showToast(`已复制：${item.name}`, 'info');
      updatePasteMenu();
      break;
    case 'cut':
      // 剪切到剪贴板
      state.clipboardFiles = [item];
      state.clipboardAction = 'cut';
      showToast(`已剪切：${item.name}`, 'info');
      updatePasteMenu();
      break;
    case 'paste':
      // 粘贴
      if (state.clipboardFiles.length > 0 && state.clipboardAction) {
        await pasteFiles(item);
      }
      break;
    case 'rename':
      showInputDialog('重命名', '请输入新名称', item.name, async (newName) => {
        await renameFile(item, newName);
      });
      break;
    case 'delete':
      const isDir = item.type === 'directory';
      showConfirmDialog(
        '确认删除',
        `确定要删除${isDir ? '目录' : '文件'} "${item.name}" 吗？${isDir ? '\n\n注意：目录及其所有内容将被删除！' : ''}`,
        async () => {
          await deleteFile(item);
        }
      );
      break;
    case 'new-file':
      showInputDialog('新建文件', '请输入文件名称', '新建文件.txt', async (fileName) => {
        await createFile(item, fileName);
      });
      break;
    case 'new-dir':
      showInputDialog('新建文件夹', '请输入文件夹名称', '新建文件夹', async (dirName) => {
        await createDirectory(item, dirName);
      });
      break;
  }
}

/**
 * 更新粘贴菜单项显示
 */
function updatePasteMenu() {
  const pasteItem = document.getElementById('contextMenuPaste');
  if (pasteItem) {
    if (state.clipboardFiles.length > 0) {
      pasteItem.style.display = 'flex';
    } else {
      pasteItem.style.display = 'none';
    }
  }
}

/**
 * 粘贴文件
 */
async function pasteFiles(targetDir) {
  if (!targetDir || targetDir.type !== 'directory') {
    showToast('请选择目标目录进行粘贴', 'error');
    return;
  }
  
  const files = state.clipboardFiles;
  const action = state.clipboardAction;
  let successCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    try {
      const actionType = action === 'cut' ? 'move' : 'copy';
      const url = `/api/file/${actionType}?path=${encodeURIComponent(file.path)}&target=${encodeURIComponent(targetDir.path)}`;
      
      const response = await fetch(url, { 
        method: action === 'cut' ? 'POST' : 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        successCount++;
        // 如果是剪切，清除剪贴板
        if (action === 'cut') {
          state.clipboardFiles = [];
          state.clipboardAction = null;
        }
      } else {
        failCount++;
        console.error('粘贴失败:', file.name, result.error);
      }
    } catch (err) {
      failCount++;
      console.error('粘贴失败:', file.name, err);
    }
  }
  
  updatePasteMenu();
  clearFileCache();
  showToast(`粘贴完成：成功 ${successCount} 个，失败 ${failCount} 个`, failCount > 0 ? 'warning' : 'success');
  loadFiles(state.currentPath);
}

/**
 * 显示确认对话框
 */
function showConfirmDialog(title, message, onConfirm) {
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  state.confirmCallback = onConfirm;
  elements.confirmDialog.classList.remove('hidden');
}

/**
 * 隐藏确认对话框
 */
function hideConfirmDialog() {
  elements.confirmDialog.classList.add('hidden');
  state.confirmCallback = null;
}

/**
 * 显示输入对话框
 */
function showInputDialog(title, placeholder, defaultValue, onInput) {
  elements.inputTitle.textContent = title;
  elements.inputField.placeholder = placeholder;
  elements.inputField.value = defaultValue || '';
  elements.inputDialog.dataset.onInput = onInput?.toString() || '';
  elements.inputDialog.classList.remove('hidden');
  elements.inputField.focus();
  elements.inputField.select();
  
  // 存储回调（使用闭包）
  elements.inputDialog._onInputCallback = onInput;
}

/**
 * 隐藏输入对话框
 */
function hideInputDialog() {
  elements.inputDialog.classList.add('hidden');
  elements.inputDialog._onInputCallback = null;
}

/**
 * 处理输入对话框确认
 */
async function handleInputOk() {
  const value = elements.inputField.value.trim();
  if (!value) {
    elements.inputField.focus();
    return;
  }
  
  const callback = elements.inputDialog._onInputCallback;
  hideInputDialog();
  
  if (callback) {
    await callback(value);
  }
}

/**
 * 重命名文件/目录
 */
async function renameFile(item, newName) {
  try {
    const url = `/api/file/rename?path=${encodeURIComponent(item.path)}&name=${encodeURIComponent(newName)}`;
    const response = await fetch(url, { method: 'POST' });
    const result = await response.json();
    
    if (!result.success) {
      showToast('重命名失败：' + (result.error || '未知错误'), 'error');
      return;
    }
    
    // 清除缓存
    clearFileCache();
    
    showToast('重命名成功', 'success');
    loadFiles(state.currentPath);
  } catch (err) {
    console.error('重命名失败:', err);
    showToast('重命名失败，请稍后重试', 'error');
  }
}

/**
 * 删除文件/目录
 */
async function deleteFile(item) {
  try {
    const url = `/api/file?path=${encodeURIComponent(item.path)}`;
    const response = await fetch(url, { method: 'DELETE' });
    const result = await response.json();
    
    if (!result.success) {
      showToast('删除失败：' + (result.error || '未知错误'), 'error');
      return;
    }
    
    // 清除缓存
    clearFileCache();
    
    showToast('删除成功', 'success');
    loadFiles(state.currentPath);
  } catch (err) {
    console.error('删除失败:', err);
    showToast('删除失败，请稍后重试', 'error');
  }
}

/**
 * 创建文件
 */
async function createFile(item, fileName) {
  try {
    const url = `/api/file/create?path=${encodeURIComponent(item.path)}&name=${encodeURIComponent(fileName)}`;
    const response = await fetch(url, { method: 'POST' });
    const result = await response.json();
    
    if (!result.success) {
      showToast('创建失败：' + (result.error || '未知错误'), 'error');
      return;
    }
    
    // 清除缓存并刷新文件列表
    clearFileCache();
    showToast('文件创建成功', 'success');
    loadFiles(state.currentPath);
  } catch (err) {
    console.error('创建文件失败:', err);
    showToast('创建文件失败，请稍后重试', 'error');
  }
}

/**
 * 创建目录
 */
async function createDirectory(item, dirName) {
  try {
    const url = `/api/file/create-dir?path=${encodeURIComponent(item.path)}&name=${encodeURIComponent(dirName)}`;
    const response = await fetch(url, { method: 'POST' });
    const result = await response.json();

    if (!result.success) {
      showToast('创建目录失败：' + (result.error || '未知错误'), 'error');
      return;
    }

    // 清除缓存
    clearFileCache();

    showToast('目录创建成功', 'success');
    loadFiles(state.currentPath);
  } catch (err) {
    console.error('创建目录失败:', err);
    showToast('创建目录失败，请稍后重试', 'error');
  }
}

/**
 * 清除文件列表缓存
 */
function clearFileCache() {
  state.fileCache.clear();
  console.log('文件列表缓存已清除');
}

/**
 * Toast 提示
 */
function showToast(message, type = 'info', duration = 3000) {
  const container = elements.toastContainer;
  
  // 创建 Toast 元素
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // 图标
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;
  
  container.appendChild(toast);
  
  // 自动移除
  setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

// 启动应用
init();
