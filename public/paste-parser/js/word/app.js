import { createFileInfo, readFileAsArrayBuffer } from '../services/file-utils.js';
import { createWordViewModel, isSupportedWordFile } from '../services/word-model.js';

const state = {
  currentView: 'rendered',
  errorMessage: '',
  fileInfo: null,
  isDragOver: false,
  isLoading: false,
  showSuccess: false,
  viewModel: null,
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderStats(stats, fileInfo) {
  return `
    <div class="stat-item"><div class="stat-value">${stats.charCount}</div><div class="stat-label">字符数</div></div>
    <div class="stat-item"><div class="stat-value">${stats.wordCount}</div><div class="stat-label">词元数</div></div>
    <div class="stat-item"><div class="stat-value">${stats.paragraphCount}</div><div class="stat-label">段落数</div></div>
    <div class="stat-item"><div class="stat-value">${fileInfo?.name || ''}</div><div class="stat-label">文件名</div></div>
  `;
}

function flashSuccess() {
  state.showSuccess = true;
  render();
  window.setTimeout(() => {
    state.showSuccess = false;
    render();
  }, 2400);
}

function showError(message) {
  state.errorMessage = message;
  render();
}

function clearError() {
  state.errorMessage = '';
}

function clearFileInput(root) {
  root.fileInput.value = '';
}

function render() {
  const root = window.__pasteParserWordRoot;
  if (!root) return;

  root.uploadArea.classList.toggle('drag-over', state.isDragOver);
  root.fileInfo.classList.toggle('hidden', !state.fileInfo);
  root.successBox.classList.toggle('hidden', !state.showSuccess);
  root.errorBox.classList.toggle('hidden', !state.errorMessage);
  root.loadingBox.classList.toggle('hidden', !state.isLoading);
  root.resultSection.classList.toggle('hidden', !state.viewModel || state.isLoading);

  if (state.fileInfo) {
    root.fileName.textContent = state.fileInfo.name;
    root.fileSize.textContent = state.fileInfo.size;
  }

  root.errorText.textContent = state.errorMessage;

  if (state.viewModel) {
    root.stats.innerHTML = renderStats(state.viewModel.stats, state.viewModel.fileInfo);
    root.messageList.innerHTML = (state.viewModel.messages || [])
      .map((message) => `<li>${escapeHtml(message)}</li>`)
      .join('');
    root.messageList.classList.toggle('hidden', (state.viewModel.messages || []).length === 0);
    root.renderedContent.innerHTML = state.viewModel.html || '<p>未解析出可渲染内容。</p>';
    root.rawContent.textContent = state.viewModel.rawText || '';
  }

  root.renderedPanel.classList.toggle('hidden', state.currentView !== 'rendered');
  root.rawPanel.classList.toggle('hidden', state.currentView !== 'raw');
  root.renderedTab.classList.toggle('active', state.currentView === 'rendered');
  root.rawTab.classList.toggle('active', state.currentView === 'raw');
  root.clearButton.disabled = !state.fileInfo && !state.viewModel;
}

async function processFile(file) {
  const root = window.__pasteParserWordRoot;

  if (!isSupportedWordFile(file?.name)) {
    showError('请上传 Word 文档（.docx 格式）。旧版 .doc 文件暂不支持。');
    return;
  }

  state.isLoading = true;
  state.fileInfo = createFileInfo(file);
  state.viewModel = null;
  state.currentView = 'rendered';
  clearError();
  render();

  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const [htmlResult, rawTextResult] = await Promise.all([
      window.mammoth.convertToHtml({ arrayBuffer }),
      window.mammoth.extractRawText({ arrayBuffer }),
    ]);

    state.viewModel = createWordViewModel({
      fileInfo: state.fileInfo,
      html: htmlResult.value,
      rawText: rawTextResult.value,
      messages: [...(htmlResult.messages || []), ...(rawTextResult.messages || [])].map((item) => item.message),
    });
    flashSuccess();
  } catch (error) {
    showError(`解析失败：${error.message}`);
  } finally {
    state.isLoading = false;
    render();
    clearFileInput(root);
  }
}

function handleDrop(event) {
  event.preventDefault();
  state.isDragOver = false;
  render();
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    processFile(file);
  }
}

function clearCurrentFile() {
  state.fileInfo = null;
  state.viewModel = null;
  state.errorMessage = '';
  state.showSuccess = false;
  state.currentView = 'rendered';
  render();
}

export function initWordPage() {
  const root = {
    clearButton: document.querySelector('#wordClearButton'),
    errorBox: document.querySelector('#wordErrorBox'),
    errorText: document.querySelector('#wordErrorText'),
    fileInfo: document.querySelector('#wordFileInfo'),
    fileInput: document.querySelector('#wordFileInput'),
    fileName: document.querySelector('#wordFileName'),
    fileSize: document.querySelector('#wordFileSize'),
    loadingBox: document.querySelector('#wordLoadingBox'),
    messageList: document.querySelector('#wordMessageList'),
    rawContent: document.querySelector('#wordRawContent'),
    rawPanel: document.querySelector('#wordRawPanel'),
    rawTab: document.querySelector('#wordRawTab'),
    renderedContent: document.querySelector('#wordRenderedContent'),
    renderedPanel: document.querySelector('#wordRenderedPanel'),
    renderedTab: document.querySelector('#wordRenderedTab'),
    resultSection: document.querySelector('#wordResultSection'),
    stats: document.querySelector('#wordStats'),
    successBox: document.querySelector('#wordSuccessBox'),
    uploadArea: document.querySelector('#wordUploadArea'),
  };

  window.__pasteParserWordRoot = root;

  root.uploadArea.addEventListener('click', () => root.fileInput.click());
  root.uploadArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    state.isDragOver = true;
    render();
  });
  root.uploadArea.addEventListener('dragleave', (event) => {
    event.preventDefault();
    state.isDragOver = false;
    render();
  });
  root.uploadArea.addEventListener('drop', handleDrop);
  root.fileInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  });
  root.clearButton.addEventListener('click', clearCurrentFile);
  root.renderedTab.addEventListener('click', () => {
    state.currentView = 'rendered';
    render();
  });
  root.rawTab.addEventListener('click', () => {
    state.currentView = 'raw';
    render();
  });

  render();
}
