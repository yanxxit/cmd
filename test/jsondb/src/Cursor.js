/**
 * 游标类 - 用于处理查询结果
 * 支持 async/await 异步操作
 */

import { matchQuery } from './Operators.js';
import { deepClone, createSortFunction, projectDocument } from './Utils.js';

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
   * 执行查询并获取结果
   * @private
   * @returns {Promise<Array>} 文档数组
   */
  async _execute() {
    if (this._executed) {
      return this._results;
    }
    
    // 获取所有文档
    let results = await this.collection._getDocuments();
    
    // 过滤
    results = results.filter(doc => matchQuery(doc, this.query));
    
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
