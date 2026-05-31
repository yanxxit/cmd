// Pure helpers for the Word parser page.
export function isSupportedWordFile(fileName) {
  return /\.docx$/i.test(String(fileName || ''));
}

export function buildWordStats(rawText) {
  const text = String(rawText || '');
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/[\s,.;:!?，。；：！？()（）"“”'‘’]+/).filter(Boolean) : [];
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    charCount: text.length,
    wordCount: words.length,
    paragraphCount: paragraphs.length,
  };
}

export function createWordViewModel({ fileInfo, html, rawText, messages = [] }) {
  return {
    fileInfo,
    html: html || '',
    rawText: rawText || '',
    messages,
    stats: buildWordStats(rawText),
  };
}
