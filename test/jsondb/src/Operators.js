/**
 * 查询和操作符实现
 */

import { getNestedValue, isType, setNestedValue, deleteNestedValue } from './Utils.js';

/**
 * 比较操作符
 */
export const comparisonOperators = {
  $eq: (value, queryValue) => value === queryValue,
  
  $ne: (value, queryValue) => value !== queryValue,
  
  $gt: (value, queryValue) => value > queryValue,
  
  $gte: (value, queryValue) => value >= queryValue,
  
  $lt: (value, queryValue) => value < queryValue,
  
  $lte: (value, queryValue) => value <= queryValue,
  
  $in: (value, queryValue) => {
    if (!Array.isArray(queryValue)) {
      throw new Error('$in 操作符需要数组');
    }
    return queryValue.includes(value);
  },
  
  $nin: (value, queryValue) => {
    if (!Array.isArray(queryValue)) {
      throw new Error('$nin 操作符需要数组');
    }
    return !queryValue.includes(value);
  }
};

/**
 * 逻辑操作符
 */
export const logicalOperators = {
  $and: (doc, conditions) => {
    if (!Array.isArray(conditions)) {
      throw new Error('$and 操作符需要数组');
    }
    return conditions.every(condition => matchQuery(doc, condition));
  },
  
  $or: (doc, conditions) => {
    if (!Array.isArray(conditions)) {
      throw new Error('$or 操作符需要数组');
    }
    return conditions.some(condition => matchQuery(doc, condition));
  },
  
  $nor: (doc, conditions) => {
    if (!Array.isArray(conditions)) {
      throw new Error('$nor 操作符需要数组');
    }
    return !conditions.some(condition => matchQuery(doc, condition));
  },
  
  $not: (doc, condition, field) => {
    return !matchField(doc, field, condition);
  }
};

/**
 * 元素操作符
 */
export const elementOperators = {
  $exists: (value, queryValue) => {
    return queryValue ? value !== undefined : value === undefined;
  },
  
  $type: (value, queryValue) => {
    return isType(value, queryValue);
  }
};

/**
 * 数组操作符
 */
export const arrayOperators = {
  $all: (value, queryValue) => {
    if (!Array.isArray(value)) {
      return false;
    }
    if (!Array.isArray(queryValue)) {
      throw new Error('$all 操作符需要数组');
    }
    return queryValue.every(item => value.includes(item));
  },
  
  $elemMatch: (value, queryValue) => {
    if (!Array.isArray(value)) {
      return false;
    }
    // 处理数组元素匹配
    return value.some(item => {
      // 如果 queryValue 是对象，需要匹配所有条件
      if (typeof queryValue === 'object' && queryValue !== null) {
        for (const [key, condition] of Object.entries(queryValue)) {
          const itemValue = item[key] !== undefined ? item[key] : (typeof key === 'string' && item[key] !== undefined ? item[key] : undefined);
          if (typeof condition === 'object' && condition !== null) {
            // 处理操作符条件
            for (const [op, opValue] of Object.entries(condition)) {
              if (op === '$gte' && !(itemValue >= opValue)) return false;
              if (op === '$lte' && !(itemValue <= opValue)) return false;
              if (op === '$gt' && !(itemValue > opValue)) return false;
              if (op === '$lt' && !(itemValue < opValue)) return false;
              if (op === '$eq' && !(itemValue === opValue)) return false;
              if (op === '$ne' && !(itemValue !== opValue)) return false;
            }
          } else if (itemValue !== condition) {
            return false;
          }
        }
        return true;
      }
      return item === queryValue;
    });
  },
  
  $size: (value, queryValue) => {
    if (!Array.isArray(value)) {
      return false;
    }
    return value.length === queryValue;
  }
};

/**
 * 正则表达式操作符
 */
export function matchRegex(value, options) {
  if (typeof value !== 'string') {
    return false;
  }
  
  const { $regex, $options = '' } = options;
  
  try {
    const regex = typeof $regex === 'string' ? new RegExp($regex, $options) : $regex;
    return regex.test(value);
  } catch (e) {
    throw new Error(`无效的正则表达式：${$regex}`);
  }
}

/**
 * 匹配字段值
 * @param {Object} doc - 文档
 * @param {string} field - 字段名
 * @param {Object} condition - 条件
 * @returns {boolean}
 */
function matchField(doc, field, condition) {
  const value = getNestedValue(doc, field);
  
  // 如果条件是普通值，直接比较
  if (!condition || typeof condition !== 'object') {
    return value === condition;
  }
  
  // 处理操作符
  let hasOperatorMatch = false;
  
  for (const [operator, queryValue] of Object.entries(condition)) {
    if (operator.startsWith('$')) {
      // $options 是 $regex 的修饰符，跳过
      if (operator === '$options') {
        continue;
      }
      
      hasOperatorMatch = true;
      let result;

      // 比较操作符
      if (comparisonOperators[operator]) {
        result = comparisonOperators[operator](value, queryValue);
      }
      // 元素操作符
      else if (elementOperators[operator]) {
        result = elementOperators[operator](value, queryValue);
      }
      // 数组操作符
      else if (arrayOperators[operator]) {
        result = arrayOperators[operator](value, queryValue);
      }
      // 正则操作符
      else if (operator === '$regex') {
        result = matchRegex(value, condition);
      }
      // 未知操作符
      else {
        throw new Error(`未知操作符：${operator}`);
      }

      if (!result) {
        return false;
      }
    }
  }
  
  // 如果没有操作符匹配，直接比较值
  if (!hasOperatorMatch) {
    return value === condition;
  }
  
  return true;
}

