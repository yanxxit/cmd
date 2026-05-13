/**
 * Test Case Collection Model
 * 基于 @yanit/jsondb 的测试案例集合管理数据模型层
 */

import { Database } from '@yanit/jsondb';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库配置
const DB_PATH = path.join(__dirname, '../../../.jsondb/test-case-collection');
const COLLECTION_NAME = 'collections';

// 全局数据库实例
let dbInstance = null;

/**
 * TestCaseCollectionModel 类
 * 封装所有测试案例集合相关的数据库操作
 */
export class TestCaseCollectionModel {
  /**
   * 构造函数
   * @param {Object} options - 数据库选项
   */
  constructor(options = {}) {
    this.options = {
      jsonb: true,
      cacheTTL: 5000,
      enableQueryCache: true,
      queryCacheTTL: 30000,
      ...options
    };
    this.collection = null;
  }

  /**
   * 初始化数据库连接
   * @returns {Promise<TestCaseCollectionModel>} 返回自身以支持链式调用
   */
  async connect() {
    if (dbInstance) {
      this.collection = dbInstance.collection(COLLECTION_NAME);
      return this;
    }

    try {
      console.log('🗄️ 初始化 JSONDB 数据库 (Collection):', DB_PATH);

      // 确保目录存在
      if (!fs.existsSync(path.dirname(DB_PATH))) {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      }

      // 创建数据库连接
      dbInstance = new Database(DB_PATH, this.options);
      await dbInstance.open();

      // 获取集合
      this.collection = dbInstance.collection(COLLECTION_NAME);

      // 创建默认集合（如果不存在）
      await this._ensureDefaultCollection();

      console.log('✅ JSONDB 数据库连接成功 (Collection)');

      return this;
    } catch (err) {
      console.error('❌ JSONDB 数据库初始化失败 (Collection):', err);
      throw err;
    }
  }

