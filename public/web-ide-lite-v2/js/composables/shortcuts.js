/**
 * Web IDE Lite v2 - 快捷键管理
 * 
 * 功能：
 * 1. 全局快捷键监听
 * 2. 快捷键冲突检测
 * 3. 快捷键自定义
 * 4. 快捷键提示
 */

import { getSetting, setSetting } from './settings.js';

// 已注册的快捷键处理器
const shortcutHandlers = new Map();

// 快捷键映射（标准化后）
const shortcutMap = {};

// 是否正在录制快捷键
let isRecording = false;

// 当前录制的快捷键键
let recordingKey = null;

// 当前录制的回调
let recordingCallback = null;

/**
 * 初始化快捷键
 */
export function initShortcuts() {
  console.log('[Shortcuts] 初始化快捷键');
  
  // 加载所有快捷键配置
  loadShortcuts();
  
  // 注册全局键盘监听
  document.addEventListener('keydown', handleGlobalKeydown);
  
  // 注册快捷键变更监听
  const unsubscribe = watchSettings((key, value) => {
    if (key.startsWith('shortcuts.')) {
      updateShortcut(key, value);
    }
  });
  
  console.log('[Shortcuts] 已注册快捷键:', Object.keys(shortcutMap));
  
  return () => {
    document.removeEventListener('keydown', handleGlobalKeydown);
    unsubscribe();
  };
}

/**
 * 加载所有快捷键
 */
function loadShortcuts() {
  const shortcuts = getSetting('shortcuts') || {};
  
  for (const [name, shortcut] of Object.entries(shortcuts)) {
    if (shortcut) {
      shortcutMap[standardizeShortcut(shortcut)] = name;
    }
  }
}

/**
 * 更新快捷键
 * @param {string} key - 设置键（如 shortcuts.save）
 * @param {string} value - 新快捷键
 */
function updateShortcut(key, value) {
  const name = key.split('.')[1];
  const oldShortcut = getSetting(key);
  
  // 移除旧快捷键
  if (oldShortcut) {
    const oldStandard = standardizeShortcut(oldShortcut);
    if (shortcutMap[oldStandard] === name) {
      delete shortcutMap[oldStandard];
    }
  }
  
  // 添加新快捷键
  if (value) {
    shortcutMap[standardizeShortcut(value)] = name;
  }
  
  console.log(`[Shortcuts] 快捷键更新：${name} = ${value}`);
}

/**
 * 标准化快捷键格式
 * @param {string} shortcut - 快捷键字符串
 * @returns {string} 标准化后的快捷键
 */
function standardizeShortcut(shortcut) {
  return shortcut.toLowerCase().replace(/\s+/g, '');
}

/**
 * 处理全局键盘事件
 * @param {KeyboardEvent} e - 键盘事件
 */
function handleGlobalKeydown(e) {
  // 如果正在录制，不触发快捷键
  if (isRecording) {
    e.preventDefault();
    handleRecording(e);
    return;
  }
  
  // 检查是否在输入框中
  const target = e.target;
  const isInput = target.tagName === 'INPUT' || 
                  target.tagName === 'TEXTAREA' || 
                  target.isContentEditable;
  
  // 某些快捷键即使在输入框中也要触发
  const shortcut = buildShortcutString(e);
  const standardShortcut = standardizeShortcut(shortcut);
  const shortcutName = shortcutMap[standardShortcut];
  
  // 如果在输入框中且不是全局快捷键，跳过
  if (isInput && !isGlobalShortcut(shortcutName)) {
    return;
  }
  
  // 触发快捷键处理
  if (shortcutHandlers.has(shortcutName)) {
    e.preventDefault();
    e.stopPropagation();
    const handler = shortcutHandlers.get(shortcutName);
    handler(e);
  }
}

/**
 * 构建快捷键字符串
 * @param {KeyboardEvent} e - 键盘事件
 * @returns {string} 快捷键字符串
 */
function buildShortcutString(e) {
  const keys = [];
  
  if (e.ctrlKey) keys.push('Ctrl');
  if (e.shiftKey) keys.push('Shift');
  if (e.altKey) keys.push('Alt');
  if (e.metaKey) keys.push('Meta');
  
  const key = e.key.toUpperCase();
  
  // 跳过修饰键
  if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(key)) {
    keys.push(key);
  }
  
  return keys.join('+');
}

/**
 * 判断是否为全局快捷键（即使在输入框中也要触发）
 * @param {string} name - 快捷键名称
 * @returns {boolean} 是否为全局快捷键
 */
function isGlobalShortcut(name) {
  const globalShortcuts = [
    'save',           // 保存
    'toggleSidebar',  // 切换侧边栏
    'toggleTheme'     // 切换主题
  ];
  return globalShortcuts.includes(name);
}

/**
 * 处理录制状态
 * @param {KeyboardEvent} e - 键盘事件
 */
