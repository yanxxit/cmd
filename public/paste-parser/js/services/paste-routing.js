export const AUTO_PARSE_TYPE = 'auto';

export const PASTE_TYPE_LABELS = {
  table: '📊 表格',
  json: '🔷 JSON',
  xml: '📝 XML',
  markdown: '📑 Markdown',
  code: '💻 代码',
  text: '📄 文本',
  rich: '🎨 富文本',
  image: '🖼️ 图片',
  file: '📁 文件',
  url: '🔗 URL',
  jwt: '🔐 JWT',
  base64: '📦 Base64',
  color: '🎨 颜色',
};

const FORCE_SUPPORTED_TYPES = new Set(Object.keys(PASTE_TYPE_LABELS));

function normalizeText(text) {
  return String(text || '').trim();
}

export function normalizeSelectedParseType(type) {
  if (type === AUTO_PARSE_TYPE) return AUTO_PARSE_TYPE;
  return FORCE_SUPPORTED_TYPES.has(type) ? type : AUTO_PARSE_TYPE;
}

export function getParseModeLabel(type) {
  const normalized = normalizeSelectedParseType(type);
  if (normalized === AUTO_PARSE_TYPE) {
    return '自动识别粘贴内容';
  }
  return `强制按 ${PASTE_TYPE_LABELS[normalized]} 解析`;
}

export function decideTextAction(text, helpers) {
  const trimmed = normalizeText(text);
  if (!trimmed) {
    return { kind: 'error', message: '未检测到可解析的文本内容' };
  }

  if (helpers.isJWT(trimmed)) return { kind: 'jwt', text: trimmed };
  if (helpers.isBase64(trimmed)) return { kind: 'base64', text: trimmed };
  if (helpers.isColorCode(trimmed)) return { kind: 'color', text: trimmed };
  if (helpers.isURL(trimmed)) return { kind: 'url', text: trimmed };
  if (helpers.isJSON(trimmed)) return { kind: 'json', text: trimmed };
  if (helpers.isXML(trimmed)) return { kind: 'xml', text: trimmed };
  if (helpers.isMarkdown(trimmed)) return { kind: 'markdown', text: trimmed };

  const language = helpers.detectLanguage(trimmed);
  if (language) {
    return { kind: 'code', text: trimmed, language };
  }

  if (helpers.isTableText(trimmed)) {
    return { kind: 'table-text', text: trimmed };
  }

  return { kind: 'text', text: trimmed };
}

function buildTextForForcedType(selectedType, payload, helpers) {
  const directText = normalizeText(payload.text);
  if (directText) return directText;

  if (payload.html && typeof helpers.extractTextFromHtml === 'function') {
    return normalizeText(helpers.extractTextFromHtml(payload.html));
  }

  return '';
}

function createFilesAction(files = []) {
  const imageFiles = files.filter((file) => String(file.type || '').startsWith('image/'));
  if (imageFiles.length > 0) {
    return { kind: 'image', files: imageFiles };
  }

  if (files.length > 0) {
    return { kind: 'file', files };
  }

  return null;
}

function decideForcedAction(payload, helpers) {
  const selectedType = normalizeSelectedParseType(payload.selectedType);
  const files = Array.isArray(payload.files) ? payload.files : [];

  if (selectedType === 'image') {
    const imageFiles = files.filter((file) => String(file.type || '').startsWith('image/'));
    if (imageFiles.length > 0) {
      return { kind: 'image', files: imageFiles };
    }
    return { kind: 'error', message: '当前内容不包含图片，无法按图片解析' };
  }

  if (selectedType === 'file') {
    if (files.length > 0) {
      return { kind: 'file', files };
    }
    return { kind: 'error', message: '当前内容不包含文件，无法按文件解析' };
  }

  if (selectedType === 'rich') {
    if (payload.html) {
      return { kind: 'rich', html: payload.html };
    }
    return { kind: 'error', message: '当前内容不包含富文本 HTML，无法按富文本解析' };
  }

  if (selectedType === 'table') {
    if (payload.html && helpers.isTableHTML(payload.html)) {
      return { kind: 'table-html', html: payload.html };
    }
    const tableText = buildTextForForcedType(selectedType, payload, helpers);
    if (tableText) {
      return { kind: 'table-text', text: tableText };
    }
    return { kind: 'error', message: '当前内容不包含可解析的表格文本' };
  }

  const text = buildTextForForcedType(selectedType, payload, helpers);
  if (!text) {
    return { kind: 'error', message: '当前内容不包含可解析的文本内容' };
  }

  switch (selectedType) {
    case 'json':
    case 'xml':
    case 'markdown':
    case 'text':
    case 'url':
    case 'jwt':
    case 'base64':
    case 'color':
      return { kind: selectedType, text };
    case 'code':
      return { kind: 'code', text, language: helpers.detectLanguage(text) || 'text' };
    default:
      return decideTextAction(text, helpers);
  }
}

export function decidePasteAction(payload, helpers) {
  const selectedType = normalizeSelectedParseType(payload.selectedType);
  if (selectedType !== AUTO_PARSE_TYPE) {
    return decideForcedAction({ ...payload, selectedType }, helpers);
  }

  const files = Array.isArray(payload.files) ? payload.files : [];
  if (payload.html) {
    if (helpers.isTableHTML(payload.html)) {
      return { kind: 'table-html', html: payload.html };
    }

    const inlineTextAction = decideTextAction(payload.text, helpers);
    if (inlineTextAction.kind === 'color' || inlineTextAction.kind === 'jwt' || inlineTextAction.kind === 'base64' || inlineTextAction.kind === 'url') {
      return inlineTextAction;
    }

    return { kind: 'rich', html: payload.html };
  }

  const text = normalizeText(payload.text);
  if (text) {
    return decideTextAction(text, helpers);
  }

  const filesAction = createFilesAction(files);
  if (filesAction) {
    return filesAction;
  }

  return { kind: 'error', message: '未检测到可解析的内容' };
}
