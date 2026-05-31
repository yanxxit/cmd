import { marked } from 'marked';
import {
  buildRichMarkdownZipBundle,
  convertRichHtmlToMarkdown,
} from './services/rich-content.js';

/**
 * 粘贴解析工具 - JavaScript
 * 支持表格、JSON、XML、Markdown、代码、图片、文件、URL、JWT、Base64、颜色等格式
 */

// DOM 元素
const pasteArea = document.getElementById('pasteArea');
const hiddenInput = document.getElementById('hiddenInput');
const hiddenEditable = document.getElementById('hiddenEditable');
const errorMessage = document.getElementById('errorMessage');
const resultSection = document.getElementById('resultSection');
const pasteTypeIndicator = document.getElementById('pasteTypeIndicator');

// 徽章
const badges = {
  table: document.getElementById('badge-table'),
  json: document.getElementById('badge-json'),
  xml: document.getElementById('badge-xml'),
  markdown: document.getElementById('badge-markdown'),
  code: document.getElementById('badge-code'),
  text: document.getElementById('badge-text'),
  rich: document.getElementById('badge-rich'),
  image: document.getElementById('badge-image'),
  file: document.getElementById('badge-file'),
  url: document.getElementById('badge-url'),
  jwt: document.getElementById('badge-jwt'),
  base64: document.getElementById('badge-base64'),
  color: document.getElementById('badge-color')
};

// 结果容器
const results = {
  table: document.getElementById('tableResult'),
  json: document.getElementById('jsonResult'),
  xml: document.getElementById('xmlResult'),
  markdown: document.getElementById('markdownResult'),
  code: document.getElementById('codeResult'),
  text: document.getElementById('textResult'),
  rich: document.getElementById('richResult'),
  image: document.getElementById('imageResult'),
  file: document.getElementById('fileResult'),
  url: document.getElementById('urlResult'),
  jwt: document.getElementById('jwtResult'),
  base64: document.getElementById('base64Result'),
  color: document.getElementById('colorResult')
};

// 当前数据
let currentData = null;
let currentType = null;
let images = [];
let files = [];
let rawHtml = null;
let rawText = null;

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function initPasteParserApp() {

// 聚焦粘贴区域
pasteArea.addEventListener('click', () => {
  pasteArea.focus();
  highlightBadge(null);
});

pasteArea.addEventListener('focus', () => {
  pasteArea.classList.add('focused');
});

pasteArea.addEventListener('blur', () => {
  pasteArea.classList.remove('focused');
});

// 粘贴事件
pasteArea.addEventListener('paste', handlePaste);

// 拖拽事件
pasteArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  pasteArea.classList.add('dragover');
});

pasteArea.addEventListener('dragleave', () => {
  pasteArea.classList.remove('dragover');
});

pasteArea.addEventListener('drop', (e) => {
  e.preventDefault();
  pasteArea.classList.remove('dragover');
  handleDrop(e);
});

// 文件选择
hiddenInput.addEventListener('change', (e) => {
  const fileList = Array.from(e.target.files);
  if (fileList.length > 0) {
    handleFiles(fileList);
  }
});

// 清空按钮
document.getElementById('clearBtn').addEventListener('click', () => {
  resultSection.classList.remove('show');
  currentData = null;
  currentType = null;
  images = [];
  files = [];
  rawHtml = null;
  rawText = null;
  highlightBadge(null);
  pasteArea.focus();
});

// 复制结果按钮
document.getElementById('copyResultBtn').addEventListener('click', () => {
  copyCurrentResult();
});

// 重新解析表格按钮
document.getElementById('reparseTableBtn')?.addEventListener('click', () => {
  if (currentData && currentData.table) {
    const useFirstRowAsHeader = document.getElementById('useFirstRowAsHeader').checked;
    if (rawHtml) {
      parseTableHTML(rawHtml, useFirstRowAsHeader);
    } else if (rawText) {
      parseTableText(rawText, useFirstRowAsHeader);
    }
  }
});

// 监听表格选项变化
document.getElementById('useFirstRowAsHeader')?.addEventListener('change', () => {
  if (rawHtml || rawText) {
    const useFirstRowAsHeader = document.getElementById('useFirstRowAsHeader').checked;
    if (rawHtml) {
      parseTableHTML(rawHtml, useFirstRowAsHeader);
    } else if (rawText) {
      parseTableText(rawText, useFirstRowAsHeader);
    }
  }
});

// 导出 CSV 按钮
document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
  if (currentData && currentData.table) {
    exportToCSV(currentData.table);
  }
});

// 导出 JSON 按钮
document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
  if (currentData && currentData.table) {
    exportToJSON(currentData.table);
  }
});

// 复制 HTML 按钮
document.getElementById('copyTableHtmlBtn')?.addEventListener('click', () => {
  if (currentData && currentData.table) {
    const html = tableToHTML(currentData.table);
    copyToClipboard(html, 'HTML 表格');
  }
});

// 复制 Markdown 按钮
document.getElementById('copyTableMarkdownBtn')?.addEventListener('click', (event) => {
  if (currentData && currentData.table) {
    const md = tableToMarkdown(currentData.table);
    copyToClipboard(md, 'Markdown 表格', event.currentTarget);
  }
});

// 下载 Markdown 按钮
document.getElementById('downloadTableMarkdownBtn')?.addEventListener('click', () => {
  if (currentData && currentData.table) {
    downloadMarkdown(currentData.table);
  }
});

document.getElementById('copyParsedMarkdownBtn')?.addEventListener('click', (event) => {
  if (currentData?.markdown) {
    copyToClipboard(currentData.markdown, 'Markdown', event.currentTarget);
  }
});

document.getElementById('copyMdHtmlBtn')?.addEventListener('click', (event) => {
  if (currentData?.markdown) {
    copyToClipboard(marked.parse(currentData.markdown), 'HTML', event.currentTarget);
  }
});

document.getElementById('copyRichTextBtn')?.addEventListener('click', async (event) => {
  if (currentData?.rich) {
    await copyRichClipboard(currentData.rich.sanitizedHtml, currentData.rich.text, event.currentTarget);
  }
});

