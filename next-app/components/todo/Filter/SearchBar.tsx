/**
 * 搜索栏组件
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Input, theme } from 'antd';
import { SearchOutlined, HistoryOutlined, ClearOutlined } from '@ant-design/icons';

interface SearchBarProps {
  isDarkMode: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  isDarkMode,
  value,
  onChange,
  placeholder = '搜索任务...',
}) => {
  const { token } = theme.useToken();
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // 加载搜索历史
  useEffect(() => {
    try {
      const saved = localStorage.getItem('todo-search-history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // 保存搜索历史
  const saveToHistory = (query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('todo-search-history', JSON.stringify(newHistory));
  };

  // 处理变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // 清空时保存历史
    if (value && !newValue) {
      saveToHistory(value);
    }
  };

  // 处理失焦
  const handleBlur = () => {
    setIsFocused(false);
    if (value) {
      saveToHistory(value);
    }
  };

  // 清除历史
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('todo-search-history');
  };

  // 选择历史
  const selectHistory = (query: string) => {
    onChange(query);
    saveToHistory(query);
  };

  return (
    <div style={{
      marginBottom: 16,
      position: 'relative',
    }}>
      <Input
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        prefix={<SearchOutlined style={{ color: isDarkMode ? '#666' : '#999' }} />}
        allowClear
        size="large"
        style={{
          background: isDarkMode ? '#1f1f1f' : '#fff',
          borderColor: isFocused ? '#1890ff' : (isDarkMode ? '#303030' : '#d9d9d9'),
          boxShadow: isFocused ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
          transition: 'all 0.3s',
        }}
      />

      {/* 搜索历史 */}
      {isFocused && history.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 8,
          padding: 8,
          background: isDarkMode ? '#1f1f1f' : '#fff',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
          }}>
            <span style={{ fontSize: 12, color: isDarkMode ? '#666' : '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
              <HistoryOutlined />
              搜索历史
            </span>
            <a
              onClick={clearHistory}
              style={{ fontSize: 12, color: '#ff4d4f' }}
            >
              <ClearOutlined style={{ marginRight: 4 }} />
              清除
            </a>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {history.map((item, i) => (
              <div
                key={i}
                onClick={() => selectHistory(item)}
                style={{
                  padding: '4px 12px',
                  background: isDarkMode ? '#141414' : '#f5f5f5',
                  borderRadius: 16,
                  fontSize: 12,
                  cursor: 'pointer',
                  color: isDarkMode ? '#fff' : '#000',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? '#303030' : '#e6e6e6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDarkMode ? '#141414' : '#f5f5f5';
                }}
              >
                <SearchOutlined style={{ marginRight: 4, fontSize: 10 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
