/**
 * JSONDB 批量操作优化模块
 * 提供高效的批量插入、更新、删除操作
 */

import { generateId, deepClone } from './Utils.js';
import { matchQuery, applyUpdate } from './Operators.js';

/**
 * 批量操作类
 */
export class BulkOperation {
  constructor(collection) {
    this.collection = collection;
    this.operations = [];
    this.insertDocs = [];
    this.updateOps = [];
    this.deleteQuerys = [];
  }
  
  /**
   * 添加插入操作
   * @param {Object|Array} docs - 文档或文档数组
   * @returns {BulkOperation}
   */
  insert(docs) {
    const docArray = Array.isArray(docs) ? docs : [docs];
    const now = new Date().toISOString();
    
    for (const doc of docArray) {
      this.insertDocs.push({
        ...deepClone(doc),
        _id: doc._id || generateId(),
        createdAt: doc.createdAt || now
      });
    }
    
    return this;
  }
  
  /**
   * 添加更新操作
   * @param {Object} query - 查询条件
   * @param {Object} update - 更新操作
   * @param {Object} options - 选项
   * @returns {BulkOperation}
   */
  update(query, update, options = {}) {
    this.updateOps.push({ query, update, options });
    return this;
  }
  
  /**
   * 添加删除操作
   * @param {Object} query - 查询条件
   * @returns {BulkOperation}
   */
  delete(query) {
    this.deleteQuerys.push(query);
    return this;
  }
  
  /**
   * 执行所有操作（单次写入）
   * @returns {Promise<Object>} 执行结果
   */
  async execute() {
    await this.collection._load();
    
    const result = {
      insertedCount: 0,
      updatedCount: 0,
      deletedCount: 0,
      insertedIds: [],
      errors: []
    };
    
    try {
      // 1. 执行插入
      if (this.insertDocs.length > 0) {
        // 批量验证
        if (this.collection._validateOnInsert) {
          for (const doc of this.insertDocs) {
            this.collection._validate(doc);
          }
        }
        
        this.collection._data._documents.push(...this.insertDocs);
        result.insertedCount = this.insertDocs.length;
        result.insertedIds = this.insertDocs.map(d => d._id);
      }
      
      // 2. 执行更新
      for (const { query, update, options } of this.updateOps) {
        for (let i = 0; i < this.collection._data._documents.length; i++) {
          const doc = this.collection._data._documents[i];
          
          if (matchQuery(doc, query)) {
            const updatedDoc = applyUpdate(doc, update);
            updatedDoc.updatedAt = new Date().toISOString();
            
            if (JSON.stringify(doc) !== JSON.stringify(updatedDoc)) {
              this.collection._data._documents[i] = updatedDoc;
              result.updatedCount++;
            }
          }
        }
      }
      
      // 3. 执行删除
      for (const query of this.deleteQuerys) {
        const initialLength = this.collection._data._documents.length;
        this.collection._data._documents = this.collection._data._documents.filter(
          doc => !matchQuery(doc, query)
        );
        result.deletedCount += initialLength - this.collection._data._documents.length;
      }
      
      // 4. 单次保存
      await this.collection._save();
      
      // 5. 失效缓存
      this.collection._cache = null;
      this.collection._cacheTime = 0;
      
    } catch (error) {
      result.errors.push(error.message);
    }
    
    return result;
  }
}

/**
 * 创建批量操作实例
 * @param {Collection} collection - 集合实例
 * @returns {BulkOperation}
 */
export function createBulkOp(collection) {
  return new BulkOperation(collection);
}

/**
 * 批量插入（简化版）
 * @param {Collection} collection - 集合实例
 * @param {Array} docs - 文档数组
 * @returns {Promise<Object>}
 */
export async function bulkInsert(collection, docs) {
  const op = createBulkOp(collection);
  op.insert(docs);
  return await op.execute();
}

/**
 * 批量更新（简化版）
 * @param {Collection} collection - 集合实例
 * @param {Array} operations - 操作数组 [{ query, update }]
 * @returns {Promise<Object>}
 */
export async function bulkUpdate(collection, operations) {
  const op = createBulkOp(collection);
  for (const { query, update } of operations) {
    op.update(query, update);
  }
  return await op.execute();
}

/**
 * 批量删除（简化版）
 * @param {Collection} collection - 集合实例
 * @param {Array} querys - 查询条件数组
 * @returns {Promise<Object>}
 */
export async function bulkDelete(collection, querys) {
  const op = createBulkOp(collection);
  for (const query of querys) {
    op.delete(query);
  }
  return await op.execute();
}
