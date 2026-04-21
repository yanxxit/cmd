/**
 * CSV 文件生成器
 */
import fs from 'fs';
import path from 'path';
import { Generator } from './base.js';

/**
 * CSV 生成器
 */
export class CsvGenerator extends Generator {
  constructor(options = {}) {
    super(options);
    this.columns = (options.columns || 'id,name,email,age,city,country,phone,created_at').split(',');
    this.rows = options.rows || 0;
    this.delimiter = options.delimiter || ',';
    this.useQuotes = options.useQuotes || false;
  }

  async generate() {
    const outputPath = path.resolve(this.outputPath);
    const stream = fs.createWriteStream(outputPath);

    // 写入表头
    const header = this.columns.join(this.delimiter) + '\n';
    stream.write(header);

    let writtenSize = header.length;
    let rowCount = 0;
    const startTime = Date.now();

    const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
    const countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Spain', 'Italy', 'Australia', 'Japan', 'China'];

    while (writtenSize < this.size || (this.rows > 0 && rowCount < this.rows)) {
      const id = rowCount + 1;
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = this.useQuotes ? `"${firstName} ${lastName}"` : `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${id}@example.com`;
      const age = Math.floor(Math.random() * 60) + 18;
      const city = this.useQuotes ? `"${cities[Math.floor(Math.random() * cities.length)]}"` : cities[Math.floor(Math.random() * cities.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      const phone = `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString();

      const row = [
        id,
        name,
        email,
        age,
        city,
        country,
        phone,
        createdAt
      ].join(this.delimiter) + '\n';

      stream.write(row);
      writtenSize += row.length;
      rowCount++;

      if (rowCount % 10000 === 0) {
        const progress = this.rows > 0 
          ? ((rowCount / this.rows) * 100).toFixed(1)
          : Math.min(100, ((writtenSize / this.size) * 100)).toFixed(1);
        process.stdout.write(`\r进度：${progress}% (${rowCount.toLocaleString()} 行, ${this.formatSize(writtenSize)})`);
      }

      // 如果指定了行数，达到后退出
      if (this.rows > 0 && rowCount >= this.rows) {
        break;
      }
    }

    stream.end();

    return {
      success: true,
      path: outputPath,
      size: writtenSize,
      rows: rowCount,
      time: Date.now() - startTime,
    };
  }
}

export default CsvGenerator;