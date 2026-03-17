/**
 * 集合类 - 管理文档集合
 * 支持 async/await 异步操作
 * 支持 JSONB 二进制存储模式
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { generateId, deepClone, getNestedValue } from './Utils.js';
import { Cursor } from './Cursor.js';
import { matchQuery, applyUpdate } from './Operators.js';
import { CollectionNotFoundError, DocumentNotFoundError } from './errors.js';

/**
 * Collection 类
 * 表示一个文档集合，提供 CRUD 操作
 */
export class Collection {
  /**
   * @param {Database} db - 数据库实例
   * @param {string} name - 集合名称
   */
  constructor(db, name) {
    this.db = db;
    this.name = name;
    this._filePath = join(db.dbPath, `${name}.json`);
    this._data = null;
    this._lock = null; // 简单的锁机制
    this.jsonb = db.options.jsonb; // 继承数据库的 JSONB 选项
  }
  
  /**
   * 加载集合数据
   * @private
   */
  async _load() {
    if (this._data !== null) {
      return;
    }
    
    // 等待锁
    await this._acquireLock();
    
    try {
      if (!existsSync(this._filePath)) {
        // 如果集合文件不存在，自动创建
        this._data = {
          _meta: { name: this.name, count: 0, indexes: [] },
          _documents: [],
          _indexes: {}
        };
        await this._save();
        return;
      }
      
      // JSONB 模式：读取二进制文件
      if (this.jsonb) {
        const buffer = await readFile(this._filePath);
        this._data = this._decodeJsonb(buffer);
      } else {
        // 普通模式：读取文本文件
        const content = await readFile(this._filePath, 'utf-8');
        this._data = JSON.parse(content);
      }
      
      // 确保数据结构完整
      if (!this._data._meta) {
        this._data._meta = { name: this.name, count: 0, indexes: [] };
      }
      if (!this._data._documents) {
        this._data._documents = [];
      }
      if (!this._data._indexes) {
        this._data._indexes = {};
      }
    } finally {
      this._releaseLock();
    }
  }
  
  /**
   * 保存集合数据
   * @private
   */
  async _save() {
    if (this._data === null) {
      return;
    }
    
    // 更新元数据
    this._data._meta.count = this._data._documents.length;
    
    // JSONB 模式：写入二进制文件
    if (this.jsonb) {
      const buffer = this._encodeJsonb();
      await writeFile(this._filePath, buffer);
    } else {
      // 普通模式：写入格式化的 JSON 文本
      const content = JSON.stringify(this._data, null, 2);
      await writeFile(this._filePath, content, 'utf-8');
    }
  }
  
  /**
   * JSONB 编码 - 将数据编码为二进制 Buffer
   * 格式：[4 字节长度][JSON 数据的 UTF-8 字节]
   * @private
   * @returns {Buffer} 编码后的 Buffer
   */
  _encodeJsonb() {
    const json = JSON.stringify(this._data);
    const jsonBuffer = Buffer.from(json, 'utf-8');
    
    // 创建包含长度前缀的 Buffer
    // 4 字节 (uint32) 长度 + JSON 数据
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(jsonBuffer.length, 0);
    
    return Buffer.concat([lengthBuffer, jsonBuffer]);
  }
  
  /**
   * JSONB 解码 - 将二进制 Buffer 解码为数据
   * @private
   * @param {Buffer} buffer - 编码后的 Buffer
   * @returns {Object} 解码后的数据
   */
  _decodeJsonb(buffer) {
    try {
      // 读取长度前缀
      const length = buffer.readUInt32BE(0);
      
      // 验证长度
      if (length !== buffer.length - 4) {
        throw new Error('JSONB 长度不匹配');
      }
      
      // 读取 JSON 数据
      const jsonBuffer = buffer.subarray(4);
      const json = jsonBuffer.toString('utf-8');
      return JSON.parse(json);
    } catch (e) {
      // 如果不是有效的 JSONB 格式，尝试直接 JSON 解析（向后兼容）
      try {
        const json = buffer.toString('utf-8');
        return JSON.parse(json);
      } catch (e2) {
        throw new Error(`无法解析数据：${e.message}`);
      }
    }
  }
  
  /**
   * 获取锁
   * @private
   */
  async _acquireLock() {
    while (this._lock) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this._lock = true;
  }
  
