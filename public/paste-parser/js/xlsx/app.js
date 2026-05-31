import { createFileInfo, readFileAsArrayBuffer } from '../services/file-utils.js';
import {
  buildCurrentSheetSummary,
  createWorkbookViewModel,
  isSupportedSpreadsheetFile,
} from '../services/xlsx-model.js';

const state = {
  currentSheetIndex: 0,
  errorMessage: '',
  fileInfo: null,
  isDragOver: false,
  isLoading: false,
  showSuccess: false,
  workbookData: null,
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderStats(summary, fileInfo, workbookData) {
  return `
    <div class="stat-item"><div class="stat-value">${workbookData.sheetNames.length}</div><div class="stat-label">工作表数量</div></div>
    <div class="stat-item"><div class="stat-value">${summary.rowCount}</div><div class="stat-label">当前行数</div></div>
    <div class="stat-item"><div class="stat-value">${summary.columnCount}</div><div class="stat-label">当前列数</div></div>
    <div class="stat-item"><div class="stat-value">${fileInfo?.name || ''}</div><div class="stat-label">文件名</div></div>
  `;
}

function showError(message) {
  state.errorMessage = message;
  render();
}

function clearError() {
  state.errorMessage = '';
}

function flashSuccess() {
  state.showSuccess = true;
  render();
  window.setTimeout(() => {
    state.showSuccess = false;
    render();
  }, 2400);
}

function renderSheetTabs(root, workbookData) {
  root.sheetTabs.innerHTML = workbookData.sheetNames
    .map(
      (name, index) => `
        <button class="sheet-tab ${state.currentSheetIndex === index ? 'active' : ''}" type="button" data-sheet-index="${index}">
          📑 ${escapeHtml(name)}
        </button>
      `
    )
    .join('');
  root.sheetTabs.classList.toggle('hidden', workbookData.sheetNames.length <= 1);
}

function renderTable(root, summary) {
  const rows = summary.currentSheet.rows || [];
  if (rows.length === 0) {
    root.tableContainer.innerHTML = '<div class="empty-sheet">当前工作表没有数据</div>';
    return;
  }

  const [headerRow, ...bodyRows] = rows;
  const headerHtml = headerRow.map((cell) => `<th>${escapeHtml(cell || '(空)')}</th>`).join('');
  const bodyHtml = bodyRows
    .map(
      (row) => `
        <tr>${row.map((cell) => `<td>${escapeHtml(cell || '')}</td>`).join('')}</tr>
      `
    )
    .join('');

  root.tableContainer.innerHTML = `
    <table class="sheet-table">
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  `;
}

function render() {
  const root = window.__pasteParserXlsxRoot;
  if (!root) return;

  root.uploadArea.classList.toggle('drag-over', state.isDragOver);
  root.fileInfo.classList.toggle('hidden', !state.fileInfo);
  root.successBox.classList.toggle('hidden', !state.showSuccess);
  root.errorBox.classList.toggle('hidden', !state.errorMessage);
  root.loadingBox.classList.toggle('hidden', !state.isLoading);
  root.resultSection.classList.toggle('hidden', !state.workbookData || state.isLoading);

  if (state.fileInfo) {
    root.fileName.textContent = state.fileInfo.name;
    root.fileSize.textContent = state.fileInfo.size;
  }

  root.errorText.textContent = state.errorMessage;

  if (state.workbookData) {
    const summary = buildCurrentSheetSummary(state.workbookData, state.currentSheetIndex);
    root.stats.innerHTML = renderStats(summary, state.fileInfo, state.workbookData);
    renderSheetTabs(root, state.workbookData);
    renderTable(root, summary);
  }
}

async function processFile(file) {
  const root = window.__pasteParserXlsxRoot;

  if (!isSupportedSpreadsheetFile(file?.name)) {
    showError('请上传 Excel 文件（.xlsx 或 .xls 格式）。');
    return;
  }

  state.isLoading = true;
  state.fileInfo = createFileInfo(file);
  state.workbookData = null;
  state.currentSheetIndex = 0;
  clearError();
  render();

  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
    const rawSheets = workbook.SheetNames.map((name) =>
      window.XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' })
    );

    state.workbookData = createWorkbookViewModel(workbook.SheetNames, rawSheets);
    flashSuccess();
  } catch (error) {
    showError(`解析失败：${error.message}`);
  } finally {
    state.isLoading = false;
    render();
    root.fileInput.value = '';
  }
}

function clearCurrentFile() {
  state.fileInfo = null;
  state.workbookData = null;
  state.currentSheetIndex = 0;
  state.errorMessage = '';
  state.showSuccess = false;
  render();
}

export function initXlsxPage() {
  const root = {
    clearButton: document.querySelector('#xlsxClearButton'),
    errorBox: document.querySelector('#xlsxErrorBox'),
    errorText: document.querySelector('#xlsxErrorText'),
    fileInfo: document.querySelector('#xlsxFileInfo'),
    fileInput: document.querySelector('#xlsxFileInput'),
    fileName: document.querySelector('#xlsxFileName'),
    fileSize: document.querySelector('#xlsxFileSize'),
    loadingBox: document.querySelector('#xlsxLoadingBox'),
    resultSection: document.querySelector('#xlsxResultSection'),
    sheetTabs: document.querySelector('#xlsxSheetTabs'),
    stats: document.querySelector('#xlsxStats'),
    successBox: document.querySelector('#xlsxSuccessBox'),
    tableContainer: document.querySelector('#xlsxTableContainer'),
    uploadArea: document.querySelector('#xlsxUploadArea'),
  };

  window.__pasteParserXlsxRoot = root;

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
  root.uploadArea.addEventListener('drop', (event) => {
    event.preventDefault();
    state.isDragOver = false;
    render();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  });
  root.fileInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  });
  root.clearButton.addEventListener('click', clearCurrentFile);
  root.sheetTabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-sheet-index]');
    if (!button) return;
    state.currentSheetIndex = Number(button.dataset.sheetIndex);
    render();
  });

  render();
}
