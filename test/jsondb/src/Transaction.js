/**
 * 简单事务模块
 * 提供多操作的原子性保证
 */

import { deepClone } from './Utils.js';

/**
 * 事务状态
 */
export const TransactionStatus = {
  ACTIVE: 'active',
  COMMITTED: 'committed',
  ROLLED_BACK: 'rolled_back',
  FAILED: 'failed'
};

/**
 * 操作类型
 */
export const OperationType = {
  INSERT: 'insert',
  UPDATE: 'update',
  DELETE: 'delete'
};

/**
 * 事务类
 */
export class Transaction {
  constructor(collections) {
    this.collections = Array.isArray(collections) ? collections : [collections];
    this.operations = [];
    this.status = TransactionStatus.ACTIVE;
    this.backup = new Map(); // 原始数据备份
    this.results = [];
  }
  
  /**
   * 备份集合数据
   * @private
   */
  async _backup() {
    for (const collection of this.collections) {
      await collection._load();
      
      // 深拷贝备份
      this.backup.set(collection.name, {
        documents: deepClone(collection._data._documents),
        indexes: deepClone(collection._data._indexes),
        meta: deepClone(collection._data._meta)
      });
    }
  }
  
  /**
   * 恢复集合数据
   * @private
   */
  async _restore() {
    for (const [name, data] of this.backup.entries()) {
      const collection = this.collections.find(c => c.name === name);
      if (collection) {
        collection._data._documents = data.documents;
        collection._data._indexes = data.indexes;
        collection._data._meta = data.meta;
      }
    }
  }
  
  /**
   * 添加插入操作
   * @param {Collection} collection - 集合
   * @param {Object|Array} docs - 文档
   * @returns {Transaction}
   */
  insert(collection, docs) {
    if (this.status !== TransactionStatus.ACTIVE) {
      throw new Error('事务已不再活跃');
    }
    
    if (!this.collections.includes(collection)) {
      throw new Error('集合不在事务范围内');
    }
    
    this.operations.push({
      type: OperationType.INSERT,
      collection,
      docs: Array.isArray(docs) ? docs : [docs]
    });
    
    return this;
  }
  
  /**
   * 添加更新操作
   * @param {Collection} collection - 集合
   * @param {Object} query - 查询条件
   * @param {Object} update - 更新操作
   * @param {Object} options - 选项
   * @returns {Transaction}
   */
  update(collection, query, update, options = {}) {
    if (this.status !== TransactionStatus.ACTIVE) {
      throw new Error('事务已不再活跃');
    }
    
    if (!this.collections.includes(collection)) {
      throw new Error('集合不在事务范围内');
    }
    
    this.operations.push({
      type: OperationType.UPDATE,
      collection,
      query,
      update,
      options
    });
    
    return this;
  }
  
  /**
   * 添加删除操作
   * @param {Collection} collection - 集合
   * @param {Object} query - 查询条件
   * @returns {Transaction}
   */
  delete(collection, query) {
    if (this.status !== TransactionStatus.ACTIVE) {
      throw new Error('事务已不再活跃');
    }
    
    if (!this.collections.includes(collection)) {
      throw new Error('集合不在事务范围内');
    }
    
    this.operations.push({
      type: OperationType.DELETE,
      collection,
      query
    });
    
    return this;
  }
  
  /**
   * 提交事务
   * @returns {Promise<Object>} 提交结果
   */
  async commit() {
    if (this.status !== TransactionStatus.ACTIVE) {
      throw new Error('事务已不再活跃');
    }
    
    try {
      // 1. 备份数据
      await this._backup();
      
      // 2. 执行所有操作
      for (const op of this.operations) {
        const result = await this._executeOperation(op);
        this.results.push(result);
      }
      
      // 3. 保存所有集合
      for (const collection of this.collections) {
        await collection._save();
        // 失效缓存
        collection._cache = null;
        collection._cacheTime = 0;
      }
      
      this.status = TransactionStatus.COMMITTED;
      
      return {
        success: true,
        operations: this.results
      };
      
    } catch (error) {
      // 执行失败，回滚
      await this.rollback();
      this.status = TransactionStatus.FAILED;
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 执行单个操作
   * @private
   * @param {Object} op - 操作对象
   * @returns {Object} 操作结果
   */
  async _executeOperation(op) {
    const { matchQuery, applyUpdate } = await import('./Operators.js');
    const { generateId } = await import('./Utils.js');
    
    switch (op.type) {
      case OperationType.INSERT: {
        const now = new Date().toISOString();
        const docs = op.docs.map(doc => ({
          ...deepClone(doc),
          _id: doc._id || generateId(),
          createdAt: doc.createdAt || now
        }));
        op.collection._data._documents.push(...docs);
        return { type: 'insert', count: docs.length, ids: docs.map(d => d._id) };
      }
      
      case OperationType.UPDATE: {
        let count = 0;
        for (let i = 0; i < op.collection._data._documents.length; i++) {
          const doc = op.collection._data._documents[i];
          if (matchQuery(doc, op.query)) {
            const updated = applyUpdate(doc, op.update);
            updated.updatedAt = new Date().toISOString();
            op.collection._data._documents[i] = updated;
            count++;
          }
        }
        return { type: 'update', count };
      }
      
      case OperationType.DELETE: {
        const initial = op.collection._data._documents.length;
        op.collection._data._documents = op.collection._data._documents.filter(
          doc => !matchQuery(doc, op.query)
        );
        return { type: 'delete', count: initial - op.collection._data._documents.length };
      }
      
      default:
        throw new Error(`未知操作类型：${op.type}`);
    }
  }
  
  /**
   * 回滚事务
   * @returns {Promise<void>}
   */
  async rollback() {
    if (this.status === TransactionStatus.COMMITTED) {
      throw new Error('已提交的事务无法回滚');
    }
    
    await this._restore();
    this.status = TransactionStatus.ROLLED_BACK;
  }
  
  /**
   * 获取事务状态
   * @returns {string} 状态
   */
  getStatus() {
    return this.status;
  }
  
  /**
   * 获取操作数量
   * @returns {number}
   */
  getOperationCount() {
    return this.operations.length;
  }
}

/**
 * 创建事务
 * @param {Collection|Collection[]} collections - 集合实例
 * @returns {Transaction}
 */
export function createTransaction(collections) {
  return new Transaction(collections);
}

/**
 * 执行事务（快捷方式）
 * @param {Collection[]} collections - 集合数组
 * @param {Function} fn - 事务函数
 * @returns {Promise<Object>}
 */
export async function withTransaction(collections, fn) {
  const tx = createTransaction(collections);
  await fn(tx);
  return await tx.commit();
}
