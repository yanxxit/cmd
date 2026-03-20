/**
 * JSON 对比核心算法模块
 * 支持深度对比、差异统计、拼音排序等功能
 */

/**
 * 按拼音排序对象键
 */
export function sortKeysByPinyin(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sortKeysByPinyin(item));
  }
  
  const sorted = {};
  Object.keys(obj).sort((a, b) => {
    return a.localeCompare(b, 'zh-Hans-CN', { sensitivity: 'accent' });
  }).forEach(key => {
    sorted[key] = sortKeysByPinyin(obj[key]);
  });
  
  return sorted;
}

/**
 * 深度对比两个值
 */
export function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * 对比两个 JSON 对象
 * 返回差异数据结构
 */
export function compareJson(left, right) {
  const result = {
    diff: {},
    stats: {
      total: 0,
      same: 0,
      modified: 0,
      added: 0,
      deleted: 0
    }
  };
  
  function compare(obj1, obj2, path = '', prefix = '') {
    const keys1 = obj1 ? Object.keys(obj1) : [];
    const keys2 = obj2 ? Object.keys(obj2) : [];
    const allKeys = [...new Set([...keys1, ...keys2])];
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const displayPath = prefix ? `${prefix}.${key}` : key;
      
      const hasIn1 = obj1 && key in obj1;
      const hasIn2 = obj2 && key in obj2;
      
      const val1 = hasIn1 ? obj1[key] : undefined;
      const val2 = hasIn2 ? obj2[key] : undefined;
      
      result.stats.total++;
      
      if (!hasIn1) {
        // 新增（右侧有，左侧没有）
        result.stats.added++;
        result.diff[displayPath] = {
          action: 'added',
          rightValue: val2,
          leftValue: undefined
        };
      } else if (!hasIn2) {
        // 删除（左侧有，右侧没有）
        result.stats.deleted++;
        result.diff[displayPath] = {
          action: 'deleted',
          leftValue: val1,
          rightValue: undefined
        };
      } else if (deepEqual(val1, val2)) {
        // 相同
        result.stats.same++;
        result.diff[displayPath] = {
          action: 'same',
          leftValue: val1,
          rightValue: val2
        };
      } else if (typeof val1 === 'object' && typeof val2 === 'object' && 
                 val1 !== null && val2 !== null &&
                 Array.isArray(val1) === Array.isArray(val2)) {
        // 都是对象或数组，递归对比
        compare(val1, val2, currentPath, displayPath);
      } else {
        // 值不同
        result.stats.modified++;
        result.diff[displayPath] = {
          action: 'modified',
          leftValue: val1,
          rightValue: val2
        };
      }
    }
  }
  
  compare(left, right);
  return result;
}

/**
 * 过滤相同字段，只保留差异
 */
export function filterSameFields(diffData, hideSame = true) {
  if (!hideSame) return diffData;
  
  const filtered = {};
  for (const [key, value] of Object.entries(diffData)) {
    if (value.action !== 'same') {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * 将差异数据转换为可导出格式
 */
export function exportDiffData(comparisonResult, leftRaw, rightRaw) {
  return {
    generatedAt: new Date().toISOString(),
    stats: comparisonResult.stats,
    left: JSON.parse(leftRaw),
    right: JSON.parse(rightRaw),
    diff: comparisonResult.diff
  };
}

/**
 * 格式化 JSON 字符串
 */
export function formatJson(jsonString) {
  try {
    const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    return JSON.stringify(sortKeysByPinyin(parsed), null, 2);
  } catch (e) {
    throw new Error('无效的 JSON 格式');
  }
}

/**
 * 解析 JSON 字符串
 */
export function parseJson(jsonString) {
  try {
    return {
      success: true,
      data: JSON.parse(jsonString)
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * 计算差异百分比
 */
export function calculateDiffPercentage(stats) {
  if (stats.total === 0) return 0;
  const diffCount = stats.modified + stats.added + stats.deleted;
  return Math.round((diffCount / stats.total) * 100);
}

/**
 * 获取差异类型标签
 */
export function getActionLabel(action) {
  const labels = {
    'same': '相同',
    'modified': '修改',
    'added': '新增',
    'deleted': '删除'
  };
  return labels[action] || action;
}

/**
 * 获取差异类型颜色
 */
export function getActionColor(action) {
  const colors = {
    'same': '#10b981',
    'modified': '#3b82f6',
    'added': '#ef4444',
    'deleted': '#f59e0b'
  };
  return colors[action] || '#666';
}
