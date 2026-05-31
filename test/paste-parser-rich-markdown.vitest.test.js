import { describe, expect, it } from 'vitest';
import {
  blocksToMarkdown,
  createAssetPlaceholder,
  createRichImageAsset,
  ensureUniqueFileName,
  resolveMarkdownAssetPlaceholders,
} from '../public/paste-parser/js/services/rich-content.js';

describe('paste parser rich markdown helpers', () => {
  it('creates unique asset file names with stable suffixes', () => {
    const usedNames = new Set();

    expect(ensureUniqueFileName('截图 01.PNG', usedNames)).toBe('01.png');
    expect(ensureUniqueFileName('截图 01.PNG', usedNames)).toBe('01-2.png');
    expect(ensureUniqueFileName('复杂 名称.final.jpeg', usedNames)).toBe('final.jpeg');
  });

  it('serializes structured rich blocks into markdown', () => {
    const assetPlaceholder = createAssetPlaceholder('rich-image-1');
    const markdown = blocksToMarkdown([
      { type: 'heading', depth: 2, text: '功能说明' },
      { type: 'paragraph', text: '支持 **富文本** 转换。' },
      { type: 'list', ordered: false, items: ['复制 Markdown', '导出 ZIP'] },
      {
        type: 'table',
        headers: ['类型', '说明'],
        rows: [['Markdown', '可复制'], ['ZIP', '包含图片']],
      },
      { type: 'image', alt: '示例图片', src: assetPlaceholder },
    ]);

    expect(markdown).toContain('## 功能说明');
    expect(markdown).toContain('- 复制 Markdown');
    expect(markdown).toContain('| 类型 | 说明 |');
    expect(markdown).toContain(`![示例图片](${assetPlaceholder})`);
  });

  it('builds export and clipboard references for embedded images', () => {
    const asset = createRichImageAsset({
      src: 'data:image/png;base64,QUJDRA==',
      alt: '流程图',
      index: 3,
      usedNames: new Set(),
      assetDir: 'images',
    });

    expect(asset.fileName).toBe('image-3.png');
    expect(asset.exportSrc).toBe('images/image-3.png');
    expect(asset.clipboardSrc).toMatch(/^data:image\/png;base64,/);
    expect(Array.from(asset.bytes)).toEqual([65, 66, 67, 68]);
  });

  it('replaces placeholders differently for clipboard and export markdown', () => {
    const asset = {
      assetId: 'rich-image-1',
      placeholder: createAssetPlaceholder('rich-image-1'),
      clipboardSrc: 'data:image/png;base64,QUJDRA==',
      exportSrc: 'images/flow.png',
      originalSrc: 'https://example.com/flow.png',
    };

    const markdown = `第一段\n\n![流程图](${asset.placeholder})`;

    expect(resolveMarkdownAssetPlaceholders(markdown, [asset], 'clipboard')).toContain(asset.clipboardSrc);
    expect(resolveMarkdownAssetPlaceholders(markdown, [asset], 'export')).toContain('images/flow.png');
    expect(
      resolveMarkdownAssetPlaceholders(markdown, [asset], 'export', { 'rich-image-1': asset.originalSrc })
    ).toContain('https://example.com/flow.png');
  });
});
