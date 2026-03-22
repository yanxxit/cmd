/**
 * TODO API 调用封装
 */

import type {
  Todo,
  TodoCreate,
  TodoUpdate,
  TodoQueryParams,
  TodoStats,
  BatchOperation,
  ApiResponse,
} from '../types';

const API_BASE = '/api/todos';

/**
 * 处理 API 响应
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || '请求失败');
  }
  const data = await response.json();
  return data.data;
}

/**
 * 获取任务列表
 */
export async function getTodos(params?: TodoQueryParams): Promise<Todo[]> {
  const searchParams = new URLSearchParams();
  
  if (params?.filter) searchParams.set('filter', params.filter);
  if (params?.priority) searchParams.set('priority', params.priority);
  if (params?.due_date) searchParams.set('due_date', params.due_date);
  if (params?.sort) searchParams.set('sort', params.sort);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.parent_id !== undefined) searchParams.set('parent_id', String(params.parent_id));
  if (params?.category) searchParams.set('category', params.category);
  if (params?.tags) params.tags.forEach(tag => searchParams.append('tags', tag));
  
  const queryString = searchParams.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
  
  const response = await fetch(url);
  return handleResponse<Todo[]>(response);
}

/**
 * 获取单个任务
 */
export async function getTodo(id: number): Promise<Todo> {
  const response = await fetch(`${API_BASE}/${id}`);
  return handleResponse<Todo>(response);
}

/**
 * 创建任务
 */
export async function createTodo(data: TodoCreate): Promise<Todo> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Todo>(response);
}

/**
 * 更新任务
 */
export async function updateTodo(id: number, data: TodoUpdate): Promise<Todo> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Todo>(response);
}

/**
 * 删除任务
 */
export async function deleteTodo(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '删除失败' }));
    throw new Error(error.message || '删除失败');
  }
}

/**
 * 切换任务完成状态
 */
export async function toggleTodo(id: number): Promise<Todo> {
  const todo = await getTodo(id);
  return updateTodo(id, { completed: !todo.completed });
}

/**
 * 批量操作
 */
export async function batchOperation(operation: BatchOperation): Promise<void> {
  const response = await fetch(`${API_BASE}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(operation),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '批量操作失败' }));
    throw new Error(error.message || '批量操作失败');
  }
}

/**
 * 获取统计信息
 */
export async function getStats(): Promise<TodoStats> {
  const response = await fetch(`${API_BASE}/stats`);
  return handleResponse<TodoStats>(response);
}

/**
 * 获取子任务列表
 */
export async function getSubTodos(parentId: number): Promise<Todo[]> {
  return getTodos({ parent_id: String(parentId) });
}

/**
 * 添加子任务
 */
export async function addSubTodo(parentId: number, data: Omit<TodoCreate, 'parent_id'>): Promise<Todo> {
  return createTodo({ ...data, parent_id: parentId });
}
