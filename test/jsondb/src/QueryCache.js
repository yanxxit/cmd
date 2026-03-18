/**
 * 查询结果缓存模块
 * 缓存相同查询的结果，提升重复查询性能
 */

import { createHash } from 'crypto';

/**
 * 查询缓存类
 */
export class QueryCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000; // 最大缓存条目数
    this.ttl = options.ttl || 60000; // 默认 1 分钟过期
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }
  
  /**
   * 生成查询缓存键
   * @param {string} collection - 集合名
   * @param {Object} query - 查询条件
   * @param {Object} options - 查询选项
   * @returns {string} 缓存键
   */
  generateKey(collection, query, options = {}) {
    const keyData = JSON.stringify({
      collection,
      query,
      options: {
        sort: options.sort,
        limit: options.limit,
        skip: options.skip,
        projection: options.projection
      }
    });
    
    return createHash('sha256').update(keyData).digest('hex');
  }
  
  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存的数据或 null
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }
    
    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    // 更新访问时间（LRU）
    entry.lastAccessed = Date.now();
    this.hits++;
    
    return entry.data;
  }
  
  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} data - 数据
   * @param {number} ttl - 过期时间（毫秒）
   */
  set(key, data, ttl) {
    // 如果缓存已满，删除最久未使用的条目
    if (this.cache.size >= this.maxSize) {
      this._evictOldest();
    }
    
    this.cache.set(key, {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl || this.ttl),
      lastAccessed: Date.now()
    });
  }
  
  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    this.cache.delete(key);
  }
  
  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
  
  /**
   * 删除与集合相关的所有缓存
   * @param {string} collection - 集合名
   */
  invalidateCollection(collection) {
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(collection)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * 删除最久未使用的条目（LRU）
   * @private
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * 获取缓存统计
   * @returns {Object} 统计信息
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(2) + '%' : '0%',
      ttl: this.ttl
    };
  }
}

/**
 * 全局查询缓存实例
 */
export const globalQueryCache = new QueryCache({
  maxSize: 500,
  ttl: 30000 // 30 秒
});

/**
 * 缓存查询装饰器
 * @param {Function} queryFn - 查询函数
 * @param {Object} options - 选项
 * @returns {Function} 装饰后的查询函数
 */
export function cacheQuery(queryFn, options = {}) {
  const cache = options.cache || globalQueryCache;
  const ttl = options.ttl;
  
  return async function(collection, query, queryOptions) {
    const key = cache.generateKey(collection.name, query, queryOptions);
    
    // 尝试从缓存获取
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // 执行查询
    const result = await queryFn.call(this, collection, query, queryOptions);
    
    // 存入缓存
    cache.set(key, result, ttl);
    
    return result;
  };
}
