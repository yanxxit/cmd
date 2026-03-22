/**
 * TODO 自定义 Hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Todo,
  TodoCreate,
  TodoUpdate,
  TodoStats,
  FilterType,
  SortType,
  ViewType,
} from '../types';
import * as todoApi from '../api';

interface UseTodoOptions {
  initialFilter?: FilterType;
  initialSort?: SortType;
  initialView?: ViewType;
}

interface UseTodoReturn {
  // 数据
  todos: Todo[];
  filteredTodos: Todo[];
  stats: TodoStats | null;
  loading: boolean;
  error: string | null;
  
  // 筛选和排序
  filter: FilterType;
  priorityFilter: string;
  dateFilter: string;
  sort: SortType;
  view: ViewType;
  search: string;
  
  // 操作
  addTodo: (data: TodoCreate) => Promise<void>;
  updateTodo: (id: number, data: TodoUpdate) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  toggleTodo: (id: number) => Promise<void>;
  setFilter: (filter: FilterType) => void;
  setPriorityFilter: (priority: string) => void;
  setDateFilter: (date: string) => void;
  setSort: (sort: SortType) => void;
  setView: (view: ViewType) => void;
  setSearch: (search: string) => void;
  refresh: () => Promise<void>;
}

/**
 * 过滤任务
 */
function filterTodos(todos: Todo[], filter: FilterType, view: ViewType, priorityFilter: string, dateFilter: string): Todo[] {
  let filtered = [...todos];
  
  // 按视图过滤
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  switch (view) {
    case 'today':
      filtered = filtered.filter(todo => {
        if (!todo.due_date) return false;
        const dueDate = new Date(todo.due_date);
        return dueDate.getTime() === today.getTime();
      });
      break;
    case 'week':
      filtered = filtered.filter(todo => {
        if (!todo.due_date) return false;
        const dueDate = new Date(todo.due_date);
        return dueDate >= today && dueDate <= weekFromNow;
      });
      break;
    case 'upcoming':
      filtered = filtered.filter(todo => {
        if (!todo.due_date) return false;
        const dueDate = new Date(todo.due_date);
        return dueDate > weekFromNow;
      });
      break;
    case 'completed':
      filtered = filtered.filter(todo => todo.completed);
      break;
    case 'no-date':
      filtered = filtered.filter(todo => !todo.due_date);
      break;
    case 'all':
    default:
      break;
  }
  
  // 按筛选条件过滤
  switch (filter) {
    case 'pending':
      filtered = filtered.filter(todo => !todo.completed);
      break;
    case 'completed':
      filtered = filtered.filter(todo => todo.completed);
      break;
    case 'overdue':
      filtered = filtered.filter(todo => {
        if (todo.completed || !todo.due_date) return false;
        return new Date(todo.due_date) < today;
      });
      break;
    case 'today':
      filtered = filtered.filter(todo => {
        if (!todo.due_date) return false;
        const dueDate = new Date(todo.due_date);
        return dueDate.getTime() === today.getTime();
      });
      break;
    case 'week':
      filtered = filtered.filter(todo => {
        if (!todo.due_date) return false;
        const dueDate = new Date(todo.due_date);
        return dueDate >= today && dueDate <= weekFromNow;
      });
      break;
    case 'all':
    default:
      break;
  }
  
  // 按优先级过滤
  if (priorityFilter !== 'all') {
    const priorityMap: Record<string, number> = {
      high: 1,
      medium: 2,
      low: 3,
    };
    filtered = filtered.filter(todo => todo.priority === priorityMap[priorityFilter]);
  }
  
  // 按日期过滤
  if (dateFilter !== 'all') {
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(todo => {
          if (!todo.due_date) return false;
          const dueDate = new Date(todo.due_date);
          return dueDate.getTime() === today.getTime();
        });
        break;
      case 'week':
        filtered = filtered.filter(todo => {
          if (!todo.due_date) return false;
          const dueDate = new Date(todo.due_date);
          return dueDate >= today && dueDate <= weekFromNow;
        });
        break;
      case 'month':
        filtered = filtered.filter(todo => {
          if (!todo.due_date) return false;
          const dueDate = new Date(todo.due_date);
          return dueDate.getMonth() === today.getMonth();
        });
        break;
      case 'overdue':
        filtered = filtered.filter(todo => {
          if (todo.completed || !todo.due_date) return false;
          return new Date(todo.due_date) < today;
        });
        break;
    }
  }
  
  return filtered;
}

/**
 * 排序任务
 */
function sortTodos(todos: Todo[], sort: SortType): Todo[] {
  return [...todos].sort((a, b) => {
    switch (sort) {
      case 'created_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'created_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'priority_asc':
        return a.priority - b.priority;
      case 'priority_desc':
        return b.priority - a.priority;
      case 'due_asc':
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      case 'due_desc':
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return -1;
        if (!b.due_date) return 1;
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      case 'updated_desc':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      default:
        return 0;
    }
  });
}

/**
 * 搜索任务
 */
function searchTodos(todos: Todo[], query: string): Todo[] {
  if (!query.trim()) return todos;
  
  const lowerQuery = query.toLowerCase();
  return todos.filter(todo =>
    todo.content.toLowerCase().includes(lowerQuery) ||
    todo.note?.toLowerCase().includes(lowerQuery) ||
    todo.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * TODO 自定义 Hook
 */
export function useTodo(options: UseTodoOptions = {}): UseTodoReturn {
  const {
    initialFilter = 'all',
    initialSort = 'created_desc',
    initialView = 'all',
  } = options;
  
  // 状态
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 筛选和排序
  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortType>(initialSort);
  const [view, setView] = useState<ViewType>(initialView);
  const [search, setSearch] = useState('');
  
  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [todosData, statsData] = await Promise.all([
        todoApi.getTodos(),
        todoApi.getStats(),
      ]);
      
      setTodos(todosData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // 添加任务
  const addTodo = useCallback(async (data: TodoCreate) => {
    const newTodo = await todoApi.createTodo(data);
    setTodos(prev => [newTodo, ...prev]);
    await loadData(); // 重新加载统计
  }, [loadData]);
  
  // 更新任务
  const updateTodo = useCallback(async (id: number, data: TodoUpdate) => {
    await todoApi.updateTodo(id, data);
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, ...data, updated_at: new Date().toISOString() } : todo
    ));
    await loadData(); // 重新加载统计
  }, [loadData]);
  
  // 删除任务
  const deleteTodo = useCallback(async (id: number) => {
    await todoApi.deleteTodo(id);
    setTodos(prev => prev.filter(todo => todo.id !== id));
    await loadData(); // 重新加载统计
  }, [loadData]);
  
  // 切换完成状态
  const toggleTodo = useCallback(async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    await todoApi.toggleTodo(id);
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed, updated_at: new Date().toISOString() } : t
    ));
    await loadData(); // 重新加载统计
  }, [todos, loadData]);
  
  // 刷新数据
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);
  
  // 过滤和排序后的任务列表
  const filteredTodos = useMemo(() => {
    let result = filterTodos(todos, filter, view, priorityFilter, dateFilter);
    result = sortTodos(result, sort);
    result = searchTodos(result, search);
    return result;
  }, [todos, filter, view, sort, search, priorityFilter, dateFilter]);
  
  return {
    // 数据
    todos,
    filteredTodos,
    stats,
    loading,
    error,
    
    // 筛选和排序
    filter,
    priorityFilter,
    dateFilter,
    sort,
    view,
    search,
    
    // 操作
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    setFilter,
    setPriorityFilter,
    setDateFilter,
    setSort,
    setView,
    setSearch,
    refresh,
  };
}
