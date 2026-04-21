/**
 * JSON 文件生成器
 */
import fs from 'fs';
import path from 'path';
import { Generator } from './base.js';

/**
 * JSON 生成器
 */
export class JsonGenerator extends Generator {
  constructor(options = {}) {
    super(options);
    this.format = options.format || 'array';
    this.pretty = options.pretty || false;
  }

  async generate() {
    const outputPath = path.resolve(this.outputPath);

    if (this.format === 'ndjson') {
      // NDJSON (Newline Delimited JSON) 格式
      const stream = fs.createWriteStream(outputPath);

      let writtenSize = 0;
      let objectCount = 0;
      const startTime = Date.now();

      while (writtenSize < this.size) {
        const obj = {
          id: objectCount + 1,
          timestamp: new Date().toISOString(),
          data: {
            name: `Item ${objectCount + 1}`,
            value: Math.random() * 1000,
            tags: ['tag1', 'tag2', 'tag3'].map(t => `${t}_${objectCount}`),
            metadata: {
              created: new Date().toISOString(),
              version: '1.0.0'
            }
          }
        };

        const line = JSON.stringify(obj) + '\n';
        stream.write(line);
        writtenSize += line.length;
        objectCount++;

        if (objectCount % 10000 === 0) {
          this.showProgress(writtenSize, this.size);
        }
      }

      stream.end();

      return {
        success: true,
        path: outputPath,
        size: writtenSize,
        objects: objectCount,
        time: Date.now() - startTime,
      };
    } else {
      // Array 格式
      const stream = fs.createWriteStream(outputPath);
      stream.write('[\n');

      let writtenSize = 2;
      let objectCount = 0;
      const startTime = Date.now();
      const indent = this.pretty ? '  ' : '';

      while (writtenSize < this.size) {
        if (objectCount > 0) {
          stream.write(',\n');
          writtenSize += 2;
        }

        const obj = {
          id: objectCount + 1,
          timestamp: new Date().toISOString(),
          data: {
            name: `Item ${objectCount + 1}`,
            value: Math.random() * 1000,
            tags: ['tag1', 'tag2', 'tag3'],
            metadata: {
              created: new Date().toISOString(),
              version: '1.0.0'
            }
          }
        };

        const line = indent + JSON.stringify(obj, null, this.pretty ? 2 : 0);
        stream.write(line);
        writtenSize += line.length;
        objectCount++;

        if (objectCount % 1000 === 0) {
          this.showProgress(writtenSize, this.size);
        }
      }

      stream.write('\n]');
      stream.end();

      return {
        success: true,
        path: outputPath,
        size: writtenSize,
        objects: objectCount,
        time: Date.now() - startTime,
      };
    }
  }
}

export default JsonGenerator;