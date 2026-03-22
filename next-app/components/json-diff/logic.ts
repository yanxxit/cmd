import { LineDiffInfo } from './types';

/**
 * 按拼音排序 Key
 */
export const sortKeysByPinyin = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => sortKeysByPinyin(item));

  const sorted: any = {};
  Object.keys(obj)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
    .forEach(key => {
      sorted[key] = sortKeysByPinyin(obj[key]);
    });
  return sorted;
};

/**
 * 计算 JSON 差异
 */
export const calculateDiff = (left: any, right: any, path = ''): any => {
  const result: any = { nodes: [], stats: { total: 0, same: 0, modified: 0, added: 0 } };
  const allKeys = new Set<string>();

  if (left && typeof left === 'object') Object.keys(left).forEach(k => allKeys.add(k));
  if (right && typeof right === 'object') Object.keys(right).forEach(k => allKeys.add(k));

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const hasLeft = left && key in left;
    const hasRight = right && key in right;
    const leftVal = hasLeft ? left[key] : undefined;
    const rightVal = hasRight ? right[key] : undefined;

    result.stats.total++;

    if (hasLeft && !hasRight) {
      result.nodes.push({ path: currentPath, key, type: 'added', leftValue: leftVal });
      result.stats.added++;
    } else if (!hasLeft && hasRight) {
      result.nodes.push({ path: currentPath, key, type: 'added', rightValue: rightVal });
      result.stats.added++;
    } else if (hasLeft && hasRight) {
      if (typeof leftVal === 'object' && typeof rightVal === 'object') {
        const childDiff = calculateDiff(leftVal, rightVal, currentPath);
        if (childDiff.stats.modified || childDiff.stats.added) {
          result.nodes.push({ path: currentPath, key, type: 'modified', children: childDiff });
          result.stats.modified++;
          result.stats.same += childDiff.stats.same;
          result.stats.modified += childDiff.stats.modified;
          result.stats.added += childDiff.stats.added;
        } else {
          result.stats.same++;
        }
      } else {
        if (leftVal === rightVal) {
          result.stats.same++;
        } else {
          result.nodes.push({ path: currentPath, key, type: 'modified', leftValue: leftVal, rightValue: rightVal });
          result.stats.modified++;
        }
      }
    }
  }
  return result;
};

/**
 * 过滤相同的字段
 */
export const filterSameFields = (data: any, compareData: any): any => {
  if (data === null || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    if (!Array.isArray(compareData)) return data;
    return data
      .map((item, i) => {
        if (JSON.stringify(item) === JSON.stringify(compareData[i])) return null;
        return filterSameFields(item, compareData[i]);
      })
      .filter(item => item !== null);
  }

  const result: any = {};
  for (const key of Object.keys(data)) {
    if (key in compareData) {
      if (typeof data[key] === 'object') {
        const filtered = filterSameFields(data[key], compareData[key]);
        if (Array.isArray(filtered) ? filtered.length : Object.keys(filtered).length) {
          result[key] = filtered;
        }
      } else if (data[key] !== compareData[key]) {
        result[key] = data[key];
      }
    } else {
      result[key] = data[key];
    }
  }
  return result;
};

/**
 * 收集差异路径
 */
export const collectDiffPaths = (diff: any, leftPaths: Map<string, any>, rightPaths: Map<string, any>) => {
  diff.nodes.forEach((node: any) => {
    if (node.type === 'added') {
      if (node.leftValue !== undefined) {
        leftPaths.set(node.path, 'deleted');
      } else {
        rightPaths.set(node.path, 'added');
      }
    } else if (node.type === 'modified') {
      leftPaths.set(node.path, 'modified');
      rightPaths.set(node.path, 'modified');
    }
    if (node.children) {
      collectDiffPaths(node.children, leftPaths, rightPaths);
    }
  });
};
