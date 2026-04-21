/**
 * Binary 文件生成器
 */
import fs from 'fs';
import path from 'path';
import { Generator } from './base.js';

/**
 * Binary 生成器
 */
export class BinaryGenerator extends Generator {
  constructor(options = {}) {
    super(options);
    this.pattern = options.pattern || 'zeros';
    this.patternValue = options.patternValue || 'DEADBEEF';
  }

  async generate() {
    const outputPath = path.resolve(this.outputPath);
    const stream = fs.createWriteStream(outputPath);

    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunksNeeded = Math.ceil(this.size / chunkSize);
    let writtenSize = 0;
    const startTime = Date.now();

    for (let chunk = 0; chunk < chunksNeeded; chunk++) {
      const remainingSize = this.size - writtenSize;
      const currentChunkSize = Math.min(chunkSize, remainingSize);

      let chunkData;

      if (this.pattern === 'zeros') {
        chunkData = Buffer.alloc(currentChunkSize, 0x00);
      } else if (this.pattern === 'random') {
        chunkData = this.generateRandomData(currentChunkSize);
      } else if (this.pattern === 'pattern') {
        const pattern = Buffer.from(this.patternValue, 'hex');
        chunkData = Buffer.alloc(currentChunkSize);
        for (let i = 0; i < currentChunkSize; i++) {
          chunkData[i] = pattern[i % pattern.length];
        }
      }

      stream.write(chunkData);
      writtenSize += currentChunkSize;
      this.showProgress(writtenSize, this.size);
    }

    stream.end();

    return {
      success: true,
      path: outputPath,
      size: writtenSize,
      time: Date.now() - startTime,
    };
  }
}

export default BinaryGenerator;