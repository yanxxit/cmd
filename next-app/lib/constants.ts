/**
 * 全局常量定义
 */

// API 基础路径
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// 应用配置
export const APP_CONFIG = {
  name: 'JSON Diff Tool',
  version: '1.0.0',
  maxHistory: 10,
  defaultFontSize: 13,
  minFontSize: 11,
  maxFontSize: 20,
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  JSON_DIFF_HISTORY: 'json-diff-history',
  THEME: 'theme',
  SETTINGS: 'settings',
} as const;

// 快捷键配置
export const SHORTCUTS = {
  COMPARE: 'mod+Enter',
  HISTORY: 'mod+H',
  THEME: 'mod+B',
  FORMAT: 'mod+Shift+F',
  CLEAR: 'mod+Shift+X',
} as const;

// 文件类型配置
export const FILE_TYPES = {
  JSON: {
    accept: '.json,application/json',
    mime: 'application/json',
    extension: '.json',
  },
} as const;

// 消息配置
export const MESSAGE_CONFIG = {
  duration: 3,
  maxCount: 3,
} as const;

// 动画配置
export const ANIMATION_CONFIG = {
  duration: 0.3,
  easing: 'ease',
} as const;
