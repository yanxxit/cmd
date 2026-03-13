/**
 * Subtask Model
 * 子任务数据操作
 */

import { getDatabase } from './database.js';

/**
 * 将数据库行转换为对象
 */
function rowToObject(row) {
  if (!row) return null;
  return {
    id: row.id,
    todo_id: row.todo_id,
    content: row.content,
    completed: row.completed,
    priority: row.priority,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * 获取子任务列表
 */
export async function getSubtasks(todoId) {
  const db = getDatabase();
  const result = await db.query(
    'SELECT * FROM subtasks WHERE todo_id = $1 ORDER BY sort_order, id',
    [todoId]
  );
  
  return result.rows.map(rowToObject);
}

/**
 * 创建子任务
 */
export async function createSubtask(data) {
  const { todo_id, content, priority = 2, sort_order = 0 } = data;
  
  const db = getDatabase();
  const result = await db.query(
    `INSERT INTO subtasks (todo_id, content, priority, sort_order) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [todo_id, content.trim(), priority, sort_order]
  );
  
  return rowToObject(result.rows[0]);
}

/**
 * 更新子任务
 */
export async function updateSubtask(id, data) {
  const { content, completed, priority, sort_order } = data;
  
  const fields = [];
  const params = [];
  let paramIndex = 1;
  
  if (content !== undefined) {
    fields.push(`content = $${paramIndex}`);
    params.push(content.trim());
    paramIndex++;
  }
  
  if (completed !== undefined) {
    fields.push(`completed = $${paramIndex}`);
    params.push(completed);
    paramIndex++;
  }
  
  if (priority !== undefined) {
    fields.push(`priority = $${paramIndex}`);
    params.push(priority);
    paramIndex++;
  }
  
  if (sort_order !== undefined) {
    fields.push(`sort_order = $${paramIndex}`);
    params.push(sort_order);
    paramIndex++;
  }
  
  if (fields.length === 0) {
    throw new Error('没有要更新的字段');
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  const db = getDatabase();
  const result = await db.query(
    `UPDATE subtasks SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  
  if (result.rows.length === 0) return null;
  return rowToObject(result.rows[0]);
}

/**
 * 删除子任务
 */
export async function deleteSubtask(id) {
  const db = getDatabase();
  const result = await db.query('DELETE FROM subtasks WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) return null;
  return { id, deleted: true };
}

/**
 * 批量操作子任务
 */
export async function batchOperateSubtasks(ids, action) {
  const db = getDatabase();
  const idList = ids.join(',');
  
  if (action === 'complete') {
    await db.exec(`UPDATE subtasks SET completed = true, updated_at = CURRENT_TIMESTAMP WHERE id IN (${idList})`);
  } else if (action === 'delete') {
    await db.exec(`DELETE FROM subtasks WHERE id IN (${idList})`);
  } else {
    throw new Error('未知操作：' + action);
  }
  
  return { count: ids.length, action };
}

/**
 * 获取子任务统计
 */
export async function getSubtaskStats(todoId) {
  const db = getDatabase();
  const result = await db.query(
    `SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN completed = false THEN 1 END) as pending,
      COUNT(CASE WHEN completed = true THEN 1 END) as completed
     FROM subtasks WHERE todo_id = $1`,
    [todoId]
  );
  
  const row = result.rows[0];
  return {
    total: parseInt(row.total),
    pending: parseInt(row.pending),
    completed: parseInt(row.completed)
  };
}