document.getElementById('copyRichHtmlBtn')?.addEventListener('click', (event) => {
  if (currentData?.rich) {
    copyToClipboard(currentData.rich.sanitizedHtml, 'HTML', event.currentTarget);
  }
});

document.getElementById('copyRichMarkdownBtn')?.addEventListener('click', (event) => {
  if (currentData?.rich?.clipboardMarkdown) {
    copyToClipboard(currentData.rich.clipboardMarkdown, 'Markdown', event.currentTarget);
  }
});

document.getElementById('exportRichZipBtn')?.addEventListener('click', async (event) => {
  if (!currentData?.rich?.exportMarkdown) return;

  const button = event.currentTarget;
  const originalText = button.textContent;
  button.dataset.originalText = originalText;

  button.textContent = '打包中...';
  button.disabled = true;

  try {
    const bundle = await buildRichMarkdownZipBundle({
      markdown: currentData.rich.placeholderMarkdown,
      assets: currentData.rich.assets,
      assetDir: 'images',
      markdownFileName: 'content.md',
    });
    downloadBlob(bundle.blob, 'rich-markdown-export.zip');
    flashButton(button, '✓ 已导出');
  } catch (error) {
    showError('导出 ZIP 失败：' + error.message);
    button.textContent = originalText;
  } finally {
    button.disabled = false;
  }
});

document.getElementById('copyUrlBtn')?.addEventListener('click', (event) => {
  if (currentData?.url) {
    copyToClipboard(currentData.url.href, 'URL', event.currentTarget);
  }
});

document.getElementById('openUrlBtn')?.addEventListener('click', () => {
  if (currentData?.url) {
    window.open(currentData.url.href, '_blank', 'noopener,noreferrer');
  }
});

// 选项卡切换
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const parent = tab.closest('.tab-content');
    const target = tab.dataset.target;
    parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    parent.querySelectorAll('[id^="' + target + '"]').forEach(c => {
      if (c.id.startsWith(target)) {
        c.style.display = c.id === target ? 'block' : 'none';
      }
    });
    tab.classList.add('active');
  });
});

document.getElementById('resultTable')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="remove-column"]');
  if (!button) return;
  removeTableColumn(Number(button.dataset.columnIndex));
});

document.getElementById('imageGrid')?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-image-action]');
  if (!button) return;

  const index = Number(button.dataset.imageIndex);
  if (button.dataset.imageAction === 'download') {
    downloadImage(index);
    return;
  }

  if (button.dataset.imageAction === 'copy') {
    await copyImage(index, button);
  }
});

// 处理粘贴
function handlePaste(e) {
  e.preventDefault();
  const clipboardData = e.clipboardData;
  
  // 优先检查 HTML 内容
  const html = clipboardData.getData('text/html');
  if (html) {
    if (isTableHTML(html)) {
      parseTableHTML(html);
      return;
    }
    const text = clipboardData.getData('text/plain');
    if (text && text.trim()) {
      const trimmed = text.trim();
      if (isColorCode(trimmed)) {
        parseColor(trimmed);
        return;
      }
      if (isJWT(trimmed) || isBase64(trimmed) || isURL(trimmed)) {
        detectAndParse(trimmed);
        return;
      }
    }
    parseRichText(html);
    return;
  }

  // 检查普通文本
  const text = clipboardData.getData('text/plain');
  if (text) {
    if (isTableText(text)) {
      parseTableText(text);
      return;
    }
    detectAndParse(text);
    return;
  }
  
  // 处理图片文件
  const files = clipboardData.files;
  if (files.length > 0) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const otherFiles = Array.from(files).filter(f => !f.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      handleImages(imageFiles);
      if (otherFiles.length > 0) {
        handleFiles(otherFiles);
      }
      return;
    }
    
    if (otherFiles.length > 0) {
      handleFiles(otherFiles);
      return;
    }
  }
  
  showError('未检测到可解析的内容');
}

// 处理拖拽
function handleDrop(e) {
  e.preventDefault();
  pasteArea.classList.remove('dragover');
  
  const html = e.dataTransfer.getData('text/html');
  if (html) {
    if (isTableHTML(html)) {
      parseTableHTML(html);
      return;
    } else {
      parseRichText(html);
      return;
    }
  }

  const text = e.dataTransfer.getData('text/plain');
  if (text) {
    if (isTableText(text)) {
      parseTableText(text);
      return;
    }
    detectAndParse(text);
    return;
  }
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const otherFiles = Array.from(files).filter(f => !f.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      handleImages(imageFiles);
      if (otherFiles.length > 0) {
        handleFiles(otherFiles);
      }
      return;
    }
    
    if (otherFiles.length > 0) {
      handleFiles(otherFiles);
      return;
    }
  }
  
  showError('未检测到可解析的内容');
}

// 检测并解析文本类型
function detectAndParse(text) {
  const trimmed = text.trim();
  
  if (isJWT(trimmed)) { parseJWT(trimmed); return; }
  if (isBase64(trimmed)) { parseBase64(trimmed); return; }
  if (isColorCode(trimmed)) { parseColor(trimmed); return; }
  if (isURL(trimmed)) { parseURL(trimmed); return; }
  if (isJSON(trimmed)) { parseJSON(trimmed); return; }
  if (isXML(trimmed)) { parseXML(trimmed); return; }
  if (isMarkdown(trimmed)) { parseMarkdown(trimmed); return; }
  
  const lang = detectLanguage(trimmed);
  if (lang) { parseCode(trimmed, lang); return; }
  
  if (isTableText(trimmed)) { parseTableText(trimmed); return; }
  
  parsePlainText(trimmed);
}

// ===== 检测函数 =====

function isJWT(text) {
  const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;
  return jwtRegex.test(text) && text.split('.').length === 3;
}

function isBase64(text) {
  const base64Regex = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;
  return base64Regex.test(text) && text.length > 20;
}

