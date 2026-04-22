/**
 * 历史记录管理模块
 * 使用 @yanit/jsondb 存储和管理云函数调用历史
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { Database } from '@yanit/jsondb';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 数据库路径
const DB_PATH = path.join(__dirname, '../../.jsondb/ae_history');
const COLLECTION_NAME = 'records';

// 全局数据库实例
let dbInstance = null;

/**
 * 获取数据库实例
 * @returns {Promise<Database>} 数据库实例
 */
async function getDB() {
  if (dbInstance) {
    return dbInstance;
  }

  // 确保目录存在
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }

  dbInstance = new Database(DB_PATH, { jsonb: true });
  await dbInstance.open();

  return dbInstance;
}

/**
 * 获取集合
 * @returns {Promise<object>} 集合对象
 */
async function getCollection() {
  const db = await getDB();
  return db.collection(COLLECTION_NAME);
}

/**
 * 添加历史记录
 * @param {object} record - 历史记录对象
 * @returns {Promise<object>} 新记录
 */
export async function addHistoryRecord(record) {
  const collection = await getCollection();
  
  const newRecord = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: record.title || '',
    tags: record.tags || [],
    functionName: record.functionName,
    params: record.params || {},
    result: record.result || null,
    duration: record.duration || 0,
    status: record.status || 'success',
    cacheKey: record.cacheKey || ''
  };

  await collection.insertOne(newRecord);
  return newRecord;
}

/**
 * 获取所有历史记录
 * @param {object} [options] - 查询选项
 * @param {number} [options.limit=50] - 限制数量
 * @param {number} [options.offset=0] - 偏移量
 * @param {string} [options.functionName] - 函数名称过滤
 * @param {string} [options.tag] - 标签过滤
 * @param {string} [options.keyword] - 关键词搜索
 * @returns {Promise<Array<object>>} 历史记录列表
 */
export async function getHistoryRecords(options = {}) {
  const collection = await getCollection();
  const { limit = 50, offset = 0, functionName, tag, keyword } = options;

  // 获取所有记录
  const records = await collection.find().toArray();

  // 按函数名称过滤
  let filteredRecords = records;
  if (functionName) {
    filteredRecords = filteredRecords.filter(r => r.functionName === functionName);
  }

  // 按标签过滤
  if (tag) {
    filteredRecords = filteredRecords.filter(r => r.tags && r.tags.includes(tag));
  }

  // 关键词搜索（搜索标题和函数名）
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    filteredRecords = filteredRecords.filter(r => 
      (r.title && r.title.toLowerCase().includes(lowerKeyword)) ||
      r.functionName.toLowerCase().includes(lowerKeyword)
    );
  }

  // 按创建时间倒序
  filteredRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // 分页
  return filteredRecords.slice(offset, offset + limit);
}

/**
 * 根据 ID 获取历史记录
 * @param {string} id - 记录 ID
 * @returns {Promise<object|null>} 历史记录
 */
export async function getHistoryRecordById(id) {
  const collection = await getCollection();
  const record = await collection.findOne({ id });
  return record || null;
}

/**
 * 更新历史记录（添加标题、标签等）
 * @param {string} id - 记录 ID
 * @param {object} updates - 更新内容
 * @returns {Promise<object|null>} 更新后的记录
 */
export async function updateHistoryRecord(id, updates) {
  const collection = await getCollection();
  const record = await getHistoryRecordById(id);
  
  if (!record) {
    return null;
  }

  // 更新字段
  const updatedRecord = {
    ...record,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await collection.updateOne({ id }, { $set: updatedRecord });
  return updatedRecord;
}

/**
 * 为历史记录添加标签
 * @param {string} id - 记录 ID
 * @param {string|Array<string>} tags - 标签
 * @returns {Promise<object|null>} 更新后的记录
 */
export async function addTags(id, tags) {
  const record = await getHistoryRecordById(id);
  if (!record) {
    return null;
  }

  const currentTags = record.tags || [];
  const newTags = Array.isArray(tags) ? tags : [tags];
  
  // 合并去重
  const mergedTags = [...new Set([...currentTags, ...newTags])];

  return await updateHistoryRecord(id, { tags: mergedTags });
}

/**
 * 删除历史记录
 * @param {string} id - 记录 ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteHistoryRecord(id) {
  const collection = await getCollection();
  const record = await getHistoryRecordById(id);
  
  if (!record) {
    return false;
  }

  await collection.deleteOne({ id });
  return true;
}

/**
 * 获取统计信息
 * @returns {Promise<object>} 统计信息
 */
export async function getStats() {
  const collection = await getCollection();
  const records = await collection.find().toArray();

  const functionNameCount = {};
  const tagCount = {};
  let totalDuration = 0;
  let successCount = 0;

  records.forEach(r => {
    // 函数名统计
    functionNameCount[r.functionName] = (functionNameCount[r.functionName] || 0) + 1;
    
    // 标签统计
    if (r.tags) {
      r.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    }

    // 统计
    totalDuration += r.duration || 0;
    if (r.status === 'success') {
      successCount++;
    }
  });

  return {
    total: records.length,
    successCount,
    failCount: records.length - successCount,
    avgDuration: records.length > 0 ? Math.round(totalDuration / records.length) : 0,
    functionNameCount,
    tagCount
  };
}

export default {
  addHistoryRecord,
  getHistoryRecords,
  getHistoryRecordById,
  updateHistoryRecord,
  addTags,
  deleteHistoryRecord,
  getStats
};
