// Shared URL parsing and building helpers.
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isJSONValue(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return false;

  try {
    const parsed = JSON.parse(trimmed);
    return !!parsed && typeof parsed === 'object';
  } catch {
    return false;
  }
}

export function normalizeJSONValue(value, asJSON = false) {
  if (!asJSON || !isJSONValue(value)) {
    return String(value ?? '');
  }

  return JSON.stringify(JSON.parse(value));
}

export function tryParseJSONValue(value) {
  const normalized = String(value ?? '').trim();
  if (!isJSONValue(normalized)) {
    return value;
  }

  try {
    return JSON.parse(normalized);
  } catch {
    return value;
  }
}

export function parseParamsString(str) {
  const params = {};
  String(str || '')
    .split('&')
    .forEach((segment) => {
      if (!segment) return;
      const [key, ...valueParts] = segment.split('=');
      if (!key) return;
      const rawValue = valueParts.join('=').trim();
      params[key.trim()] = tryParseJSONValue(rawValue);
    });
  return params;
}

export function parseQueryString(searchString) {
  if (!searchString) return {};
  const search = String(searchString).startsWith('?') ? String(searchString).slice(1) : String(searchString);
  if (!search) return {};

  try {
    return parseParamsString(decodeURIComponent(search));
  } catch {
    return parseParamsString(search);
  }
}

export function parseHashParams(hashString) {
  if (!hashString) return {};
  const hash = String(hashString).startsWith('#') ? String(hashString).slice(1) : String(hashString);
  if (!hash) return {};

  try {
    return parseParamsString(decodeURIComponent(hash));
  } catch {
    return parseParamsString(hash);
  }
}

export function parseUrlInput(inputUrl) {
  const text = String(inputUrl || '').trim();
  if (!text) {
    throw new Error('请输入 URL 链接');
  }

  const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  const url = new URL(candidate);

  let decodedUrl = url.href;
  try {
    decodedUrl = decodeURIComponent(url.href);
  } catch {
    decodedUrl = url.href;
  }

  const queryParams = parseQueryString(url.search);
  const hashParams = parseHashParams(url.hash);
  const queryCount = Object.keys(queryParams).length;
  const hashCount = Object.keys(hashParams).length;

  return {
    originalUrl: url.href,
    decodedUrl,
    queryParams,
    hashParams,
    urlInfo: {
      protocol: url.protocol,
      host: url.host,
      hostname: url.hostname,
      port: url.port || '(默认)',
      pathname: url.pathname,
      search: url.search || null,
      hash: url.hash || null,
      href: url.href,
    },
    stats: {
      length: url.href.length,
      queryCount,
      hashCount,
      totalCount: queryCount + hashCount,
    },
  };
}

export function syntaxHighlightJSON(json) {
  return escapeHtml(String(json ?? '')).replace(
    /(&quot;(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\&]|&(?!quot;))*(?:&quot;)(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (/^&quot;/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export function generateParamId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEditableParam(param = {}) {
  return {
    id: param.id || generateParamId(),
    key: param.key || '',
    value: param.value || '',
    encode: Boolean(param.encode),
    asJSON: Boolean(param.asJSON),
  };
}

export function createEmptyEditableParam() {
  return createEditableParam();
}

export function createEditableParamList(list = []) {
  return list.map((item) => createEditableParam(item));
}

export function buildUrlFromEditorState({ baseUrl = '', pathname = '', queryParams = [], hashParams = [] }) {
  let url = String(baseUrl || '').trim();
  const normalizedPath = String(pathname || '').trim();

  if (normalizedPath) {
    if (!url.endsWith('/') && !normalizedPath.startsWith('/')) {
      url += '/';
    }
    url += normalizedPath;
  }

  const buildSegments = (params) =>
    params
      .filter((param) => String(param.key || '').trim())
      .map((param) => {
        const normalizedValue = normalizeJSONValue(param.value, param.asJSON);
        const encodedValue = param.encode ? encodeURIComponent(normalizedValue) : normalizedValue;
        return `${encodeURIComponent(String(param.key).trim())}=${encodedValue}`;
      });

  const querySegments = buildSegments(queryParams);
  if (querySegments.length > 0) {
    url += `?${querySegments.join('&')}`;
  }

  const hashSegments = buildSegments(hashParams);
  if (hashSegments.length > 0) {
    url += `#${hashSegments.join('&')}`;
  }

  return url;
}

export function buildEditorStats(fullUrl, queryParams, hashParams) {
  return {
    length: String(fullUrl || '').length,
    queryCount: queryParams.length,
    hashCount: hashParams.length,
  };
}