function isColorCode(text) {
  const colorPatterns = [
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/,
    /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
    /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/,
    /^hsl\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\)$/,
    /^hsla\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*,\s*[\d.]+\s*\)$/
  ];
  return colorPatterns.some(p => p.test(text));
}

function isURL(text) {
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  return urlPattern.test(text) || text.startsWith('http://') || text.startsWith('https://');
}

function isJSON(text) {
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null;
  } catch (e) {
    return false;
  }
}

function isXML(text) {
  return text.trim().startsWith('<') && text.includes('</');
}

function isMarkdown(text) {
  const mdPatterns = [
    /^#{1,6}\s+/m,
    /^\s*[-*+]\s+/m,
    /^\s*\d+\.\s+/m,
    /^\[.+\]\(.+\)/m,
    /^!\[.+\]\(.+\)/m,
    /^```[\s\S]*```/m,
    /^\|.*\|.*\|/m,
    /^>\s+/m
  ];
  return mdPatterns.some(p => p.test(text));
}

function isTableText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return false;

  const hasTabs = text.includes('\t');
  if (hasTabs) {
    const tabCounts = lines.map(l => (l.match(/\t/g) || []).length);
    const avgTabs = tabCounts.reduce((a, b) => a + b, 0) / tabCounts.length;
    if (avgTabs >= 1) return true;
  }

  const hasCommas = text.includes(',');
  if (hasCommas) {
    const commaCounts = lines.map(l => (l.match(/,/g) || []).length);
    const avgCommas = commaCounts.reduce((a, b) => a + b, 0) / commaCounts.length;
    if (avgCommas >= 1) return true;
  }

  const hasPipes = text.includes('|');
  if (hasPipes) {
    const pipeCounts = lines.map(l => (l.match(/\|/g) || []).length);
    const avgPipes = pipeCounts.reduce((a, b) => a + b, 0) / pipeCounts.length;
    if (avgPipes >= 2) return true;
  }

  if (lines.length >= 3) {
    const lengths = lines.map(l => l.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.abs(l - avgLength), 0) / lengths.length;
    if (variance < avgLength * 0.2 && lines[0].split(/\s{2,}/).length >= 3) {
      return true;
    }
  }

  return false;
}

function detectLanguage(text) {
  const lines = text.split('\n');
  const firstLine = lines[0].trim();
  
  if (firstLine.startsWith('#!')) {
    if (firstLine.includes('python')) return 'python';
    if (firstLine.includes('node')) return 'javascript';
    if (firstLine.includes('bash')) return 'bash';
  }

  const textLower = text.toLowerCase();
  
  if (text.includes('function ') && text.includes('=>')) return 'javascript';
  if (text.includes('import ') && text.includes('from ')) return 'javascript';
  if (text.includes('def ') && text.includes(':')) return 'python';
  if (text.includes('fn ') && text.includes('{')) return 'rust';
  if (text.includes('func ') && text.includes('(')) return 'go';
  if (text.includes('public class ') || text.includes('public static void')) return 'java';
  if (text.includes('#include')) return 'cpp';
  if (text.includes('SELECT ') && text.includes('FROM ')) return 'sql';
  if (text.includes('<!DOCTYPE html>') || text.includes('<html')) return 'html';
  if (text.includes('{') && text.includes('}') && text.includes(':')) return 'css';

  return null;
}

function sanitizeRichHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ''), 'text/html');

  doc.querySelectorAll('script, style, iframe, object, embed').forEach((element) => element.remove());
  doc.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value || '';
      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name);
      }
      if ((name === 'href' || name === 'src') && /^javascript:/i.test(value)) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return doc.body.innerHTML;
}

function flashButton(button, nextText) {
  if (!button) return;
  const originalText = button.dataset.originalText || button.textContent;
  button.dataset.originalText = originalText;
  button.textContent = nextText;
  window.setTimeout(() => {
    button.textContent = originalText;
  }, 2000);
}

async function copyRichClipboard(html, text, button) {
  try {
    if (window.ClipboardItem && navigator.clipboard?.write) {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
    } else {
      await navigator.clipboard.writeText(text);
    }
    flashButton(button, '✓ 已复制');
  } catch (error) {
    showError('复制富文本失败：' + error.message);
  }
}

// ===== 检测 HTML 表格 =====

