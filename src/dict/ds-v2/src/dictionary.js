import { Level } from 'level';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Dictionary {
  constructor(dbPath) {
    // 使用传递的数据库路径或者默认路径
    const databasePath = dbPath || path.join(__dirname, '..', 'data', 'dictionary-db');
    this.db = new Level(databasePath, { valueEncoding: 'utf8' });
    this.alphabets = 'abcdefghijklmnopqrstuvwxyz';
  }

  // 从数据库获取词典定义
  async getDefinition(word) {
    try {
      return await this.db.get(word);
    } catch (error) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  // 检查单词是否存在于词典中
  async hasWord(word) {
    const definition = await this.getDefinition(word);
    return definition !== null;
  }

  // 根据前缀查找匹配的单词（扫描数据库）
  async prefixLookup(prefix, limit = 30) {
    const matches = [];
    
    for await (const [key, value] of this.db.iterator({
      gt: prefix,
      lt: prefix + '\xff',
      limit: limit
    })) {
      matches.push(key);
      if (matches.length >= limit) break;
    }

    return matches;
  }

  // 查找单词的翻译结果
  async lookupResult(word) {
    let result = '';
    const relWords = await this.prefixLookup(word, 30);

    if (relWords.length === 0) {
      if (word.includes(' ')) { // 包含多个单词的情况
        const lastWord = word.split(' ');
        return await this.lookupResult(lastWord[lastWord.length - 1]);
      } else { // 拼写错误的情况
        const corWords = this.edits1(word);
        const foundCorrections = [];
        
        for (const w of corWords) {
          if (await this.hasWord(w)) {
            foundCorrections.push('? ' + w);
          }
        }
        
        result = foundCorrections.join('\n');
      }
    } else {
      const results = [];
      for (const w of relWords) {
        const def = await this.getDefinition(w);
        results.push(w + ': ' + def);
      }
      result = results.join('\n');
    }

    return result;
  }

  // 生成编辑距离为1的单词集合
  edits1(word) {
    const n = word.length;
    const splits = [];
    for (let i = 0; i <= n; i++) {
      splits.push([word.slice(0, i), word.slice(i)]);
    }

    const deletes = [];
    const transposes = [];
    const replaces = [];
    const inserts = [];

    for (const [a, b] of splits) {
      // 删除操作
      if (b) deletes.push(a + b.slice(1));

      // 转置操作
      if (b.length > 1) transposes.push(a + b[1] + b[0] + b.slice(2));

      // 替换操作
      if (b) {
        for (const c of this.alphabets) {
          replaces.push(a + c + b.slice(1));
        }
      }

      // 插入操作
      for (const c of this.alphabets) {
        inserts.push(a + c + b);
      }
    }

    return [...new Set([...deletes, ...transposes, ...replaces, ...inserts])];
  }

  // 关闭数据库连接
  async close() {
    await this.db.close();
  }
}

export default Dictionary;