/**
 * Web IDE Lite v2 - 编辑器右键菜单功能
 * 
 * 功能：
 * 1. 复制/粘贴/剪切
 * 2. 撤销/重做
 * 3. 全选
 * 4. 查找/替换
 * 5. 缩进/取消缩进
 * 6. 注释/取消注释
 * 7. 格式化代码
 */

/**
 * 复制选中文本
 * @param {Object} state - Vue 响应式状态
 */
export async function editorCopy(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
  
  if (selectedText) {
    try {
      await navigator.clipboard.writeText(selectedText);
      showToast(state, '✅ 已复制', 'success');
    } catch (e) {
      // 降级处理
      document.execCommand('copy');
      showToast(state, '✅ 已复制', 'success');
    }
  } else {
    showToast(state, '⚠️ 请先选择文本', 'warning');
  }
}

/**
 * 粘贴文本
 * @param {Object} state - Vue 响应式状态
 */
export async function editorPaste(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  try {
    const text = await navigator.clipboard.readText();
    insertTextAtCursor(state, text);
    showToast(state, '✅ 已粘贴', 'success');
  } catch (e) {
    showToast(state, '❌ 粘贴失败', 'error');
  }
}

/**
 * 剪切选中文本
 * @param {Object} state - Vue 响应式状态
 */
export async function editorCut(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
  
  if (selectedText) {
    try {
      await navigator.clipboard.writeText(selectedText);
      // 删除选中的文本
      deleteSelectedText(state);
      showToast(state, '✅ 已剪切', 'success');
    } catch (e) {
      showToast(state, '❌ 剪切失败', 'error');
    }
  } else {
    showToast(state, '⚠️ 请先选择文本', 'warning');
  }
}

/**
 * 撤销
 * @param {Object} state - Vue 响应式状态
 */
export function editorUndo(state) {
  try {
    document.execCommand('undo');
    showToast(state, '↩️ 已撤销', 'info');
  } catch (e) {
    showToast(state, '❌ 撤销失败', 'error');
  }
}

/**
 * 重做
 * @param {Object} state - Vue 响应式状态
 */
export function editorRedo(state) {
  try {
    document.execCommand('redo');
    showToast(state, '↪️ 已重做', 'info');
  } catch (e) {
    showToast(state, '❌ 重做失败', 'error');
  }
}

/**
 * 全选
 * @param {Object} state - Vue 响应式状态
 */
export function editorSelectAll(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  textarea.select();
  showToast(state, '✅ 已全选', 'info');
}

/**
 * 删除选中文本
 * @param {Object} state - Vue 响应式状态
 */
export function editorDelete(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  deleteSelectedText(state);
}

/**
 * 缩进选中行
 * @param {Object} state - Vue 响应式状态
 */
export function editorIndent(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const tabSize = window.__editorTabSettings?.tabSize || 2;
  const useSpaces = window.__editorTabSettings?.useSpaces !== false;
  const indentStr = useSpaces ? ' '.repeat(tabSize) : '\t';
  
  indentLines(state, indentStr);
  showToast(state, '✅ 已缩进', 'info');
}

/**
 * 取消缩进选中行
 * @param {Object} state - Vue 响应式状态
 */
export function editorOutdent(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const tabSize = window.__editorTabSettings?.tabSize || 2;
  const useSpaces = window.__editorTabSettings?.useSpaces !== false;
  const indentStr = useSpaces ? ' '.repeat(tabSize) : '\t';
  
  outdentLines(state, indentStr);
  showToast(state, '✅ 已取消缩进', 'info');
}

/**
 * 注释选中行
 * @param {Object} state - Vue 响应式状态
 */
export function editorToggleComment(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const language = state.currentLanguage?.value || 'plaintext';
  const commentStyle = getCommentStyle(language);
  
  toggleCommentLines(state, commentStyle);
  showToast(state, '✅ 已切换注释', 'info');
}

/**
 * 格式化代码（简化版）
 * @param {Object} state - Vue 响应式状态
 */
export function editorFormat(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const content = textarea.value;
  const language = state.currentLanguage?.value || 'plaintext';
  
  // 简化格式化：移除多余空行，统一缩进
  let formatted = content
    .split('\n')
    .map(line => line.replace(/\s+$/, '')) // 移除行尾空格
    .join('\n')
    .replace(/\n{3,}/g, '\n\n'); // 多个空行变为一个
  
  state.editorContent.value = formatted;
  showToast(state, '✅ 已格式化', 'success');
}