function isTableHTML(html) {
  if (!html || typeof html !== 'string') return false;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  
  if (table) return true;
  
  const hasExcelClass = html.match(/class=["'][^"']*xl[^"']*["']/i);
  const hasMsoStyle = html.match(/mso-/i);
  const hasGoogleSheets = html.match(/google-sheets|spreadsheet/i);
  
  const hasRowStructure = html.match(/<\s*(tr|div)[^>]*class=["'][^"']*(row|xl|data)[^"']*["']/i);
  const hasCellStructure = html.match(/<\s*(td|div)[^>]*class=["'][^"']*(cell|xl|data)[^"']*["']/i);
  
  if ((hasExcelClass || hasMsoStyle || hasGoogleSheets) && (hasRowStructure || hasCellStructure)) {
    return true;
  }
  
  return false;
}

// ===== 解析函数 =====

function parseTableHTML(html, useFirstRowAsHeader = true) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let table = doc.querySelector('table');
    
    rawHtml = html;
    rawText = null;
    
    if (!table) {
      table = buildTableFromExcelFormat(html, doc);
      if (!table) {
        showError('未找到表格元素');
        return;
      }
    }

    const rows = Array.from(table.querySelectorAll('tr'));
    const tableData = { headers: [], rows: [], hasHeader: false };

    rows.forEach((row, index) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const rowData = cells.map(cell => {
        let text = cell.textContent;
        text = text.replace(/\s+/g, ' ');
        return text.trim();
      });
      
      if (rowData.length > 0) {
        if (index === 0 && useFirstRowAsHeader) {
          tableData.headers = rowData;
          tableData.hasHeader = true;
        } else {
          tableData.rows.push(rowData);
        }
      }
    });

    if (!tableData.hasHeader && tableData.rows.length > 0) {
      const colCount = Math.max(...tableData.rows.map(r => r.length));
      tableData.headers = Array.from({ length: colCount }, (_, i) => `列${i + 1}`);
    }

    const maxCols = Math.max(tableData.headers.length, ...tableData.rows.map(r => r.length));
    tableData.rows = tableData.rows.map(row => {
      const padded = [...row];
      while (padded.length < maxCols) padded.push('');
      return padded;
    });

    currentData = { table: tableData };
    currentType = 'table';

    showTableResult(tableData);
    hideError();
  } catch (err) {
    showError('解析表格失败：' + err.message);
  }
}

function buildTableFromExcelFormat(html, doc) {
  const rows = doc.querySelectorAll('[class*="row"], [class*="xl"], tr');
  
  if (rows.length === 0) return null;
  
  const table = doc.createElement('table');
  
  rows.forEach(row => {
    const tr = doc.createElement('tr');
    
    let cells = row.querySelectorAll('[class*="cell"], [class*="xl"], td, th');
    if (cells.length === 0) {
      if (row.tagName === 'DIV' || row.tagName === 'SPAN') {
        const td = doc.createElement('td');
        td.textContent = row.textContent.trim();
        tr.appendChild(td);
      }
    } else {
      cells.forEach(cell => {
        const td = doc.createElement('td');
        td.textContent = cell.textContent.trim();
        tr.appendChild(td);
      });
    }
    
    if (tr.children.length > 0) {
      table.appendChild(tr);
    }
  });
  
  return table.children.length > 0 ? table : null;
}

function parseTableText(text, useFirstRowAsHeader = true) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const delimiter = text.includes('\t') ? '\t' : text.includes('|') ? '|' : ',';
  
  rawText = text;
  rawHtml = null;

  const tableData = { headers: [], rows: [], hasHeader: false };

  lines.forEach((line, index) => {
    let cells = line.split(delimiter).map(c => c.trim());
    if (delimiter === '|') {
      cells = cells.filter(c => c !== '');
    }
    if (index === 0 && useFirstRowAsHeader) {
      tableData.headers = cells;
      tableData.hasHeader = true;
    } else {
      tableData.rows.push(cells);
    }
  });

  if (!tableData.hasHeader && tableData.rows.length > 0) {
    const colCount = Math.max(...tableData.rows.map(r => r.length));
    tableData.headers = Array.from({ length: colCount }, (_, i) => `列${i + 1}`);
  }

  if (tableData.rows.length > 0 || tableData.headers.length > 0) {
    currentData = { table: tableData };
    currentType = 'table';
    showTableResult(tableData);
    hideError();
  } else {
    parsePlainText(text);
  }
}

function parseJSON(text) {
  try {
    const parsed = JSON.parse(text);
    currentData = { json: parsed, raw: text };
    currentType = 'json';
    
    showJSONResult(parsed, text);
    hideError();
  } catch (err) {
    showError('解析 JSON 失败：' + err.message);
  }
}

function parseXML(text) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    
    if (doc.querySelector('parsererror')) {
      throw new Error('XML 解析错误');
    }

    currentData = { xml: text };
    currentType = 'xml';
    
    showXMLResult(text);
    hideError();
  } catch (err) {
    showError('解析 XML 失败：' + err.message);
  }
}

function parseMarkdown(text) {
  currentData = { markdown: text };
  currentType = 'markdown';
  
  showMarkdownResult(text);
  hideError();
}

function parseCode(text, lang) {
  currentData = { code: text, language: lang };
  currentType = 'code';
  
  showCodeResult(text, lang);
  hideError();
}

function parsePlainText(text) {
  currentData = { text: text };
  currentType = 'text';
  
  showTextResult(text);
  hideError();
}

function parseRichText(html) {
  const sanitizedHtml = sanitizeRichHtml(html);
  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizedHtml, 'text/html');
  const text = (doc.body.textContent || '').trim();
  const markdownResult = convertRichHtmlToMarkdown(sanitizedHtml);

  currentData = {
    rich: {
      html,
      sanitizedHtml,
      text,
      assets: markdownResult.assets,
      placeholderMarkdown: markdownResult.placeholderMarkdown,
      clipboardMarkdown: markdownResult.clipboardMarkdown,
      exportMarkdown: markdownResult.exportMarkdown,
    },
  };
  currentType = 'rich';

  showRichResult(currentData.rich);
  hideError();
}

function parseURL(text) {
  try {
    let urlStr = text;
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
      urlStr = 'https://' + urlStr;
    }
    const url = new URL(urlStr);
    
    currentData = { url: url, raw: text };
    currentType = 'url';
    
    showURLResult(url);
    hideError();
  } catch (err) {
    parsePlainText(text);
  }
}

function parseJWT(text) {
  try {
    const parts = text.split('.');
    if (parts.length !== 3) throw new Error('无效的 JWT 格式');
    
    const decode = (str) => {
      try {
        return JSON.parse(atob(str.replace(/-/g, '+').replace(/_/g, '/')));
      } catch (e) {
        return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
      }
    };

    const header = decode(parts[0]);
    const payload = decode(parts[1]);
    const signature = parts[2];

    currentData = { 
      jwt: { header, payload, signature },
      raw: text
    };
    currentType = 'jwt';
    
    showJWTResult(header, payload, signature, text);
    hideError();
  } catch (err) {
    showError('解码 JWT 失败：' + err.message);
  }
}

function parseBase64(text) {
  try {
    const decoded = atob(text);
    currentData = { base64: text, decoded };
    currentType = 'base64';
    
    showBase64Result(text, decoded);
    hideError();
  } catch (err) {
    showError('解码 Base64 失败：' + err.message);
  }
}

function parseColor(text) {
  currentData = { color: text };
  currentType = 'color';
  
  showColorResult(text);
  hideError();
}

function handleImages(imageFiles) {
  images = [];
  
  const promises = imageFiles.map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        images.push({
          file: file,
          dataUrl: e.target.result,
          name: file.name,
          size: file.size,
          type: file.type
        });
        resolve();
      };
      reader.readAsDataURL(file);
    });
  });

  Promise.all(promises).then(() => {
    currentData = { images };
    currentType = 'image';
    showImageResult(images);
    hideError();
  });
}

