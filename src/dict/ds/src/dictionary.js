// Dictionary class for English-Chinese translation
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Dictionary {
  constructor(dataFilePath) {
    // 修正路径 - 正确指向数据文件
    // __dirname 是 /Users/mac/github/cmd/ds/src，所以 ../.. 应该是 /Users/mac/github/cmd，我们只需要 ..
    const projectRoot = path.resolve(__dirname, '..'); // 现在是 /Users/mac/github/cmd/ds
    this.dataFilePath = dataFilePath || path.join(projectRoot, 'data', 'endict.txt');
    console.log('Data file path:', this.dataFilePath); // 调试输出
    this.dictionary = new Map(); // 存储词典数据：英文 -> 中文
    this.alphabets = 'abcdefghijklmnopqrstuvwxyz';
    this.loadDictionary();
  }

  // 加载词典数据
  loadDictionary() {
    try {
      const data = fs.readFileSync(this.dataFilePath, 'utf8');
      const lines = data.split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const delimiterIndex = line.indexOf('\t');
        if (delimiterIndex === -1) continue;
        
        const englishWord = line.substring(0, delimiterIndex).trim();
        const chineseDef = line.substring(delimiterIndex + 1).trim();
        
        if (englishWord && chineseDef) {
          // 添加原始单词
          this.dictionary.set(englishWord, chineseDef);
          
          // 如果英文单词不是小写形式，则同时存储小写版本
          const lowerWord = englishWord.toLowerCase();
          if (englishWord !== lowerWord) {
            this.dictionary.set(lowerWord + ';' + englishWord + ';', chineseDef);
          }
        }
      }
      
      console.log(`Dictionary loaded with ${this.dictionary.size} entries`);
    } catch (error) {
      console.error('Error loading dictionary:', error.message);
    }
  }

  // 根据前缀查找匹配的单词
  prefixLookup(prefix, limit = 30) {
    const matches = [];
    
    for (const [word, def] of this.dictionary.entries()) {
      if (word.startsWith(prefix)) {
        matches.push(word.replace(/;.*/, '')); // 移除标记字符
        if (matches.length >= limit) break;
      }
    }
    
    return matches;
  }

  // 查找单词的翻译结果
  lookupResult(word) {
    let result = '';
    const relWords = this.prefixLookup(word, 30);

    // 处理带标记的单词
    const processedRelWords = relWords.map(w =>
      w.endsWith(';') ? w.split(';')[1] : w
    );

    if (processedRelWords.length === 0) {
      if (word.includes(' ')) { // 由于包含多个单词
        const lastWord = word.split(' ');
        return this.lookupResult(lastWord[lastWord.length - 1]); // 使用最后一个单词
      } else { // 由于拼写错误
        const corWords = this.edits1(word);
        result = corWords
          .filter(w => this.dictionary.has(w))
          .map(w => '? ' + w)
          .join('\n');
      }
    } else {
      result = processedRelWords
        .map(w => w + ': ' + this.dictionary.get(w))
        .join('\n');
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
  
  // 获取单词定义
  getDefinition(word) {
    return this.dictionary.get(word);
  }
  
  // 检查单词是否存在
  hasWord(word) {
    return this.dictionary.has(word);
  }
}

export default Dictionary;