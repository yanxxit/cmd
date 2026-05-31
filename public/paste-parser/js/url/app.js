import { urlParserTestCases } from '../services/url-test-cases.js';
import { escapeHtml, parseUrlInput, syntaxHighlightJSON } from '../services/url-tools.js';

const state = {
  errorMessage: '',
  hasResult: false,
  inputUrl: '',
  parsedResult: null,
  selectedTestCaseIndex: -1,
};

function flashButton(button, nextText) {
  const originalText = button.dataset.originalText || button.textContent;
  button.dataset.originalText = originalText;
  button.textContent = nextText;
  window.setTimeout(() => {
    button.textContent = originalText;
  }, 1800);
}

function renderTestCaseOptions(root) {
  root.testCaseSelect.innerHTML = [
    '<option value="-1">-- 请选择测试案例 --</option>',
    ...urlParserTestCases.map(
      (item, index) =>
        `<option value="${index}" ${state.selectedTestCaseIndex === index ? 'selected' : ''}>${escapeHtml(
          `${item.icon} ${item.name} (${item.categoryName})`
        )}</option>`
    ),
  ].join('');
}

function renderResultSections(result) {
  const sections = [];

  sections.push(`
    <div class="url-section">
      <div class="url-raw-section">
        <div class="url-raw-label">📎 原始链接</div>
        <div class="url-raw-value">${escapeHtml(result.originalUrl)}</div>
        <div class="url-actions">
          <button type="button" class="btn btn-outline" data-copy-value="${escapeHtml(result.originalUrl)}">📋 复制原始链接</button>
        </div>
      </div>
      <div class="url-raw-section">
        <div class="url-raw-label">🔓 解码链接</div>
        <div class="url-raw-value">${escapeHtml(result.decodedUrl)}</div>
        <div class="url-actions">
          <button type="button" class="btn btn-outline" data-copy-value="${escapeHtml(result.decodedUrl)}">📋 复制解码链接</button>
        </div>
      </div>
    </div>
  `);

  if (Object.keys(result.queryParams).length > 0) {
    sections.push(`
      <div class="url-section">
        <h3 class="url-section-title">📊 Query 参数 (${Object.keys(result.queryParams).length} 个)</h3>
        <div class="text-output syntax-json">${syntaxHighlightJSON(JSON.stringify(result.queryParams, null, 2))}</div>
        <div class="url-actions">
          <button type="button" class="btn" data-copy-value="${escapeHtml(JSON.stringify(result.queryParams))}">📋 复制 Query 参数</button>
        </div>
      </div>
    `);
  }

  if (Object.keys(result.hashParams).length > 0) {
    sections.push(`
      <div class="url-section">
        <h3 class="url-section-title">📊 Hash 参数 (${Object.keys(result.hashParams).length} 个)</h3>
        <div class="text-output syntax-json">${syntaxHighlightJSON(JSON.stringify(result.hashParams, null, 2))}</div>
        <div class="url-actions">
          <button type="button" class="btn" data-copy-value="${escapeHtml(JSON.stringify(result.hashParams))}">📋 复制 Hash 参数</button>
        </div>
      </div>
    `);
  }

  if (result.stats.totalCount === 0) {
    sections.push(`
      <div class="format-info">
        <div class="format-info-title">💡 提示</div>
        <div class="format-info-content">该 URL 没有查询参数或 hash 参数。</div>
      </div>
    `);
  }

  return sections.join('');
}

function render() {
  const root = window.__pasteParserUrlRoot;
  if (!root) return;

  renderTestCaseOptions(root);
  root.urlInput.value = state.inputUrl;
  root.useCaseButton.disabled = state.selectedTestCaseIndex < 0;
  root.errorBox.classList.toggle('hidden', !state.errorMessage);
  root.errorText.textContent = state.errorMessage;
  root.resultSection.classList.toggle('hidden', !state.hasResult || !state.parsedResult);

  const currentCase = urlParserTestCases[state.selectedTestCaseIndex];
  root.testCaseHint.textContent = currentCase
    ? `当前案例：${currentCase.name}，可直接加载后解析。`
    : '可先选择一个预设案例，快速验证 Query、Hash、中文编码和 JSON 参数场景。';

  if (!state.parsedResult) return;

  root.stats.innerHTML = `
    <div class="stat-item"><div class="stat-value">${state.parsedResult.stats.length}</div><div class="stat-label">字符数</div></div>
    <div class="stat-item"><div class="stat-value">${state.parsedResult.stats.queryCount}</div><div class="stat-label">Query 参数</div></div>
    <div class="stat-item"><div class="stat-value">${state.parsedResult.stats.hashCount}</div><div class="stat-label">Hash 参数</div></div>
    <div class="stat-item"><div class="stat-value">${state.parsedResult.stats.totalCount}</div><div class="stat-label">总参数</div></div>
  `;
  root.resultBody.innerHTML = renderResultSections(state.parsedResult);
}

function showError(message) {
  state.errorMessage = message;
  render();
}

function parseCurrentUrl() {
  try {
    state.parsedResult = parseUrlInput(state.inputUrl);
    state.hasResult = true;
    state.errorMessage = '';
    render();
    window.setTimeout(() => {
      window.__pasteParserUrlRoot.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  } catch (error) {
    state.errorMessage = error.message.startsWith('请输入') ? error.message : `无效的 URL 格式：${error.message}`;
    state.hasResult = false;
    state.parsedResult = null;
    render();
  }
}

export function initUrlPage() {
  const root = {
    clearButton: document.querySelector('#urlClearButton'),
    errorBox: document.querySelector('#urlErrorBox'),
    errorText: document.querySelector('#urlErrorText'),
    parseButton: document.querySelector('#urlParseButton'),
    resultBody: document.querySelector('#urlResultBody'),
    resultSection: document.querySelector('#urlResultSection'),
    stats: document.querySelector('#urlStats'),
    testCaseHint: document.querySelector('#urlTestCaseHint'),
    testCaseSelect: document.querySelector('#urlTestCaseSelect'),
    urlInput: document.querySelector('#urlInput'),
    useCaseButton: document.querySelector('#urlUseCaseButton'),
  };

  window.__pasteParserUrlRoot = root;

  root.testCaseSelect.addEventListener('change', (event) => {
    state.selectedTestCaseIndex = Number(event.target.value);
    render();
  });
  root.useCaseButton.addEventListener('click', () => {
    if (state.selectedTestCaseIndex < 0) return;
    state.inputUrl = urlParserTestCases[state.selectedTestCaseIndex].url;
    parseCurrentUrl();
  });
  root.urlInput.addEventListener('input', (event) => {
    state.inputUrl = event.target.value;
  });
  root.urlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      parseCurrentUrl();
    }
  });
  root.parseButton.addEventListener('click', parseCurrentUrl);
  root.clearButton.addEventListener('click', () => {
    state.inputUrl = '';
    state.selectedTestCaseIndex = -1;
    state.hasResult = false;
    state.errorMessage = '';
    state.parsedResult = null;
    render();
    root.urlInput.focus();
  });
  root.resultBody.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy-value]');
    if (!button) return;
    try {
      await navigator.clipboard.writeText(button.dataset.copyValue);
      flashButton(button, '✓ 已复制');
    } catch (error) {
      showError(`复制失败：${error.message}`);
    }
  });

  render();
  root.urlInput.focus();
}
