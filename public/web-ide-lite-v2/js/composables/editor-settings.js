/**
 * Web IDE Lite v2 - 编辑器设置应用
 * 
 * 功能：
 * 1. 应用编辑器字体、行高等设置
 * 2. 应用 Tab 和缩进设置
 * 3. 应用光标样式设置
 * 4. 应用平滑滚动设置
 */

import { getSetting } from './settings.js';

// 当前应用的设置缓存
let appliedSettings = {};

/**
 * 初始化编辑器设置
 * @param {Object} state - Vue 响应式状态
 * @param {Object} actions - 操作函数
 */
export function initEditorSettings(state, actions) {
  console.log('[EditorSettings] 初始化编辑器设置');
  
  // 应用初始设置
  applyAllEditorSettings(state);
  
  // 监听设置变更
  const unsubscribe = watchSettings((key, value) => {
    if (key.startsWith('editor.') || key.startsWith('other.')) {
      applySetting(key, value, state);
    }
  });
  
  return () => unsubscribe();
}

/**
 * 应用所有编辑器设置
 * @param {Object} state - Vue 响应式状态
 */
export function applyAllEditorSettings(state) {
  const editorEl = state.editorRef?.value;
  if (!editorEl) {
    console.warn('[EditorSettings] 编辑器元素未就绪');
    return;
  }
  
  // 应用字体设置
  applyFontSettings(editorEl);
  
  // 应用 Tab 设置
  applyTabSettings();
  
  // 应用光标设置
  applyCursorSettings(editorEl);
  
  // 应用滚动设置
  applyScrollSettings(editorEl);
  
  console.log('[EditorSettings] 所有设置已应用');
}

/**
 * 应用字体设置
 * @param {HTMLElement} editorEl - 编辑器元素
 */
function applyFontSettings(editorEl) {
  const fontSize = getSetting('editor.fontSize');
  const fontFamily = getSetting('editor.fontFamily');
  const lineHeight = getSetting('editor.lineHeight');
  
  editorEl.style.fontSize = `${fontSize}px`;
  editorEl.style.fontFamily = fontFamily;
  editorEl.style.lineHeight = String(lineHeight);
  
  // 同时应用到高亮区域
  const highlight = document.querySelector('.code-highlight');
  if (highlight) {
    highlight.style.fontSize = `${fontSize}px`;
    highlight.style.fontFamily = fontFamily;
    highlight.style.lineHeight = String(lineHeight);
  }
  
  appliedSettings.font = { fontSize, fontFamily, lineHeight };
  console.log('[EditorSettings] 字体设置已应用', { fontSize, fontFamily, lineHeight });
}

/**
 * 应用 Tab 设置
 */
function applyTabSettings() {
  const tabSize = getSetting('editor.tabSize');
  const useSpaces = getSetting('editor.useSpaces');
  
  // 在编辑器中设置 CSS tab-size
  const editorEl = document.querySelector('.code-editor');
  if (editorEl) {
    editorEl.style.tabSize = String(tabSize);
  }
  
  // 保存设置到全局，供 onTab 函数使用
  window.__editorTabSettings = { tabSize, useSpaces };
  
  appliedSettings.tab = { tabSize, useSpaces };
  console.log('[EditorSettings] Tab 设置已应用', { tabSize, useSpaces });
}

/**
 * 应用光标设置
 * @param {HTMLElement} editorEl - 编辑器元素
 */
function applyCursorSettings(editorEl) {
  const cursorStyle = getSetting('other.cursorStyle');
  const cursorBlinking = getSetting('other.cursorBlinking');
  
  // 光标样式
  const caretShape = {
    'line': 'auto',
    'block': 'block',
    'underline': 'underline'
  }[cursorStyle] || 'auto';
  
  editorEl.style.caretShape = caretShape;
  
  // 光标闪烁
  if (!cursorBlinking) {
    editorEl.style.animation = 'none';
  } else {
    editorEl.style.animation = '';
  }
  
  appliedSettings.cursor = { cursorStyle, cursorBlinking };
  console.log('[EditorSettings] 光标设置已应用', { cursorStyle, cursorBlinking });
}

/**
 * 应用滚动设置
 * @param {HTMLElement} editorEl - 编辑器元素
 */
function applyScrollSettings(editorEl) {
  const smoothScrolling = getSetting('other.smoothScrolling');
  
  if (smoothScrolling) {
    editorEl.style.scrollBehavior = 'smooth';
  } else {
    editorEl.style.scrollBehavior = 'auto';
  }
  
  appliedSettings.scroll = { smoothScrolling };
  console.log('[EditorSettings] 滚动设置已应用', { smoothScrolling });
}

/**
 * 应用单个设置变更
 * @param {string} key - 设置键
 * @param {any} value - 设置值
 * @param {Object} state - Vue 响应式状态
 */
export function applySetting(key, value, state) {
  const editorEl = state.editorRef?.value;
  if (!editorEl && !key.startsWith('other.')) return;
  
  switch (key) {
    case 'editor.fontSize':
    case 'editor.fontFamily':
    case 'editor.lineHeight':
      if (editorEl) applyFontSettings(editorEl);
      break;
      
    case 'editor.tabSize':
    case 'editor.useSpaces':
      applyTabSettings();
      break;
      
    case 'other.cursorStyle':
    case 'other.cursorBlinking':
      if (editorEl) applyCursorSettings(editorEl);
      break;
      
    case 'other.smoothScrolling':
      if (editorEl) applyScrollSettings(editorEl);
      break;
  }
}

/**
 * 监听设置变更
 * @param {Function} callback - 回调函数
 * @returns {Function} 取消监听函数
 */
function watchSettings(callback) {
  const listeners = window.__settingsListeners || [];
  const wrapper = (key, value) => callback(key, value);
  listeners.push(wrapper);
  window.__settingsListeners = listeners;
  
  return () => {
    const index = listeners.indexOf(wrapper);
    if (index > -1) listeners.splice(index, 1);
    window.__settingsListeners = listeners;
  };
}

/**
 * 通知设置变更监听器
 * @param {string} key - 设置键
 * @param {any} value - 设置值
 */
export function notifySettingsChange(key, value) {
  const listeners = window.__settingsListeners || [];
  listeners.forEach(fn => fn(key, value));
}

/**
 * 获取当前应用的设置
 * @returns {Object} 已应用的设置
 */
export function getAppliedSettings() {
  return { ...appliedSettings };
}

/**
 * 重置编辑器设置为默认值
 * @param {Object} state - Vue 响应式状态
 */
export function resetEditorSettings(state) {
  const editorEl = state.editorRef?.value;
  if (!editorEl) return;
  
  // 清除所有自定义样式
  editorEl.style.fontSize = '';
  editorEl.style.fontFamily = '';
  editorEl.style.lineHeight = '';
  editorEl.style.tabSize = '';
  editorEl.style.caretShape = '';
  editorEl.style.scrollBehavior = '';
  
  appliedSettings = {};
  console.log('[EditorSettings] 设置已重置');
}
