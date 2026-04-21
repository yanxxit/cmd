/**
 * DOCX 文件生成器
 */
import fs from 'fs';
import path from 'path';
import { Generator } from './base.js';

/**
 * DOCX 生成器
 */
export class DocxGenerator extends Generator {
  constructor(options = {}) {
    super(options);
    this.title = options.title || '大型文档生成测试';
    this.paragraphs = options.paragraphs || 500;
    this.method = options.method || 'padding';
  }

  async generate() {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
    
    console.log('正在创建基础文档...');
    
    const paragraphs = [
      new Paragraph({
        text: this.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 400 },
      }),
      new Paragraph({
        text: `生成时间：${new Date().toLocaleString()}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 },
      }),
      new Paragraph({
        text: `目标大小：${this.formatSize(this.size)}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 100, after: 100 },
      }),
    ];

    // 添加内容段落
    const loremText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ";
    for (let i = 0; i < this.paragraphs; i++) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: loremText.repeat(20),
              font: "Arial",
              size: 22,
            }),
          ],
          spacing: { line: 320 },
        })
      );
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    const baseBuffer = await Packer.toBuffer(doc);
    const baseSize = baseBuffer.length;
    
    console.log(`基础文档大小：${this.formatSize(baseSize)}`);

    let finalBuffer = baseBuffer;

    // 根据方法扩大文件
    if (this.method === 'padding') {
      console.log('正在添加填充数据...');
      const paddingSize = Math.max(0, this.size - baseSize);
      console.log(`需要填充：${this.formatSize(paddingSize)}`);
      
      const padding = Buffer.alloc(paddingSize, 0x00);
      finalBuffer = Buffer.concat([baseBuffer, padding]);
    } else if (this.method === 'content') {
      console.log('正在生成更多内容...');
      // 通过重复内容来扩大
      const repeatFactor = Math.ceil(this.size / baseSize);
      const parts = [];
      for (let i = 0; i < repeatFactor; i++) {
        parts.push(baseBuffer);
      }
      finalBuffer = Buffer.concat(parts);
      finalBuffer = finalBuffer.slice(0, this.size);
    }

    // 保存文件
    const outputPath = path.resolve(this.outputPath);
    fs.writeFileSync(outputPath, finalBuffer);

    return {
      success: true,
      path: outputPath,
      size: finalBuffer.length,
      baseSize,
      time: Date.now() - this.startTime,
    };
  }
}

export default DocxGenerator;