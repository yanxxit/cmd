/**
 * useTodo Hook 测试
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTodo } from '../useTodo';

// Mock API
jest.mock('../../api/todo-api', () => ({
  getTodos: jest.fn().mockResolvedValue([]),
  getStats: jest.fn().mockResolvedValue({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    today: 0,
    week: 0,
    completionRate: 0,
  }),
  createTodo: jest.fn().mockResolvedValue({
    id: 1,
    content: '测试任务',
    completed: false,
    priority: 2,
    due_date: null,
    note: null,
    parent_id: null,
    tags: [],
    category: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  updateTodo: jest.fn().mockResolvedValue({}),
  deleteTodo: jest.fn().mockResolvedValue({}),
  toggleTodo: jest.fn().mockResolvedValue({}),
}));

describe('useTodo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该初始化状态', async () => {
    const { result } = renderHook(() => useTodo());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.todos).toEqual([]);
    expect(result.current.filteredTodos).toEqual([]);
    expect(result.current.filter).toBe('all');
    expect(result.current.sort).toBe('created_desc');
  });

  it('应该添加任务', async () => {
    const { result } = renderHook(() => useTodo());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    await act(async () => {
      await result.current.addTodo({ content: '新任务' });
    });
    
    expect(result.current.todos.length).toBe(1);
  });

  it('应该切换任务完成状态', async () => {
    const { result } = renderHook(() => useTodo());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // 先添加任务
    await act(async () => {
      await result.current.addTodo({ content: '测试任务' });
    });
    
    // 切换状态
    await act(async () => {
      await result.current.toggleTodo(1);
    });
    
    expect(result.current.todos[0].completed).toBe(true);
  });

  it('应该删除任务', async () => {
    const { result } = renderHook(() => useTodo());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // 先添加任务
    await act(async () => {
      await result.current.addTodo({ content: '测试任务' });
    });
    
    // 删除任务
    await act(async () => {
      await result.current.deleteTodo(1);
    });
    
    expect(result.current.todos.length).toBe(0);
  });

  it('应该更新筛选状态', async () => {
    const { result } = renderHook(() => useTodo());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    act(() => {
      result.current.setFilter('pending');
    });
    
    expect(result.current.filter).toBe('pending');
  });

  it('应该更新排序状态', async () => {
    const { result } = renderHook(() => useTodo());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    act(() => {
      result.current.setSort('priority_desc');
    });
    
    expect(result.current.sort).toBe('priority_desc');
  });

  it('应该更新搜索关键词', async () => {
    const { result } = renderHook(() => useTodo());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    act(() => {
      result.current.setSearch('测试');
    });
    
    expect(result.current.search).toBe('测试');
  });

  it('应该刷新数据', async () => {
    const { result } = renderHook(() => useTodo());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    await act(async () => {
      await result.current.refresh();
    });
    
    expect(result.current.loading).toBe(false);
  });
});
