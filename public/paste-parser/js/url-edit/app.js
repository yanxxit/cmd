import { urlEditorTestCases } from '../services/url-test-cases.js';
import {
  buildEditorStats,
  buildUrlFromEditorState,
  createEditableParamList,
  createEmptyEditableParam,
  escapeHtml,
  isJSONValue,
} from '../services/url-tools.js';

const defaultState = () => ({
  baseUrl: 'https://example.com',
  pathname: '/api/search',
  queryParams: [],
  hashParams: [],
  fullUrl: '',
  selectedTestCaseIndex: -1,
  showSuccess: false,
  successMessage: '',
  errorMessage: '',
});

const state = defaultState();

function flashMessage(type, message) {
  if (type === 'success') {
    state.successMessage = message;
    state.showSuccess = true;
    render();
    window.setTimeout(() => {
      state.showSuccess = false;
      render();
    }, 2400);
    return;
  }

  state.errorMessage = message;
  render();
  window.setTimeout(() => {
    state.errorMessage = '';
    render();
  }, 2400);
}

function updatePreview() {
  try {
    state.fullUrl = buildUrlFromEditorState({
      baseUrl: state.baseUrl,
      pathname: state.pathname,
      queryParams: state.queryParams,
      hashParams: state.hashParams,
    });
    state.errorMessage = '';
  } catch (error) {
    state.errorMessage = `生成 URL 失败：${error.message}`;
  }
}

function renderOptions(root) {
  root.testCaseSelect.innerHTML = [
    '<option value="-1">-- 请选择测试案例 --</option>',
    ...urlEditorTestCases.map(
      (item, index) =>
        `<option value="${index}" ${state.selectedTestCaseIndex === index ? 'selected' : ''}>${escapeHtml(
          `${item.icon} ${item.name} (${item.categoryName})`
        )}</option>`
    ),
  ].join('');
}

function renderParamList(params, kind) {
  return params
    .map(
      (param, index) => `
        <div class="param-item" data-param-kind="${kind}" data-param-id="${param.id}">
          <div class="param-row">
            <div>
              <div class="param-label">参数名</div>
              <input class="text-input" type="text" data-field="key" value="${escapeHtml(param.key)}" placeholder="key">
            </div>
            <div>
              <div class="param-label">参数值</div>
              <input class="text-input" type="text" data-field="value" value="${escapeHtml(param.value)}" placeholder="value">
              <div class="checkbox-wrapper">
                <input type="checkbox" id="${kind}-encode-${param.id}" data-field="encode" ${param.encode ? 'checked' : ''}>
                <label for="${kind}-encode-${param.id}">URL 编码（encodeURIComponent）</label>
              </div>
              <div class="checkbox-wrapper">
                <input type="checkbox" id="${kind}-json-${param.id}" data-field="asJSON" ${param.asJSON ? 'checked' : ''}>
                <label for="${kind}-json-${param.id}">JSON 转 String（JSON.stringify）</label>
              </div>
              ${
                param.asJSON && isJSONValue(param.value)
                  ? '<div class="hint-text">ℹ️ 将自动执行 JSON.stringify() 后再进行 URL 编码。</div>'
                  : ''
              }
            </div>
            <div>
              <div class="param-label">操作</div>
              <div class="param-actions">
                <button class="btn btn-sm btn-danger" type="button" data-action="remove-param" data-index="${index}" data-kind="${kind}">删除</button>
              </div>
            </div>
          </div>
        </div>
      `
    )
    .join('');
}

function render() {
  const root = window.__pasteParserUrlEditorRoot;
  if (!root) return;

  updatePreview();
  renderOptions(root);
  root.baseUrl.value = state.baseUrl;
  root.pathname.value = state.pathname;
  root.queryParamsList.innerHTML = renderParamList(state.queryParams, 'query');
  root.hashParamsList.innerHTML = renderParamList(state.hashParams, 'hash');
  root.previewBox.textContent = state.fullUrl;
  root.useCaseButton.disabled = state.selectedTestCaseIndex < 0;
  root.successBox.classList.toggle('hidden', !state.showSuccess);
  root.successText.textContent = state.successMessage;
  root.errorBox.classList.toggle('hidden', !state.errorMessage);
  root.errorText.textContent = state.errorMessage;

  const stats = buildEditorStats(state.fullUrl, state.queryParams, state.hashParams);
  root.stats.innerHTML = `
    <div class="stat-item"><div class="stat-value">${stats.length}</div><div class="stat-label">总字符数</div></div>
    <div class="stat-item"><div class="stat-value">${stats.queryCount}</div><div class="stat-label">Query 参数</div></div>
    <div class="stat-item"><div class="stat-value">${stats.hashCount}</div><div class="stat-label">Hash 参数</div></div>
  `;
}

