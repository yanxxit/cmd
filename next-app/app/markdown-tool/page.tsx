'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 动态导入编辑器组件（避免 SSR 问题）
const Editor = dynamic(() => import('@/components/markdown-editor'), {
  ssr: false,
});

const Preview = dynamic(() => import('@/components/markdown-preview'), {
  ssr: false,
});

const DEFAULT_MARKDOWN = `# Markdown 预览工具

## 功能特点

- 📝 **实时预览** - 左侧编辑，右侧实时预览
- 🎨 **语法高亮** - 支持代码高亮显示
- 📋 **常用语法** - 支持所有 Markdown 语法
- 💾 **本地存储** - 自动保存内容到本地
- 📥 **导出功能** - 支持下载为 MD 文件

## 常用语法示例

### 1. 文本格式

**粗体文本** 和 *斜体文本*

### 2. 列表

#### 无序列表
- 项目 1
- 项目 2
- 项目 3

#### 有序列表
1. 第一步
2. 第二步
3. 第三步

### 3. 代码块

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### 4. 引用

> 这是一段引用文本
> 可以有多行

### 5. 表格

| 功能 | 状态 |
|------|------|
| 编辑 | ✅ |
| 预览 | ✅ |
| 保存 | ✅ |

### 6. 任务列表

- [x] 完成编辑器
- [x] 完成预览器
- [ ] 添加更多功能

---

**开始编辑吧！** 在左侧输入 Markdown 内容，右侧会实时显示预览效果。

> 💡 提示：内容会自动保存到本地存储，关闭页面后重新打开仍可恢复。
`;

export default function MarkdownToolPage() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 从本地存储加载
  useEffect(() => {
    const saved = localStorage.getItem('markdown-content');
    if (saved) {
      setMarkdown(saved);
    }
  }, []);

  // 自动保存到本地存储
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('markdown-content', markdown);
      setLastSaved(new Date());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 500);

    return () => clearTimeout(timer);
  }, [markdown]);

  // 清空内容
  const handleClear = () => {
    if (confirm('确定要清空所有内容吗？')) {
      setMarkdown(DEFAULT_MARKDOWN);
      localStorage.removeItem('markdown-content');
    }
  };

  // 重置为默认
  const handleReset = () => {
    if (confirm('确定要重置为默认内容吗？')) {
      setMarkdown(DEFAULT_MARKDOWN);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              📝 Markdown 预览工具
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {isSaved && (
                <span className="text-green-600">✓ 已保存</span>
              )}
              {lastSaved && !isSaved && (
                <span>
                  上次保存：{lastSaved.toLocaleTimeString('zh-CN')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              🔄 重置
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
            >
              🗑️ 清空
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-[1600px] mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-120px)] min-h-[500px]">
          {/* 编辑器 */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <Editor value={markdown} onChange={setMarkdown} />
          </div>

          {/* 预览器 */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <Preview markdown={markdown} />
          </div>
        </div>
      </main>
    </div>
  );
}