  /**
   * 释放锁
   * @private
   */
  _releaseLock() {
    this._lock = null;
  }
  
  /**
   * 获取所有文档
   * @private
   * @returns {Array} 文档数组
   */
  async _getDocuments() {
    await this._load();
    return this._data._documents;
  }
  
  /**
   * 插入单个文档
   * @param {Object} doc - 文档
   * @returns {Promise<Object>} 插入后的文档（包含 _id）
   */
  async insertOne(doc) {
    await this._load();
    
    // 创建文档副本并添加 _id
    const newDoc = {
      ...deepClone(doc),
      _id: doc._id || generateId(),
      createdAt: new Date().toISOString()
    };
    
    this._data._documents.push(newDoc);
    await this._save();
    
    return deepClone(newDoc);
  }
  
  /**
   * 插入多个文档
   * @param {Array<Object>} docs - 文档数组
   * @returns {Promise<Object>} 插入结果
   */
  async insertMany(docs) {
    if (!Array.isArray(docs)) {
      throw new Error('insertMany 需要数组参数');
    }
    
    await this._load();
    
    const insertedDocs = docs.map(doc => ({
      ...deepClone(doc),
      _id: doc._id || generateId(),
      createdAt: new Date().toISOString()
    }));
    
    this._data._documents.push(...insertedDocs);
    await this._save();
    
    return {
      acknowledged: true,
      insertedCount: insertedDocs.length,
      insertedIds: insertedDocs.reduce((acc, doc, i) => {
        acc[i] = doc._id;
        return acc;
      }, {})
    };
  }
  
  /**
   * 查询文档
   * @param {Object} query - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Cursor} 游标对象
   */
  find(query = {}, options = {}) {
    return new Cursor(this, query, options);
  }
  
  /**
   * 查询单个文档
   * @param {Object} query - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Promise<Object|null>} 文档或 null
   */
  async findOne(query = {}, options = {}) {
    return await new Cursor(this, query, options).first();
  }
  
  /**
   * 更新单个文档
   * @param {Object} query - 查询条件
   * @param {Object} update - 更新操作
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 更新结果
   */
  async updateOne(query, update, options = {}) {
    await this._load();
    
    const docIndex = this._data._documents.findIndex(doc => matchQuery(doc, query));
    
    if (docIndex === -1) {
      if (options.upsert) {
        // 插入新文档
        const newDoc = {
          _id: generateId(),
          ...deepClone(query),
          ...deepClone(update)
        };
        this._data._documents.push(newDoc);
        await this._save();
        
        return {
          acknowledged: true,
          matchedCount: 0,
          modifiedCount: 0,
          upsertedId: newDoc._id
        };
      }
      
      return {
        acknowledged: true,
        matchedCount: 0,
        modifiedCount: 0
      };
    }
    
    // 应用更新
    const updatedDoc = applyUpdate(this._data._documents[docIndex], update);
    updatedDoc.updatedAt = new Date().toISOString();
    this._data._documents[docIndex] = updatedDoc;
    
    await this._save();
    
    return {
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1
    };
  }
  
  /**
   * 更新多个文档
   * @param {Object} query - 查询条件
   * @param {Object} update - 更新操作
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 更新结果
   */
  async updateMany(query, update, options = {}) {
    await this._load();
    
    let matchedCount = 0;
    let modifiedCount = 0;
    
    for (let i = 0; i < this._data._documents.length; i++) {
      const doc = this._data._documents[i];
      
      if (matchQuery(doc, query)) {
        matchedCount++;
        const updatedDoc = applyUpdate(doc, update);
        updatedDoc.updatedAt = new Date().toISOString();
        
        if (JSON.stringify(doc) !== JSON.stringify(updatedDoc)) {
          modifiedCount++;
          this._data._documents[i] = updatedDoc;
        }
      }
    }
    
    if (matchedCount === 0 && options.upsert) {
      // 插入新文档
      const newDoc = {
        _id: generateId(),
        ...deepClone(query),
        ...deepClone(update)
      };
      this._data._documents.push(newDoc);
      await this._save();
      
      return {
        acknowledged: true,
        matchedCount: 0,
        modifiedCount: 0,
        upsertedId: newDoc._id
      };
    }
    
    await this._save();
    
    return {
      acknowledged: true,
      matchedCount,
      modifiedCount
    };
  }
  