function loadTestCase() {
  if (state.selectedTestCaseIndex < 0) return;
  const testCase = urlEditorTestCases[state.selectedTestCaseIndex];
  state.baseUrl = testCase.baseUrl;
  state.pathname = testCase.pathname;
  state.queryParams = createEditableParamList(testCase.queryParams);
  state.hashParams = createEditableParamList(testCase.hashParams);
  render();
  flashMessage('success', '模板已加载');
}

function resetState() {
  const fresh = defaultState();
  Object.assign(state, fresh);
  render();
}

function bindParamMutation(event, kind) {
  const item = event.target.closest(`[data-param-kind="${kind}"]`);
  if (!item) return;

  const list = kind === 'query' ? state.queryParams : state.hashParams;
  const target = list.find((param) => param.id === item.dataset.paramId);
  if (!target) return;

  if (event.target.matches('[data-field="key"]')) {
    target.key = event.target.value;
  } else if (event.target.matches('[data-field="value"]')) {
    target.value = event.target.value;
  } else if (event.target.matches('[data-field="encode"]')) {
    target.encode = event.target.checked;
  } else if (event.target.matches('[data-field="asJSON"]')) {
    target.asJSON = event.target.checked;
  }

  render();
}

export function initUrlEditorPage() {
  const root = {
    addHashButton: document.querySelector('#urlEditAddHashButton'),
    addQueryButton: document.querySelector('#urlEditAddQueryButton'),
    baseUrl: document.querySelector('#urlEditBaseUrl'),
    clearButton: document.querySelector('#urlEditClearButton'),
    copyButton: document.querySelector('#urlEditCopyButton'),
    errorBox: document.querySelector('#urlEditErrorBox'),
    errorText: document.querySelector('#urlEditErrorText'),
    hashParamsList: document.querySelector('#urlEditHashParamsList'),
    pathname: document.querySelector('#urlEditPathname'),
    previewBox: document.querySelector('#urlEditPreviewBox'),
    queryParamsList: document.querySelector('#urlEditQueryParamsList'),
    stats: document.querySelector('#urlEditStats'),
    successBox: document.querySelector('#urlEditSuccessBox'),
    successText: document.querySelector('#urlEditSuccessText'),
    testCaseSelect: document.querySelector('#urlEditTestCaseSelect'),
    useCaseButton: document.querySelector('#urlEditUseCaseButton'),
  };

  window.__pasteParserUrlEditorRoot = root;

  root.testCaseSelect.addEventListener('change', (event) => {
    state.selectedTestCaseIndex = Number(event.target.value);
    render();
  });
  root.useCaseButton.addEventListener('click', loadTestCase);
  root.baseUrl.addEventListener('input', (event) => {
    state.baseUrl = event.target.value;
    render();
  });
  root.pathname.addEventListener('input', (event) => {
    state.pathname = event.target.value;
    render();
  });
  root.addQueryButton.addEventListener('click', () => {
    state.queryParams.push(createEmptyEditableParam());
    render();
  });
  root.addHashButton.addEventListener('click', () => {
    state.hashParams.push(createEmptyEditableParam());
    render();
  });
  root.clearButton.addEventListener('click', resetState);
  root.copyButton.addEventListener('click', async () => {
    if (!state.fullUrl) {
      flashMessage('error', '请先生成 URL');
      return;
    }

    try {
      await navigator.clipboard.writeText(state.fullUrl);
      flashMessage('success', 'URL 已复制到剪贴板');
    } catch (error) {
      flashMessage('error', `复制失败：${error.message}`);
    }
  });

  root.queryParamsList.addEventListener('input', (event) => bindParamMutation(event, 'query'));
  root.queryParamsList.addEventListener('change', (event) => bindParamMutation(event, 'query'));
  root.hashParamsList.addEventListener('input', (event) => bindParamMutation(event, 'hash'));
  root.hashParamsList.addEventListener('change', (event) => bindParamMutation(event, 'hash'));

  const removeHandler = (event) => {
    const button = event.target.closest('[data-action="remove-param"]');
    if (!button) return;
    const index = Number(button.dataset.index);
    if (button.dataset.kind === 'query') {
      state.queryParams.splice(index, 1);
    } else {
      state.hashParams.splice(index, 1);
    }
    render();
  };
  root.queryParamsList.addEventListener('click', removeHandler);
  root.hashParamsList.addEventListener('click', removeHandler);

  render();
}
