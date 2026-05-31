import { describe, expect, it } from 'vitest';
import {
  AUTO_PARSE_TYPE,
  decidePasteAction,
  decideTextAction,
  getParseModeLabel,
  normalizeSelectedParseType,
} from '../public/paste-parser/js/services/paste-routing.js';

const helpers = {
  isJWT: (text) => text === 'header.payload.signature',
  isBase64: (text) => text === 'YWJjZGVmZ2hpamtsbW5vcHFyc3Q=',
  isColorCode: (text) => text === '#667EEA',
  isURL: (text) => text === 'https://example.com',
  isJSON: (text) => text.startsWith('{'),
  isXML: (text) => text.startsWith('<root>'),
  isMarkdown: (text) => text.startsWith('# '),
  isTableText: (text) => text.includes('\t'),
  isTableHTML: (html) => html.includes('<table'),
  detectLanguage: (text) => (text.includes('const ') ? 'javascript' : null),
  extractTextFromHtml: (html) => html.replace(/<[^>]+>/g, ' ').trim(),
};

describe('paste parser routing', () => {
  it('normalizes parse mode selection and labels', () => {
    expect(normalizeSelectedParseType('json')).toBe('json');
    expect(normalizeSelectedParseType('unknown')).toBe(AUTO_PARSE_TYPE);
    expect(getParseModeLabel(AUTO_PARSE_TYPE)).toBe('自动识别粘贴内容');
    expect(getParseModeLabel('markdown')).toContain('Markdown');
  });

  it('detects text content automatically', () => {
    expect(decideTextAction('{"ok":true}', helpers)).toEqual({
      kind: 'json',
      text: '{"ok":true}',
    });

    expect(decideTextAction('const answer = 42;', helpers)).toEqual({
      kind: 'code',
      text: 'const answer = 42;',
      language: 'javascript',
    });
  });

  it('prefers table html over rich text in auto mode', () => {
    expect(
      decidePasteAction(
        {
          selectedType: AUTO_PARSE_TYPE,
          html: '<table><tr><td>1</td></tr></table>',
          text: '1\t2',
          files: [],
        },
        helpers
      )
    ).toEqual({
      kind: 'table-html',
      html: '<table><tr><td>1</td></tr></table>',
    });
  });

  it('keeps special text detection ahead of html rich parsing in auto mode', () => {
    expect(
      decidePasteAction(
        {
          selectedType: AUTO_PARSE_TYPE,
          html: '<div><a href="https://example.com">example</a></div>',
          text: 'https://example.com',
          files: [],
        },
        helpers
      )
    ).toEqual({
      kind: 'url',
      text: 'https://example.com',
    });
  });

  it('forces requested parser when a type is preselected', () => {
    expect(
      decidePasteAction(
        {
          selectedType: 'json',
          text: '{"forced":true}',
          html: '',
          files: [],
        },
        helpers
      )
    ).toEqual({
      kind: 'json',
      text: '{"forced":true}',
    });

    expect(
      decidePasteAction(
        {
          selectedType: 'code',
          text: 'const forced = true;',
          html: '',
          files: [],
        },
        helpers
      )
    ).toEqual({
      kind: 'code',
      text: 'const forced = true;',
      language: 'javascript',
    });
  });

  it('returns clear errors when forced content is unavailable', () => {
    expect(
      decidePasteAction(
        {
          selectedType: 'rich',
          text: 'plain text only',
          html: '',
          files: [],
        },
        helpers
      )
    ).toEqual({
      kind: 'error',
      message: '当前内容不包含富文本 HTML，无法按富文本解析',
    });

    expect(
      decidePasteAction(
        {
          selectedType: 'image',
          text: '',
          html: '',
          files: [],
        },
        helpers
      )
    ).toEqual({
      kind: 'error',
      message: '当前内容不包含图片，无法按图片解析',
    });
  });

  it('routes clipboard files to image or file results', () => {
    expect(
      decidePasteAction(
        {
          selectedType: AUTO_PARSE_TYPE,
          text: '',
          html: '',
          files: [{ name: 'shot.png', type: 'image/png' }],
        },
        helpers
      )
    ).toEqual({
      kind: 'image',
      files: [{ name: 'shot.png', type: 'image/png' }],
    });

    expect(
      decidePasteAction(
        {
          selectedType: AUTO_PARSE_TYPE,
          text: '',
          html: '',
          files: [{ name: 'readme.txt', type: 'text/plain' }],
        },
        helpers
      )
    ).toEqual({
      kind: 'file',
      files: [{ name: 'readme.txt', type: 'text/plain' }],
    });
  });
});
