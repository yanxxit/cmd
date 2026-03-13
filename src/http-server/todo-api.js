/**
 * TODO List API Router
 * 使用 model 层进行数据操作
 */

import express from 'express';
import { initDatabase, getTodos, getTodoById, createTodo, updateTodo, deleteTodo, batchOperate, getTodoStats } from '../model/index.js';
import { getSubtasks, createSubtask, updateSubtask, deleteSubtask, batchOperateSubtasks } from '../model/subtask.js';

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
    const { content, priority, due_date, note, parent_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: '任务内容不能为空'
      });
    }

    const todo = await createTodo({ content, priority, due_date, note, parent_id: parent_id || null });

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

/**
 * GET /api/subtasks
 * 获取子任务列表
 */
router.get('/subtasks', async (req, res) => {
  try {
    const { todo_id } = req.query;
    
    if (!todo_id) {
      return res.status(400).json({
        success: false,
        error: '缺少 todo_id 参数'
      });
    }
    
    const subtasks = await getSubtasks(parseInt(todo_id));

    res.json({
      success: true,
      data: subtasks
    });

  } catch (err) {
    console.error('获取子任务失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/subtasks
 * 创建子任务
 */
router.post('/subtasks', async (req, res) => {
  try {
    const { todo_id, content, priority = 2 } = req.body;
    
    if (!todo_id || !content) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }
    
    const subtask = await createSubtask({ todo_id, content, priority });
    
    res.json({
      success: true,
      data: subtask
    });
    
  } catch (err) {
    console.error('创建子任务失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * PUT /api/subtasks/:id
 * 更新子任务
 */
router.put('/subtasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const subtask = await updateSubtask(id, updates);
    
    if (!subtask) {
      return res.status(404).json({
        success: false,
        error: '子任务不存在'
      });
    }
    
    res.json({
      success: true,
      data: subtask
    });
    
  } catch (err) {
    console.error('更新子任务失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * DELETE /api/subtasks/:id
 * 删除子任务
 */
router.delete('/subtasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteSubtask(id);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (err) {
    console.error('删除子任务失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/subtasks/batch
 * 批量操作子任务
 */
router.post('/subtasks/batch', async (req, res) => {
  try {
    const { ids, action } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请选择子任务'
      });
    }
    
    const result = await batchOperateSubtasks(ids, action);
    
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

export default router;
