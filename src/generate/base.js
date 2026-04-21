/**
 * 生成器基类
 * 所有文件生成器的基类
 */
export class Generator {
  constructor(options = {}) {
    this.options = options;
    this.outputPath = options.outputPath || options.output;
    this.size = options.size;
  }

  /**
   * 生成文件
   * @returns {Promise<object>} 生成结果
   */
  async generate() {
    throw new Error('子类必须实现 generate 方法');
  }

  /**
   * 格式化大小显示
   */
  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  /**
   * 解析大小字符串
   */
  parseSize(sizeStr) {
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB|TB)?$/i);
    if (!match) {
      throw new Error('无效的大小格式，例如：50MB, 1GB');
    }

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'MB').toUpperCase();

    const multipliers = {
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    };

    return Math.floor(value * multipliers[unit]);
  }

  /**
   * 显示进度
   */
  showProgress(current, total) {
    const progress = Math.min(100, (current / total) * 100).toFixed(1);
    process.stdout.write(`\r进度：${progress}% (${this.formatSize(current)})`);
  }

  /**
   * 生成随机数据
   */
  generateRandomData(size) {
    const buffer = Buffer.alloc(size);
    for (let i = 0; i < size; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  }
}

export default Generator;