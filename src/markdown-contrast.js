/**
 * Markdown 对比编辑器数据模块
 * 支持保存和加载对比内容
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据文件路径
const DATA_FILE = path.join(__dirname, '../../.markdown-contrast-data.json');

// 默认示例内容
export const defaultExamples = [
  {
    id: 'hello-world',
    name: 'Hello World',
    icon: '👋',
    left: {
      title: 'Node.js',
      markdown: `# Hello Node.js

\`\`\`javascript
console.log('Hello, World!');
\`\`\`

## 特点
- 基于 JavaScript
- 异步非阻塞
- 事件驱动

> Node.js 适合 I/O 密集型应用
`
    },
    right: {
      title: 'Python',
      markdown: `# Hello Python

\`\`\`python
print('Hello, World!')
\`\`\`

## 特点
- 语法简洁
- 易读性强
- 生态丰富

> Python 适合数据科学和 AI
`
    }
  },
  {
    id: 'api-example',
    name: 'API 示例',
    icon: '🌐',
    left: {
      title: 'Express (Node.js)',
      markdown: `# Express API

\`\`\`javascript
import express from 'express';
const app = express();

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);
\`\`\`

## 路由定义
- 使用回调函数
- 中间件支持
- 链式调用
`
    },
    right: {
      title: 'FastAPI (Python)',
      markdown: `# FastAPI

\`\`\`python
from fastapi import FastAPI
app = FastAPI()

@app.get("/api/users")
async def get_users():
    return {"users": []}
\`\`\`

## 路由定义
- 装饰器语法
- 类型提示
- 自动生成文档
`
    }
  },
  {
    id: 'database',
    name: '数据库操作',
    icon: '💾',
    left: {
      title: 'Node.js + Prisma',
      markdown: `# Prisma ORM

\`\`\`javascript
const user = await prisma.user.create({
  data: {
    name: 'John',
    email: 'john@example.com'
  }
});
\`\`\`

## 特点
- 类型安全
- 自动补全
- 迁移工具
`
    },
    right: {
      title: 'Python + SQLAlchemy',
      markdown: `# SQLAlchemy

\`\`\`python
user = User(name='John', email='john@example.com')
db.session.add(user)
db.session.commit()
\`\`\`

## 特点
- ORM 映射
- 会话管理
- 查询构建器
`
    }
  }
];

/**
 * 加载所有对比内容
 */
export async function loadAllContrasts() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const saved = JSON.parse(data);
      // 合并默认和保存的内容
      return [...defaultExamples, ...saved];
    }
  } catch (error) {
    console.error('加载数据失败:', error.message);
  }
  return defaultExamples;
}

/**
 * 保存对比内容
 */
export async function saveContrast(contrast) {
  try {
    let saved = [];
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      saved = JSON.parse(data);
    }
    
    // 如果是新的，添加到保存列表
    const existingIndex = saved.findIndex(c => c.id === contrast.id);
    if (existingIndex >= 0) {
      saved[existingIndex] = contrast;
    } else {
      saved.push(contrast);
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(saved, null, 2), 'utf-8');
    return { success: true, data: contrast };
  } catch (error) {
    console.error('保存数据失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 删除对比内容
 */
export async function deleteContrast(id) {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { success: false, error: '数据文件不存在' };
    }
    
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    let saved = JSON.parse(data);
    saved = saved.filter(c => c.id !== id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(saved, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('删除数据失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 获取单个对比内容
 */
export async function getContrastById(id) {
  const all = await loadAllContrasts();
  return all.find(c => c.id === id) || null;
}

/**
 * 渲染 Markdown 为 HTML
 */
export function renderMarkdown(markdown) {
  // 简单的 Markdown 渲染（生产环境建议使用 marked 等库）
  let html = markdown;
  
  // 转义 HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // 代码块
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="code-block"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
  });
  
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // 标题
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // 粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 斜体
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 引用
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
  
  // 列表
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/<\/li>\n<li>/g, '</li><li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // 换行
  html = html.replace(/\n/g, '<br>');
  
  // 清理多余的 br
  html = html.replace(/<\/(h[1-6]|ul|ol|li|pre|blockquote)><br>/g, '</$1>');
  
  return html;
}
