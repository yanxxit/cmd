/**
 * Task Manager Model
 * 基于 @yanit/jsondb 的任务管理数据模型层
 * 提供高复用的数据库操作方法
 */

import { Database } from '@yanit/jsondb';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库配置
const DB_PATH = path.join(__dirname, '../../../.jsondb/task-manager');
const COLLECTION_NAME = 'tasks';

// 全局数据库实例
let dbInstance = null;

/**
 * TaskManager Model 类
 * 封装所有任务相关的数据库操作
 */
export class TaskManagerModel {
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
   * @returns {Promise<TaskManagerModel>} 返回自身以支持链式调用
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
   * 创建任务
   * @param {Object} taskData - 任务数据
   * @returns {Promise<Object>} 创建的任务
   */
  async create(taskData) {
    await this._ensureConnected();

    const task = await this.collection.insertOne({
      title: taskData.title?.trim(),
      description: taskData.description || '',
      priority: taskData.priority || 2,
      status: taskData.status || 'pending',
      dueDate: taskData.dueDate || null,
      tags: taskData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return task;
  }

  /**
   * 根据 ID 查找任务
   * @param {string} id - 任务 ID
   * @returns {Promise<Object|null>} 任务对象，不存在则返回 null
   */
  async findById(id) {
    await this._ensureConnected();
    return await this.collection.findOne({ _id: id });
  }

  /**
   * 查询任务列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 包含数据和分页信息的对象
   */
  async find(options = {}) {
    await this._ensureConnected();

    const {
      status,
      priority,
      search,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = options;

    // 构建查询条件
    let query = {};

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = parseInt(priority);
    }

    // 执行查询
    let cursor = this.collection.find(query);

    // 搜索功能
    if (search) {
      const allTasks = await cursor.toArray();
      const filtered = allTasks.filter(task =>
        task.title?.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase()) ||
        task.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );

      // 排序
      const sorted = filtered.sort((a, b) => {
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

    // 排序
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    cursor = cursor.sort(sortOptions);

    // 分页
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    cursor = cursor.skip((pageNum - 1) * limitNum).limit(limitNum);

    const taskList = await cursor.toArray();

    // 获取总数
    const total = await this.collection.countDocuments(query);

    return {
      data: taskList,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * 更新任务
   * @param {string} id - 任务 ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Object|null>} 更新后的任务，不存在则返回 null
   */
  async update(id, updates) {
    await this._ensureConnected();

    // 检查任务是否存在
    const existingTask = await this.collection.findOne({ _id: id });
    if (!existingTask) {
      return null;
    }

    // 更新任务
    const updateDoc = {
      $set: {
        ...updates,
        updatedAt: new Date().toISOString()
      }
    };

    await this.collection.updateOne({ _id: id }, updateDoc);

    // 返回更新后的任务
    return await this.collection.findOne({ _id: id });
  }

  /**
   * 删除任务
   * @param {string} id - 任务 ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    await this._ensureConnected();

    // 检查任务是否存在
    const existingTask = await this.collection.findOne({ _id: id });
    if (!existingTask) {
      return false;
    }

    // 删除任务
    await this.collection.deleteOne({ _id: id });
    return true;
  }

  /**
   * 批量操作
   * @param {Object} params - 批量操作参数
   * @returns {Promise<Object>} 操作结果
   */
  async batchOperate(params) {
    await this._ensureConnected();

    const { operation, ids, data } = params;

    if (!operation || !ids || !Array.isArray(ids)) {
      throw new Error('参数错误：需要 operation 和 ids 数组');
    }

    let result;

    switch (operation) {
      case 'delete':
        for (const id of ids) {
          await this.collection.deleteOne({ _id: id });
        }
        result = { deleted: ids.length };
        break;

      case 'update':
        for (const id of ids) {
          await this.collection.updateOne(
            { _id: id },
            {
              $set: {
                ...data,
                updatedAt: new Date().toISOString()
              }
            }
          );
        }
        result = { updated: ids.length };
        break;

      default:
        throw new Error('不支持的操作类型');
    }

    return result;
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    await this._ensureConnected();

    const allTasks = await this.collection.find().toArray();

    return {
      total: allTasks.length,
      byStatus: {
        pending: allTasks.filter(t => t.status === 'pending').length,
        in_progress: allTasks.filter(t => t.status === 'in_progress').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        cancelled: allTasks.filter(t => t.status === 'cancelled').length
      },
      byPriority: {
        low: allTasks.filter(t => t.priority === 1).length,
        medium: allTasks.filter(t => t.priority === 2).length,
        high: allTasks.filter(t => t.priority === 3).length
      }
    };
  }

  /**
   * 导出所有任务
   * @returns {Promise<Array>} 所有任务数据
   */
  async export() {
    await this._ensureConnected();
    return await this.collection.find().toArray();
  }
}

/**
 * 创建单例实例
 */
export const taskManagerModel = new TaskManagerModel();

/**
 * 快捷函数 - 获取 Model 实例
 * @returns {Promise<TaskManagerModel>} Model 实例
 */
export async function getTaskManagerModel() {
  const model = new TaskManagerModel();
  await model.connect();
  return model;
}

export default taskManagerModel;
