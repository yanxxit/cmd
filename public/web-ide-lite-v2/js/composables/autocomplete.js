/**
 * Web IDE Lite v2 - 自动补全功能
 * 
 * 功能：
 * 1. 代码关键字补全
 * 2. 智能提示弹窗
 * 3. 键盘导航选择
 * 4. 按语言分类补全
 */

// 编程语言关键字补全列表
const KEYWORDS = {
  javascript: [
    { label: 'function', detail: '函数声明', insertText: 'function ${1:name}(${2:args}) {\n  ${3:// code}\n}' },
    { label: 'const', detail: '常量声明', insertText: 'const ${1:name} = ${2:value};' },
    { label: 'let', detail: '变量声明', insertText: 'let ${1:name} = ${2:value};' },
    { label: 'var', detail: '变量声明', insertText: 'var ${1:name} = ${2:value};' },
    { label: 'if', detail: '条件语句', insertText: 'if (${1:condition}) {\n  ${2:// code}\n}' },
    { label: 'else', detail: '条件语句', insertText: 'else {\n  ${1:// code}\n}' },
    { label: 'for', detail: '循环语句', insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n  ${3:// code}\n}' },
    { label: 'while', detail: '循环语句', insertText: 'while (${1:condition}) {\n  ${2:// code}\n}' },
    { label: 'return', detail: '返回语句', insertText: 'return ${1:value};' },
    { label: 'class', detail: '类声明', insertText: 'class ${1:Name} {\n  constructor(${2:args}) {\n    ${3:// code}\n  }\n}' },
    { label: 'import', detail: '导入模块', insertText: 'import { ${1:module} } from "${2:path}";' },
    { label: 'export', detail: '导出模块', insertText: 'export ${1:default} ' },
    { label: 'async', detail: '异步函数', insertText: 'async ${1:name}(${2:args}) {\n  ${3:// code}\n}' },
    { label: 'await', detail: '等待 Promise', insertText: 'await ${1:promise}' },
    { label: 'try', detail: '异常处理', insertText: 'try {\n  ${1:// code}\n} catch (${2:error}) {\n  ${3:// handle error}\n}' },
    { label: 'console.log', detail: '控制台输出', insertText: 'console.log(${1:data});' },
    { label: 'console.error', detail: '控制台错误', insertText: 'console.error(${1:error});' },
    { label: 'console.warn', detail: '控制台警告', insertText: 'console.warn(${1:warning});' },
    { label: 'setTimeout', detail: '定时器', insertText: 'setTimeout(() => {\n  ${1:// code}\n}, ${2:delay});' },
    { label: 'setInterval', detail: '间隔定时器', insertText: 'setInterval(() => {\n  ${1:// code}\n}, ${2:delay});' },
    { label: 'addEventListener', detail: '事件监听', insertText: '${1:element}.addEventListener(\'${2:event}\', (${3:e}) => {\n  ${4:// code}\n});' },
    { label: 'fetch', detail: '网络请求', insertText: 'fetch(\'${1:url}\')\n  .then(response => response.json())\n  .then(data => {\n    ${2:// code}\n  });' },
    { label: 'document.querySelector', detail: 'DOM 查询', insertText: 'document.querySelector(\'${1:selector}\')' },
    { label: 'document.querySelectorAll', detail: 'DOM 查询全部', insertText: 'document.querySelectorAll(\'${1:selector}\')' },
    { label: 'Array.map', detail: '数组映射', insertText: '.map(${1:item} => ${2:result})' },
    { label: 'Array.filter', detail: '数组过滤', insertText: '.filter(${1:item} => ${2:condition})' },
    { label: 'Array.reduce', detail: '数组归约', insertText: '.reduce((acc, ${1:item}) => {\n  ${2:// code}\n  return acc;\n}, ${3:initial})' },
    { label: 'Array.forEach', detail: '数组遍历', insertText: '.forEach(${1:item} => {\n  ${2:// code}\n})' }
  ],
  
  python: [
    { label: 'def', detail: '函数定义', insertText: 'def ${1:name}(${2:args}):\n    ${3:# code}' },
    { label: 'class', detail: '类定义', insertText: 'class ${1:Name}:\n    def __init__(self, ${2:args}):\n        ${3:# code}' },
    { label: 'if', detail: '条件语句', insertText: 'if ${1:condition}:\n    ${2:# code}' },
    { label: 'elif', detail: '条件语句', insertText: 'elif ${1:condition}:\n    ${2:# code}' },
    { label: 'else', detail: '条件语句', insertText: 'else:\n    ${1:# code}' },
    { label: 'for', detail: '循环语句', insertText: 'for ${1:item} in ${2:iterable}:\n    ${3:# code}' },
    { label: 'while', detail: '循环语句', insertText: 'while ${1:condition}:\n    ${2:# code}' },
    { label: 'return', detail: '返回语句', insertText: 'return ${1:value}' },
    { label: 'import', detail: '导入模块', insertText: 'import ${1:module}' },
    { label: 'from import', detail: '导入模块', insertText: 'from ${1:module} import ${2:name}' },
    { label: 'try', detail: '异常处理', insertText: 'try:\n    ${1:# code}\nexcept ${2:Exception} as ${3:e}:\n    ${4:# handle}' },
    { label: 'print', detail: '打印输出', insertText: 'print(${1:data})' },
    { label: 'len', detail: '获取长度', insertText: 'len(${1:obj})' },
    { label: 'range', detail: '范围', insertText: 'range(${1:start}, ${2:stop}, ${3:step})' },
    { label: 'list', detail: '列表', insertText: '[${1:item} for ${2:item} in ${3:iterable}]' },
    { label: 'dict', detail: '字典', insertText: '{${1:key}: ${2:value} for ${3:key}, ${4:value} in ${5:items}}' }
  ],
  
  html: [
    { label: 'div', detail: 'DIV 元素', insertText: '<div>${1:content}</div>' },
    { label: 'span', detail: 'SPAN 元素', insertText: '<span>${1:content}</span>' },
    { label: 'p', detail: '段落', insertText: '<p>${1:content}</p>' },
    { label: 'a', detail: '链接', insertText: '<a href="${1:url}">${2:text}</a>' },
    { label: 'img', detail: '图片', insertText: '<img src="${1:src}" alt="${2:alt}">' },
    { label: 'ul', detail: '无序列表', insertText: '<ul>\n  <li>${1:item}</li>\n</ul>' },
    { label: 'ol', detail: '有序列表', insertText: '<ol>\n  <li>${1:item}</li>\n</ol>' },
    { label: 'li', detail: '列表项', insertText: '<li>${1:content}</li>' },
    { label: 'table', detail: '表格', insertText: '<table>\n  <thead>\n    <tr>\n      <th>${1:Header}</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>${2:Data}</td>\n    </tr>\n  </tbody>\n</table>' },
    { label: 'form', detail: '表单', insertText: '<form action="${1:url}" method="${2:post}">\n  <input type="${3:text}" name="${4:name}">\n  <button type="submit">${5:Submit}</button>\n</form>' },
    { label: 'input', detail: '输入框', insertText: '<input type="${1:text}" name="${2:name}" placeholder="${3:placeholder}">' },
    { label: 'button', detail: '按钮', insertText: '<button type="${1:button}">${2:Text}</button>' },
    { label: 'script', detail: '脚本', insertText: '<script>\n  ${1:// code}\n</script>' },
    { label: 'style', detail: '样式', insertText: '<style>\n  ${1:/* css */}\n</style>' },
    { label: 'link css', detail: '链接 CSS', insertText: '<link rel="stylesheet" href="${1:style.css}">' }
  ],
  
  css: [
    { label: 'display', detail: '显示属性', insertText: 'display: ${1:flex};' },
    { label: 'flex', detail: '弹性布局', insertText: 'display: flex;\njustify-content: ${1:center};\nalign-items: ${2:center};' },
    { label: 'grid', detail: '网格布局', insertText: 'display: grid;\ngrid-template-columns: ${1:repeat(3, 1fr)};\ngap: ${2:10px};' },
    { label: 'position', detail: '定位', insertText: 'position: ${1:absolute};\ntop: ${2:0};\nleft: ${3:0};' },
    { label: 'margin', detail: '外边距', insertText: 'margin: ${1:0};' },
    { label: 'padding', detail: '内边距', insertText: 'padding: ${1:0};' },
    { label: 'color', detail: '文字颜色', insertText: 'color: ${1:#333};' },
    { label: 'background', detail: '背景', insertText: 'background: ${1:#fff};' },
    { label: 'font-size', detail: '字体大小', insertText: 'font-size: ${1:16px};' },
    { label: 'font-weight', detail: '字体粗细', insertText: 'font-weight: ${1:bold};' },
    { label: 'border', detail: '边框', insertText: 'border: ${1:1px} ${2:solid} ${3:#333};' },
    { label: 'border-radius', detail: '圆角', insertText: 'border-radius: ${1:4px};' },
    { label: 'width', detail: '宽度', insertText: 'width: ${1:100%};' },
    { label: 'height', detail: '高度', insertText: 'height: ${1:100%};' },
    { label: 'transition', detail: '过渡', insertText: 'transition: ${1:all} ${2:0.3s} ${3:ease};' },
    { label: 'animation', detail: '动画', insertText: 'animation: ${1:name} ${2:1s} ${3:ease} ${4:infinite};' },
    { label: 'media', detail: '媒体查询', insertText: '@media (max-width: ${1:768px}) {\n  ${2:/* styles */}\n}' }
  ]
};

/**
 * 获取某语言的补全列表
 * @param {string} language - 语言名称
 * @returns {Array} 补全列表
 */
export function getCompletionsForLanguage(language) {
  const langMap = {
    'javascript': 'javascript',
    'typescript': 'javascript',
    'python': 'python',
    'html': 'html',
    'css': 'css',
    'scss': 'css',
    'json': 'javascript'
  };
  
  const mappedLang = langMap[language] || 'javascript';
  return KEYWORDS[mappedLang] || KEYWORDS.javascript;
}

/**
 * 查找匹配的补全项
 * @param {string} currentWord - 当前输入的单词
 * @param {string} language - 语言名称
 * @returns {Array} 匹配的补全项
 */
export function findMatchingCompletions(currentWord, language) {
  if (!currentWord || currentWord.length < 1) return [];
  
  const completions = getCompletionsForLanguage(language);
  const word = currentWord.toLowerCase();
  
  return completions.filter(item => 
    item.label.toLowerCase().startsWith(word)
  ).sort((a, b) => {
    // 按匹配度排序
    const aScore = a.label.toLowerCase().indexOf(word);
    const bScore = b.label.toLowerCase().indexOf(word);
    return aScore - bScore;
  });
}

/**
 * 获取当前光标处的单词
 * @param {string} text - 文本内容
 * @param {number} position - 光标位置
 * @returns {Object} 单词信息
 */
export function getCurrentWord(text, position) {
  const textBefore = text.substring(0, position);
  const textAfter = text.substring(position);
  
  // 查找单词边界
  const beforeMatch = textBefore.match(/[\w.]+$/);
  const afterMatch = textAfter.match(/^[\w.]*/);
  
  const word = (beforeMatch ? beforeMatch[0] : '') + (afterMatch ? afterMatch[0] : '');
  const startPos = beforeMatch ? position - beforeMatch[0].length : position;
  const endPos = position + (afterMatch ? afterMatch[0].length : 0);
  
  return {
    word,
    startPos,
    endPos
  };
}

/**
 * 创建自动补全状态管理
 * @returns {Object} 状态对象
 */
export function createAutocompleteState() {
  return {
    visible: false,
    completions: [],
    selectedIndex: 0,
    position: { x: 0, y: 0 },
    currentWord: '',
    language: 'javascript'
  };
}

/**
 * 处理补全选择
 * @param {Object} state - 补全状态
 * @param {Object} completion - 选中的补全项
 * @param {HTMLTextAreaElement} textarea - 文本区域
 * @returns {Object} 更新后的状态
 */
export function selectCompletion(state, completion, textarea) {
  if (!completion || !textarea) return state;
  
  const text = textarea.value;
  const { startPos, endPos } = getCurrentWord(text, textarea.selectionStart);
  
  // 替换当前单词
  const before = text.substring(0, startPos);
  const after = text.substring(endPos);
  
  // 处理 snippet 占位符
  const insertText = completion.insertText.replace(/\$\{\d+:?([^}]*)\}/g, '$1');
  
  const newText = before + insertText + after;
  textarea.value = newText;
  
  // 触发 input 事件
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  
  // 隐藏补全面板
  state.visible = false;
  state.completions = [];
  
  return state;
}

/**
 * 导航补全列表
 * @param {Object} state - 补全状态
 * @param {number} direction - 方向（1=下，-1=上）
 * @returns {Object} 更新后的状态
 */
export function navigateCompletions(state, direction) {
  if (!state.visible || state.completions.length === 0) return state;
  
  let newIndex = state.selectedIndex + direction;
  
  // 循环导航
  if (newIndex < 0) {
    newIndex = state.completions.length - 1;
  } else if (newIndex >= state.completions.length) {
    newIndex = 0;
  }
  
  state.selectedIndex = newIndex;
  return state;
}

/**
 * 注册补全快捷键
 * @param {Function} onTrigger - 触发回调
 * @param {Function} onSelect - 选择回调
 * @param {Function} onNavigate - 导航回调
 */
export function registerAutocompleteShortcuts(onTrigger, onSelect, onNavigate) {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Space 触发补全
    if (e.ctrlKey && e.key === ' ') {
      e.preventDefault();
      onTrigger();
    }
    
    // Tab 或 Enter 选择补全
    if ((e.key === 'Tab' || e.key === 'Enter') && !e.shiftKey) {
      // 需要检查补全面板是否可见
      onSelect();
    }
    
    // 上下箭头导航
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      onNavigate(1);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onNavigate(-1);
    }
  });
}

/**
 * 解析 snippet 占位符格式
 * @param {string} snippet - snippet 文本
 * @returns {Object} 解析结果
 */
export function parseSnippet(snippet) {
  const placeholders = [];
  let index = 0;
  const regex = /\$\{(\d+):?([^}]*)\}/g;
  let match;
  
  let result = snippet;
  while ((match = regex.exec(snippet)) !== null) {
    placeholders.push({
      index: parseInt(match[1]),
      defaultValue: match[2],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  // 移除占位符标记
  result = result.replace(/\$\{\d+:?([^}]*)\}/g, '$1');
  
  return {
    text: result,
    placeholders
  };
}
