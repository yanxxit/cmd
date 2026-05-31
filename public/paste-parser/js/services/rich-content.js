const ASSET_PLACEHOLDER_PREFIX = '{{asset:';
const ASSET_PLACEHOLDER_SUFFIX = '}}';
const BLOCK_TAGS = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'DIV',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HR',
  'LI',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'UL',
]);

export function createAssetPlaceholder(assetId) {
  return `${ASSET_PLACEHOLDER_PREFIX}${assetId}${ASSET_PLACEHOLDER_SUFFIX}`;
}

export function inferExtensionFromMimeType(mimeType) {
  const normalized = String(mimeType || '').toLowerCase();
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
  if (normalized.includes('gif')) return 'gif';
  if (normalized.includes('webp')) return 'webp';
  if (normalized.includes('svg')) return 'svg';
  if (normalized.includes('bmp')) return 'bmp';
  return 'bin';
}

function sanitizeBaseName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^(?:[.-])+/, '')
    .replace(/(?:[.-])+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function ensureUniqueFileName(fileName, usedNames = new Set()) {
  const raw = String(fileName || 'asset.bin');
  const match = raw.match(/^(.*?)(\.[a-z0-9]+)?$/i);
  const baseName = sanitizeBaseName(match?.[1] || 'asset') || 'asset';
  const extension = (match?.[2] || '').toLowerCase();

  let candidate = `${baseName}${extension}`;
  let index = 2;

  while (usedNames.has(candidate)) {
    candidate = `${baseName}-${index}${extension}`;
    index += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

function inferNameFromUrl(src, fallback = 'image') {
  try {
    const url = new URL(src);
    const pathname = url.pathname.split('/').filter(Boolean).pop() || fallback;
    return pathname;
  } catch {
    return fallback;
  }
}

function decodeBase64ToUint8Array(base64) {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(base64, 'base64'));
  }

  throw new Error('当前环境不支持 Base64 解码');
}

export function createRichImageAsset({ src, alt = '', index = 1, usedNames = new Set(), assetDir = 'images' }) {
  const assetId = `rich-image-${index}`;
  const placeholder = createAssetPlaceholder(assetId);
  const isDataUrl = typeof src === 'string' && src.startsWith('data:');

  if (isDataUrl) {
    const match = src.match(/^data:([^;]+);base64,(.+)$/);
    const mimeType = match?.[1] || 'application/octet-stream';
    const extension = inferExtensionFromMimeType(mimeType);
    const preferredName = alt ? sanitizeBaseName(alt) : `image-${index}`;
    const fileName = ensureUniqueFileName(`${preferredName || `image-${index}`}.${extension}`, usedNames);

    return {
      assetId,
      placeholder,
      alt,
      originalSrc: src,
      clipboardSrc: src,
      exportSrc: `${assetDir}/${fileName}`,
      fileName,
      mimeType,
      sourceType: 'data-url',
      bytes: decodeBase64ToUint8Array(match?.[2] || ''),
    };
  }

  const preferredFileName = inferNameFromUrl(src, `image-${index}`);
  const fileName = ensureUniqueFileName(preferredFileName, usedNames);

  return {
    assetId,
    placeholder,
    alt,
    originalSrc: src,
    clipboardSrc: src,
    exportSrc: `${assetDir}/${fileName}`,
    fileName,
    mimeType: '',
    sourceType: 'remote-url',
  };
}

function escapeMarkdownText(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/([*_{}\[\]()#+\-.!|>])/g, '\\$1');
}

function escapeMarkdownCell(text) {
  return String(text || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function escapeMarkdownCode(text) {
  return String(text || '').replace(/`/g, '\\`');
}

function normalizeInlineSpacing(value) {
  return value
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function blocksToMarkdown(blocks) {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'heading':
          return `${'#'.repeat(Math.max(1, Math.min(6, block.depth || 1)))} ${block.text || ''}`.trim();
        case 'paragraph':
          return (block.text || '').trim();
        case 'blockquote':
          return String(block.text || '')
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n');
        case 'code': {
          const fence = '```';
          const language = block.language ? String(block.language).trim() : '';
          const text = String(block.text || '').replace(/\n+$/g, '');
          return `${fence}${language}\n${text}\n${fence}`;
        }
        case 'list':
          return (block.items || [])
            .map((item, index) => `${block.ordered ? `${index + 1}.` : '-'} ${item}`)
            .join('\n');
        case 'table': {
          const headers = block.headers || [];
          const rows = block.rows || [];
          const headerLine = `| ${headers.map(escapeMarkdownCell).join(' | ')} |`;
          const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
          const rowLines = rows.map((row) => `| ${row.map(escapeMarkdownCell).join(' | ')} |`);
          return [headerLine, separatorLine, ...rowLines].join('\n');
        }
        case 'image':
          return `![${block.alt || ''}](${block.src || ''})`;
        case 'rule':
          return '---';
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export function resolveMarkdownAssetPlaceholders(markdown, assets, mode = 'clipboard', fallbacks = {}) {
  let resolved = String(markdown || '');

  assets.forEach((asset) => {
    const target = mode === 'export'
      ? (fallbacks[asset.assetId] || asset.exportSrc || asset.originalSrc)
      : (fallbacks[asset.assetId] || asset.clipboardSrc || asset.originalSrc);
    resolved = resolved.split(asset.placeholder).join(target);
  });

  return resolved;
}

function extractCodeLanguage(codeElement) {
  const className = codeElement?.getAttribute?.('class') || '';
  const match = className.match(/language-([a-z0-9_-]+)/i);
  return match?.[1] || '';
}

function hasBlockChildren(element) {
  return Array.from(element.children || []).some((child) => BLOCK_TAGS.has(child.tagName));
}

function renderInlineChildren(node, context) {
  return normalizeInlineSpacing(
    Array.from(node.childNodes || [])
      .map((child) => renderInlineNode(child, context))
      .join('')
  );
}

function renderInlineNode(node, context) {
  if (node.nodeType === 3) {
    return escapeMarkdownText(node.textContent || '');
  }

  if (node.nodeType !== 1) {
    return '';
  }

  const tagName = node.tagName.toUpperCase();

  if (tagName === 'BR') {
    return '  \n';
  }

  if (tagName === 'IMG') {
    const src = node.getAttribute('src') || '';
    if (!src) return '';

    const asset = createRichImageAsset({
      src,
      alt: node.getAttribute('alt') || '',
      index: context.assetIndex,
      usedNames: context.usedNames,
      assetDir: context.assetDir,
    });

    context.assetIndex += 1;
    context.assets.push(asset);
    return `![${asset.alt || ''}](${asset.placeholder})`;
  }

  if (tagName === 'A') {
    const href = node.getAttribute('href') || '';
    const text = renderInlineChildren(node, context) || escapeMarkdownText(href);
    return href ? `[${text}](${href})` : text;
  }

  if (tagName === 'STRONG' || tagName === 'B') {
    return `**${renderInlineChildren(node, context)}**`;
  }

  if (tagName === 'EM' || tagName === 'I') {
    return `*${renderInlineChildren(node, context)}*`;
  }

  if (tagName === 'DEL' || tagName === 'S') {
    return `~~${renderInlineChildren(node, context)}~~`;
  }

  if (tagName === 'CODE') {
    return `\`${escapeMarkdownCode(node.textContent || '')}\``;
  }

  return renderInlineChildren(node, context);
}

function renderListBlock(listElement, context, ordered = false) {
  const items = Array.from(listElement.children || [])
    .filter((child) => child.tagName === 'LI')
    .map((item) => renderInlineChildren(item, context))
    .filter(Boolean);

  return items.length > 0 ? { type: 'list', ordered, items } : null;
}

function renderTableBlock(tableElement, context) {
  const rows = Array.from(tableElement.querySelectorAll('tr'));
  if (rows.length === 0) return null;

  const allRows = rows
    .map((row) => Array.from(row.children || []).map((cell) => renderInlineChildren(cell, context)))
    .filter((row) => row.length > 0);

  if (allRows.length === 0) return null;

  const headers = allRows[0];
  const bodyRows = allRows.slice(1);
  return { type: 'table', headers, rows: bodyRows };
}

function elementToBlocks(element, context) {
  const tagName = element.tagName.toUpperCase();

  if (tagName === 'H1' || tagName === 'H2' || tagName === 'H3' || tagName === 'H4' || tagName === 'H5' || tagName === 'H6') {
    const text = renderInlineChildren(element, context);
    return text ? [{ type: 'heading', depth: Number(tagName.slice(1)), text }] : [];
  }

  if (tagName === 'P') {
    const text = renderInlineChildren(element, context);
    return text ? [{ type: 'paragraph', text }] : [];
  }

  if (tagName === 'BLOCKQUOTE') {
    const innerBlocks = childNodesToBlocks(element, context);
    const text = blocksToMarkdown(innerBlocks);
    return text ? [{ type: 'blockquote', text }] : [];
  }

  if (tagName === 'PRE') {
    const codeElement = element.querySelector('code');
    const codeText = codeElement?.textContent || element.textContent || '';
    return codeText
      ? [{
          type: 'code',
          language: extractCodeLanguage(codeElement),
          text: codeText.replace(/\n+$/g, ''),
        }]
      : [];
  }

  if (tagName === 'UL') {
    const block = renderListBlock(element, context, false);
    return block ? [block] : [];
  }

  if (tagName === 'OL') {
    const block = renderListBlock(element, context, true);
    return block ? [block] : [];
  }

  if (tagName === 'TABLE') {
    const block = renderTableBlock(element, context);
    return block ? [block] : [];
  }

  if (tagName === 'HR') {
    return [{ type: 'rule' }];
  }

  if (tagName === 'IMG') {
    const text = renderInlineNode(element, context);
    return text ? [{ type: 'paragraph', text }] : [];
  }

  if (hasBlockChildren(element)) {
    return childNodesToBlocks(element, context);
  }

  const text = renderInlineChildren(element, context);
  return text ? [{ type: 'paragraph', text }] : [];
}

function childNodesToBlocks(root, context) {
  const blocks = [];

  Array.from(root.childNodes || []).forEach((node) => {
    if (node.nodeType === 3) {
      const text = normalizeInlineSpacing(escapeMarkdownText(node.textContent || ''));
      if (text) {
        blocks.push({ type: 'paragraph', text });
      }
      return;
    }

    if (node.nodeType !== 1) {
      return;
    }

    blocks.push(...elementToBlocks(node, context));
  });

  return blocks;
}

export function convertRichHtmlToMarkdown(html, options = {}) {
  if (typeof DOMParser === 'undefined') {
    throw new Error('当前环境不支持 DOMParser');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ''), 'text/html');
  const context = {
    assetDir: options.assetDir || 'images',
    assetIndex: 1,
    assets: [],
    usedNames: new Set(),
  };

  const blocks = childNodesToBlocks(doc.body, context);
  const placeholderMarkdown = blocksToMarkdown(blocks);

  return {
    blocks,
    assets: context.assets,
    placeholderMarkdown,
    clipboardMarkdown: resolveMarkdownAssetPlaceholders(placeholderMarkdown, context.assets, 'clipboard'),
    exportMarkdown: resolveMarkdownAssetPlaceholders(placeholderMarkdown, context.assets, 'export'),
  };
}

async function fetchRemoteAssetBytes(asset) {
  const response = await fetch(asset.originalSrc);
  if (!response.ok) {
    throw new Error(`下载失败: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export async function buildRichMarkdownZipBundle({
  markdown,
  assets,
  assetDir = 'images',
  markdownFileName = 'content.md',
  zipFactory,
}) {
  const createZip = zipFactory || (() => {
    if (typeof window === 'undefined' || typeof window.JSZip === 'undefined') {
      throw new Error('JSZip 未加载');
    }
    return new window.JSZip();
  });

  const zip = createZip();
  const assetFolder = zip.folder(assetDir);
  const exportFallbacks = {};

  for (const asset of assets) {
    try {
      const bytes = asset.sourceType === 'data-url'
        ? asset.bytes
        : await fetchRemoteAssetBytes(asset);
      assetFolder.file(asset.fileName, bytes);
      exportFallbacks[asset.assetId] = `${assetDir}/${asset.fileName}`;
    } catch {
      exportFallbacks[asset.assetId] = asset.originalSrc;
    }
  }

  const resolvedMarkdown = resolveMarkdownAssetPlaceholders(markdown, assets, 'export', exportFallbacks);
  zip.file(markdownFileName, resolvedMarkdown);

  return {
    blob: await zip.generateAsync({ type: 'blob' }),
    markdown: resolvedMarkdown,
  };
}
