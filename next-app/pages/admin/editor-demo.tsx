import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, Spin } from 'antd';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';

/**
 * 最佳实践示例：使用 next/dynamic 动态加载重型依赖
 * 根据 Vercel bundle-dynamic-imports 规则，为了避免 CodeMirror 和 Markdown 
 * 阻塞主页面加载并影响打包体积，我们通过 next/dynamic 且 ssr: false 的方式懒加载。
 */

// 1. 动态加载 ReactMarkdown
const MarkdownViewer = dynamic(
  () => import('react-markdown').then((mod) => mod.default),
  { 
    ssr: false, 
    loading: () => <Spin tip="加载 Markdown 渲染器..." /> 
  }
);

// 2. 动态加载 CodeMirror 编辑器
const CodeEditor = dynamic(
  () => import('@uiw/react-codemirror').then((mod) => mod.default),
  { 
    ssr: false, 
    loading: () => <Spin tip="加载代码编辑器..." /> 
  }
);

export default function MarkdownEditorPage() {
  const [content, setContent] = useState<string>('# Hello Dynamic Import\n\n这是一个通过 `next/dynamic` 动态加载的示例。');

  return (
    <AdminLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '24px' }}>动态导入优化示例 (CodeMirror & Markdown)</h2>
        
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* 左侧：动态加载的 CodeMirror 编辑器 */}
          <Card title="编辑器 (懒加载)" style={{ flex: 1 }}>
            <CodeEditor
              value={content}
              height="400px"
              onChange={(val) => setContent(val)}
              // 注意：为了更极致的优化，CodeMirror 的语言包也可以使用动态导入
              // extensions={[...]} 
            />
          </Card>

          {/* 右侧：动态加载的 Markdown 渲染器 */}
          <Card title="预览 (懒加载)" style={{ flex: 1 }}>
            <div className="markdown-preview-content" style={{ minHeight: '400px' }}>
              <MarkdownViewer>{content}</MarkdownViewer>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
