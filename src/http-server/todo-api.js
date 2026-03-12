/**
 * TODO List API Router
 * 使用 model 层进行数据操作
 */

import express from 'express';
import { initDatabase, getTodos, getTodoById, createTodo, updateTodo, deleteTodo, batchOperate, getTodoStats } from '../model/index.js';

const router = express.Router();

/**
 * 初始化数据库中间件
 */
async function initDB(req, res, next) {
  try {
    await initDatabase();
    next();
  } catch (err) {
    console.error('数据库初始化失败:', err);
    res.status(500).json({
      success: false,
      error: '数据库初始化失败：' + err.message
    });
  }
}

// 对所有 TODO API 请求初始化数据库
router.use(initDB);

/**
 * GET /api/todos
 * 获取 TODO 列表
 */
router.get('/', async (req, res) => {
  try {
    const { filter, sort, search } = req.query;
    const todos = await getTodos({ filter, sort, search });
    
    res.json({
      success: true,
      data: todos
    });
    
  } catch (err) {
    console.error('获取 TODO 列表失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/todos
 * 创建 TODO
 */
router.post('/', async (req, res) => {
  try {
    const { content, priority, due_date, note } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: '任务内容不能为空'
      });
    }
    
    const todo = await createTodo({ content, priority, due_date, note });
    
    res.json({
      success: true,
      data: todo
    });
    
  } catch (err) {
    console.error('创建 TODO 失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * PUT /api/todos/:id
 * 更新 TODO
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const todo = await updateTodo(id, updates);
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }
    
    res.json({
      success: true,
      data: todo
    });
    
  } catch (err) {
    console.error('更新 TODO 失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * DELETE /api/todos/:id
 * 删除 TODO
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteTodo(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: '任务不存在'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (err) {
    console.error('删除 TODO 失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/todos/batch
 * 批量操作
 */
router.post('/batch', async (req, res) => {
  try {
    const { ids, action } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请选择任务'
      });
    }
    
    const result = await batchOperate(ids, action);
    
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

/**
 * GET /api/todos/stats
 * 获取统计信息
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getTodoStats();
    
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

export default router;
