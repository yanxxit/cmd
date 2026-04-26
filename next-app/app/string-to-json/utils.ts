/**
 * 将带有多层转义的字符串解析为 JSON 对象
 * @param inputStr 原始转义字符串
 * @returns 解析后的 JavaScript 对象
 */
export function parseEscapedJson(inputStr: string): any {
  if (!inputStr || !inputStr.trim()) {
    throw new Error('Empty input');
  }

  let parsed = inputStr.trim();
  let result;

  // 尝试第一遍原生解析
  try {
    result = JSON.parse(parsed);
  } catch (e) {
    // 如果失败，尝试一些常见的修正
    // 1. 如果是以非标准引号包裹的内容，尝试替换
    let cleanStr = parsed.replace(/^['"`]|['"`]$/g, '');
    
    // 2. 如果包含多余的反斜杠，尝试反转义
    if (cleanStr.includes('\\"')) {
      cleanStr = cleanStr.replace(/\\"/g, '"');
    }
    if (cleanStr.includes('\\\\')) {
      cleanStr = cleanStr.replace(/\\\\/g, '\\');
    }
    
    result = JSON.parse(cleanStr);
  }

  // 如果解析出来仍然是字符串（例如经过多层转义的字符串 "{\\\"a\\\":1}"）
  // 继续向下解析直到它成为一个对象
  let depth = 0;
  while (typeof result === 'string' && depth < 5) {
    try {
      const nextResult = JSON.parse(result);
      result = nextResult;
    } catch (e) {
      break; // 无法进一步解析，直接退出
    }
    depth++;
  }

  if (typeof result !== 'object' || result === null) {
    // 哪怕只是一个数字或字符串，只要有效也可以格式化展示
    // 但为了严谨，我们先判断一下
    if (typeof result === 'string') {
      throw new Error('Parsed result is still a string, might not be a valid JSON object');
    }
  }

  return result;
}

/**
 * 将 JSON 字符串或对象压缩并转义为适合复制的单行字符串
 * @param jsonInput 合法的 JSON 字符串或对象
 * @returns 转义并由双引号包裹的字符串
 */
export function stringifyAndEscapeJson(jsonInput: string | object): string {
  let parsed;
  if (typeof jsonInput === 'string') {
    if (!jsonInput.trim()) {
      throw new Error('Empty input');
    }
    parsed = JSON.parse(jsonInput);
  } else {
    parsed = jsonInput;
  }
  
  // 压缩成单行并转义双引号
  const str = JSON.stringify(parsed);
  // 如果需要被包裹成字符串，可以在外层加双引号
  return `"${str.replace(/"/g, '\\"')}"`;
}
