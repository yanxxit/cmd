/**
 * Node.js 键盘监听模块
 * 参考 Python 的 keyboard/pynput 模块设计
 * 支持监听键盘按键、组合键、热键注册
 */

import readline from 'readline';
import { EventEmitter } from 'events';

// 特殊键映射
const KEY_MAP = {
  // 控制键
  '\u0003': 'ctrl_c',
  '\u0004': 'ctrl_d',
  '\u001a': 'ctrl_z',
  '\u001b': 'escape',
  '\u007f': 'backspace',
  '\u0008': 'backspace',
  '\u000d': 'enter',
  '\u000a': 'enter',
  '\u0009': 'tab',
  '\u001b[D': 'left',
  '\u001b[C': 'right',
  '\u001b[A': 'up',
  '\u001b[B': 'down',
  '\u001b[1~': 'home',
  '\u001b[4~': 'end',
  '\u001b[5~': 'pageup',
  '\u001b[6~': 'pagedown',
  '\u001b[3~': 'delete',
  '\u001b[2~': 'insert',
  '\u001b[11~': 'f1',
  '\u001b[12~': 'f2',
  '\u001b[13~': 'f3',
  '\u001b[14~': 'f4',
  '\u001b[15~': 'f5',
  '\u001b[17~': 'f6',
  '\u001b[18~': 'f7',
  '\u001b[19~': 'f8',
  '\u001b[20~': 'f9',
  '\u001b[21~': 'f10',
  '\u001b[23~': 'f11',
  '\u001b[24~': 'f12',
};

// 修饰键状态
class ModifierState {
  constructor() {
    this.ctrl = false;
    this.alt = false;
    this.shift = false;
    this.meta = false;
  }

  toString() {
    const parts = [];
    if (this.ctrl) parts.push('ctrl');
    if (this.alt) parts.push('alt');
    if (this.shift) parts.push('shift');
    if (this.meta) parts.push('meta');
    return parts.join('+');
  }

  isEmpty() {
    return !this.ctrl && !this.alt && !this.shift && !this.meta;
  }
}

// 键盘事件类
class KeyboardEvent {
  constructor(name, event_type = 'down') {
    this.name = name;
    this.event_type = event_type;
    this.timestamp = Date.now();
  }

  is_press() {
    return this.event_type === 'down';
  }

  is_release() {
    return this.event_type === 'up';
  }
}

// 主键盘监听类
class KeyboardListener extends EventEmitter {
  constructor() {
    super();
    this.rl = null;
    this.is_listening = false;
    this.modifiers = new ModifierState();
    this.pressed_keys = new Set();
    this.hooks = new Map(); // 热键回调
    this.suppress = false;
  }

  /**
   * 开始监听键盘
   * @param {Object} options - 选项
   * @param {boolean} options.suppress - 是否阻止默认行为
   * @param {boolean} options.raw_mode - 是否使用原始模式
   */
  start(options = {}) {
    if (this.is_listening) return;

    this.suppress = options.suppress || false;
    const raw_mode = options.raw_mode !== false;

    // 检查是否是 TTY 环境
    if (!process.stdin.isTTY) {
      console.error('错误：需要在 TTY 终端环境中运行');
      console.error('当前环境不支持键盘监听（stdin 不是 TTY）');
      return this;
    }

    // 设置原始模式
    if (raw_mode) {
      process.stdin.setRawMode(true);
    }

    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    this.is_listening = true;

    // 监听输入
    process.stdin.on('data', (data) => {
      this._handle_input(data);
    });

    // 监听进程退出
    process.on('exit', () => this.stop());
    process.on('SIGINT', () => {
      this.stop();
      process.exit();
    });

    this.emit('start');
    return this;
  }

  /**
   * 停止监听
   */
  stop() {
    if (!this.is_listening) return;

    process.stdin.setRawMode(false);
    process.stdin.pause();
    this.is_listening = false;

    this.emit('stop');
    return this;
  }

  /**
   * 处理输入数据
   */
  _handle_input(data) {
    const keys = [];

    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      const code = data.charCodeAt(i);

      // 检查是否是转义序列
      if (char === '\u001b' && data.length > 1) {
        // 完整的转义序列
        const seq = data;
        const key_name = KEY_MAP[seq] || this._parse_escape_sequence(seq);
        if (key_name) {
          keys.push(key_name);
        }
        break;
      }

      // 检查修饰键
      if (code === 16) { // Ctrl+P (示例)
        this.modifiers.ctrl = true;
      }

      // 普通字符
      let key_name = char;

      // 检查是否是控制字符
      if (code < 32) {
        key_name = KEY_MAP[char] || `ctrl_${String.fromCharCode(code + 96)}`;
        if (code === 16) { // Ctrl+P
          this.modifiers.ctrl = true;
          key_name = 'ctrl+p';
        }
      }

      // 检查 shift
      if (char >= 'A' && char <= 'Z') {
        this.modifiers.shift = true;
      }

      keys.push(key_name.toLowerCase());
    }