  /**
   * 确保默认集合存在
   * @private
   */
  async _ensureDefaultCollection() {
    let defaultCollection = await this.collection.findOne({ name: '默认集合' });
    if (!defaultCollection) {
      defaultCollection = await this.collection.insertOne({
        name: '默认集合',
        description: '系统自动创建的默认测试案例集合',
        icon: 'FolderOpenOutlined',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('✅ 已创建默认测试案例集合');
    }

    // 数据迁移：将未关联集合的历史案例归入默认集合
    try {
      const testCaseModule = await import('./TestCase.js');
      const tcModel = testCaseModule.testCaseModel;
      await tcModel.connect();
      const orphanCases = await tcModel.collection.find({
        $or: [
          { collectionId: '' },
          { collectionId: null },
          { collectionId: { $exists: false } }
        ]
      }).toArray();
      if (orphanCases.length > 0) {
        for (const c of orphanCases) {
          await tcModel.collection.updateOne(
            { _id: c._id },
            { $set: { collectionId: defaultCollection._id, updatedAt: new Date().toISOString() } }
          );
        }
        console.log(`🔧 已将 ${orphanCases.length} 个无归属案例迁移到默认集合`);
      }
    } catch (e) {
      console.warn('⚠️ 历史案例迁移到默认集合失败：', e?.message || e);
    }
  }

  /**
   * 获取数据库实例
   * @returns {Database} 数据库实例
   */
  static getDatabase() {
    if (!dbInstance) {
      throw new Error('数据库未初始化，请先调用 connect()');
    }
    return dbInstance;
  }

  /**
   * 关闭数据库连接
   * @returns {Promise<void>}
   */
  async close() {
    if (dbInstance) {
      await dbInstance.close();
      dbInstance = null;
      this.collection = null;
      console.log('🔒 JSONDB 数据库连接已关闭 (Collection)');
    }
  }

  /**
   * 确保数据库已连接
   * @private
   */
  async _ensureConnected() {
    if (!this.collection) {
      await this.connect();
    }
  }

  /**
   * 创建测试案例集合
   * @param {Object} data - 集合数据
   * @returns {Promise<Object>} 创建的集合
   */
  async create(data) {
    await this._ensureConnected();

    const collection = await this.collection.insertOne({
      name: data.name?.trim() || '',
      description: data.description?.trim() || '',
      icon: data.icon?.trim() || 'FolderOpenOutlined',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return collection;
  }

  /**
   * 根据 ID 查找集合
   * @param {string} id - 集合 ID
   * @returns {Promise<Object|null>} 集合对象，不存在则返回 null
   */
  async findById(id) {
    await this._ensureConnected();
    const result = await this.collection.findOne({ _id: id });
    
    if (result) {
      // 计算案例数量
      const testCaseModel = (await import('./TestCase.js')).testCaseModel;
      await testCaseModel.connect();
      const caseCount = await testCaseModel.collection.countDocuments({ collectionId: id });
      result.caseCount = caseCount;
    }
    
    return result;
  }

  /**
   * 查询集合列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 包含数据和分页信息的对象
   */
  async find(options = {}) {
    await this._ensureConnected();

    const {
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc'
    } = options;

    // 查询所有集合
    let cursor = this.collection.find({});
    let allCollections = await cursor.toArray();

    // 计算每个集合的案例数量
    const testCaseModel = (await import('./TestCase.js')).testCaseModel;
    await testCaseModel.connect();
    
    for (const collection of allCollections) {
      const caseCount = await testCaseModel.collection.countDocuments({ collectionId: collection._id });
      collection.caseCount = caseCount;
    }

    // 排序
    const sorted = allCollections.sort((a, b) => {
      const aVal = a[sort];
      const bVal = b[sort];
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // 分页
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginated = sorted.slice(startIndex, endIndex);

    return {
      data: paginated,
      pagination: {
        total: sorted.length,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(sorted.length / limitNum)
      }
    };
  }

  /**
   * 更新集合
   * @param {string} id - 集合 ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object|null>} 更新后的集合，不存在则返回 null
   */
  async update(id, updates) {
    await this._ensureConnected();

    // 检查集合是否存在
    const existingCollection = await this.collection.findOne({ _id: id });
    if (!existingCollection) {
      return null;
    }

    // 更新集合
    const updateDoc = {
      $set: {
        ...updates,
        updatedAt: new Date().toISOString()
      }
    };

    await this.collection.updateOne({ _id: id }, updateDoc);

    // 返回更新后的集合
    return await this.collection.findOne({ _id: id });
  }

  /**
   * 删除集合
   * @param {string} id - 集合 ID
   * @param {boolean} deleteCases - 是否同时删除集合下的所有案例
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id, deleteCases = false) {
    await this._ensureConnected();

    // 检查集合是否存在
    const existingCollection = await this.collection.findOne({ _id: id });
    if (!existingCollection) {
      return false;
    }

    // 如果是默认集合，不允许删除
    if (existingCollection.name === '默认集合') {
      throw new Error('默认集合不允许删除');
    }

    // 如果选择同时删除案例
    if (deleteCases) {
      const testCaseModel = (await import('./TestCase.js')).testCaseModel;
      await testCaseModel.connect();
      await testCaseModel.collection.deleteMany({ collectionId: id });
    }

    // 删除集合
    await this.collection.deleteOne({ _id: id });
    return true;
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    await this._ensureConnected();

    const allCollections = await this.collection.find().toArray();
    
    // 计算每个集合的案例数量
    const testCaseModel = (await import('./TestCase.js')).testCaseModel;
    await testCaseModel.connect();
    
    const collectionStats = [];
    for (const collection of allCollections) {
      const caseCount = await testCaseModel.collection.countDocuments({ collectionId: collection._id });
      collectionStats.push({
        _id: collection._id,
        name: collection.name,
        caseCount
      });
    }

    const totalCases = collectionStats.reduce((sum, item) => sum + item.caseCount, 0);

    return {
      totalCollections: allCollections.length,
      totalCases,
      byCollection: collectionStats
    };
  }

  /**
   * 获取所有集合（简化版，用于下拉选择）
   * @returns {Promise<Array>} 集合列表
   */
  async getAll() {
    await this._ensureConnected();
    
    const allCollections = await this.collection.find().toArray();
    
    // 计算每个集合的案例数量
    const testCaseModel = (await import('./TestCase.js')).testCaseModel;
    await testCaseModel.connect();
    
    for (const collection of allCollections) {
      const caseCount = await testCaseModel.collection.countDocuments({ collectionId: collection._id });
      collection.caseCount = caseCount;
    }
    
    return allCollections.sort((a, b) => a.name.localeCompare(b.name));
  }
}

/**
 * 创建单例实例
 */
export const testCaseCollectionModel = new TestCaseCollectionModel();

/**
 * 快捷函数 - 获取 Model 实例
 * @returns {Promise<TestCaseCollectionModel>} Model 实例
 */
export async function getTestCaseCollectionModel() {
  const model = new TestCaseCollectionModel();
  await model.connect();
  return model;
}

export default testCaseCollectionModel;
