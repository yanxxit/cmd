/**
 * LOG 文件生成器
 */
import fs from 'fs';
import path from 'path';
import { Generator } from './base.js';

/**
 * LOG 生成器
 */
export class LogGenerator extends Generator {
  constructor(options = {}) {
    super(options);
    this.level = options.level || 'info';
    this.format = options.format || 'text';
    this.source = options.source || 'app-server';
  }

  async generate() {
    const outputPath = path.resolve(this.outputPath);
    const stream = fs.createWriteStream(outputPath);

    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const selectedLevel = levels.indexOf(this.level.toUpperCase());
    const activeLevels = levels.slice(selectedLevel);

    const messages = [
      'Request processed successfully',
      'Database connection established',
      'Cache hit for key',
      'User authentication successful',
      'API response received',
      'File upload completed',
      'Background job executed',
      'Configuration loaded',
      'Session created',
      'Data synchronized'
    ];

    let writtenSize = 0;
    let lineCount = 0;
    const startTime = Date.now();

    const chunkSize = 1024 * 1024;
    const chunksNeeded = Math.ceil(this.size / chunkSize);

    for (let chunk = 0; chunk < chunksNeeded; chunk++) {
      let chunkData = '';

      while (Buffer.byteLength(chunkData) < chunkSize && writtenSize < this.size) {
        const timestamp = new Date(startTime + lineCount * 10).toISOString();
        const level = activeLevels[Math.floor(Math.random() * activeLevels.length)];
        const message = messages[Math.floor(Math.random() * messages.length)];
        const requestId = Math.random().toString(36).substring(2, 15);

        let logLine;
        if (this.format === 'json') {
          logLine = JSON.stringify({
            timestamp,
            level,
            source: this.source,
            requestId,
            message,
            metadata: {
              duration: Math.floor(Math.random() * 1000),
              userId: Math.floor(Math.random() * 10000)
            }
          }) + '\n';
        } else {
          logLine = `[${timestamp}] [${level}] [${this.source}] [${requestId}] ${message}\n`;
        }

        chunkData += logLine;
        writtenSize += logLine.length;
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
      time: Date.now() - startTime,
    };
  }
}

export default LogGenerator;