  /**
   * 替换单个文档
   * @param {Object} query - 查询条件
   * @param {Object} doc - 新文档
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 替换结果
   */
  async replaceOne(query, doc, options = {}) {
    await this._load();
    
    const docIndex = this._data._documents.findIndex(doc => matchQuery(doc, query));
    
    if (docIndex === -1) {
      if (options.upsert) {
        const newDoc = {
          ...deepClone(doc),
          _id: generateId(),
          createdAt: new Date().toISOString()
        };
        this._data._documents.push(newDoc);
        await this._save();
        
        return {
          acknowledged: true,
          matchedCount: 0,
          modifiedCount: 0,
          upsertedId: newDoc._id
        };
      }
      
      return {
        acknowledged: true,
        matchedCount: 0,
        modifiedCount: 0
      };
    }
    
    // 保留 _id，替换其他字段
    const oldId = this._data._documents[docIndex]._id;
    const newDoc = {
      ...deepClone(doc),
      _id: oldId,
      updatedAt: new Date().toISOString()
    };
    
    this._data._documents[docIndex] = newDoc;
    await this._save();
    
    return {
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1
    };
  }
  
  /**
   * 删除单个文档
   * @param {Object} query - 查询条件
   * @returns {Promise<Object>} 删除结果
   */
  async deleteOne(query) {
    await this._load();
    
    const docIndex = this._data._documents.findIndex(doc => matchQuery(doc, query));
    
    if (docIndex === -1) {
      return {
        acknowledged: true,
        deletedCount: 0
      };
    }
    
    this._data._documents.splice(docIndex, 1);
    await this._save();
    
    return {
      acknowledged: true,
      deletedCount: 1
    };
  }
  
  /**
   * 删除多个文档
   * @param {Object} query - 查询条件
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMany(query) {
    await this._load();
    
    const initialCount = this._data._documents.length;
    this._data._documents = this._data._documents.filter(doc => !matchQuery(doc, query));
    const deletedCount = initialCount - this._data._documents.length;
    
    await this._save();
    
    return {
      acknowledged: true,
      deletedCount
    };
  }
  
  /**
   * 计数文档
   * @param {Object} query - 查询条件
   * @returns {Promise<number>} 文档数量
   */
  async countDocuments(query = {}) {
    return await this.find(query).count();
  }
  
  /**
   * 获取不同值
   * @param {string} key - 字段名
   * @param {Object} query - 查询条件
   * @returns {Promise<Array>} 不同值数组
   */
  async distinct(key, query = {}) {
    const docs = await this.find(query).toArray();
    const values = new Set();
    
    for (const doc of docs) {
      const value = getNestedValue(doc, key);
      if (value !== undefined) {
        values.add(value);
      }
    }
    
    return Array.from(values);
  }
  
  /**
   * 聚合查询
   * @param {Array} pipeline - 聚合管道
   * @returns {Promise<Array>} 结果数组
   */
  async aggregate(pipeline) {
    await this._load();
    
    let results = this._data._documents.map(doc => deepClone(doc));
    
    for (const stage of pipeline) {
      const stageName = Object.keys(stage)[0];
      const stageValue = stage[stageName];
      
      results = this._applyAggregationStage(results, stageName, stageValue);
    }
    
    return results;
  }
  
  /**
   * 应用聚合阶段
   * @private
   */
  _applyAggregationStage(docs, stageName, stageValue) {
    switch (stageName) {
      case '$match':
        return docs.filter(doc => matchQuery(doc, stageValue));
      
      case '$project':
        return docs.map(doc => {
          const result = {};
          for (const [key, value] of Object.entries(stageValue)) {
            if (typeof value === 'string' && value.startsWith('$')) {
              result[key] = getNestedValue(doc, value.substring(1));
            } else if (value === 0 || value === false) {
              // 排除字段
            } else {
              result[key] = getNestedValue(doc, key);
            }
          }
          if (stageValue._id !== undefined) {
            result._id = stageValue._id === 0 ? undefined : doc._id;
          } else {
            result._id = doc._id;
          }
          return result;
        });
      
      case '$group':
        return this._applyGroup(docs, stageValue);
      
      case '$sort':
        return docs.sort((a, b) => {
          for (const [key, direction] of Object.entries(stageValue)) {
            const aVal = getNestedValue(a, key);
            const bVal = getNestedValue(b, key);
            if (aVal < bVal) return -1 * direction;
            if (aVal > bVal) return 1 * direction;
          }
          return 0;
        });
      
      case '$limit':
        return docs.slice(0, stageValue);
      
      case '$skip':
        return docs.slice(stageValue);
      
      case '$count':
        return [{ [stageValue]: docs.length }];
      
      default:
        console.warn(`未实现的聚合阶段：${stageName}`);
        return docs;
    }
  }
  