/**
 * 复制当前行
 * @param {Object} state - Vue 响应式状态
 */
export function editorCopyLine(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const lines = textarea.value.split('\n');
  const currentLine = getCurrentLine(state);
  const lineContent = lines[currentLine - 1] || '';
  
  navigator.clipboard.writeText(lineContent + '\n');
  showToast(state, '✅ 行已复制', 'success');
}

/**
 * 删除当前行
 * @param {Object} state - Vue 响应式状态
 */
export function editorDeleteLine(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const lines = textarea.value.split('\n');
  const currentLine = getCurrentLine(state);
  
  lines.splice(currentLine - 1, 1);
  state.editorContent.value = lines.join('\n');
  showToast(state, '✅ 行已删除', 'info');
}

/**
 * 上移当前行
 * @param {Object} state - Vue 响应式状态
 */
export function editorMoveLineUp(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const lines = textarea.value.split('\n');
  const currentLine = getCurrentLine(state);
  
  if (currentLine > 1) {
    [lines[currentLine - 2], lines[currentLine - 1]] = [lines[currentLine - 1], lines[currentLine - 2]];
    state.editorContent.value = lines.join('\n');
    // 恢复光标位置
    setTimeout(() => {
      goToLine(textarea, currentLine - 1, 1);
    }, 0);
    showToast(state, '✅ 行已上移', 'info');
  }
}

/**
 * 下移当前行
 * @param {Object} state - Vue 响应式状态
 */
export function editorMoveLineDown(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const lines = textarea.value.split('\n');
  const currentLine = getCurrentLine(state);
  
  if (currentLine < lines.length) {
    [lines[currentLine - 1], lines[currentLine]] = [lines[currentLine], lines[currentLine - 1]];
    state.editorContent.value = lines.join('\n');
    // 恢复光标位置
    setTimeout(() => {
      goToLine(textarea, currentLine + 1, 1);
    }, 0);
    showToast(state, '✅ 行已下移', 'info');
  }
}

/**
 * 转大写
 * @param {Object} state - Vue 响应式状态
 */
export function editorToUpperCase(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  transformSelectedText(state, text => text.toUpperCase());
  showToast(state, '✅ 已转大写', 'info');
}

/**
 * 转小写
 * @param {Object} state - Vue 响应式状态
 */
export function editorToLowerCase(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  transformSelectedText(state, text => text.toLowerCase());
  showToast(state, '✅ 已转小写', 'info');
}

// ==================== 辅助函数 ====================

/**
 * 显示 Toast
 */
function showToast(state, message, type = 'info') {
  if (state.showToast) {
    state.showToast(message, type);
  }
}

/**
 * 在光标位置插入文本
 */
function insertTextAtCursor(state, text) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  
  const content = state.editorContent.value;
  state.editorContent.value = content.substring(0, start) + text + content.substring(end);
  
  // 恢复光标位置
  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
  }, 0);
}

/**
 * 删除选中的文本
 */
function deleteSelectedText(state) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  
  if (start !== end) {
    const content = state.editorContent.value;
    state.editorContent.value = content.substring(0, start) + content.substring(end);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start;
      textarea.focus();
    }, 0);
  }
}

/**
 * 缩进多行
 */
function indentLines(state, indentStr) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const lines = textarea.value.split('\n');
  const startLine = getLineAtPosition(textarea, textarea.selectionStart);
  const endLine = getLineAtPosition(textarea, textarea.selectionEnd);
  
  for (let i = startLine - 1; i < endLine; i++) {
    if (lines[i].trim()) { // 非空行才缩进
      lines[i] = indentStr + lines[i];
    }
  }
  
  state.editorContent.value = lines.join('\n');
}

/**
 * 取消缩进多行
 */
function outdentLines(state, indentStr) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const lines = textarea.value.split('\n');
  const startLine = getLineAtPosition(textarea, textarea.selectionStart);
  const endLine = getLineAtPosition(textarea, textarea.selectionEnd);
  
  for (let i = startLine - 1; i < endLine; i++) {
    if (lines[i].startsWith(indentStr)) {
      lines[i] = lines[i].substring(indentStr.length);
    } else if (lines[i].startsWith('\t')) {
      lines[i] = lines[i].substring(1);
    } else {
      // 移除开头的空格（最多 tabSize 个）
      const tabSize = window.__editorTabSettings?.tabSize || 2;
      const match = lines[i].match(/^( +)/);
      if (match && match[1].length <= tabSize) {
        lines[i] = lines[i].substring(match[1].length);
      }
    }
  }
  
  state.editorContent.value = lines.join('\n');
}

