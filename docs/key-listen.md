# x-key-listen - Node.js 键盘监听工具

类似 Python 的 `keyboard` / `pynput` 模块，用于在 Node.js 中监听键盘按键。

## 安装

```bash
# 全局安装
npm link

# 或使用 pnpm
pnpm link
```

## 用法

### CLI 命令

```bash
# 1. 监听所有按键
x-key-listen

# 2. 监听特定按键
x-key-listen wait ctrl+c

# 3. 记录按键序列
x-key-listen record

# 4. 注册热键监听
x-key-listen hotkey "ctrl+q"

# 5. 显示按键映射表
x-key-listen map

# 6. 测试键盘
x-key-listen test

# 7. 详细模式
x-key-listen listen -v
```

### 编程使用

#### 基础监听

```javascript
import { create_listener } from './src/keyboard/listener.js';

const listener = create_listener();

// 监听所有按键
listener.on('key', (event) => {
  console.log(`按键：${event.name}`);
});

// 监听特定按键
listener.on('enter', (event) => {
  console.log('按下了 Enter 键！');
});

// 监听组合键
listener.on('ctrl+c', (event) => {
  console.log('按下了 Ctrl+C！');
});

// 启动监听
listener.start();
```

#### 热键注册

```javascript
import { create_listener } from './src/keyboard/listener.js';

const listener = create_listener();

// 注册热键
listener.on_hotkey('ctrl+q', () => {
  console.log('热键触发：Ctrl+Q');
  listener.stop();
  process.exit(0);
});

listener.on_hotkey('alt+enter', () => {
  console.log('热键触发：Alt+Enter');
});

listener.start();
```

#### 等待按键

```javascript
import { wait_for, read_key } from './src/keyboard/listener.js';

// 等待特定按键
async function waitForAnyKey() {
  console.log('按任意键继续...');
  const event = await wait_for('key');
  console.log(`你按下了：${event.name}`);
}

// 读取单个按键
async function readSingleKey() {
  console.log('按一个键...');
  const key = await read_key();
  console.log(`你按下了：${key}`);
}
```

#### 检查按键状态

```javascript
import { create_listener } from './src/keyboard/listener.js';

const listener = create_listener();

listener.on('key', (event) => {
  // 检查键是否被按下
  if (listener.is_pressed('ctrl')) {
    console.log('Ctrl 键正被按住');
  }
  
  // 获取所有按下的键
  const pressed = listener.get_pressed_keys();
  console.log('当前按下的键:', pressed);
});

listener.start();
```

## API 参考

### KeyboardListener 类

#### 方法

- `start(options)` - 开始监听
  - `options.suppress` - 是否阻止默认行为
  - `options.raw_mode` - 是否使用原始模式
  
- `stop()` - 停止监听

- `on(event, callback)` - 监听事件
  - `'key'` - 任意按键
  - `'key_up'` - 按键释放
  - `'<key_name>'` - 特定按键（如 `'enter'`, `'ctrl+c'`）

- `on_hotkey(combination, callback)` - 注册热键

- `off_hotkey(combination)` - 移除热键

- `is_pressed(key_name)` - 检查键是否被按下

- `get_pressed_keys()` - 获取所有按下的键

- `wait_for(key)` - 等待特定按键（返回 Promise）

### KeyboardEvent 类

#### 属性

- `name` - 按键名称
- `event_type` - 事件类型（'down' 或 'up'）
- `timestamp` - 时间戳

#### 方法

- `is_press()` - 是否为按下事件
- `is_release()` - 是否为释放事件

### 便捷函数

- `create_listener()` - 创建监听器
- `on_key(key, callback)` - 监听按键并返回监听器
- `add_hotkey(hotkey, callback)` - 注册热键并返回监听器
- `wait_for(key)` - 等待按键
- `read_key()` - 读取单个按键

## 按键名称

### 控制键

| 名称 | 描述 |
|------|------|
| `ctrl_c` | Ctrl+C |
| `ctrl_d` | Ctrl+D |
| `escape` | Escape |
| `backspace` | Backspace |
| `enter` | Enter |
| `tab` | Tab |
| `space` | Space |

