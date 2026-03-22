'use client';

import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { App, Button, Tooltip } from 'antd';
import React, { useRef, useState, useMemo, useCallback } from 'react';

import { HIGHLIGHT_STYLES } from './constants';
import createStyles from './styles';
import type { LineDiffInfo } from './types';
import { processLines, smartFormat, copyToClipboard } from './utils';

export interface HighlightEditorProps {
  value: string;
  onChange: (value: string) => void;
  diffPaths: Map<string, any>;
  placeholder?: string;
  fontSize?: number;
  title?: string;
}

/**
 * 编辑器行组件（使用 memo 优化）
 */
const EditorLine: React.FC<{ lineInfo: LineDiffInfo; styles: any }> = React.memo(({ lineInfo, styles }) => {
  const hasContent = lineInfo.content.trim();
  const leadingSpaces = hasContent ? (lineInfo.content.match(/^(\s*)/)?.[1] || '') : '';
  const textContent = hasContent ? lineInfo.content.slice(leadingSpaces.length) : '';
  const isSame = lineInfo.type === 'same';
  
  // 获取高亮样式（排除 'same' 类型）
  const hlStyle = lineInfo.type !== 'same' ? HIGHLIGHT_STYLES[lineInfo.type] : undefined;

  const contentStyle = useMemo(() => isSame 
    ? { ...styles.lineContent, color: '#333' }
    : { ...styles.lineContent, ...hlStyle, color: hlStyle?.color }
  , [isSame, styles.lineContent, hlStyle]);

  if (!hasContent) {
    return <div style={styles.line}><span style={styles.emptyLine}>&nbsp;</span></div>;
  }

  return (
    <div style={styles.line}>
      {leadingSpaces && <span style={styles.leadingSpace}>{leadingSpaces}</span>}
      <span style={contentStyle}>{textContent}</span>
    </div>
  );
});

EditorLine.displayName = 'EditorLine';

/**
 * 高亮编辑器组件
 */
export const HighlightEditor: React.FC<HighlightEditorProps> = ({
  value,
  onChange,
  diffPaths,
  placeholder,
  fontSize = 13,
  title,
}) => {
  const { message } = App.useApp();
  const editorRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  
  // 缓存样式对象
  const styles: any = useMemo(() => {
    const baseStyles = createStyles(false);
    return {
      ...baseStyles,
      editor: { ...baseStyles.editor, fontSize },
    };
  }, [fontSize]);

  // 缓存处理后的行
  const processedLines = useMemo(
    () => processLines(value, diffPaths),
    [value, diffPaths]
  );

  // 状态派生值
  const isEmpty = !value?.trim();
  const showPlaceholder = isEmpty && !isFocused && processedLines.length === 0;

  /**
   * 处理粘贴事件 - 自动格式化 JSON
   */
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formattedText = smartFormat(pastedText);

    setIsPasting(true);
    const selection = window.getSelection();
    if (selection && editorRef.current) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(formattedText));
      
      // 直接更新，避免 onInput 重复触发
      const newText = editorRef.current.innerText;
      onChange(newText);
      
      setTimeout(() => {
        setIsPasting(false);
      }, 0);
      
      message.success('已自动格式化 JSON');
    }
  }, [onChange]);

  /**
   * 处理输入
   */
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    // 粘贴时跳过，避免重复
    if (isPasting) return;
    const text = e.currentTarget.innerText;
    onChange(text);
  }, [onChange, isPasting]);

  /**
   * 复制内容
   */
  const handleCopy = useCallback(async () => {
    if (!value?.trim()) {
      message.warning('没有可复制的内容');
      return;
    }
    setCopying(true);
    try {
      const success = await copyToClipboard(value);
      message[success ? 'success' : 'error'](
        success ? '已复制到剪贴板' : '复制失败'
      );
    } catch {
      message.error('复制失败');
    } finally {
      setCopying(false);
    }
  }, [value]);

  return (
    <div style={styles.container}>
      {/* 复制按钮 */}
      <div style={{
        ...styles.copyButton,
        opacity: isEmpty ? 0.3 : 0.8,
        pointerEvents: isEmpty ? 'none' : 'auto',
      }}>
        <Tooltip title={title ? `复制${title}` : '复制'}>
          <Button
            size="small"
            icon={copying ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            style={styles.copyButtonStyle}
          >
            {copying ? '已复制' : '复制'}
          </Button>
        </Tooltip>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.editor}
        data-placeholder={placeholder}
      >
        {showPlaceholder ? (
          <div style={styles.placeholder}>{placeholder}</div>
        ) : processedLines.length > 0 ? (
          processedLines.map((line, i) => (
            <EditorLine key={i} lineInfo={line} styles={styles} />
          ))
        ) : null}
      </div>
    </div>
  );
};
