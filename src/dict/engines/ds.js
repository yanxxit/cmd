import { TranslationEngine } from './base.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 屌丝字典本地搜索引擎
 * 基于本地 endict.txt 文件
 */
export class DSEngine extends TranslationEngine {
  constructor(options = {}) {
    super('屌丝字典');
    this.dataPath = options.dataPath || path.join(__dirname, '../ds/data/endict.txt');
    this.dictionary = null;
    this.index = new Map();
  }

  /**
   * 加载词典数据
   */
  async loadDictionary() {
    if (this.dictionary) return;

    if (!fs.existsSync(this.dataPath)) {
      throw new Error(`词典文件不存在：${this.dataPath}\n请运行：ds init`);
    }

    const content = fs.readFileSync(this.dataPath, 'utf-8');
    const lines = content.split('\n');
    
    this.dictionary = [];
    this.index.clear();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // 匹配格式：word + 空格/制表符 + explanation
      // 例如：hello  [hə'ləʊ] int.喂，哈罗
      const match = line.match(/^(\S+)\s+(.*)/);
      if (match) {
        const word = match[1].toLowerCase();
        const explanation = match[2];
        
        this.dictionary.push({ word, explanation });
        
        // 建立索引
        if (!this.index.has(word)) {
          this.index.set(word, []);
        }
        this.index.get(word).push(i);
      }
    }

    console.log(`词典已加载：${this.dictionary.length} 条记录`);
  }

  async lookup(word) {
    await this.loadDictionary();

    const normalizedWord = word.toLowerCase().trim();
    const indices = this.index.get(normalizedWord);

    if (!indices || indices.length === 0) {
      // 尝试模糊匹配
      return this.fuzzyLookup(normalizedWord);
    }

    const results = indices.map(i => this.dictionary[i].explanation);
    return `${word}: ${results.join('\n')}`;
  }

  async translate(text) {
    return this.lookup(text);
  }

  /**
   * 模糊查询
   */
  fuzzyLookup(word) {
    const results = [];
    const maxResults = 10;

    // 前缀匹配
    for (const [dictWord, indices] of this.index.entries()) {
      if (dictWord.startsWith(word)) {
        results.push({
          word: dictWord,
          explanation: this.dictionary[indices[0]].explanation
        });
        if (results.length >= maxResults) break;
      }
    }

    if (results.length === 0) {
      // 包含匹配
      for (const [dictWord, indices] of this.index.entries()) {
        if (dictWord.includes(word)) {
          results.push({
            word: dictWord,
            explanation: this.dictionary[indices[0]].explanation
          });
          if (results.length >= maxResults) break;
        }
      }
    }

    if (results.length > 0) {
      const formatted = results.map(r => `${r.word}: ${r.explanation}`);
      return `未找到精确匹配，以下是相关结果:\n\n${formatted.join('\n')}`;
    }

    return `${word}: Not found in dictionary`;
  }

  async isAvailable() {
    try {
      await this.loadDictionary();
      return this.dictionary.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * 搜索（支持正则）
   */
  async search(pattern, options = {}) {
    await this.loadDictionary();

    const regex = new RegExp(pattern, options.flags || 'i');
    const results = [];
    const maxResults = options.maxResults || 100;

    for (const item of this.dictionary) {
      if (regex.test(item.word) || regex.test(item.explanation)) {
        results.push(item);
        if (results.length >= maxResults) break;
      }
    }

    return results;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalWords: this.dictionary ? this.dictionary.length : 0,
      indexSize: this.index.size,
      dataPath: this.dataPath
    };
  }
}

export default DSEngine;