function handleFiles(fileList) {
  files = fileList.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type || 'unknown'
  }));
  
  currentData = { files };
  currentType = 'file';
  
  showFileResult(files);
  hideError();
}

// ===== 显示结果函数 =====

function showTableResult(data) {
  pasteTypeIndicator.textContent = '📊 表格';
  highlightBadge('table');
  
  const colCount = Math.max(data.headers.length, ...data.rows.map(r => r.length));
  document.getElementById('tableStats').innerHTML = `
    <div class="stat-item"><div class="stat-value">${data.rows.length}</div><div class="stat-label">数据行数</div></div>
    <div class="stat-item"><div class="stat-value">${colCount}</div><div class="stat-label">列数</div></div>
    <div class="stat-item"><div class="stat-value">${data.headers.length}</div><div class="stat-label">表头</div></div>
  `;

  const table = document.getElementById('resultTable');
  let html = '<thead><tr>';
  data.headers.forEach((h, index) => {
    html += `
      <th>
        <div class="table-header-cell">
          <span class="table-header-text">${escapeHtml(h)}</span>
          <button
            type="button"
            class="table-column-delete-btn"
            data-action="remove-column"
            data-column-index="${index}"
            title="删除这一列"
            aria-label="删除列 ${escapeHtml(h || `列${index + 1}`)}"
          >
            ×
          </button>
        </div>
      </th>
    `;
  });
  html += '</tr></thead><tbody>';
  
  data.rows.forEach(row => {
    html += '<tr>';
    for (let i = 0; i < data.headers.length; i++) {
      html += `<td>${escapeHtml(row[i] || '')}</td>`;
    }
    html += '</tr>';
  });
  html += '</tbody>';
  table.innerHTML = html;

  showResultTab('table');
  resultSection.classList.add('show');
}

function removeTableColumn(columnIndex) {
  if (!currentData?.table) return;

  const tableData = currentData.table;
  const currentColumnCount = Math.max(
    tableData.headers.length,
    ...(tableData.rows || []).map((row) => row.length),
    0
  );

  if (currentColumnCount <= 1) {
    showError('至少需要保留 1 列，无法继续删除');
    return;
  }

  tableData.headers = tableData.headers.filter((_, index) => index !== columnIndex);
  tableData.rows = tableData.rows.map((row) => row.filter((_, index) => index !== columnIndex));

  if (tableData.headers.length === 0 && tableData.rows.length > 0) {
    const nextColumnCount = Math.max(...tableData.rows.map((row) => row.length), 0);
    tableData.headers = Array.from({ length: nextColumnCount }, (_, index) => `列${index + 1}`);
  }

  currentData = { ...currentData, table: tableData };
  showTableResult(tableData);
  hideError();
}

function showJSONResult(parsed, raw) {
  pasteTypeIndicator.textContent = '🔷 JSON';
  highlightBadge('json');
  
  const keys = Object.keys(parsed);
  document.getElementById('jsonStats').innerHTML = `
    <div class="stat-item"><div class="stat-value">${keys.length}</div><div class="stat-label">顶层键</div></div>
    <div class="stat-item"><div class="stat-value">${raw.length}</div><div class="stat-label">字符数</div></div>
    <div class="stat-item"><div class="stat-value">${JSON.stringify(parsed).length}</div><div class="stat-label">压缩后</div></div>
  `;

  document.getElementById('jsonContent').innerHTML = syntaxHighlightJSON(JSON.stringify(parsed, null, 2));
  showResultTab('json');
  resultSection.classList.add('show');
}

function showXMLResult(text) {
  pasteTypeIndicator.textContent = '📝 XML';
  highlightBadge('xml');
  
  const lines = text.split('\n').length;
  document.getElementById('xmlStats').innerHTML = `
    <div class="stat-item"><div class="stat-value">${lines}</div><div class="stat-label">行数</div></div>
    <div class="stat-item"><div class="stat-value">${text.length}</div><div class="stat-label">字符数</div></div>
  `;

  document.getElementById('xmlContent').textContent = text;
  showResultTab('xml');
  resultSection.classList.add('show');
}

function showMarkdownResult(text) {
  pasteTypeIndicator.textContent = '📑 Markdown';
  highlightBadge('markdown');
  
  const lines = text.split('\n').length;
  document.getElementById('markdownStats').innerHTML = `
    <div class="stat-item"><div class="stat-value">${lines}</div><div class="stat-label">行数</div></div>
    <div class="stat-item"><div class="stat-value">${text.length}</div><div class="stat-label">字符数</div></div>
    <div class="stat-item"><div class="stat-value">${text.split(/\s+/).filter(Boolean).length}</div><div class="stat-label">词元数</div></div>
  `;

  const html = markdownToHTML(text);
  document.getElementById('mdPreview').innerHTML = html;
  document.getElementById('mdSource').textContent = text;
  
  showResultTab('markdown');
  resultSection.classList.add('show');
}

function showCodeResult(text, lang) {
  pasteTypeIndicator.textContent = '💻 ' + lang.toUpperCase();
  highlightBadge('code');
  
  const lines = text.split('\n').length;
  document.getElementById('codeStats').innerHTML = `
    <div class="stat-item"><div class="stat-value">${lines}</div><div class="stat-label">行数</div></div>
    <div class="stat-item"><div class="stat-value">${text.length}</div><div class="stat-label">字符数</div></div>
  `;

  document.getElementById('codeLang').textContent = lang;
  document.getElementById('codeContent').textContent = text;
  
  showResultTab('code');
  resultSection.classList.add('show');
}

function showTextResult(text) {
  pasteTypeIndicator.textContent = '📄 文本';
  highlightBadge('text');
  
  const lines = text.split(/\r?\n/).length;
  const words = text.split(/\s+/).filter(w => w).length;
  
  document.getElementById('textStats').innerHTML = `
    <div class="stat-item"><div class="stat-value">${lines}</div><div class="stat-label">行数</div></div>
    <div class="stat-item"><div class="stat-value">${words}</div><div class="stat-label">单词数</div></div>
    <div class="stat-item"><div class="stat-value">${text.length}</div><div class="stat-label">字符数</div></div>
  `;

  document.getElementById('textContent').textContent = text;
  showResultTab('text');
  resultSection.classList.add('show');
}

