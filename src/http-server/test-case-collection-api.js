/**
 * Test Case Collection API Router
 * 基于 @yanit/jsondb 实现的测试案例集合管理系统
 */

import express from 'express';
import { testCaseCollectionModel, testCaseModel } from '../model/jsondb/index.js';

const router = express.Router();

// 对所有 Test Case Collection API 请求初始化数据库
router.use(async (req, res, next) => {
  try {
    if (!testCaseCollectionModel.collection) {
      await testCaseCollectionModel.connect();
    }
    if (!testCaseModel.collection) {
      await testCaseModel.connect();
    }
    next();
  } catch (err) {
    console.error('数据库初始化失败:', err);
    res.status(500).json({
      success: false,
      error: '数据库初始化失败：' + err.message
    });
  }
});

/**
 * GET /api/test-case-collections
 * 获取测试案例集合列表
 */
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '20', sort = 'createdAt', order = 'desc' } = req.query;

    const result = await testCaseCollectionModel.find({
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });

  } catch (err) {
    console.error('获取测试案例集合列表失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/test-case-collections/all
 * 获取所有集合（简化版，用于下拉选择）
 */
router.get('/all', async (req, res) => {
  try {
    const collections = await testCaseCollectionModel.getAll();

    res.json({
      success: true,
      data: collections
    });

  } catch (err) {
    console.error('获取所有集合失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/test-case-collections/stats
 * 获取统计信息
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await testCaseCollectionModel.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (err) {
    console.error('获取统计信息失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/test-case-collections/:id
 * 获取单个集合详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await testCaseCollectionModel.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        error: '集合不存在'
      });
    }

    res.json({
      success: true,
      data: collection
    });

  } catch (err) {
    console.error('获取集合详情失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/test-case-collections/:id/cases
 * 获取集合下的案例列表
 */
router.get('/:id/cases', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;

    // 检查集合是否存在
    const collection = await testCaseCollectionModel.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        error: '集合不存在'
      });
    }

    // 获取集合下的案例
    const result = await testCaseModel.find({
      collectionId: id,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });

  } catch (err) {
    console.error('获取集合下的案例失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/test-case-collections
 * 创建新集合
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    // 验证必填字段
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: '集合名称不能为空'
      });
    }

    // 检查名称是否重复
    const existingCollection = await testCaseCollectionModel.collection.findOne({ name: name.trim() });
    if (existingCollection) {
      return res.status(400).json({
        success: false,
        error: '集合名称已存在'
      });
    }

    // 创建集合
    const collection = await testCaseCollectionModel.create({
      name: name.trim(),
      description: description?.trim() || '',
      icon: icon?.trim() || 'FolderOpenOutlined'
    });

    res.status(201).json({
      success: true,
      data: collection
    });

  } catch (err) {
    console.error('创建测试案例集合失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * PUT /api/test-case-collections/:id
 * 更新集合
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    // 检查集合是否存在
    const existingCollection = await testCaseCollectionModel.findById(id);
    if (!existingCollection) {
      return res.status(404).json({
        success: false,
        error: '集合不存在'
      });
    }

    // 如果是默认集合，不允许修改名称
    if (existingCollection.name === '默认集合' && name && name.trim() !== '默认集合') {
      return res.status(400).json({
        success: false,
        error: '默认集合不允许修改名称'
      });
    }

    // 检查名称是否重复（排除自身）
    if (name && name.trim() !== existingCollection.name) {
      const duplicateCollection = await testCaseCollectionModel.collection.findOne({ 
        name: name.trim(),
        _id: { $ne: id }
      });
      if (duplicateCollection) {
        return res.status(400).json({
          success: false,
          error: '集合名称已存在'
        });
      }
    }

    // 更新集合
    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (icon !== undefined) updates.icon = icon.trim() || 'FolderOpenOutlined';

    const updatedCollection = await testCaseCollectionModel.update(id, updates);

    res.json({
      success: true,
      data: updatedCollection
    });

  } catch (err) {
    console.error('更新测试案例集合失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * DELETE /api/test-case-collections/:id
 * 删除集合
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteCases = 'false' } = req.query;

    // 检查集合是否存在
    const existingCollection = await testCaseCollectionModel.findById(id);
    if (!existingCollection) {
      return res.status(404).json({
        success: false,
        error: '集合不存在'
      });
    }

    // 删除集合
    const deleted = await testCaseCollectionModel.delete(id, deleteCases === 'true');

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: '集合不存在'
      });
    }

    res.json({
      success: true,
      message: '集合已删除'
    });

  } catch (err) {
    console.error('删除测试案例集合失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// 应用关闭时清理数据库
process.on('SIGINT', async () => {
  await testCaseCollectionModel.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await testCaseCollectionModel.close();
  process.exit(0);
});

export default router;
