import { TranslationEngine } from './base.js';
import axios from 'axios';

/**
 * 有道翻译引擎
 * 使用有道智云 API
 */
export class YoudaoEngine extends TranslationEngine {
  constructor(options = {}) {
    super('有道翻译');
    this.apiKey = options.apiKey || process.env.YOUDAO_API_KEY;
    this.secretKey = options.secretKey || process.env.YOUDAO_SECRET_KEY;
    this.baseUrl = 'https://openapi.youdao.com/api';
  }

  async translate(text) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          q: text,
          from: 'auto',
          to: 'auto',
          appKey: this.apiKey,
          sign: this.generateSign(text),
          salt: Date.now()
        }
      });

      if (response.data.errorCode !== '0') {
        throw new Error(`API 错误：${response.data.errorCode}`);
      }

      return this.formatResult(response.data);
    } catch (error) {
      throw new Error(`有道翻译失败：${error.message}`);
    }
  }

  async lookup(word) {
    return this.translate(word);
  }

  async isAvailable() {
    try {
      const result = await this.translate('hello');
      return !!result;
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成签名
   */
  generateSign(text) {
    const crypto = require('crypto');
    const salt = Date.now();
    const signStr = this.apiKey + this.truncateText(text) + salt + this.secretKey;
    return crypto.createHash('sha256').update(signStr).digest('hex');
  }

  /**
   * 截断文本（API 要求）
   */
  truncateText(text) {
    const len = text.length;
    if (len <= 20) return text;
    return text.substring(0, 10) + len + text.substring(len - 10, len);
  }

  /**
   * 格式化结果
   */
  formatResult(data) {
    const parts = [];

    // 基本翻译
    if (data.translation) {
      parts.push(data.translation.join('\n'));
    }

    // 词典释义
    if (data.basic) {
      if (data.basic['phonetic']) {
        parts.push(`音标：[${data.basic['phonetic']}]`);
      }
      if (data.basic['uk-phonetic']) {
        parts.push(`英式音标：[${data.basic['uk-phonetic']}]`);
      }
      if (data.basic['us-phonetic']) {
        parts.push(`美式音标：[${data.basic['us-phonetic']}]`);
      }
      if (data.basic.explains) {
        parts.push(`释义：${data.basic.explains.join('\n')}`);
      }
    }

    // 网络释义
    if (data.web) {
      const webExplanations = data.web.map(item => {
        return `${item.key}: ${item.value.join('; ')}`;
      });
      if (webExplanations.length > 0) {
        parts.push(`\n网络释义:\n${webExplanations.join('\n')}`);
      }
    }

    return parts.join('\n\n');
  }
}

export default YoudaoEngine;
