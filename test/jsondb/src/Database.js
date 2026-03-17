/**
 * 数据库类 - 管理数据库和集合
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { Collection } from './Collection.js';
import { ensureDir } from './Utils.js';
import { DatabaseNotFoundError, CollectionExistsError } from './errors.js';

/**
 * Database 类
 * 表示一个数据库，提供集合管理和数据库操作
 */
export class Database {
  /**
   * @param {string} dbPath - 数据库路径
   */
  constructor(dbPath) {
    this.dbPath = dbPath;
    this._metaFile = join(dbPath, '_meta.json');
    this._meta = null;
    this._collections = new Map();
  }
  
  /**
   * 打开数据库
   * @returns {Database} 返回自身以支持链式调用
   */
  open() {
    // 如果数据库不存在，创建它
    if (!existsSync(this.dbPath)) {
      mkdirSync(this.dbPath, { recursive: true });
      this._meta = {
        name: this.dbNameFromPath,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        collections: []
      };
      this._saveMeta();
    } else {
      // 加载元数据
      this._loadMeta();
    }
    
    return this;
  }
  
  /**
   * 从路径获取数据库名
   * @private
   * @returns {string} 数据库名
   */
  get dbNameFromPath() {
    return this.dbPath.split(/[\\/]/).pop() || 'default';
  }
  
  /**
   * 加载元数据
   * @private
   */
  _loadMeta() {
    if (!existsSync(this._metaFile)) {
      throw new DatabaseNotFoundError(this.dbPath);
    }
    
    const content = readFileSync(this._metaFile, 'utf-8');
    this._meta = JSON.parse(content);
  }
  
  /**
   * 保存元数据
   * @private
   */
  _saveMeta() {
    ensureDir(this._metaFile);
    const content = JSON.stringify(this._meta, null, 2);
    writeFileSync(this._metaFile, content, 'utf-8');
  }
  
  /**
   * 关闭数据库
   */
  close() {
    // 保存所有集合数据
    for (const collection of this._collections.values()) {
      // Collection 会自动保存
    }
    
    this._collections.clear();
    this._meta = null;
  }
  
  /**
   * 获取集合
   * @param {string} name - 集合名称
   * @returns {Collection} 集合实例
   */
  collection(name) {
    // 检查缓存
    if (this._collections.has(name)) {
      return this._collections.get(name);
    }
    
    // 创建新集合
    const collection = new Collection(this, name);
    this._collections.set(name, collection);
    
    return collection;
  }
  
  /**
   * 创建集合
   * @param {string} name - 集合名称
   * @param {Object} options - 选项
   * @returns {Collection} 集合实例
   */
  createCollection(name, options = {}) {
    const collectionFile = join(this.dbPath, `${name}.json`);
    
    // 检查集合是否已存在
    if (existsSync(collectionFile)) {
      throw new CollectionExistsError(name);
    }
    
    // 创建集合文件
    const initialData = {
      _meta: {
        name,
        count: 0,
        indexes: options.indexes || []
      },
      _documents: [],
      _indexes: {}
    };
    
    ensureDir(collectionFile);
    writeFileSync(collectionFile, JSON.stringify(initialData, null, 2), 'utf-8');
    
    // 更新元数据
    if (!this._meta.collections.includes(name)) {
      this._meta.collections.push(name);
      this._saveMeta();
    }
    
    const collection = new Collection(this, name);
    this._collections.set(name, collection);
    
    return collection;
  }
  
  /**
   * 删除集合
   * @param {string} name - 集合名称
   * @returns {Object} 删除结果
   */
  dropCollection(name) {
    const collectionFile = join(this.dbPath, `${name}.json`);
    
    if (!existsSync(collectionFile)) {
      return { acknowledged: false };
    }
    
    // 删除文件
    rmSync(collectionFile);
    
    // 更新元数据
    this._meta.collections = this._meta.collections.filter(c => c !== name);
    this._saveMeta();
    
    // 清除缓存
    this._collections.delete(name);
    
    return { acknowledged: true };
  }
  
  /**
   * 列出所有集合
   * @returns {Array<string>} 集合名称数组
   */
  listCollections() {
    // 从文件系统读取最新的集合列表
    const files = readdirSync(this.dbPath);
    const collectionFiles = files
      .filter(file => file.endsWith('.json') && file !== '_meta.json')
      .map(file => file.replace('.json', ''));
    
    return collectionFiles;
  }
  
  /**
   * 获取数据库统计信息
   * @returns {Object} 统计信息
   */
  stats() {
    const collections = this.listCollections();
    let totalDocuments = 0;
    let totalSize = 0;
    
    for (const name of collections) {
      const collection = this.collection(name);
      const stats = collection.stats();
      totalDocuments += stats.count;
      totalSize += stats.size;
    }
    
    return {
      db: this.dbNameFromPath,
      collections: collections.length,
      totalDocuments,
      totalSize,
      path: this.dbPath
    };
  }
  
  /**
   * 删除数据库
   * @returns {Object} 删除结果
   */
  drop() {
    if (existsSync(this.dbPath)) {
      rmSync(this.dbPath, { recursive: true, force: true });
    }
    
    this._meta = null;
    this._collections.clear();
    
    return { acknowledged: true };
  }
}
