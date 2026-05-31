import { describe, expect, it } from 'vitest';
import { formatFileSize } from '../public/paste-parser/js/services/file-utils.js';
import {
  buildWordStats,
  createWordViewModel,
  isSupportedWordFile,
} from '../public/paste-parser/js/services/word-model.js';
import {
  buildCurrentSheetSummary,
  createWorkbookViewModel,
  isSupportedSpreadsheetFile,
  normalizeSheetMatrix,
} from '../public/paste-parser/js/services/xlsx-model.js';

describe('paste parser word model helpers', () => {
  it('validates supported word files', () => {
    expect(isSupportedWordFile('demo.docx')).toBe(true);
    expect(isSupportedWordFile('demo.DOCX')).toBe(true);
    expect(isSupportedWordFile('demo.doc')).toBe(false);
  });

  it('builds stable word statistics', () => {
    expect(buildWordStats('第一段内容。\n\nSecond paragraph here.')).toEqual({
      charCount: 30,
      wordCount: 4,
      paragraphCount: 2,
    });
  });

  it('creates a word view model with derived stats', () => {
    const viewModel = createWordViewModel({
      fileInfo: { name: 'demo.docx', size: '12 KB' },
      html: '<p>Hello</p>',
      rawText: 'Hello world',
      messages: ['图片将以内联方式展示'],
    });

    expect(viewModel.stats.wordCount).toBe(2);
    expect(viewModel.messages).toHaveLength(1);
  });
});

describe('paste parser xlsx model helpers', () => {
  it('validates supported spreadsheet files', () => {
    expect(isSupportedSpreadsheetFile('report.xlsx')).toBe(true);
    expect(isSupportedSpreadsheetFile('report.xls')).toBe(true);
    expect(isSupportedSpreadsheetFile('report.csv')).toBe(false);
  });

  it('normalizes matrix rows into a rectangle', () => {
    expect(normalizeSheetMatrix([['A', 'B'], ['1'], [null, 3]])).toEqual([
      ['A', 'B'],
      ['1', ''],
      ['', '3'],
    ]);
  });

  it('creates workbook and sheet summary view models', () => {
    const workbook = createWorkbookViewModel(['概览', '明细'], [
      [['列1', '列2'], ['A', 'B']],
      [['id'], [1], [2]],
    ]);
    const summary = buildCurrentSheetSummary(workbook, 1);

    expect(workbook.sheetNames).toEqual(['概览', '明细']);
    expect(summary.rowCount).toBe(3);
    expect(summary.columnCount).toBe(1);
    expect(summary.currentSheet.rows[1][0]).toBe('1');
  });
});

describe('paste parser file utilities', () => {
  it('formats human readable file size', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });
});
