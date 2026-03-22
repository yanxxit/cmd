/**
 * JSON 对比工具样式
 */
import React from 'react';

const createStyles = (darkMode: boolean = false): Record<string, React.CSSProperties> => ({
  // 页面容器 - 全屏布局
  pageContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: darkMode 
      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    overflow: 'hidden',
  },

  // 顶部工具栏 - 固定 56px
  toolbar: {
    height: 56,
    minHeight: 56,
    background: darkMode ? 'rgba(30, 30, 46, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    boxShadow: darkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
    zIndex: 100,
  },

  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  logoIcon: {
    fontSize: 22,
    background: darkMode 
      ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },

  logoText: {
    fontSize: 18,
    fontWeight: 700,
    background: darkMode 
      ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '0.5px',
  },

  // 主内容区
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 12,
    gap: 12,
    minHeight: 0,
    overflow: 'hidden',
  },

  // 编辑区卡片
  editorCard: {
    height: '100%',
    borderRadius: 12,
    border: 'none',
    boxShadow: darkMode ? '0 4px 16px rgba(0, 0, 0, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: darkMode ? 'rgba(30, 30, 46, 0.98)' : 'rgba(255, 255, 255, 0.98)',
  },

  cardHeader: {
    height: 44,
    minHeight: 44,
    background: darkMode 
      ? 'linear-gradient(135deg, #2d2d44 0%, #1a1a2e 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    borderBottom: `1px solid ${darkMode ? '#3d3d5c' : '#e9ecef'}`,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: 8,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: darkMode ? '#e0e0e0' : '#333',
  },

  editorWrapper: {
    flex: 1,
    overflow: 'auto',
    background: darkMode ? '#1e1e2e' : '#fff',
    fontSize: 'inherit',
  },

  // 编辑器
  editor: {
    fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, "Courier New", monospace',
    fontSize: 'inherit',
    lineHeight: 1.7,
    padding: '16px 20px',
    minHeight: '100%',
    outline: 'none',
    whiteSpace: 'pre',
    color: darkMode ? '#e0e0e0' : '#2c3e50',
    cursor: 'text',
  },

  placeholder: {
    color: darkMode ? '#555' : '#bbb',
    pointerEvents: 'none',
  },

  line: {
    minHeight: '1.7em',
    lineHeight: 1.7,
    whiteSpace: 'pre',
  },

  leadingSpace: {
    display: 'inline-block',
    fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, monospace',
  },

  lineContent: {
    padding: '1px 6px',
    borderRadius: '3px',
    display: 'inline-block',
    whiteSpace: 'pre',
    transition: 'all 0.15s ease',
  },

  emptyLine: {
    display: 'inline-block',
    minWidth: '100%',
  },

  // 编辑器容器
  container: {
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },

  // 复制按钮容器
  copyButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    transition: 'opacity 0.2s',
  },

  // 复制按钮样式
  copyButtonStyle: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
});

export default createStyles;
