/**
 * Test Case Model
 * 基于 @yanit/jsondb 的测试案例管理数据模型层
 * 提供高复用的数据库操作方法
 */

import { Database } from '@yanit/jsondb';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库配置
const DB_PATH = path.join(__dirname, '../../../.jsondb/test-case-manager');
const COLLECTION_NAME = 'testCases';

// 全局数据库实例
let dbInstance = null;

/**
 * TestCaseModel 类
 * 封装所有测试案例相关的数据库操作
 */
export class TestCaseModel {
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
   * @returns {Promise<TestCaseModel>} 返回自身以支持链式调用
   */
  async connect() {
    if (dbInstance) {
      this.collection = dbInstance.collection(COLLECTION_NAME);
      return this;
    }

    try {
      console.log('🗄️ 初始化 JSONDB 数据库:', DB_PATH);

      // 确保目录存在
      if (!fs.existsSync(path.dirname(DB_PATH))) {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      }

      // 创建数据库连接
      dbInstance = new Database(DB_PATH, this.options);
      await dbInstance.open();

      // 获取集合
      this.collection = dbInstance.collection(COLLECTION_NAME);

      console.log('✅ JSONDB 数据库连接成功');

      return this;
    } catch (err) {
      console.error('❌ JSONDB 数据库初始化失败:', err);
      throw err;
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
      console.log('🔒 JSONDB 数据库连接已关闭');
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
   * 创建测试案例
   * @param {Object} data - 案例数据
   * @returns {Promise<Object>} 创建的案例
   */
  async create(data) {
    await this._ensureConnected();

    const testCase = await this.collection.insertOne({
      collectionId: data.collectionId || '',
      apiName: data.apiName?.trim() || '',
      title: data.title?.trim() || '',
      requestParams: data.requestParams || {},
      responseData: data.responseData || {},
      remark: data.remark || '',
      tags: data.tags || [],
      subCases: Array.isArray(data.subCases) ? data.subCases : [],
      requestTime: data.requestTime || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return testCase;
  }

  /**
   * 根据 ID 查找案例
   * @param {string} id - 案例 ID
   * @returns {Promise<Object|null>} 案例对象，不存在则返回 null
   */
  async findById(id) {
    await this._ensureConnected();
    return await this.collection.findOne({ _id: id });
  }

  /**
   * 查询案例列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 包含数据和分页信息的对象
   */
  async find(options = {}) {
    await this._ensureConnected();

    const {
      apiName,
      title,
      collectionId,
      search,
      tags,
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc'
    } = options;

    // 构建查询条件
    let query = {};

    if (apiName) {
      query.apiName = apiName;
    }

    if (collectionId) {
      query.collectionId = collectionId;
    }

    // 执行查询
    let cursor = this.collection.find(query);
    let allCases = await cursor.toArray();

    // 标签过滤（在 JS 层做，确保数组字段过滤稳定可靠）
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagSet = new Set(tags.filter(Boolean));
      if (tagSet.size > 0) {
        allCases = allCases.filter(item =>
          Array.isArray(item.tags) && item.tags.some(t => tagSet.has(t))
        );
      }
    }

    // 搜索功能（接口名、标题模糊匹配）
    if (search) {
      const searchLower = search.toLowerCase();
      allCases = allCases.filter(item =>
        item.apiName?.toLowerCase().includes(searchLower) ||
        item.title?.toLowerCase().includes(searchLower)
      );
    }

    // 排序
    const sorted = allCases.sort((a, b) => {
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
   * 更新案例
   * @param {string} id - 案例 ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object|null>} 更新后的案例，不存在则返回 null
   */
  async update(id, updates) {
    await this._ensureConnected();

    // 检查案例是否存在
    const existingCase = await this.collection.findOne({ _id: id });
    if (!existingCase) {
      return null;
    }

    // 更新案例
    const updateDoc = {
      $set: {
        ...updates,
        updatedAt: new Date().toISOString()
      }
    };

    await this.collection.updateOne({ _id: id }, updateDoc);

    // 返回更新后的案例
    return await this.collection.findOne({ _id: id });
  }

  /**
   * 删除案例
   * @param {string} id - 案例 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    await this._ensureConnected();

    // 检查案例是否存在
    const existingCase = await this.collection.findOne({ _id: id });
    if (!existingCase) {
      return false;
    }

    // 删除案例
    await this.collection.deleteOne({ _id: id });
    return true;
  }

  /**
   * 批量删除
   * @param {Array<string>} ids - 案例 ID 数组
   * @returns {Promise<Object>} 删除结果
   */
  async batchDelete(ids) {
    await this._ensureConnected();

    let deletedCount = 0;
    for (const id of ids) {
      const result = await this.delete(id);
      if (result) {
        deletedCount++;
      }
    }

    return { deleted: deletedCount };
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    await this._ensureConnected();

    const allCases = await this.collection.find().toArray();

    // 按接口名分组统计
    const byApiName = {};
    allCases.forEach(item => {
      const apiName = item.apiName || '未分类';
      byApiName[apiName] = (byApiName[apiName] || 0) + 1;
    });

    // 按标签统计
    const tagCount = {};
    allCases.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    return {
      total: allCases.length,
      byApiName,
      byTags: tagCount,
      recentCases: allCases.slice(-5).reverse()
    };
  }

  /**
   * 获取所有接口名分组
   * @returns {Promise<Array<string>>} 接口名列表
   */
  async getGroupedApiNames() {
    await this._ensureConnected();

    const allCases = await this.collection.find().toArray();
    const apiNames = [...new Set(allCases.map(item => item.apiName).filter(Boolean))];
    
    return apiNames.sort();
  }

  /**
   * 获取所有标签
   * @returns {Promise<Array<string>>} 标签列表
   */
  async getAllTags() {
    await this._ensureConnected();

    const allCases = await this.collection.find().toArray();
    const tagSet = new Set();
    
    allCases.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => tagSet.add(tag));
      }
    });

    return [...tagSet].sort();
  }

  /**
   * 生成子案例 ID
   * @private
   */
  _genSubId() {
    return 'sub_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /**
   * 获取案例的子案例列表
   * @param {string} caseId - 父案例 ID
   * @returns {Promise<Array>} 子案例数组
   */
  async listSubCases(caseId) {
    await this._ensureConnected();
    const parent = await this.collection.findOne({ _id: caseId });
    if (!parent) return null;
    return Array.isArray(parent.subCases) ? parent.subCases : [];
  }

  /**
   * 添加子案例
   * @param {string} caseId - 父案例 ID
   * @param {Object} data - 子案例数据 { title, content, remark }
   * @returns {Promise<Object|null>} 新增的子案例
   */
  async addSubCase(caseId, data) {
    await this._ensureConnected();
    const parent = await this.collection.findOne({ _id: caseId });
    if (!parent) return null;

    const now = new Date().toISOString();
    const subCase = {
      _id: this._genSubId(),
      title: (data.title || '').trim(),
      content: data.content !== undefined ? data.content : '',
      remark: data.remark || '',
      createdAt: now,
      updatedAt: now
    };

    const subCases = Array.isArray(parent.subCases) ? [...parent.subCases, subCase] : [subCase];
    await this.collection.updateOne(
      { _id: caseId },
      { $set: { subCases, updatedAt: now } }
    );
    return subCase;
  }

  /**
   * 更新子案例
   * @param {string} caseId - 父案例 ID
   * @param {string} subId - 子案例 ID
   * @param {Object} updates - 更新字段
   * @returns {Promise<Object|null>} 更新后的子案例
   */
  async updateSubCase(caseId, subId, updates) {
    await this._ensureConnected();
    const parent = await this.collection.findOne({ _id: caseId });
    if (!parent || !Array.isArray(parent.subCases)) return null;

    const idx = parent.subCases.findIndex(s => s._id === subId);
    if (idx < 0) return null;

    const now = new Date().toISOString();
    const updated = {
      ...parent.subCases[idx],
      ...updates,
      _id: subId,
      updatedAt: now
    };
    const subCases = [...parent.subCases];
    subCases[idx] = updated;

    await this.collection.updateOne(
      { _id: caseId },
      { $set: { subCases, updatedAt: now } }
    );
    return updated;
  }

  /**
   * 删除子案例
   * @param {string} caseId - 父案例 ID
   * @param {string} subId - 子案例 ID
   * @returns {Promise<boolean>}
   */
  async deleteSubCase(caseId, subId) {
    await this._ensureConnected();
    const parent = await this.collection.findOne({ _id: caseId });
    if (!parent || !Array.isArray(parent.subCases)) return false;

    const subCases = parent.subCases.filter(s => s._id !== subId);
    if (subCases.length === parent.subCases.length) return false;

    await this.collection.updateOne(
      { _id: caseId },
      { $set: { subCases, updatedAt: new Date().toISOString() } }
    );
    return true;
  }
}

/**
 * 创建单例实例
 */
export const testCaseModel = new TestCaseModel();

/**
 * 快捷函数 - 获取 Model 实例
 * @returns {Promise<TestCaseModel>} Model 实例
 */
export async function getTestCaseModel() {
  const model = new TestCaseModel();
  await model.connect();
  return model;
}

export default testCaseModel;
