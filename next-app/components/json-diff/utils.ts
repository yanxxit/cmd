import { LineDiffInfo } from './types';

/**
 * 处理 JSON 行差异
 */
export const processLines = (text: string, diffPaths: Map<string, any>): LineDiffInfo[] => {
  if (!text) return [];

  const lines = text.split('\n');
  const result: LineDiffInfo[] = [];
  const keyPathStack: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    let type: 'added' | 'modified' | 'deleted' | 'same' = 'same';

    // 检查是否包含 key
    const keyMatch = trimmed.match(/^"([^"]+)":/);
    if (keyMatch) {
      const key = keyMatch[1];
      if (trimmed.includes('{') || trimmed.includes('[')) {
        keyPathStack.push(key);
      }
      const path = keyPathStack.length > 0 ? keyPathStack.join('.') + '.' + key : key;

      // 匹配差异路径
      for (const [p, t] of diffPaths.entries()) {
        if (p === path || p.endsWith('.' + key)) {
          type = t === 'added' ? 'deleted' : t;
          break;
        }
      }
    }

    // 值行继承上一个 key 行的类型
    if (type === 'same' && !keyMatch && trimmed && !['{', '}', '[', ']'].includes(trimmed)) {
      for (let j = i - 1; j >= 0; j--) {
        if (result[j] && result[j].type !== 'same') {
          type = result[j].type;
          break;
        }
      }
    }

    result.push({ content: line, type });
  }

  return result;
};

/**
 * 格式化 JSON
 */
export const formatJson = (json: string): string => {
  try {
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return json;
  }
};

/**
 * 压缩 JSON
 */
export const minifyJson = (json: string): string => {
  try {
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed);
  } catch {
    return json;
  }
};

/**
 * 解析上传的 JSON 文件
 */
export const parseJsonFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        // 验证是否为有效 JSON
        JSON.parse(content);
        resolve(content);
      } catch (err) {
        reject(new Error('无效的 JSON 文件'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
};

/**
 * 性能优化：分块处理大 JSON
 */
export const processLargeJson = (data: any, chunkSize = 1000): any => {
  if (data === null || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    if (data.length <= chunkSize) {
      return data.map(item => processLargeJson(item, chunkSize));
    }
    // 分块处理大数组
    const result: any[] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      result.push(...chunk.map(item => processLargeJson(item, chunkSize)));
    }
    return result;
  }

  const result: any = {};
  const keys = Object.keys(data);
  for (const key of keys) {
    result[key] = processLargeJson(data[key], chunkSize);
  }
  return result;
};

/**
 * 检查是否为有效 JSON
 */
export const isValidJson = (text: string): boolean => {
  if (!text || !text.trim()) return false;
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * 智能格式化：尝试格式化 JSON，失败则返回原文本
 */
export const smartFormat = (text: string): string => {
  if (!text || !text.trim()) return text;
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return text;
  }
};

/**
 * 复制文本到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
};
