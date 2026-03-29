/**
 * Task Manager API Router
 * 基于 @yanit/jsondb 实现的任务管理系统
 * 使用 Model 层进行数据操作
 */

import express from 'express';
import { taskManagerModel } from '../model/jsondb/index.js';

const router = express.Router();

// 对所有 Task Manager API 请求初始化数据库
router.use(async (req, res, next) => {
  try {
    if (!taskManagerModel.collection) {
      await taskManagerModel.connect();
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
 * GET /api/tasks
 * 获取任务列表
 * 支持过滤、搜索、排序和分页
 */
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      search, 
      sort = 'createdAt', 
      order = 'desc',
      page = '1',
      limit = '10'
    } = req.query;

    const result = await taskManagerModel.find({
      status,
      priority,
      search,
      sort,
      order,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });

  } catch (err) {
    console.error('获取任务列表失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/tasks/stats
 * 获取任务统计信息
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await taskManagerModel.getStats();

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
 * GET /api/tasks/export
 * 导出任务数据
 */
router.get('/export', async (req, res) => {
  try {
    const allTasks = await taskManagerModel.export();

    // 导出为 JSON 格式
    const jsonData = JSON.stringify(allTasks, null, 2);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.json"');
    
    res.send(jsonData);

  } catch (err) {
    console.error('导出数据失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/tasks/:id
 * 获取单个任务详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await taskManagerModel.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }

    res.json({
      success: true,
      data: task
    });

  } catch (err) {
    console.error('获取任务详情失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/tasks
 * 创建新任务
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, dueDate, tags, status } = req.body;

    // 验证必填字段
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: '任务标题不能为空'
      });
    }

    // 创建任务
    const task = await taskManagerModel.create({
      title,
      description,
      priority,
      dueDate,
      tags,
      status
    });

    res.status(201).json({
      success: true,
      data: task
    });

  } catch (err) {
    console.error('创建任务失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * PUT /api/tasks/:id
 * 更新任务
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 更新任务
    const updatedTask = await taskManagerModel.update(id, updates);

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }

    res.json({
      success: true,
      data: updatedTask
    });

  } catch (err) {
    console.error('更新任务失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * 删除任务
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 删除任务
    const deleted = await taskManagerModel.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }

    res.json({
      success: true,
      message: '任务已删除'
    });

  } catch (err) {
    console.error('删除任务失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/tasks/batch
 * 批量操作任务
 */
router.post('/batch', async (req, res) => {
  try {
    const { operation, ids, data } = req.body;

    const result = await taskManagerModel.batchOperate({ operation, ids, data });

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
  await taskManagerModel.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await taskManagerModel.close();
  process.exit(0);
});

export default router;