/**
 * 匹配查询条件
 * @param {Object} doc - 文档
 * @param {Object} query - 查询条件
 * @returns {boolean}
 */
export function matchQuery(doc, query) {
  if (!query || typeof query !== 'object') {
    return true;
  }
  
  for (const [key, condition] of Object.entries(query)) {
    // 逻辑操作符
    if (key.startsWith('$')) {
      if (logicalOperators[key]) {
        const result = logicalOperators[key](doc, condition);
        if (!result) {
          return false;
        }
      } else {
        throw new Error(`未知逻辑操作符：${key}`);
      }
    } else {
      // 字段匹配
      const result = matchField(doc, key, condition);
      if (!result) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * 更新操作符实现
 */
export const updateOperators = {
  $set: (doc, updates) => {
    for (const [path, value] of Object.entries(updates)) {
      setNestedValue(doc, path, value);
    }
  },
  
  $unset: (doc, paths) => {
    for (const path of Object.keys(paths)) {
      deleteNestedValue(doc, path);
    }
  },
  
  $inc: (doc, updates) => {
    for (const [path, value] of Object.entries(updates)) {
      const currentValue = getNestedValue(doc, path) || 0;
      setNestedValue(doc, path, currentValue + value);
    }
  },
  
  $mul: (doc, updates) => {
    for (const [path, value] of Object.entries(updates)) {
      const currentValue = getNestedValue(doc, path) || 1;
      setNestedValue(doc, path, currentValue * value);
    }
  },
  
  $rename: (doc, renames) => {
    for (const [oldPath, newPath] of Object.entries(renames)) {
      const value = getNestedValue(doc, oldPath);
      if (value !== undefined) {
        setNestedValue(doc, newPath, value);
        deleteNestedValue(doc, oldPath);
      }
    }
  },
  
  $setOnInsert: (doc, updates, isInsert) => {
    if (isInsert) {
      updateOperators.$set(doc, updates);
    }
  },
  
  $min: (doc, updates) => {
    for (const [path, value] of Object.entries(updates)) {
      const currentValue = getNestedValue(doc, path);
      if (currentValue === undefined || value < currentValue) {
        setNestedValue(doc, path, value);
      }
    }
  },
  
  $max: (doc, updates) => {
    for (const [path, value] of Object.entries(updates)) {
      const currentValue = getNestedValue(doc, path);
      if (currentValue === undefined || value > currentValue) {
        setNestedValue(doc, path, value);
      }
    }
  },
  
  $push: (doc, updates) => {
    for (const [path, value] of Object.entries(updates)) {
      const currentValue = getNestedValue(doc, path);
      const array = Array.isArray(currentValue) ? currentValue : [];
      setNestedValue(doc, path, [...array, value]);
    }
  },
  
  $pop: (doc, updates) => {
    for (const [path, direction] of Object.entries(updates)) {
      const currentValue = getNestedValue(doc, path);
      if (Array.isArray(currentValue) && currentValue.length > 0) {
        if (direction === 1) {
          setNestedValue(doc, path, currentValue.slice(0, -1));
        } else if (direction === -1) {
          setNestedValue(doc, path, currentValue.slice(1));
        }
      }
    }
  },
  
  $pull: (doc, updates) => {
    for (const [path, condition] of Object.entries(updates)) {
      const currentValue = getNestedValue(doc, path);
      if (Array.isArray(currentValue)) {
        const filtered = currentValue.filter(item => {
          if (typeof condition === 'object') {
            return !matchQuery(item, condition);
          }
          return item !== condition;
        });
        setNestedValue(doc, path, filtered);
      }
    }
  },
  
  $addToSet: (doc, updates) => {
    for (const [path, value] of Object.entries(updates)) {
      const currentValue = getNestedValue(doc, path);
      const array = Array.isArray(currentValue) ? currentValue : [];
      if (!array.some(item => JSON.stringify(item) === JSON.stringify(value))) {
        setNestedValue(doc, path, [...array, value]);
      }
    }
  }
};

/**
 * 应用更新到文档
 * @param {Object} doc - 原文档
 * @param {Object} update - 更新对象
 * @param {boolean} isInsert - 是否是插入操作
 * @returns {Object} 更新后的文档
 */
export function applyUpdate(doc, update, isInsert = false) {
  const result = JSON.parse(JSON.stringify(doc));
  
  for (const [operator, updates] of Object.entries(update)) {
    if (!operator.startsWith('$')) {
      throw new Error('更新操作必须使用操作符');
    }
    
    if (updateOperators[operator]) {
      updateOperators[operator](result, updates, isInsert);
    } else {
      throw new Error(`未知更新操作符：${operator}`);
    }
  }
  
  return result;
}
