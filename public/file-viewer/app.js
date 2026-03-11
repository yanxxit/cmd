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
  cacheMaxAge: 5 * 60 * 1000 // 缓存有效期 5 分钟
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
  closeModal: document.getElementById('closeModal'),
  downloadBtn: document.getElementById('downloadBtn'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),
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
    if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !elements.fileModal.classList.contains('hidden')) {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  // 从 URL 获取初始路径
  const params = new URLSearchParams(window.location.search);
  const initialPath = params.get('path') || '';

  // 加载文件列表
  loadFiles(initialPath);
}

/**
 * 初始化上传处理器
 */
function initUploadHandlers() {
  // 点击上传按钮
  elements.uploadBtn.addEventListener('click', () => {
    elements.fileInput.click();
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
  
  if (items.length === 0) {
    elements.empty.classList.remove('hidden');
    elements.fileList.classList.add('hidden');
    return;
  }
  
  elements.empty.classList.add('hidden');
  elements.fileList.classList.remove('hidden');
  
  for (const item of items) {
    const fileItem = createFileItem(item);
    elements.fileList.appendChild(fileItem);
  }
}

/**
 * 创建文件项元素
 */
function createFileItem(item) {
  const div = document.createElement('div');
  div.className = 'file-item';
  div.dataset.path = item.path;
  div.dataset.name = item.name;
  div.dataset.type = item.type;
  div.innerHTML = `
    <span class="file-icon">${item.icon}</span>
    <span class="file-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
    <div class="file-meta">
      ${item.size ? `<span class="file-size">${item.size.formatted}</span>` : ''}
      <span class="file-date">${formatDate(item.modified)}</span>
    </div>
  `;

  // 绑定点击事件
  div.addEventListener('click', () => handleFileClick(item));

  return div;
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
  elements.imagePreview.classList.add('hidden');
  elements.videoPreview.classList.add('hidden');
  elements.audioPreview.classList.add('hidden');
  elements.pdfPreview.classList.add('hidden');
  elements.binaryInfo.classList.add('hidden');
  elements.codeContent.textContent = '';
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
  
  div.innerHTML = `
    <span class="file-icon">${item.icon}</span>
    <div style="flex: 1; overflow: hidden;">
      <div class="file-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
      <div class="file-path" style="font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${escapeHtml(pathDisplay)}
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
  let highlightedLine = match.line;
  
  // 简单的高亮处理
  const highlightClass = 'code-result-highlight';
  
  div.innerHTML = `
    <span class="code-result-line-num">${match.lineNumber}</span>
    <span class="code-result-line-content">${escapeHtml(highlightedLine)}</span>
  `;
  
  return div;
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
        // 刷新文件列表
        loadFiles(state.currentPath);
      }, 1000);
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
      alert('重命名失败：' + (result.error || '未知错误'));
      return;
    }
    
    // 清除缓存
    clearFileCache();
    
    // 刷新文件列表
    loadFiles(state.currentPath);
  } catch (err) {
    console.error('重命名失败:', err);
    alert('重命名失败，请稍后重试');
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
      alert('删除失败：' + (result.error || '未知错误'));
      return;
    }
    
    // 清除缓存
    clearFileCache();
    
    // 刷新文件列表
    loadFiles(state.currentPath);
  } catch (err) {
    console.error('删除失败:', err);
    alert('删除失败，请稍后重试');
  }
}

/**
 * 创建文件
 */
async function createFile(item, fileName) {
  try {
    // 创建空文件可以通过上传空内容实现，这里简化处理，提示用户使用其他方式
    alert('新建文件功能暂未实现，请在目录中手动创建文件');
  } catch (err) {
    console.error('创建文件失败:', err);
    alert('创建文件失败，请稍后重试');
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
      alert('创建目录失败：' + (result.error || '未知错误'));
      return;
    }

    // 清除缓存
    clearFileCache();

    // 刷新文件列表
    loadFiles(state.currentPath);
  } catch (err) {
    console.error('创建目录失败:', err);
    alert('创建目录失败，请稍后重试');
  }
}

/**
 * 清除文件列表缓存
 */
function clearFileCache() {
  state.fileCache.clear();
  console.log('文件列表缓存已清除');
}

// 启动应用
init();