  /**
   * 应用分组
   * @private
   */
  _applyGroup(docs, stageValue) {
    const groups = new Map();
    
    for (const doc of docs) {
      let key;
      if (stageValue._id === null) {
        key = null;
      } else if (typeof stageValue._id === 'string') {
        key = getNestedValue(doc, stageValue._id.substring(1));
      } else {
        key = JSON.stringify(stageValue._id);
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(doc);
    }
    
    return Array.from(groups.entries()).map(([key, groupDocs]) => {
      const result = { _id: key };
      
      for (const [aggKey, aggExpr] of Object.entries(stageValue)) {
        if (aggKey === '_id') continue;
        
        if (typeof aggExpr === 'object') {
          const aggOp = Object.keys(aggExpr)[0];
          const aggField = aggExpr[aggOp];
          
          if (aggOp === '$sum') {
            result[aggKey] = groupDocs.reduce((sum, d) => {
              const val = getNestedValue(d, aggField.substring(1)) || 0;
              return sum + val;
            }, 0);
          } else if (aggOp === '$avg') {
            result[aggKey] = groupDocs.reduce((sum, d) => {
              const val = getNestedValue(d, aggField.substring(1)) || 0;
              return sum + val;
            }, 0) / groupDocs.length;
          } else if (aggOp === '$count') {
            result[aggKey] = groupDocs.length;
          } else if (aggOp === '$min') {
            result[aggKey] = Math.min(...groupDocs.map(d => getNestedValue(d, aggField.substring(1)) || 0));
          } else if (aggOp === '$max') {
            result[aggKey] = Math.max(...groupDocs.map(d => getNestedValue(d, aggField.substring(1)) || 0));
          }
        }
      }
      
      return result;
    });
  }
  
  /**
   * 创建索引
   * @param {Object} keys - 索引键
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 索引信息
   */
  async createIndex(keys, options = {}) {
    await this._load();
    
    const indexName = Object.entries(keys)
      .map(([k, v]) => `${k}_${v}`)
      .join('_');
    
    // 检查索引是否已存在
    const existingIndex = this._data._meta.indexes?.find(i => i.name === indexName);
    if (existingIndex) {
      return existingIndex;
    }
    
    // 创建索引
    const index = {
      key: keys,
      name: indexName,
      unique: options.unique || false
    };
    
    if (!this._data._meta.indexes) {
      this._data._meta.indexes = [];
    }
    this._data._meta.indexes.push(index);
    
    await this._save();
    
    return index;
  }
  
  /**
   * 删除索引
   * @param {string} name - 索引名称
   * @returns {Promise<Object>} 删除结果
   */
  async dropIndex(name) {
    await this._load();
    
    if (!this._data._meta.indexes) {
      return { acknowledged: false };
    }
    
    const initialLength = this._data._meta.indexes.length;
    this._data._meta.indexes = this._data._meta.indexes.filter(i => i.name !== name);
    
    if (this._data._meta.indexes.length === initialLength) {
      return { acknowledged: false };
    }
    
    await this._save();
    
    return { acknowledged: true };
  }
  
  /**
   * 列出所有索引
   * @returns {Promise<Array>} 索引数组
   */
  async listIndexes() {
    await this._load();
    return this._data._meta.indexes || [];
  }
  
  /**
   * 获取集合统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async stats() {
    await this._load();
    
    const size = this.jsonb 
      ? this._encodeJsonb().length 
      : JSON.stringify(this._data).length;
    
    return {
      ns: this.name,
      count: this._data._documents.length,
      size,
      avgObjSize: this._data._documents.length > 0
        ? size / this._data._documents.length
        : 0,
      indexes: this._data._meta.indexes?.length || 0,
      jsonb: this.jsonb
    };
  }
}
