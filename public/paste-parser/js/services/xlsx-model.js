// Pure helpers for the spreadsheet parser page.
export function isSupportedSpreadsheetFile(fileName) {
  return /\.(xlsx|xls)$/i.test(String(fileName || ''));
}

export function normalizeSheetMatrix(matrix) {
  const rows = Array.isArray(matrix) ? matrix.map((row) => (Array.isArray(row) ? row : [row])) : [];
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);

  return rows.map((row) => {
    const padded = Array.from({ length: maxColumns }, (_, index) => row[index] ?? '');
    return padded.map((cell) => {
      if (cell == null) return '';
      return typeof cell === 'string' ? cell : String(cell);
    });
  });
}

export function createWorkbookViewModel(sheetNames, rawSheets) {
  const sheets = sheetNames.map((name, index) => ({
    name: name || `Sheet ${index + 1}`,
    rows: normalizeSheetMatrix(rawSheets[index] || []),
  }));

  return {
    sheetNames: sheets.map((sheet) => sheet.name),
    sheets,
  };
}

export function buildCurrentSheetSummary(workbookData, currentSheetIndex) {
  const currentSheet = workbookData?.sheets?.[currentSheetIndex] || { rows: [] };
  const rows = currentSheet.rows || [];

  return {
    currentSheet,
    rowCount: rows.length,
    columnCount: rows[0]?.length || 0,
  };
}
