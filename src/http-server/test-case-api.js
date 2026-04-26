/**
 * Test Case API Router
 * 基于 @yanit/jsondb 实现的测试案例管理系统
 * 使用 Model 层进行数据操作
 */

import express from 'express';
import { testCaseModel } from '../model/jsondb/index.js';

const router = express.Router();

// 对所有 Test Case API 请求初始化数据库
router.use(async (req, res, next) => {
  try {
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
 * GET /api/test-cases
 * 获取测试案例列表
 * 支持搜索、分页、标签过滤
 */
router.get('/', async (req, res) => {
  try {
    const { 
      apiName,
      title,
      search,
      tags,
      page = '1',
      limit = '20',
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // 处理标签数组
    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [];

    const result = await testCaseModel.find({
      apiName,
      title,
      search,
      tags: tagsArray,
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
    console.error('获取测试案例列表失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/test-cases/stats
 * 获取统计信息
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await testCaseModel.getStats();

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
 * GET /api/test-cases/api-names
 * 获取所有接口名分组
 */
router.get('/api-names', async (req, res) => {
  try {
    const apiNames = await testCaseModel.getGroupedApiNames();

    res.json({
      success: true,
      data: apiNames
    });

  } catch (err) {
    console.error('获取接口名列表失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/test-cases/tags
 * 获取所有标签
 */
router.get('/tags', async (req, res) => {
  try {
    const tags = await testCaseModel.getAllTags();

    res.json({
      success: true,
      data: tags
    });

  } catch (err) {
    console.error('获取标签列表失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/test-cases/:id
 * 获取单个案例详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const testCase = await testCaseModel.findById(id);

    if (!testCase) {
      return res.status(404).json({
        success: false,
        error: '案例不存在'
      });
    }

    res.json({
      success: true,
      data: testCase
    });

  } catch (err) {
    console.error('获取案例详情失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/test-cases
 * 创建新案例
 */
router.post('/', async (req, res) => {
  try {
    const { 
      apiName, 
      title, 
      requestParams, 
      responseData, 
      remark, 
      tags, 
      requestTime 
    } = req.body;

    // 验证必填字段
    if (!apiName || !apiName.trim()) {
      return res.status(400).json({
        success: false,
        error: '接口名称不能为空'
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: '案例标题不能为空'
      });
    }

    // 创建案例
    const testCase = await testCaseModel.create({
      apiName,
      title,
      requestParams,
      responseData,
      remark,
      tags,
      requestTime
    });

    res.status(201).json({
      success: true,
      data: testCase
    });

  } catch (err) {
    console.error('创建测试案例失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * PUT /api/test-cases/:id
 * 更新案例
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 更新案例
    const updatedCase = await testCaseModel.update(id, updates);

    if (!updatedCase) {
      return res.status(404).json({
        success: false,
        error: '案例不存在'
      });
    }

    res.json({
      success: true,
      data: updatedCase
    });

  } catch (err) {
    console.error('更新测试案例失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * DELETE /api/test-cases/:id
 * 删除案例
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 删除案例
    const deleted = await testCaseModel.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: '案例不存在'
      });
    }

    res.json({
      success: true,
      message: '案例已删除'
    });

  } catch (err) {
    console.error('删除测试案例失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/test-cases/batch
 * 批量操作
 */
router.post('/batch', async (req, res) => {
  try {
    const { operation, ids } = req.body;

    if (!operation || !ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        error: '参数错误：需要 operation 和 ids 数组'
      });
    }

    let result;

    if (operation === 'delete') {
      result = await testCaseModel.batchDelete(ids);
    } else {
      return res.status(400).json({
        success: false,
        error: '不支持的操作类型'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (err) {
    console.error('批量操作失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// 应用关闭时清理数据库
process.on('SIGINT', async () => {
  await testCaseModel.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await testCaseModel.close();
  process.exit(0);
});

export default router;
