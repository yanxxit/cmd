/**
 * TXT 文件生成器
 */
import fs from 'fs';
import path from 'path';
import { Generator } from './base.js';

/**
 * TXT 生成器
 */
export class TxtGenerator extends Generator {
  constructor(options = {}) {
    super(options);
    this.title = options.title || '大型文本文件';
    this.encoding = options.encoding || 'utf-8';
    this.lineLength = options.lineLength || 120;
    this.contentType = options.contentType || 'lorem';
  }

  async generate() {
    const outputPath = path.resolve(this.outputPath);
    const stream = fs.createWriteStream(outputPath, { encoding: this.encoding });

    // 写入标题
    const header = `${this.title}\n生成时间：${new Date().toLocaleString()}\n目标大小：${this.formatSize(this.size)}\n${'='.repeat(this.lineLength)}\n\n`;
    stream.write(header);

    let writtenSize = Buffer.byteLength(header, this.encoding);
    let lineCount = 4;

    // 生成内容
    const loremText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ";
    const chineseText = "天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。";
    const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunksNeeded = Math.ceil(this.size / chunkSize);

    for (let chunk = 0; chunk < chunksNeeded; chunk++) {
      let chunkData = '';

      while (Buffer.byteLength(chunkData, this.encoding) < chunkSize && writtenSize < this.size) {
        let line = '';

        if (this.contentType === 'lorem') {
          line = loremText.repeat(Math.ceil(this.lineLength / loremText.length)).substring(0, this.lineLength);
        } else if (this.contentType === 'chinese') {
          line = chineseText.repeat(Math.ceil(this.lineLength / chineseText.length)).substring(0, this.lineLength);
        } else if (this.contentType === 'random') {
          line = Array(this.lineLength).fill(0).map(() => randomChars[Math.floor(Math.random() * randomChars.length)]).join('');
        } else if (this.contentType === 'zeros') {
          line = '0'.repeat(this.lineLength);
        }

        chunkData += line + '\n';
        writtenSize += Buffer.byteLength(line + '\n', this.encoding);
        lineCount++;
      }

      stream.write(chunkData);
      this.showProgress(writtenSize, this.size);
    }

    stream.end();

    return {
      success: true,
      path: outputPath,
      size: writtenSize,
      lines: lineCount,
      time: Date.now() - this.startTime,
    };
  }
}

export default TxtGenerator;