function showRichResult(richData) {
  pasteTypeIndicator.textContent = '🎨 富文本';
  highlightBadge('rich');

  const markdownText = richData.exportMarkdown || richData.clipboardMarkdown || '';
  document.getElementById('richStats').innerHTML = `
    <div class="stat-item"><div class="stat-value">${richData.text.length}</div><div class="stat-label">文本字符数</div></div>
    <div class="stat-item"><div class="stat-value">${markdownText.split(/\r?\n/).filter(Boolean).length}</div><div class="stat-label">Markdown 行数</div></div>
    <div class="stat-item"><div class="stat-value">${richData.assets.length}</div><div class="stat-label">图片资源</div></div>
  `;

  document.getElementById('richPreview').innerHTML = richData.sanitizedHtml;
  document.getElementById('richHtml').textContent = richData.sanitizedHtml;
  document.getElementById('richMarkdown').textContent = markdownText;
  
  showResultTab('rich');
  resultSection.classList.add('show');
}

function showImageResult(images) {
  pasteTypeIndicator.textContent = '🖼️ 图片';
  highlightBadge('image');
  
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  
  document.getElementById('imageStats').innerHTML = `
    <div class="stat-item"><div class="stat-value">${images.length}</div><div class="stat-label">图片数量</div></div>
    <div class="stat-item"><div class="stat-value">${(totalSize / 1024).toFixed(1)} KB</div><div class="stat-label">总大小</div></div>
  `;

  const grid = document.getElementById('imageGrid');
  grid.innerHTML = images.map((img, index) => `
    <div class="image-card">
      <img src="${img.dataUrl}" alt="${img.name}">
      <div class="image-info">
        <div>${escapeHtml(img.name)}</div>
        <div>${(img.size / 1024).toFixed(1)} KB</div>
      </div>
      <div class="image-actions">
        <button class="btn" data-image-action="download" data-image-index="${index}">下载</button>
        <button class="btn btn-outline" data-image-action="copy" data-image-index="${index}">复制</button>
      </div>
    </div>
  `).join('');

  showResultTab('image');
  resultSection.classList.add('show');
}

function showFileResult(files) {
  pasteTypeIndicator.textContent = '📁 文件';
  highlightBadge('file');
  
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  
  document.getElementById('fileStats').innerHTML = `
    <div class="stat-item"><div class="stat-value">${files.length}</div><div class="stat-label">文件数量</div></div>
    <div class="stat-item"><div class="stat-value">${(totalSize / 1024).toFixed(1)} KB</div><div class="stat-label">总大小</div></div>
  `;

  const list = document.getElementById('fileList');
  list.innerHTML = files.map((file, index) => `
    <div class="file-item">
      <div class="file-icon">📄</div>
      <div class="file-details">
        <div class="file-name">${escapeHtml(file.name)}</div>
        <div class="file-meta">${(file.size / 1024).toFixed(1)} KB · ${file.type || '未知类型'}</div>
      </div>
    </div>
  `).join('');

  showResultTab('file');
  resultSection.classList.add('show');
}

function showURLResult(url) {
  pasteTypeIndicator.textContent = '🔗 URL';
  highlightBadge('url');
  
  const queryParams = parseQueryString(url.search);
  const hashParams = parseHashParams(url.hash);
  
  let decodedUrl = url.href;
  try {
    decodedUrl = decodeURIComponent(url.href);
  } catch (e) {}
  
  const urlInfo = {
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port || '(默认)',
    pathname: url.pathname,
    search: url.search || null,
    hash: url.hash || null,
    href: url.href
  };
  
  const totalParams = Object.keys(queryParams).length + Object.keys(hashParams).length;
  
  document.getElementById('urlStats').innerHTML = `
    <div class="stat-item"><div class="stat-value">${url.href.length}</div><div class="stat-label">字符数</div></div>
    <div class="stat-item"><div class="stat-value">${Object.keys(queryParams).length}</div><div class="stat-label">Query 参数</div></div>
    <div class="stat-item"><div class="stat-value">${Object.keys(hashParams).length}</div><div class="stat-label">Hash 参数</div></div>
    <div class="stat-item"><div class="stat-value">${totalParams}</div><div class="stat-label">总参数</div></div>
  `;

  let html = '';
  
  html += `
    <div class="url-section">
      <div class="url-raw-section">
        <div class="url-raw-item">
          <div class="url-raw-label">📎 原始链接</div>
          <div class="url-raw-value text-output" style="padding: 12px; font-size: 0.85rem; word-break: break-all; white-space: pre-wrap;">${escapeHtml(url.href)}</div>
          <button class="btn btn-outline copy-raw-btn" data-value="${escapeHtml(url.href)}" style="margin-top: 10px;">📋 复制原始链接</button>
        </div>
      </div>
      
      <div class="url-raw-section">
        <div class="url-raw-item">
          <div class="url-raw-label">🔓 解码链接</div>
          <div class="url-raw-value text-output" style="padding: 12px; font-size: 0.85rem; word-break: break-all; white-space: pre-wrap;">${escapeHtml(decodedUrl)}</div>
          <button class="btn btn-outline copy-raw-btn" data-value="${escapeHtml(decodedUrl)}" style="margin-top: 10px;">📋 复制解码链接</button>
        </div>
      </div>
    </div>
  `;
  
  html += `
    <div class="url-section">
      <h3 class="url-section-title">📍 URL 基本信息</h3>
      <div class="text-output syntax-json" style="max-height: 600px;">${syntaxHighlightJSON(JSON.stringify(urlInfo, null, 2))}</div>
    </div>
  `;
  
  if (Object.keys(queryParams).length > 0) {
    html += `
      <div class="url-section">
        <h3 class="url-section-title">📊 Query 参数 (${Object.keys(queryParams).length}个)</h3>
        <div class="text-output syntax-json" style="max-height: 600px;">${syntaxHighlightJSON(JSON.stringify(queryParams, null, 2))}</div>
        <div class="url-actions">
          <button class="btn copy-json-btn" data-json='${JSON.stringify(queryParams)}'>📋 复制 Query 参数</button>
        </div>
      </div>
    `;
  }
  
  if (Object.keys(hashParams).length > 0) {
    html += `
      <div class="url-section">
        <h3 class="url-section-title">📊 Hash 参数 (${Object.keys(hashParams).length}个)</h3>
        <div class="text-output syntax-json" style="max-height: 600px;">${syntaxHighlightJSON(JSON.stringify(hashParams, null, 2))}</div>
        <div class="url-actions">
          <button class="btn copy-json-btn" data-json='${JSON.stringify(hashParams)}'>📋 复制 Hash 参数</button>
        </div>
      </div>
    `;
  }
  
  if (totalParams === 0) {
    html += `
      <div class="format-info">
        <div class="format-info-title">💡 提示</div>
        <div class="format-info-content">该 URL 没有查询参数或 hash 参数</div>
      </div>
    `;
  }

  document.getElementById('urlParts').innerHTML = html;
  
  document.getElementById('urlParts').querySelectorAll('.copy-json-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const json = btn.dataset.json;
      copyToClipboard(json, 'JSON');
    });
  });
  
  document.getElementById('urlParts').querySelectorAll('.copy-raw-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      copyToClipboard(value, '链接');
    });
  });

  showResultTab('url');
  resultSection.classList.add('show');
}

