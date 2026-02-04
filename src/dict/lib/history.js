import { Level } from 'level';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Generators from './generators.js';

// 获取当前文件所在目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保历史记录目录存在
const historyDir = path.resolve(__dirname, '../../../logs/dict');
const dbPath = path.join(historyDir, 'history-db');

// 初始化数据库
let db;
async function initDB() {
  if (!db) {
    db = new Level(dbPath, { valueEncoding: 'json' });
  }
  return db;
}

/**
 * 读取历史记录
 * @returns {Promise<Array>} 历史记录数组
 */
async function readHistory() {
  const database = await initDB();
  const history = [];
  
  try {
    for await (const [key, value] of database.iterator()) {
      history.push(value);
    }
    
    // 按更新时间排序，最新的在前面
    history.sort((a, b) => b.updateTime - a.updateTime);
    
    return history;
  } catch (error) {
    console.error('读取历史记录失败:', error.message);
    return [];
  }
}

/**
 * 写入历史记录
 * @param {Object} record - 历史记录对象
 * @param {string} record.word - 查询的单词
 * @param {string} record.result - 查询结果
 */
async function writeHistory(record) {
  const database = await initDB();
  const now = Date.now();
  
  try {
    // 检查是否存在相同单词的历史记录
    try {
      const existingRecord = await database.get(record.word);
      
      // 更新现有记录
      const updatedRecord = {
        word: record.word,
        timestamp: existingRecord.timestamp, // 保持创建时间不变
        updateTime: now,
        result: record.result,
        count: (existingRecord.count || 1) + 1
      };
      
      await database.put(record.word, updatedRecord);
    } catch (error) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        // 创建新记录
        const newRecord = {
          word: record.word,
          timestamp: now, // 首次创建时生成
          updateTime: now,
          result: record.result,
          count: 1
        };
        await database.put(record.word, newRecord);
      } else {
        throw error;
      }
    }
    
    // 限制历史记录数量，只保留最近100条
    const history = await readHistory();
    if (history.length > 100) {
      const recordsToDelete = history.slice(100);
      for (const item of recordsToDelete) {
        await database.del(item.word);
      }
    }
  } catch (error) {
    console.error('写入历史记录失败:', error.message);
  }
}

/**
 * 清空历史记录
 */
async function clearHistory() {
  const database = await initDB();
  
  try {
    await database.clear();
    console.log('历史记录已清空');
  } catch (error) {
    console.error('清空历史记录失败:', error.message);
  }
}

/**
 * 关闭数据库连接
 */
async function closeDB() {
  if (db) {
    await db.close();
    db = null;
  }
}

/**
 * 导出历史记录到 JSON 文件
 * @param {string} outputPath - 输出文件路径，默认 logs/dict/history.json
 * @returns {Promise<string>} 导出成功的文件路径
 */
async function exportToJSON(outputPath) {
  const database = await initDB();
  const history = [];
  
  try {
    for await (const [key, value] of database.iterator()) {
      history.push(value);
    }
    
    // 按创建时间倒序排序
    history.sort((a, b) => b.timestamp - a.timestamp);
    
    // 默认输出路径
    const defaultPath = path.join(historyDir, 'history.json');
    const exportPath = outputPath || defaultPath;
    
    // 确保目录存在
    const exportDir = path.dirname(exportPath);
    await fs.promises.mkdir(exportDir, { recursive: true });
    
    // 写入 JSON 文件
    await fs.promises.writeFile(exportPath, JSON.stringify(history, null, 2));
    
    return exportPath;
  } catch (error) {
    console.error('导出历史记录失败:', error.message);
    throw error;
  }
}

/**
 * 生成 Markdown 文件记录学习经历
 * @param {string} outputPath - 输出文件路径，默认 logs/dict/learning-history.md
 * @returns {Promise<string>} 生成成功的文件路径
 */
async function generateMarkdown(outputPath) {
  const database = await initDB();
  const history = [];
  
  try {
    for await (const [key, value] of database.iterator()) {
      history.push(value);
    }
    
    return await Generators.generateMarkdown(history, outputPath);
  } catch (error) {
    console.error('生成学习记录失败:', error.message);
    throw error;
  }
}

/**
 * 生成 HTML 文件记录学习经历（使用 React 渲染）
 * @param {string} outputPath - 输出文件路径，默认 logs/dict/learning-history.html
 * @returns {Promise<string>} 生成成功的文件路径
 */
async function generateHTML(outputPath) {
  const database = await initDB();
  const history = [];
  
  try {
    for await (const [key, value] of database.iterator()) {
      history.push(value);
    }
    
    return await Generators.generateHTML(history, outputPath);
  } catch (error) {
    console.error('生成 HTML 学习记录失败:', error.message);
    throw error;
  }
}

export default {
  readHistory,
  writeHistory,
  clearHistory,
  closeDB,
  exportToJSON,
  generateMarkdown,
  generateHTML
};
