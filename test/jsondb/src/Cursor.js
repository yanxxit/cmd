/**
 * 游标类 - 用于处理查询结果
 * 支持 async/await 异步操作
 * 支持索引查询优化
 */

import { matchQuery } from './Operators.js';
import { deepClone, createSortFunction, projectDocument, getNestedValue } from './Utils.js';

/**
 * Cursor 类
 * 提供链式查询接口和结果迭代
 */
export class Cursor {
  /**
   * @param {Collection} collection - 集合实例
   * @param {Object} query - 查询条件
   * @param {Object} options - 查询选项
   */
  constructor(collection, query = {}, options = {}) {
    this.collection = collection;
    this.query = query;
    this.options = { ...options };
    this._executed = false;
    this._results = null;
    this._currentIndex = 0;
    this._useIndex = options.useIndex !== false; // 默认使用索引
  }
  
  /**
   * 指定使用哪个索引
   * @param {string} indexName - 索引名称
   * @returns {Cursor}
   */
  hint(indexName) {
    this.options.hint = indexName;
    return this;
  }
  
  /**
   * 禁用索引
   * @returns {Cursor}
   */
  noIndex() {
    this._useIndex = false;
    return this;
  }
  
  /**
   * 排序
   * @param {Object} sortSpec - 排序规范，如 { age: -1, name: 1 }
   * @returns {Cursor} 返回自身以支持链式调用
   */
  sort(sortSpec) {
    this.options.sort = sortSpec;
    return this;
  }
  
  /**
   * 跳过指定数量的文档
   * @param {number} count - 跳过数量
   * @returns {Cursor}
   */
  skip(count) {
    this.options.skip = count;
    return this;
  }
  
  /**
   * 限制返回文档数量
   * @param {number} count - 限制数量
   * @returns {Cursor}
   */
  limit(count) {
    this.options.limit = count;
    return this;
  }
  
  /**
   * 投影字段
   * @param {Object} projection - 投影规范
   * @returns {Cursor}
   */
  project(projection) {
    this.options.projection = projection;
    return this;
  }
  
  /**
   * 使用索引查找匹配的文档 IDs
   * @private
   * @returns {Set|null} 匹配的 ID 集合，如果无法使用索引则返回 null
   */
  async _findWithIndex() {
    if (!this._useIndex) {
      return null;
    }
    
    const indexes = await this.collection.listIndexes();
    if (indexes.length === 0) {
      return null;
    }
    
    // 查找可以使用的索引
    const queryKeys = Object.keys(this.query).filter(k => !k.startsWith('$'));
    if (queryKeys.length === 0) {
      return null;
    }
    
    // 查找匹配的索引
    let matchingIndex = null;
    
    // 如果指定了 hint，使用指定的索引
    if (this.options.hint) {
      matchingIndex = indexes.find(i => i.name === this.options.hint);
    } else {
      // 否则查找最佳匹配
      for (const index of indexes) {
        const indexKeys = Object.keys(index.key);
        // 检查索引是否覆盖查询字段
        if (indexKeys.some(key => queryKeys.includes(key))) {
          matchingIndex = index;
          break;
        }
      }
    }
    
    if (!matchingIndex) {
      return null;
    }
    
    // 使用索引查找
    return await this._queryIndex(matchingIndex);
  }
  
  /**
   * 查询索引
   * @private
   * @param {Object} index - 索引对象
   * @returns {Set|null} 匹配的 ID 集合
   */
  async _queryIndex(index) {
    const indexKeys = Object.keys(index.key);
    const matchedIds = new Set();
    let hasMatch = false;
    
    for (const key of indexKeys) {
      if (this.query[key] !== undefined) {
        hasMatch = true;
        const queryValue = this.query[key];
        
        // 获取索引数据
        const indexData = this.collection._data._indexes?.[index.name] || {};
        
        // 简单相等查询
        if (typeof queryValue !== 'object' || queryValue === null) {
          const keyStr = String(queryValue);
          if (indexData[keyStr]) {
            indexData[keyStr].forEach(id => matchedIds.add(id));
          }
        }
        // 操作符查询（$eq, $in 等）
        else if (queryValue.$eq !== undefined) {
          const keyStr = String(queryValue.$eq);
          if (indexData[keyStr]) {
            indexData[keyStr].forEach(id => matchedIds.add(id));
          }
        }
        else if (queryValue.$in !== undefined && Array.isArray(queryValue.$in)) {
          queryValue.$in.forEach(val => {
            const keyStr = String(val);
            if (indexData[keyStr]) {
              indexData[keyStr].forEach(id => matchedIds.add(id));
            }
          });
        }
      }
    }
    
    return hasMatch ? matchedIds : null;
  }
  
  /**
   * 执行查询并获取结果
   * @private
   * @returns {Promise<Array>} 文档数组
   */
  async _execute() {
    if (this._executed) {
      return this._results;
    }
    
    // 尝试使用索引
    const indexedIds = await this._findWithIndex();
    
    let results;
    
    if (indexedIds !== null && indexedIds.size > 0) {
      // 使用索引优化查询
      const allDocs = await this.collection._getDocuments();
      const docMap = new Map(allDocs.map(doc => [doc._id, doc]));
      
      results = [];
      for (const id of indexedIds) {
        const doc = docMap.get(id);
        if (doc && matchQuery(doc, this.query)) {
          results.push(doc);
        }
      }
      
      console.log(`[索引优化] 从 ${allDocs.length} 条记录中快速定位到 ${indexedIds.size} 条`);
    } else {
      // 全表扫描
      results = await this.collection._getDocuments();
      results = results.filter(doc => matchQuery(doc, this.query));
    }
    
    // 排序
    if (this.options.sort) {
      const sortFn = createSortFunction(this.options.sort);
      results.sort(sortFn);
    }
    
    // 跳过
    if (this.options.skip) {
      results = results.slice(this.options.skip);
    }
    
    // 限制
    if (this.options.limit) {
      results = results.slice(0, this.options.limit);
    }
    
    // 投影
    if (this.options.projection) {
      results = results.map(doc => projectDocument(doc, this.options.projection));
    } else {
      // 深拷贝，避免修改原数据
      results = results.map(doc => deepClone(doc));
    }
    
    this._results = results;
    this._executed = true;
    
    return this._results;
  }
  
  /**
   * 获取下一个文档
   * @returns {Promise<Object|null>} 文档或 null
   */
  async next() {
    const results = await this._execute();
    
    if (this._currentIndex < results.length) {
      return results[this._currentIndex++];
    }
    
    return null;
  }
  
  /**
   * 转换为数组
   * @returns {Promise<Array>} 文档数组
   */
  async toArray() {
    return await this._execute();
  }
  
  /**
   * 遍历每个文档（异步）
   * @param {Function} callback - 异步回调函数
   * @returns {Promise<void>}
   */
  async forEach(callback) {
    const results = await this._execute();
    for (let i = 0; i < results.length; i++) {
      await callback(results[i], i);
    }
  }
  
  /**
   * 获取第一个文档
   * @returns {Promise<Object|null>}
   */
  async first() {
    const results = await this._execute();
    return results.length > 0 ? results[0] : null;
  }
  
  /**
   * 获取文档数量
   * @returns {Promise<number>}
   */
  async count() {
    const results = await this._execute();
    return results.length;
  }
  
  /**
   * [Symbol.asyncIterator] 支持 for await...of 循环
   * @returns {AsyncIterator}
   */
  [Symbol.asyncIterator]() {
    return {
      next: async () => {
        const doc = await this.next();
        return {
          value: doc,
          done: doc === null
        };
      }
    };
  }
}
