# 双引擎词典架构文档

## 概述

已将原有的两个独立词典工具（有道翻译 `fy.js` 和屌丝字典 `ds.js`）重构为统一的双引擎架构。

## 架构设计

```
┌─────────────────────────────────────┐
│         命令行接口                   │
│    (fy.js / ds.js)                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      统一翻译模块                    │
│    (main-new.js)                    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      引擎管理器                      │
│    (EngineManager)                  │
└──────┬──────────────────┬───────────┘
       │                  │
┌──────▼──────┐   ┌───────▼────────┐
│  Youdao     │   │   DS           │
│  Engine     │   │   Engine       │
│  (API)      │   │   (Local)      │
└─────────────┘   └────────────────┘
```

## 引擎说明

### 1. DS 引擎（本地词典）

**特点**:
- ✅ 离线使用，无需网络
- ✅ 响应速度快
- ✅ 包含 176,798 条词目
- ❌ 仅支持英文单词查询
- ❌ 数据需要初始化下载

**使用场景**:
- 快速查询常见英文单词
- 无网络环境
- 批量搜索

**示例**:
```bash
# 初始化
ds init

# 查询单词
ds lookup hello

# 搜索
ds search "^hel"

# 统计
ds stats
```

### 2. Youdao 引擎（在线 API）

**特点**:
- ✅ 支持多语言翻译
- ✅ 支持中文翻译
- ✅ 提供详细释义和网络解释
- ❌ 需要网络连接
- ❌ 依赖 API 密钥
- ❌ 速度相对较慢

**使用场景**:
- 中英互译
- 需要详细释义
- 查询专业术语

**示例**:
```bash
# 使用有道引擎
fy -e youdao "hello world"

# 设置为首选引擎
fy --set-engine youdao
```

## 命令行工具

### fy.js - 统一翻译工具

```bash
# 基本查询（默认使用 DS 引擎）
fy hello

# 指定引擎
fy -e youdao "hello"
fy -e ds hello

# 查询历史记录
fy -d 7

# 导出历史
fy -E history.json

# 生成学习记录
fy -m learning.md
fy -t learning.html

# 引擎管理
fy -l              # 列出引擎
fy -s              # 显示状态
fy --stats         # 显示统计
fy --set-engine ds # 设置首选引擎

# 搜索（仅 DS 引擎）
fy --search "^pre"
```

### ds.js - 本地词典工具

```bash
# 初始化
ds init

# 查询单词
ds lookup hello

# 搜索
ds search "^pre"

# 交互式命令行
ds cli

# Web 服务器
ds serve -p 8080
ds serve -e youdao -p 8080

# 统计信息
ds stats
```

## 编程接口

### 使用 EngineManager

```javascript
import { EngineManager } from './src/dict/engines/index.js';

// 创建管理器
const manager = new EngineManager({
  preferredEngine: 'ds',
  fallbackEnabled: true,
  verbose: true
});

// 翻译
const result = await manager.translate('hello');
console.log(result.result);

// 指定引擎
const result2 = await manager.translate('hello', {
  engine: 'youdao'
});

// 检查引擎状态
const status = await manager.checkEnginesStatus();
console.log(status);
```

### 使用统一接口

```javascript
import dict from './src/dict/main-new.js';

// 翻译
await dict.fanyi('hello');

// 查询
await dict.lookup('hello', { engine: 'youdao' });

// 搜索
await dict.search('^pre', { maxResults: 50 });

// 引擎管理
dict.listEngines();
dict.setPreferredEngine('ds');
dict.checkEnginesStatus();
```

## 引擎对比

| 特性 | DS 引擎 | Youdao 引擎 |
|------|---------|-------------|
| 类型 | 本地词典 | 在线 API |
| 网络 | 不需要 | 需要 |
| 速度 | 快 (~10ms) | 中 (~500ms) |
| 词库 | 176k 词条 | 不限 |
| 中文支持 | 否 | 是 |
| 多语言 | 否 | 是 |
| 详细释义 | 基础 | 详细 |
| 网络释义 | 否 | 是 |
| 音标 | 是 | 是 |

## 配置选项

### 环境变量

```bash
# 首选引擎
export PREFERRED_ENGINE=ds

# 有道 API 密钥
export YOUDAO_API_KEY=your_api_key
export YOUDAO_SECRET_KEY=your_secret_key

# 详细模式
export VERBOSE=true

# DS 数据路径
export DS_DATA_PATH=/path/to/endict.txt
```

### 配置文件

创建 `~/.config/dict/config.json`:

```json
{
  "preferredEngine": "ds",
  "verbose": false,
  "spinner": true,
  "color": "#8c8c8c",
  "youdao": {
    "apiKey": "your_key",
    "secretKey": "your_secret"
  },
  "ds": {
    "dataPath": "/path/to/endict.txt"
  }
}
```

## 高级功能

### 自动回退

当首选引擎失败时，自动尝试备用引擎：

```javascript
const result = await manager.translate('hello', {
  fallback: true  // 启用回退
});

// 如果 DS 引擎失败，自动尝试 Youdao
```

### 并行查询

同时使用多个引擎查询：

```javascript
const [dsResult, youdaoResult] = await Promise.all([
  manager.getEngine('ds').translate('hello'),
  manager.getEngine('youdao').translate('hello')
]);
```

### 自定义引擎

实现自定义翻译引擎：

```javascript
import { TranslationEngine } from './engines/base.js';

class MyEngine extends TranslationEngine {
  async translate(text) {
    // 实现翻译逻辑
    return translation;
  }
  
  async lookup(word) {
    // 实现查询逻辑
    return result;
  }
  
  async isAvailable() {
    // 检查引擎可用性
    return true;
  }
}

// 注册引擎
manager.registerEngine('myengine', new MyEngine());
```

## 性能优化

### 缓存策略

```javascript
// 缓存查询结果
const cached = await Cache.readFromCache(key);
if (!cached) {
  const result = await engine.translate(text);
  await Cache.writeToCache(key, result);
}
```

### 索引优化

DS 引擎使用 Map 索引：

```javascript
// 建立单词索引
this.index = new Map();
for (const item of dictionary) {
  const word = item.word.toLowerCase();
  if (!this.index.has(word)) {
    this.index.set(word, []);
  }
  this.index.get(word).push(item);
}
```

## 故障排除

### DS 引擎不可用

```bash
# 检查数据文件
ls -lh src/dict/ds/data/endict.txt

# 重新初始化
ds init
```

### Youdao API 错误

```bash
# 检查 API 密钥
echo $YOUDAO_API_KEY

# 测试连接
fy -e youdao "test" --verbose
```

### 引擎切换问题

```bash
# 查看当前引擎
fy -l

# 重置首选引擎
fy --set-engine ds
```

## 迁移指南

### 从旧版本迁移

**原 fy.js**:
```bash
fy hello
```

**新版本**（功能相同）:
```bash
fy-new hello
# 或
fy -e ds hello
```

**原 ds.js**:
```bash
ds lookup hello
```

**新版本**:
```bash
ds-new lookup hello
# 或保持兼容
ds lookup hello
```

## 开发计划

- [ ] 添加更多词典引擎
- [ ] 支持离线语音合成
- [ ] 添加单词本功能
- [ ] 支持 Anki 导出
- [ ] 添加记忆曲线算法
- [ ] 支持多词典并行查询
- [ ] 添加 TTS 发音

## 相关资源

- 屌丝字典：https://github.com/fxsjy/diaosi
- 有道 API：https://ai.youdao.com/
- 配置文档：`src/dict/DS-INIT-GUIDE.md`
