// js/format.js - 子案例内容渲染所需的小工具
// content 可能是 JSON 对象或字符串，统一转成可读字符串
export function contentToText(content) {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;
  try {
    return JSON.stringify(content, null, 2);
  } catch (e) {
    return String(content);
  }
}

export function contentToInline(content) {
  const text = contentToText(content);
  return text.replace(/\s+/g, ' ').trim();
}

// 尝试把字符串解析为 JSON；失败则原样返回
export function tryParseJSON(text) {
  if (typeof text !== 'string' || !text.trim()) return text;
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}