### 方向键

| 名称 | 描述 |
|------|------|
| `up` | ↑ 上 |
| `down` | ↓ 下 |
| `left` | ← 左 |
| `right` | → 右 |

### 功能键

| 名称 | 描述 |
|------|------|
| `home` | Home |
| `end` | End |
| `pageup` | Page Up |
| `pagedown` | Page Down |
| `delete` | Delete |
| `insert` | Insert |
| `f1` - `f12` | F1 - F12 |

### 组合键格式

```
ctrl+c          - Ctrl + C
alt+enter       - Alt + Enter
ctrl+shift+k    - Ctrl + Shift + K
ctrl+alt+delete - Ctrl + Alt + Delete
```

## 示例项目

### 简单的快捷键退出程序

```javascript
import { create_listener } from './src/keyboard/listener.js';

const listener = create_listener();

console.log('按 Ctrl+Q 退出程序');

listener.on_hotkey('ctrl+q', () => {
  console.log('\n退出程序');
  listener.stop();
  process.exit(0);
});

listener.start();

// 主程序逻辑
setInterval(() => {
  console.log('程序运行中...');
}, 1000);
```

### 按键记录器

```javascript
import { create_listener } from './src/keyboard/listener.js';
import fs from 'fs';

const listener = create_listener();
const log = [];
const startTime = Date.now();

listener.on('key', (event) => {
  if (event.is_press()) {
    log.push({
      key: event.name,
      time: ((Date.now() - startTime) / 1000).toFixed(3)
    });
    console.log(`[${log[log.length - 1].time}s] ${event.name}`);
  }
  
  // Ctrl+S 保存
  if (event.name === 'ctrl+s') {
    fs.writeFileSync('keylog.json', JSON.stringify(log, null, 2));
    console.log('\n已保存到 keylog.json');
  }
  
  // Ctrl+Q 退出
  if (event.name === 'ctrl+q') {
    listener.stop();
    process.exit(0);
  }
});

console.log('按键记录器启动');
console.log('Ctrl+S 保存，Ctrl+Q 退出');

listener.start();
```

### 游戏控制

```javascript
import { create_listener } from './src/keyboard/listener.js';

const listener = create_listener();
const player = { x: 0, y: 0 };

console.log('使用 WASD 或方向键移动，Q 退出');

listener.on('w', () => { player.y--; console.log(`位置：${player.x}, ${player.y}`); });
listener.on('s', () => { player.y++; console.log(`位置：${player.x}, ${player.y}`); });
listener.on('a', () => { player.x--; console.log(`位置：${player.x}, ${player.y}`); });
listener.on('d', () => { player.x++; console.log(`位置：${player.x}, ${player.y}`); });

// 方向键
listener.on('up', () => { player.y--; console.log(`位置：${player.x}, ${player.y}`); });
listener.on('down', () => { player.y++; console.log(`位置：${player.x}, ${player.y}`); });
listener.on('left', () => { player.x--; console.log(`位置：${player.x}, ${player.y}`); });
listener.on('right', () => { player.x++; console.log(`位置：${player.x}, ${player.y}`); });

listener.on('q', () => {
  listener.stop();
  process.exit(0);
});

listener.start();
```

## 注意事项

1. **权限要求**: 在某些系统上可能需要管理员权限才能监听全局键盘事件
2. **终端依赖**: 需要在终端中运行，浏览器环境不支持
3. **原始模式**: 使用 `setRawMode(true)` 来捕获所有按键
4. **跨平台**: 支持 macOS、Linux 和 Windows

## 与 Python keyboard 模块对比

| 功能 | Python keyboard | Node.js x-key-listen |
|------|----------------|---------------------|
| 监听按键 | `keyboard.on_press()` | `listener.on('key')` |
| 热键注册 | `keyboard.add_hotkey()` | `listener.on_hotkey()` |
| 等待按键 | `keyboard.wait()` | `wait_for()` |
| 按键状态 | `keyboard.is_pressed()` | `listener.is_pressed()` |
| 记录按键 | `keyboard.record()` | `x-key-listen record` |

## License

ISC