function parseQueryString(searchString) {
  const params = {};
  if (!searchString) return params;
  
  const search = searchString.startsWith('?') ? searchString.substring(1) : searchString;
  if (!search) return params;
  
  try {
    const decoded = decodeURIComponent(search);
    parseParamsString(decoded, params);
  } catch (e) {
    parseParamsString(search, params);
  }
  
  return params;
}

function parseHashParams(hashString) {
  const params = {};
  if (!hashString) return params;
  
  const hash = hashString.startsWith('#') ? hashString.substring(1) : hashString;
  if (!hash) return params;
  
  try {
    const decoded = decodeURIComponent(hash);
    parseParamsString(decoded, params);
  } catch (e) {
    parseParamsString(hash, params);
  }
  
  return params;
}

function parseParamsString(str, paramsObj) {
  str.split('&').forEach(param => {
    if (!param) return;
    const [key, ...valueParts] = param.split('=');
    const value = valueParts.join('=');
    
    if (key) {
      const decodedKey = key.trim();
      const decodedValue = value ? value.trim() : '';
      paramsObj[decodedKey] = decodedValue;
    }
  });
}

function showJWTResult(header, payload, signature, raw) {
  pasteTypeIndicator.textContent = '🔐 JWT';
  highlightBadge('jwt');
  
  document.getElementById('jwtStats').innerHTML = `
    <div class="stat-item"><div class="stat-value">${Object.keys(header).length}</div><div class="stat-label">Header 字段</div></div>
    <div class="stat-item"><div class="stat-value">${Object.keys(payload).length}</div><div class="stat-label">Payload 字段</div></div>
    <div class="stat-item"><div class="stat-value">${raw.length}</div><div class="stat-label">总长度</div></div>
  `;

  document.getElementById('jwtParts').innerHTML = `
    <div class="jwt-part">
      <div class="jwt-part-header">
        <span class="jwt-part-title">Header</span>
      </div>
      <div class="jwt-part-content">${JSON.stringify(header, null, 2)}</div>
    </div>
    <div class="jwt-part">
      <div class="jwt-part-header">
        <span class="jwt-part-title">Payload</span>
      </div>
      <div class="jwt-part-content">${JSON.stringify(payload, null, 2)}</div>
    </div>
    <div class="jwt-part">
      <div class="jwt-part-header">
        <span class="jwt-part-title">Signature</span>
      </div>
      <div class="jwt-part-content">${signature}</div>
    </div>
  `;

  showResultTab('jwt');
  resultSection.classList.add('show');
}

function showBase64Result(encoded, decoded) {
  pasteTypeIndicator.textContent = '📦 Base64';
  highlightBadge('base64');
  
  document.getElementById('base64Encode').textContent = encoded;
  document.getElementById('base64Decode').textContent = decoded;
  
  showResultTab('base64');
  resultSection.classList.add('show');
}

function showColorResult(color) {
  pasteTypeIndicator.textContent = '🎨 颜色';
  highlightBadge('color');
  
  const formats = convertColorFormats(color);
  
  const preview = document.getElementById('colorPreview');
  preview.innerHTML = `
    <div class="color-box" style="background-color: ${color}"></div>
    <div class="color-info">
      <div class="color-value">${color}</div>
      <div class="color-formats">
        <span class="color-format" title="十六进制（6 位）" data-color="${formats.hex}">${formats.hex}</span>
        ${formats.hex3 ? `<span class="color-format" title="十六进制（3 位）" data-color="${formats.hex3}">${formats.hex3}</span>` : ''}
        <span class="color-format" title="十六进制（8 位，带透明度）" data-color="${formats.hex8}">${formats.hex8}</span>
        <span class="color-format" title="RGB" data-color="${formats.rgb}">${formats.rgb}</span>
        <span class="color-format" title="RGBA" data-color="${formats.rgba}">${formats.rgba}</span>
        <span class="color-format" title="HSL" data-color="${formats.hsl}">${formats.hsl}</span>
        <span class="color-format" title="HSLA" data-color="${formats.hsla}">${formats.hsla}</span>
      </div>
    </div>
  `;

  preview.querySelectorAll('.color-format').forEach(span => {
    span.addEventListener('click', () => {
      const colorValue = span.dataset.color;
      copyToClipboard(colorValue, '颜色值');
    });
  });

  document.getElementById('colorCode').textContent = color;
  
  showResultTab('color');
  resultSection.classList.add('show');
}

// ===== 辅助函数 =====

