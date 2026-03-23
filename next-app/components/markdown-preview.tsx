'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { useState, useRef } from 'react';

interface MarkdownPreviewProps {
  markdown: string;
}

export default function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const [copied, setCopied] = useState<'none' | 'markdown' | 'html'>('none');
  const contentRef = useRef<HTMLElement>(null);

  // 显示复制提示
  const showCopyToast = (success: boolean, type: 'markdown' | 'html') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white font-medium text-sm transition-all duration-300 z-50 ${
      success ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = success 
      ? `✓ ${type === 'markdown' ? 'Markdown' : 'HTML'} 已复制` 
      : `✗ ${type === 'markdown' ? 'Markdown' : 'HTML'} 复制失败`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  // 复制 Markdown 内容
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied('markdown');
      showCopyToast(true, 'markdown');
      setTimeout(() => setCopied('none'), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      showCopyToast(false, 'markdown');
    }
  };

  // 生成完整的 HTML 文档
  const generateFullHtml = (content: string): string => {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown 导出</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #fff;
    }
    h1 { font-size: 2rem; font-weight: 700; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; margin-bottom: 16px; }
    h2 { font-size: 1.5rem; font-weight: 600; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; margin-bottom: 16px; margin-top: 24px; }
    h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 16px; margin-top: 24px; }
    h4 { font-size: 1rem; font-weight: 600; margin-bottom: 16px; margin-top: 24px; }
    p { margin-bottom: 16px; }
    ul, ol { margin-bottom: 16px; padding-left: 2em; }
    li { margin-bottom: 4px; }
    blockquote {
      border-left: 4px solid #dfe2e5;
      padding-left: 16px;
      margin: 16px 0;
      color: #6a737d;
      background: #f6f8fa;
      padding: 8px 16px;
    }
    code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 85%;
      background: rgba(27,31,35,0.05);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      color: #24292e;
    }
    pre {
      background: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      margin-bottom: 16px;
    }
    pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
    }
    th, td {
      border: 1px solid #dfe2e5;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f6f8fa;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background: #f6f8fa;
    }
    hr {
      border: 0;
      border-top: 2px solid #eaecef;
      margin: 24px 0;
    }
    strong { font-weight: 700; }
    em { font-style: italic; }
    a {
      color: #0366d6;
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 16px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
${content}
</body>
</html>`;
  };

  // 复制渲染后的 HTML（完整文档）
  const handleCopyHtml = async () => {
    try {
      const content = contentRef.current?.innerHTML;
      if (!content) {
        showCopyToast(false, 'html');
        return;
      }

      // 生成完整的 HTML 文档
      const fullHtml = generateFullHtml(content);

      // 尝试使用 Clipboard API 写入 HTML
      try {
        const blobHtml = new Blob([fullHtml], { type: 'text/html' });
        const blobText = new Blob([content.replace(/<[^>]*>/g, '')], { type: 'text/plain' });
        
        const item = new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        });
        
        await navigator.clipboard.write([item]);
      } catch (clipboardErr) {
        // 降级方案：只复制纯文本
        console.warn('HTML 复制失败，降级为纯文本:', clipboardErr);
        await navigator.clipboard.writeText(content.replace(/<[^>]*>/g, ''));
      }

      setCopied('html');
      showCopyToast(true, 'html');
      setTimeout(() => setCopied('none'), 2000);
    } catch (err) {
      console.error('复制 HTML 失败:', err);
      showCopyToast(false, 'html');
    }
  };

  // 预览 HTML（新窗口打开）
  const handlePreviewHtml = () => {
    const content = contentRef.current?.innerHTML;
    if (!content) return;

    const fullHtml = generateFullHtml(content);
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(fullHtml);
      previewWindow.document.close();
    }
  };

  // 下载为 HTML 文件
  const handleDownloadHtml = () => {
    const content = contentRef.current?.innerHTML;
    if (!content) return;

    const fullHtml = generateFullHtml(content);
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markdown-${new Date().getTime()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showCopyToast(true, 'html');
  };

  // 下载为 MD 文件
  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markdown-${new Date().getTime()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">预览</span>
        <div className="flex-1" />
        <button
          onClick={handleCopyMarkdown}
          className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          title="复制 Markdown"
        >
          {copied === 'markdown' ? '✓ 已复制' : '📋 复制 MD'}
        </button>
        <button
          onClick={handleCopyHtml}
          className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          title="复制 HTML（含样式）"
        >
          {copied === 'html' ? '✓ 已复制' : '📄 复制 HTML'}
        </button>
        <div className="h-4 w-px bg-gray-300 mx-1" />
        <button
          onClick={handlePreviewHtml}
          className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          title="在新窗口预览 HTML"
        >
          🔍 预览 HTML
        </button>
        <button
          onClick={handleDownloadHtml}
          className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          title="下载为 HTML 文件"
        >
          📥 下载 HTML
        </button>
        <button
          onClick={handleDownload}
          className="px-3 py-1 text-xs font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 transition-colors"
          title="下载为 Markdown 文件"
        >
          💾 下载 MD
        </button>
      </div>

      {/* 预览内容 */}
      <div className="flex-1 overflow-auto p-4">
        <article ref={contentRef} className="markdown-preview-content prose prose-gray max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-3xl font-bold text-gray-900 border-b pb-2 mb-4" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-3 mt-6" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4" {...props} />
              ),
              h4: ({ node, ...props }) => (
                <h4 className="text-lg font-medium text-gray-800 mb-2 mt-3" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="text-gray-700 leading-7 mb-4" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside space-y-1 mb-4 ml-4" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-inside space-y-1 mb-4 ml-4" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="text-gray-700" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-gray-300 pl-4 py-2 my-4 bg-gray-50 text-gray-600 italic"
                  {...props}
                />
              ),
              code: ({ node, inline, className, children, ...props }: any) => {
                if (inline) {
                  return (
                    <code className="bg-gray-100 rounded px-1.5 py-0.5 text-sm text-red-600 font-mono" {...props}>
                      {children}
                    </code>
                  );
                }
                return (
                  <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border border-gray-300" {...props} />
                </div>
              ),
              th: ({ node, ...props }) => (
                <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left font-semibold" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="border border-gray-300 px-4 py-2" {...props} />
              ),
              hr: ({ node, ...props }) => (
                <hr className="border-t-2 border-gray-200 my-6" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-bold text-gray-900" {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className="italic text-gray-700" {...props} />
              ),
              a: ({ node, ...props }) => (
                <a className="text-blue-600 hover:underline" {...props} />
              ),
              img: ({ node, ...props }) => (
                <img className="max-w-full h-auto rounded-lg shadow-md my-4" {...props} />
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
