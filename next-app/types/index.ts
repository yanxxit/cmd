/**
 * 全局类型定义
 */

// 通用响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}

// 分页响应
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationParams;
}

// 用户类型
export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// 主题类型
export type Theme = 'light' | 'dark' | 'auto';

// 工具函数类型
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Primitive = string | number | boolean | null | undefined;

// 事件类型
export interface EventCallback<T = any> {
  (data: T): void;
}

// 组件通用属性
export interface BaseProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// 异步操作选项
export interface AsyncOptions {
  loading?: boolean;
  success?: boolean;
  error?: boolean;
}