    // 触发事件
    for (const key of keys) {
      this._emit_key_event(key);
    }
  }

  /**
   * 解析转义序列
   */
  _parse_escape_sequence(seq) {
    // 处理带有前缀的转义序列
    if (seq.startsWith('\u001b[')) {
      // 方向键等
      const match = seq.match(/\u001b\[(\d+)?([A-Za-z~])/);
      if (match) {
        const [, num, key] = match;
        if (key === 'A') return 'up';
        if (key === 'B') return 'down';
        if (key === 'C') return 'right';
        if (key === 'D') return 'left';
        if (key === '~') {
          if (num === '1') return 'home';
          if (num === '3') return 'delete';
          if (num === '4') return 'end';
          if (num === '5') return 'pageup';
          if (num === '6') return 'pagedown';
        }
      }
    }
    return 'escape';
  }

  /**
   * 触发按键事件
   */
  _emit_key_event(key_name) {
    const event = new KeyboardEvent(key_name, 'down');

    // 构建完整键名（包含修饰键）
    let full_key_name = key_name;
    if (!this.modifiers.isEmpty() && !key_name.includes('ctrl') && !key_name.includes('alt') && !key_name.includes('shift')) {
      full_key_name = `${this.modifiers.toString()}+${key_name}`;
    }

    // 触发通用事件
    this.emit('key', event);
    this.emit(key_name, event);
    this.emit(full_key_name, event);

    // 检查热键
    if (this.hooks.has(full_key_name)) {
      this.hooks.get(full_key_name)(event);
    }
    if (this.hooks.has(key_name)) {
      this.hooks.get(key_name)(event);
    }

    // 记录按下的键
    this.pressed_keys.add(key_name);

    // 更新修饰键状态
    if (key_name === 'ctrl' || key_name.includes('ctrl')) {
      this.modifiers.ctrl = true;
    }
    if (key_name === 'alt' || key_name.includes('alt')) {
      this.modifiers.alt = true;
    }
    if (key_name === 'shift' || key_name.includes('shift')) {
      this.modifiers.shift = true;
    }

    // 自动触发释放事件（对于非修饰键）
    if (!['ctrl', 'alt', 'shift', 'meta'].includes(key_name)) {
      setTimeout(() => {
        this._emit_release_event(key_name);
      }, 50);
    }
  }

  /**
   * 触发释放事件
   */
  _emit_release_event(key_name) {
    const event = new KeyboardEvent(key_name, 'up');

    this.emit('key_up', event);
    this.emit(`${key_name}_up`, event);

    this.pressed_keys.delete(key_name);

    // 更新修饰键状态
    if (key_name === 'ctrl' || key_name.includes('ctrl')) {
      this.modifiers.ctrl = false;
    }
    if (key_name === 'alt' || key_name.includes('alt')) {
      this.modifiers.alt = false;
    }
    if (key_name === 'shift' || key_name.includes('shift')) {
      this.modifiers.shift = false;
    }
  }

  /**
   * 注册热键回调
   * @param {string} hotkey - 热键组合，如 'ctrl+c', 'alt+enter'
   * @param {Function} callback - 回调函数
   */
  on_hotkey(hotkey, callback) {
    this.hooks.set(hotkey.toLowerCase(), callback);
    return this;
  }

  /**
   * 移除热键回调
   */
  off_hotkey(hotkey) {
    this.hooks.delete(hotkey.toLowerCase());
    return this;
  }

  /**
   * 检查键是否被按下
   */
  is_pressed(key_name) {
    return this.pressed_keys.has(key_name.toLowerCase());
  }

  /**
   * 获取当前按下的所有键
   */
  get_pressed_keys() {
    return Array.from(this.pressed_keys);
  }

  /**
   * 等待特定按键
   * @param {string} key - 要等待的键
   * @returns {Promise}
   */
  wait_for(key) {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.name === key.toLowerCase()) {
          this.off(key.toLowerCase(), handler);
          resolve(event);
        }
      };
      this.on(key.toLowerCase(), handler);
    });
  }
}

// 便捷函数

/**
 * 创建键盘监听器
 */
export function create_listener() {
  return new KeyboardListener();
}

/**
 * 监听按键
 * @param {string} key - 要监听的键
 * @param {Function} callback - 回调函数
 */
export function on_key(key, callback) {
  const listener = create_listener();
  listener.on(key.toLowerCase(), callback);
  listener.start();
  return listener;
}

/**
 * 注册热键
 * @param {string} hotkey - 热键组合
 * @param {Function} callback - 回调函数
 */
export function add_hotkey(hotkey, callback) {
  const listener = create_listener();
  listener.on_hotkey(hotkey, callback);
  listener.start();
  return listener;
}

/**
 * 等待按键
 * @param {string} key - 要等待的键
 */
export async function wait_for(key) {
  const listener = create_listener();
  listener.start();
  const event = await listener.wait_for(key);
  listener.stop();
  return event;
}

/**
 * 读取单个按键（一次性）
 * @returns {Promise<string>}
 */
export async function read_key() {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', (data) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      
      const char = data.toString();
      const key = KEY_MAP[char] || char.toLowerCase();
      resolve(key);
    });
  });
}

// 导出主类
export { KeyboardListener, KeyboardEvent, ModifierState };
export default KeyboardListener;
