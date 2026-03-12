/**
 * Todo Model
 * TODO 任务数据操作
 */

import { getDatabase } from './database.js';

/**
 * 将数据库行转换为对象
 */
function rowToObject(row) {
  if (!row) return null;
  return {
    id: row.id,
    content: row.content,
    completed: row.completed,
    priority: row.priority,
    due_date: row.due_date,
    note: row.note,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * 获取 TODO 列表
 */
export async function getTodos(options = {}) {
  const { filter, sort, search } = options;
  
  const conditions = [];
  const params = [];
  
  // 筛选条件
  if (filter === 'pending') {
    conditions.push('completed = false');
  } else if (filter === 'completed') {
    conditions.push('completed = true');
  }
  
  // 搜索条件
  if (search) {
    params.push(search);
    conditions.push('content ILIKE ?');
  }
  
  let query = 'SELECT * FROM todos';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  // 排序
  query += ' ORDER BY ';
  switch (sort) {
    case 'created_asc':
      query += 'created_at ASC';
      break;
    case 'created_desc':
      query += 'created_at DESC';
      break;
    case 'priority_asc':
      query += 'priority ASC, created_at DESC';
      break;
    case 'priority_desc':
      query += 'priority DESC, created_at DESC';
      break;
    case 'due_date_asc':
      query += 'due_date ASC, created_at DESC';
      break;
    default:
      query += 'created_at DESC';
  }
  
  const db = getDatabase();
  const result = await db.query(query, params);
  
  return result.rows.map(row => rowToObject(row));
}

/**
 * 根据 ID 获取 TODO
 */
export async function getTodoById(id) {
  const db = getDatabase();
  const result = await db.query(`SELECT * FROM todos WHERE id = ${id}`);
  
  if (result.rows.length === 0) return null;
  return rowToObject(result.rows[0]);
}

/**
 * 创建 TODO
 */
export async function createTodo(data) {
  const { content, priority = 2, due_date = null, note = '' } = data;
  const db = getDatabase();
  
  try {
    // 使用 exec 插入数据
    const contentEsc = content.trim().replace(/'/g, "''");
    const noteEsc = (note || '').replace(/'/g, "''");
    const dueDateVal = due_date ? `'${due_date}'` : 'NULL';
    
    const sql = `INSERT INTO todos (content, priority, due_date, note) VALUES ('${contentEsc}', ${priority}, ${dueDateVal}, '${noteEsc}')`;
    await db.exec(sql);
    
    // 获取最新创建的记录
    const result = await db.query('SELECT * FROM todos ORDER BY id DESC LIMIT 1');
    return rowToObject(result.rows[0]);
  } catch (err) {
    console.error('❌ 创建 TODO 失败:', err.message);
    throw err;
  }
}

/**
 * 更新 TODO
 */
export async function updateTodo(id, data) {
  const { content, completed, priority, due_date, note } = data;
  
  const fields = [];
  
  if (content !== undefined) {
    const val = content.trim().replace(/'/g, "''");
    fields.push(`content = '${val}'`);
  }
  
  if (completed !== undefined) {
    fields.push(`completed = ${completed ? 'true' : 'false'}`);
  }
  
  if (priority !== undefined) {
    fields.push(`priority = ${priority}`);
  }
  
  if (due_date !== undefined) {
    fields.push(`due_date = ${due_date ? `'${due_date}'` : 'NULL'}`);
  }
  
  if (note !== undefined) {
    const val = (note || '').replace(/'/g, "''");
    fields.push(`note = '${val}'`);
  }
  
  if (fields.length === 0) {
    throw new Error('没有要更新的字段');
  }
  
  fields.push("updated_at = CURRENT_TIMESTAMP");
  
  const db = getDatabase();
  await db.exec(`UPDATE todos SET ${fields.join(', ')} WHERE id = ${id}`);
  
  // 查询返回更新后的数据
  return await getTodoById(id);
}

/**
 * 删除 TODO
 */
export async function deleteTodo(id) {
  const db = getDatabase();
  const result = await db.exec(`DELETE FROM todos WHERE id = ${id}`);
  
  if (result.affectedRows === 0) return null;
  return { id, deleted: true };
}

/**
 * 批量操作
 */
export async function batchOperate(ids, action) {
  const db = getDatabase();
  const idList = ids.join(',');
  
  if (action === 'complete') {
    await db.exec(`UPDATE todos SET completed = true, updated_at = CURRENT_TIMESTAMP WHERE id IN (${idList})`);
  } else if (action === 'delete') {
    await db.exec(`DELETE FROM todos WHERE id IN (${idList})`);
  } else {
    throw new Error('未知操作：' + action);
  }
  
  return { count: ids.length, action };
}

/**
 * 获取统计信息
 */
export async function getTodoStats() {
  const db = getDatabase();
  const result = await db.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN completed = false THEN 1 END) as pending,
      COUNT(CASE WHEN completed = true THEN 1 END) as completed
    FROM todos
  `);
  
  return {
    total: result.rows[0].total,
    pending: result.rows[0].pending,
    completed: result.rows[0].completed
  };
}
