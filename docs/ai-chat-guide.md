# AI 聊天助手使用文档

> 📅 创建时间：2026-03-13  
> 📋 技术栈：Vue 3 + 混元大模型 + Marked

---

## 🎯 功能概述

基于混元大模型的网页版 AI 聊天助手，支持：
- ✅ 智能对话
- ✅ 上下文记忆（最近 2 条消息）
- ✅ Markdown 渲染
- ✅ 代码高亮
- ✅ 明/暗主题切换
- ✅ 对话历史本地存储
- ✅ 流式响应（后端支持）

---

## 📁 文件结构

```
public/ai-chat/
└── index.html          # AI 聊天页面

src/http-server/
└── ai-chat-api.js      # AI 聊天 API

src/ai/
└── chat.js             # AI 聊天核心类（命令行版）
```

---

## 🚀 快速开始

### 访问页面

```bash
# 启动服务
x-static

# 访问页面
http://127.0.0.1:3000/ai-chat/
```

### 配置 API Key

在 `.env` 文件中设置：
```bash
HUNYUAN_API_KEY=your_api_key_here
```

---

## 🎨 界面布局

```
┌─────────────────────────────────────────────┐
│  🤖 AI 智能助手              [🗑️ 清空] [🌙] │
│  基于混元大模型                              │
├─────────────────────────────────────────────┤
│                                             │
│     ┌─────────────────┐                    │
│     │ 你好！有什么    │ 👤 用户消息         │
│     │ 可以帮助你的？  │                     │
│     └─────────────────┘                    │
│                                             │
│  ┌─────────────────┐                        │
│  │ 这是一个示例    │ 🤖 AI 回复             │
│  │ 回答内容...     │ (Markdown 渲染)         │
│  └─────────────────┘                        │
│                                             │
│  ⏳ 输入中...                                │
│                                             │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────┐  [发送 📤]    │
│  │ 输入你的问题...         │               │
│  └─────────────────────────┘               │
│  📌 上下文：最近 2 条消息（包含当前问题）    │
└─────────────────────────────────────────────┘
```

---

## 💻 核心功能

### 1. 上下文记忆

**机制：**
- 仅保留最近 2 条消息作为上下文
- 包含：1 条用户问题 + 1 条 AI 回答
- 自动精简，节省 Token

**示例流程：**
```
用户：今天天气如何？
AI：今天天气晴朗...

用户：那明天呢？  ← 上下文：[用户：今天天气如何？, AI：今天天气晴朗...]
AI：明天可能会...
```

### 2. Markdown 渲染

**支持的格式：**
- 标题、段落、列表
- 代码块（带语法高亮）
- 表格、引用
- 粗体、斜体

**示例：**
```markdown
# 标题

## 代码示例
```python
def hello():
    print("Hello, World!")
```

## 表格
| 名称 | 值 |
|------|-----|
| A    | 1   |
| B    | 2   |
```

### 3. 主题切换

**浅色主题：**
- 白色背景
- 蓝色用户消息
- 灰色 AI 消息

**深色主题：**
- 深灰背景
- 深蓝用户消息
- 深灰 AI 消息

### 4. 历史记录

**本地存储：**
- 对话历史自动保存
- 刷新页面不丢失
- 清空对话时删除

---

## 🔧 API 接口

### POST /api/ai/chat

AI 聊天接口

**请求：**
```json
{
  "messages": [
    { "role": "user", "content": "你好" },
    { "role": "assistant", "content": "你好！有什么可以帮助你的？" },
    { "role": "user", "content": "今天天气如何？" }
  ]
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "content": "今天天气晴朗，气温适宜...",
    "model": "hunyuan-lite",
    "usage": {
      "prompt_tokens": 50,
      "completion_tokens": 100,
      "total_tokens": 150
    }
  }
}
```

### GET /api/ai/status

检查 AI 服务状态

**响应：**
```json
{
  "success": true,
  "data": {
    "available": true,
    "model": "hunyuan-lite",
    "endpoint": "https://api.hunyuan.cloud.tencent.com/v1"
  }
}
```

---

## 📊 上下文管理

### 实现逻辑

```javascript
// 获取最近 2 条消息
const contextMessages = computed(() => {
  const userMessages = messages.filter(m => m.role === 'user');
  const aiMessages = messages.filter(m => m.role === 'ai');
  
  // 获取最近 1 条用户消息和 1 条 AI 回复
  const recentUser = userMessages.slice(-1);
  const recentAI = aiMessages.slice(-1);
  
  return [...recentUser, ...recentAI];
});
```

### API 调用

```javascript
// 构建上下文消息（最近 2 条）
const contextForAPI = contextMessages.value.map(msg => ({
  role: msg.role === 'ai' ? 'assistant' : 'user',
  content: msg.content
}));

// 添加当前问题
contextForAPI.push({
  role: 'user',
  content: userInput
});

// 发送给 API
await fetch('/api/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ messages: contextForAPI })
});
```

---

## 🎨 样式特点

### 消息气泡

**用户消息：**
- 右侧对齐
- 蓝色背景
- 白色文字
- 右下角圆角

**AI 消息：**
- 左侧对齐
- 灰色背景
- 深色文字
- 左下角圆角

### 输入指示器

```css
.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: var(--text-secondary);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}
```

---

## 🔒 隐私说明

**数据存储：**
- 对话历史存储在本地（localStorage）
- 不会上传到服务器
- 清空对话时删除

**API 调用：**
- 仅发送必要的上下文消息
- 不包含个人信息
- 使用 HTTPS 加密

---

## 🐛 常见问题

### 1. API Key 未设置

**错误：** `错误：未设置 HUNYUAN_API_KEY 环境变量`

**解决：**
1. 在项目根目录创建 `.env` 文件
2. 添加：`HUNYUAN_API_KEY=your_key`
3. 重启服务

### 2. 响应慢

**原因：** 网络延迟或模型处理中

**解决：**
- 检查网络连接
- 等待 AI 处理完成
- 尝试简化问题

### 3. 历史记录丢失

**原因：** 清除了浏览器缓存

**解决：**
- 避免清除 localStorage
- 导出重要对话

---

## 📚 相关资源

- [混元大模型文档](https://cloud.tencent.com/document/product/1729)
- [Vue 3 文档](https://vuejs.org/)
- [Marked 文档](https://marked.js.org/)

---

## 📝 更新日志

### v1.0.0 (2026-03-13)
- ✅ 初始版本发布
- ✅ 智能对话功能
- ✅ 上下文记忆（最近 2 条）
- ✅ Markdown 渲染
- ✅ 明/暗主题切换
- ✅ 对话历史存储

---

*本文档基于 v1.0.0 版本编写，如有更新请参考最新代码。*
