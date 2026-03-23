'use client';

import { useRef, useCallback, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const editorRef = useRef<EditorView | null>(null);
  const [wordCount, setWordCount] = useState(0);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
      // 计算字数
      const words = val.trim() ? val.trim().split(/\s+/).length : 0;
      setWordCount(words);
    },
    [onChange]
  );

  const handleEditorMount = useCallback((editor: EditorView) => {
    editorRef.current = editor;
  }, []);

  // 插入文本到光标位置
  const insertText = useCallback((text: string, cursorOffset = 0) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.state.selection.main;
    const from = selection.from;
    const to = selection.to;
    const selectedText = editor.state.doc.sliceString(from, to);

    editor.dispatch({
      changes: {
        from,
        to,
        insert: text.replace('$selection', selectedText),
      },
      selection: {
        anchor: from + cursorOffset + (text.includes('$selection') ? selectedText.length : 0),
      },
    });

    editor.focus();
  }, []);

  // 工具栏按钮配置
  const toolbarButtons = [
    { label: 'H1', text: '# $selection\n', title: '标题 1', offset: 3 },
    { label: 'H2', text: '## $selection\n', title: '标题 2', offset: 4 },
    { label: 'H3', text: '### $selection\n', title: '标题 3', offset: 5 },
    { label: '**粗体**', text: '**$selection**', title: '粗体', offset: 2 },
    { label: '*斜体*', text: '*$selection*', title: '斜体', offset: 1 },
    { label: '列表', text: '- $selection\n', title: '无序列表', offset: 2 },
    { label: '引用', text: '> $selection\n', title: '引用', offset: 2 },
    { label: '代码', text: '```\n$selection\n```\n', title: '代码块', offset: 4 },
    { label: '链接', text: '[$selection](url)', title: '链接', offset: 1 },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={() => insertText(btn.text, btn.offset)}
            title={btn.title}
            className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            {btn.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-xs text-gray-500">{wordCount} 字</span>
      </div>

      {/* 编辑器 */}
      <div className="flex-1 min-h-0">
        <CodeMirror
          value={value}
          height="100%"
          extensions={[markdown()]}
          onChange={handleChange}
          onCreateEditor={handleEditorMount}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            autocompletion: true,
          }}
          theme="light"
          className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto [&_.cm-gutters]:bg-gray-50 [&_.cm-content]:p-2"
        />
      </div>
    </div>
  );
}
