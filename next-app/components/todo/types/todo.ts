/**
 * TODO List 应用类型定义
 */

// 优先级类型
export type Priority = 1 | 2 | 3; // 1-高，2-中，3-低

// 任务状态
export type TodoStatus = 'pending' | 'completed' | 'overdue';

// 筛选类型
export type FilterType = 'all' | 'pending' | 'completed' | 'today' | 'week' | 'overdue';
export type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
export type DateFilter = 'all' | 'today' | 'week' | 'month' | 'overdue';

// 排序类型
export type SortType = 
  | 'created_asc' 
  | 'created_desc' 
  | 'priority_asc' 
  | 'priority_desc' 
  | 'due_asc' 
  | 'due_desc'
  | 'updated_desc';

// 视图类型
export type ViewType = 'all' | 'today' | 'week' | 'upcoming' | 'completed' | 'no-date';

// 主题类型
export type ThemeType = 'light' | 'dark' | 'auto';

// 任务对象
export interface Todo {
  id: number;
  content: string;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  due_time?: string | null;
  note: string | null;
  parent_id: number | null;
  tags: string[];
  category: string;
  repeat?: string | null;
  created_at: string;
  updated_at: string;
  // 计算属性（非数据库字段）
  subTodos?: Todo[];
  isOverdue?: boolean;
  isToday?: boolean;
  subTaskProgress?: {
    total: number;
    completed: number;
    percentage: number;
  };
}

// 创建任务
export interface TodoCreate {
  content: string;
  priority?: Priority;
  due_date?: string | null;
  due_time?: string | null;
  note?: string | null;
  parent_id?: number | null;
  tags?: string[];
  category?: string;
  repeat?: string | null;
}

// 更新任务
export interface TodoUpdate {
  content?: string;
  completed?: boolean;
  priority?: Priority;
  due_date?: string | null;
  due_time?: string | null;
  note?: string | null;
  tags?: string[];
  category?: string;
  repeat?: string | null;
}

// 批量操作
export interface BatchOperation {
  ids: number[];
  action: 'complete' | 'uncomplete' | 'delete';
}

// 统计信息
export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  today: number;
  week: number;
  completionRate: number;
}

// API 响应基础类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// API 查询参数
export interface TodoQueryParams {
  filter?: FilterType;
  priority?: PriorityFilter;
  due_date?: DateFilter;
  sort?: SortType;
  search?: string;
  parent_id?: string | null;
  category?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
}

// 自然语言解析结果
export interface ParsedResult {
  content: string;
  priority?: Priority;
  due_date?: string;
  due_time?: string;
  tags?: string[];
  category?: string;
  repeat?: string;
}

// 分类对象
export interface Category {
  id: number;
  name: string;
  color: string;
  icon?: string;
  todo_count: number;
}

// 标签对象
export interface Tag {
  id: number;
  name: string;
  color: string;
  todo_count: number;
}

// 用户设置
export interface UserSettings {
  theme: ThemeType;
  defaultPriority: Priority;
  defaultView: ViewType;
  showCompleted: boolean;
  soundEnabled: boolean;
}
