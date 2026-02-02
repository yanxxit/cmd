import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Level } from 'level';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义数据库路径
const dbPath = path.join(__dirname, 'data', 'dictionary-db');

// 创建或打开数据库
const db = new Level(dbPath, { valueEncoding: 'utf8' });

// 获取数据文件路径
const dataFilePath = path.join(__dirname, '..', 'ds', 'data', 'endict.txt');

console.log('开始导入数据到 LevelDB...');

async function importData() {
  try {
    // 读取数据文件
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const lines = data.split('\n');
    
    console.log(`总共 ${lines.length} 行数据`);
    
    let count = 0;
    // 批量插入数据
    const batch = db.batch();
    
    for (const line of lines) {
      if (!line.trim()) continue;

      const delimiterIndex = line.indexOf('\t');
      if (delimiterIndex === -1) continue;

      const englishWord = line.substring(0, delimiterIndex).trim();
      const chineseDef = line.substring(delimiterIndex + 1).trim();

      if (englishWord && chineseDef) {
        // 存储英文 -> 中文的映射
        batch.put(englishWord, chineseDef);

        // 如果英文单词不是小写形式，则同时存储小写版本
        const lowerWord = englishWord.toLowerCase();
        if (englishWord !== lowerWord) {
          batch.put(lowerWord, chineseDef);
        }
        
        count++;
        if (count % 10000 === 0) {
          console.log(`已处理 ${count} 条记录...`);
        }
      }
    }
    
    // 提交批量操作
    await batch.write();
    
    console.log(`成功导入 ${count} 条词典数据到 LevelDB`);
    console.log(`数据库路径: ${dbPath}`);
    
    // 关闭数据库
    await db.close();
  } catch (error) {
    console.error('导入数据时出错:', error.message);
    process.exit(1);
  }
}

// 运行导入函数
await importData();