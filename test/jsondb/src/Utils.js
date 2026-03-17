/**
 * 工具函数模块
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

/**
 * 生成唯一 ID（类似 MongoDB ObjectId 简化版）
 * @returns {string} 24 位十六进制字符串
 */
export function generateId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomPart = createHash('sha256')
    .update(Math.random().toString() + Date.now().toString())
    .digest('hex')
    .substring(0, 16);
  return timestamp + randomPart;
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 获取嵌套对象的值
 * @param {Object} obj - 对象
 * @param {string} path - 路径，如 'user.name'
 * @returns {any} 值
 */
export function getNestedValue(obj, path) {
  if (!path || typeof path !== 'string') {
    return obj;
  }
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return undefined;
    }
    result = result[key];
  }
  
  return result;
}

/**
 * 设置嵌套对象的值
 * @param {Object} obj - 对象
 * @param {string} path - 路径，如 'user.name'
 * @param {any} value - 值
 */
export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

/**
 * 删除嵌套对象的属性
 * @param {Object} obj - 对象
 * @param {string} path - 路径，如 'user.name'
 * @returns {boolean} 是否删除成功
 */
export function deleteNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      return false;
    }
    current = current[keys[i]];
  }
  
  return delete current[keys[keys.length - 1]];
}

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
export function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirname(dirPath), { recursive: true });
  }
}

/**
 * 检查值是否匹配类型
 * @param {any} value - 值
 * @param {string} type - 类型名称
 * @returns {boolean}
 */
export function isType(value, type) {
  if (type === 'array') {
    return Array.isArray(value);
  }
  if (type === 'null') {
    return value === null;
  }
  if (type === 'object') {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
  return typeof value === type;
}

/**
 * 比较两个值
 * @param {any} a - 值 a
 * @param {any} b - 值 b
 * @returns {number} -1, 0, 1
 */
export function compareValues(a, b) {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * 将排序规范转换为比较函数
 * @param {Object} sortSpec - 排序规范，如 { age: -1, name: 1 }
 * @returns {Function} 比较函数
 */
export function createSortFunction(sortSpec) {
  const keys = Object.keys(sortSpec);
  
  return (a, b) => {
    for (const key of keys) {
      const direction = sortSpec[key];
      const aVal = getNestedValue(a, key);
      const bVal = getNestedValue(b, key);
      
      const cmp = compareValues(aVal, bVal);
      if (cmp !== 0) {
        return cmp * direction;
      }
    }
    return 0;
  };
}

/**
 * 投影文档字段
 * @param {Object} doc - 文档
 * @param {Object} projection - 投影规范
 * @returns {Object} 投影后的文档
 */
export function projectDocument(doc, projection) {
  if (!projection) {
    return deepClone(doc);
  }
  
  const result = {};
  const keys = Object.keys(projection);
  
  // 检查是包含模式还是排除模式
  let isIncludeMode = false;
  for (const key of keys) {
    if (key !== '_id' && projection[key]) {
      isIncludeMode = true;
      break;
    }
  }
  
  // 处理 _id 字段
  if (projection._id !== undefined) {
    if (projection._id) {
      result._id = doc._id;
    }
  } else if (isIncludeMode) {
    result._id = doc._id;
  }
  
  // 处理其他字段
  for (const key of keys) {
    if (key === '_id') continue;
    
    if (projection[key]) {
      result[key] = getNestedValue(doc, key);
    }
  }
  
  return result;
}