function parseColorToRGBA(color) {
  let r = 0, g = 0, b = 0, a = 1;
  
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = parseInt(hex.slice(6, 8), 16) / 255;
    }
  } else if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
      a = match[4] !== undefined ? parseFloat(match[4]) : 1;
    }
  } else if (color.startsWith('hsl')) {
    const match = color.match(/hsla?\s*\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/);
    if (match) {
      const h = parseInt(match[1]) / 360;
      const s = parseFloat(match[2]) / 100;
      const l = parseFloat(match[3]) / 100;
      a = match[4] !== undefined ? parseFloat(match[4]) : 1;
      const rgb = hslToRgb(h, s, l);
      r = rgb[0];
      g = rgb[1];
      b = rgb[2];
    }
  }
  
  return { r, g, b, a };
}

function hslToRgb(h, s, l) {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function convertColorFormats(color) {
  const rgba = parseColorToRGBA(color);
  const { r, g, b, a } = rgba;
  const hsl = rgbToHsl(r, g, b);
  
  const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  let hex3 = null;
  if (r % 17 === 0 && g % 17 === 0 && b % 17 === 0) {
    hex3 = '#' + [r, g, b].map(x => (x / 17).toString(16)).join('').toUpperCase();
  }
  
  const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase();
  const hex8 = hex + alphaHex;
  
  return {
    hex: hex,
    hex3: hex3,
    hex8: hex8,
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgba: `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`,
    hsl: `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`,
    hsla: `hsla(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%, ${a.toFixed(2)})`
  };
}

function exportToCSV(tableData) {
  const { headers, rows } = tableData;
  
  let csv = headers.map(h => escapeCSV(h)).join(',') + '\n';
  
  rows.forEach(row => {
    csv += row.map(cell => escapeCSV(cell)).join(',') + '\n';
  });

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, 'table_export.csv');
}

function escapeCSV(text) {
  if (text === null || text === undefined) return '';
  const str = String(text);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function exportToJSON(tableData) {
  const { headers, rows } = tableData;
  
  const jsonData = rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] !== undefined ? row[i] : '';
    });
    return obj;
  });

  const jsonStr = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, 'table_export.json');
}

function tableToMarkdown(tableData) {
  const { headers, rows } = tableData;
  
  let md = '| ' + headers.map(h => escapeMarkdown(h)).join(' | ') + ' |\n';
  md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
  
  rows.forEach(row => {
    md += '| ' + row.map(cell => escapeMarkdown(cell)).join(' | ') + ' |\n';
  });

  return md;
}

function downloadMarkdown(tableData) {
  const md = tableToMarkdown(tableData);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, 'table_export.md');
}

function escapeMarkdown(text) {
  if (text === null || text === undefined) return '';
  const str = String(text);
  return str.replace(/\|/g, '\\|').replace(/\n/g, ' ').replace(/\r/g, '');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function tableToHTML(tableData) {
  const { headers, rows } = tableData;
  
  let html = '<table>\n<thead>\n<tr>';
  headers.forEach(h => {
    html += `<th>${escapeHtml(h)}</th>`;
  });
  html += '</tr>\n</thead>\n<tbody>\n';
  
  rows.forEach(row => {
    html += '<tr>';
    for (let i = 0; i < headers.length; i++) {
      html += `<td>${escapeHtml(row[i] || '')}</td>`;
    }
    html += '</tr>\n';
  });
  html += '</tbody>\n</table>';
  
  return html;
}

function showResultTab(type) {
  Object.values(results).forEach(r => r.classList.remove('active'));
  if (results[type]) results[type].classList.add('active');
}

function highlightBadge(type) {
  Object.values(badges).forEach(b => b.classList.remove('active'));
  if (badges[type]) badges[type].classList.add('active');
}

function syntaxHighlightJSON(json) {
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
    let cls = 'json-number';
    if (/^"/.test(match)) {
      cls = /:$/.test(match) ? 'json-key' : 'json-string';
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

function markdownToHTML(md) {
  return marked.parse(String(md || ''));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.add('show');
}

function hideError() {
  errorMessage.classList.remove('show');
}

function copyCurrentResult() {
  if (!currentData) return;

  if (currentData.json) {
    copyToClipboard(JSON.stringify(currentData.json, null, 2), 'JSON');
  } else if (currentData.xml) {
    copyToClipboard(currentData.xml, 'XML');
  } else if (currentData.markdown) {
    copyToClipboard(currentData.markdown, 'Markdown');
  } else if (currentData.code) {
    copyToClipboard(currentData.code, '代码');
  } else if (currentData.text) {
    copyToClipboard(currentData.text, '文本');
  } else if (currentData.url) {
    copyToClipboard(currentData.url.href, 'URL');
  } else if (currentData.jwt) {
    copyToClipboard(currentData.raw, 'JWT');
  } else if (currentData.base64) {
    copyToClipboard(currentData.base64, 'Base64');
  } else if (currentData.color) {
    copyToClipboard(currentData.color, '颜色');
  } else if (currentData.rich?.clipboardMarkdown) {
    copyToClipboard(currentData.rich.clipboardMarkdown, 'Markdown');
  } else if (currentData.table) {
    copyToClipboard(tableToMarkdown(currentData.table), 'Markdown 表格');
  }
}

function copyToClipboard(text, label, button) {
  navigator.clipboard.writeText(text).then(() => {
    flashButton(button || document.getElementById('copyResultBtn'), '✓ 已复制');
  }).catch(err => {
    showError('复制失败：' + err.message);
  });
}

function downloadImage(index) {
  const img = images[index];
  if (!img) return;
  const a = document.createElement('a');
  a.href = img.dataUrl;
  a.download = img.name || 'image.png';
  a.click();
}

async function copyImage(index, button) {
  const img = images[index];
  if (!img) return;
  try {
    const response = await fetch(img.dataUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    flashButton(button, '✓ 已复制');
  } catch (err) {
    showError('复制图片失败：' + err.message);
  }
}

// 页面加载后聚焦
window.setTimeout(() => {
  pasteArea.focus();
}, 0);
}