function handleRecording(e) {
  const shortcut = buildShortcutString(e);
  
  // Esc 取消录制
  if (e.key === 'Escape') {
    cancelRecording();
    return;
  }
  
  // 检查快捷键是否已被占用
  const standardShortcut = standardizeShortcut(shortcut);
  const existingName = shortcutMap[standardShortcut];
  
  if (existingName && existingName !== recordingKey) {
    if (confirm(`快捷键 ${shortcut} 已被 "${existingName}" 使用，是否覆盖？`)) {
      // 覆盖旧快捷键
      setSetting(`shortcuts.${existingName}`, '');
      delete shortcutMap[standardShortcut];
    } else {
      return;
    }
  }
  
  // 保存新快捷键
  setSetting(`shortcuts.${recordingKey}`, shortcut);
  shortcutMap[standardShortcut] = recordingKey;
  
  console.log(`[Shortcuts] 快捷键已录制：${recordingKey} = ${shortcut}`);
  
  if (recordingCallback) {
    recordingCallback(shortcut);
  }
  
  isRecording = false;
  recordingKey = null;
  recordingCallback = null;
}

/**
 * 取消录制
 */
function cancelRecording() {
  isRecording = false;
  recordingKey = null;
  recordingCallback = null;
  console.log('[Shortcuts] 录制已取消');
}

/**
 * 注册快捷键处理器
 * @param {string} name - 快捷键名称（如 'save'）
 * @param {Function} handler - 处理函数
 */
export function registerShortcut(name, handler) {
  if (shortcutHandlers.has(name)) {
    console.warn(`[Shortcuts] 快捷键 ${name} 已被注册，将被覆盖`);
  }
  
  shortcutHandlers.set(name, handler);
  console.log(`[Shortcuts] 已注册快捷键：${name}`);
  
  return () => {
    shortcutHandlers.delete(name);
  };
}

/**
 * 注销快捷键处理器
 * @param {string} name - 快捷键名称
 */
export function unregisterShortcut(name) {
  shortcutHandlers.delete(name);
  console.log(`[Shortcuts] 已注销快捷键：${name}`);
}

/**
 * 开始录制快捷键
 * @param {string} key - 快捷键键名（如 'save'）
 * @param {Function} callback - 录制完成回调
 */
export function startRecording(key, callback) {
  isRecording = true;
  recordingKey = key;
  recordingCallback = callback;
  
  console.log('[Shortcuts] 开始录制，请按下快捷键（按 Esc 取消）');
}

/**
 * 取消录制
 */
export function stopRecording() {
  cancelRecording();
}

/**
 * 检查是否正在录制
 * @returns {boolean} 是否正在录制
 */
export function isRecordingShortcut() {
  return isRecording;
}

/**
 * 获取所有快捷键
 * @returns {Object} 快捷键对象
 */
export function getAllShortcuts() {
  return { ...shortcutMap };
}

/**
 * 获取快捷键名称
 * @param {string} shortcut - 快捷键字符串
 * @returns {string} 快捷键名称
 */
export function getShortcutName(shortcut) {
  return shortcutMap[standardizeShortcut(shortcut)] || null;
}

/**
 * 获取快捷键描述
 * @param {string} name - 快捷键名称
 * @returns {string} 快捷键描述
 */
export function getShortcutDescription(name) {
  const descriptions = {
    'save': '保存当前文件',
    'newFile': '新建文件',
    'openFile': '打开文件',
    'search': '搜索文本',
    'replace': '替换文本',
    'toggleSidebar': '切换侧边栏',
    'toggleTheme': '切换主题'
  };
  return descriptions[name] || name;
}

/**
 * 获取快捷键提示
 * @returns {Array} 快捷键提示列表
 */
export function getShortcutHints() {
  const shortcuts = getSetting('shortcuts') || {};
  
  return Object.entries(shortcuts).map(([name, shortcut]) => ({
    name,
    shortcut,
    description: getShortcutDescription(name)
  }));
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
 * 重置所有快捷键为默认值
 */
export function resetShortcuts() {
  const defaultShortcuts = {
    'save': 'Ctrl+S',
    'newFile': 'Ctrl+N',
    'openFile': 'Ctrl+O',
    'search': 'Ctrl+F',
    'replace': 'Ctrl+H',
    'toggleSidebar': 'Ctrl+B',
    'toggleTheme': 'Ctrl+Shift+T'
  };
  
  for (const [name, shortcut] of Object.entries(defaultShortcuts)) {
    setSetting(`shortcuts.${name}`, shortcut);
  }
  
  // 重新加载
  Object.keys(shortcutMap).forEach(key => delete shortcutMap[key]);
  loadShortcuts();
  
  console.log('[Shortcuts] 快捷键已重置为默认值');
}

/**
 * 导出快捷键配置
 * @returns {Object} 快捷键配置对象
 */
export function exportShortcuts() {
  return getSetting('shortcuts') || {};
}

/**
 * 导入快捷键配置
 * @param {Object} shortcuts - 快捷键配置对象
 */
export function importShortcuts(shortcuts) {
  for (const [name, shortcut] of Object.entries(shortcuts)) {
    if (shortcut) {
      setSetting(`shortcuts.${name}`, shortcut);
    }
  }
  console.log('[Shortcuts] 快捷键配置已导入');
}