/**
 * 切换注释
 */
function toggleCommentLines(state, commentStyle) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const lines = textarea.value.split('\n');
  const startLine = getLineAtPosition(textarea, textarea.selectionStart);
  const endLine = getLineAtPosition(textarea, textarea.selectionEnd);
  
  const { prefix, suffix } = commentStyle;
  const commentRegex = new RegExp(`^\\s*(${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`);
  
  // 检查是否所有行都已注释
  const allCommented = Array.from({ length: endLine - startLine + 1 }, (_, i) => lines[startLine - 1 + i])
    .every(line => commentRegex.test(line));
  
  for (let i = startLine - 1; i < endLine; i++) {
    if (lines[i].trim()) {
      if (allCommented) {
        // 取消注释
        lines[i] = lines[i].replace(commentRegex, '').trimStart();
      } else {
        // 添加注释
        lines[i] = `${prefix}${lines[i]}${suffix}`;
      }
    }
  }
  
  state.editorContent.value = lines.join('\n');
}

/**
 * 获取语言的注释样式
 */
function getCommentStyle(language) {
  const styles = {
    'javascript': { prefix: '// ', suffix: '' },
    'typescript': { prefix: '// ', suffix: '' },
    'python': { prefix: '# ', suffix: '' },
    'go': { prefix: '// ', suffix: '' },
    'html': { prefix: '<!-- ', suffix: ' -->' },
    'css': { prefix: '/* ', suffix: ' */' },
    'scss': { prefix: '// ', suffix: '' },
    'json': { prefix: '// ', suffix: '' },
    'markdown': { prefix: '> ', suffix: '' },
    'yaml': { prefix: '# ', suffix: '' },
    'sql': { prefix: '-- ', suffix: '' },
    'xml': { prefix: '<!-- ', suffix: ' -->' },
    'plaintext': { prefix: '// ', suffix: '' }
  };
  
  return styles[language] || styles.plaintext;
}

/**
 * 获取光标所在行号
 */
function getLineAtPosition(textarea, position) {
  return textarea.value.substring(0, position).split('\n').length;
}

/**
 * 获取当前行号
 */
function getCurrentLine(state) {
  return state.cursorLine?.value || 1;
}

/**
 * 跳转到指定行
 */
function goToLine(textarea, line, column = 1) {
  const lines = textarea.value.split('\n');
  let position = 0;
  
  for (let i = 0; i < line - 1; i++) {
    position += lines[i].length + 1;
  }
  
  position += column - 1;
  textarea.setSelectionRange(position, position);
  textarea.focus();
}

/**
 * 转换选中文本
 */
function transformSelectedText(state, transformFn) {
  const textarea = state.editorRef?.value;
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  
  if (start !== end) {
    const content = state.editorContent.value;
    const selectedText = content.substring(start, end);
    const transformed = transformFn(selectedText);
    
    state.editorContent.value = content.substring(0, start) + transformed + content.substring(end);
    
    setTimeout(() => {
      textarea.setSelectionRange(start, start + transformed.length);
      textarea.focus();
    }, 0);
  }
}

/**
 * 创建编辑器右键菜单操作集合
 */
export function createEditorContextMenuActions(state) {
  return {
    copy: () => editorCopy(state),
    paste: () => editorPaste(state),
    cut: () => editorCut(state),
    undo: () => editorUndo(state),
    redo: () => editorRedo(state),
    selectAll: () => editorSelectAll(state),
    delete: () => editorDelete(state),
    indent: () => editorIndent(state),
    outdent: () => editorOutdent(state),
    toggleComment: () => editorToggleComment(state),
    format: () => editorFormat(state),
    copyLine: () => editorCopyLine(state),
    deleteLine: () => editorDeleteLine(state),
    moveLineUp: () => editorMoveLineUp(state),
    moveLineDown: () => editorMoveLineDown(state),
    toUpperCase: () => editorToUpperCase(state),
    toLowerCase: () => editorToLowerCase(state)
  };
}
