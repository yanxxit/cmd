/**
 * 快速添加任务组件
 * 
 * 支持自然语言输入：
 * - 明天下午 3 点开会 #工作 @会议室 🔴
 * - 下周一提交报告 !high
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Space, Tag, Select, theme } from 'antd';
import { PlusOutlined, CalendarOutlined, FlagOutlined, TagOutlined, ClockCircleOutlined, FolderOutlined } from '@ant-design/icons';
import { parseNaturalLanguage, isNaturalLanguage, getDateSuggestions } from '../utils';
import type { Priority } from '../types';

const { TextArea } = Input;

interface QuickAddProps {
  onAdd: (content: string, priority?: Priority, due_date?: string | null, due_time?: string | null, tags?: string[], category?: string) => void;
  isDarkMode: boolean;
}

export const QuickAdd: React.FC<QuickAddProps> = ({ onAdd, isDarkMode }) => {
  const [value, setValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [parsed, setParsed] = useState<ReturnType<typeof parseNaturalLanguage> | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { token } = theme.useToken();

  // 解析自然语言
  useEffect(() => {
    if (isNaturalLanguage(value)) {
      const result = parseNaturalLanguage(value);
      setParsed(result);
    } else {
      setParsed(null);
    }
  }, [value]);

  // 日期建议
  useEffect(() => {
    if (value.includes('周') || value.includes('月') || value.includes('年')) {
      setSuggestions(getDateSuggestions());
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [value]);

  // 处理提交
  const handleSubmit = () => {
    if (!value.trim()) return;

    const content = parsed?.content || value;
    
    onAdd(
      content,
      parsed?.priority,
      parsed?.due_date || null,
      parsed?.due_time || null,
      parsed?.tags,
      parsed?.category
    );

    setValue('');
    setParsed(null);
    setIsExpanded(false);
  };

  // 处理按键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  };

  // 优先级颜色
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 1: return '#ff4d4f';
      case 2: return '#fa8c16';
      case 3: return '#52c41a';
    }
  };

  return (
    <div style={{
      marginBottom: 24,
      position: 'relative',
    }}>
      <div style={{
        background: isDarkMode ? '#1f1f1f' : '#fff',
        borderRadius: 8,
        boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        transition: 'all 0.3s',
      }}>
        <TextArea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsExpanded(true)}
          placeholder="添加任务... (试试输入：明天下午 3 点开会 #工作 @会议室 🔴)"
          autoSize={{ minRows: isExpanded ? 3 : 1, maxRows: 6 }}
          style={{
            padding: 16,
            fontSize: 14,
            border: 'none',
            resize: 'none',
            background: 'transparent',
          }}
        />

        {/* 解析预览 */}
        {parsed && (
          <div style={{
            padding: '0 16px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            {parsed.priority && (
              <Tag color={getPriorityColor(parsed.priority)} style={{ borderRadius: 4 }}>
                <FlagOutlined style={{ marginRight: 4 }} />
                {parsed.priority === 1 ? '高' : parsed.priority === 2 ? '中' : '低'}优先级
              </Tag>
            )}
            {parsed.due_date && (
              <Tag color="blue" style={{ borderRadius: 4 }}>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {parsed.due_date}
              </Tag>
            )}
            {parsed.due_time && (
              <Tag color="cyan" style={{ borderRadius: 4 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {parsed.due_time}
              </Tag>
            )}
            {parsed.tags?.map((tag, i) => (
              <Tag key={i} color="purple" style={{ borderRadius: 4 }}>
                <TagOutlined style={{ marginRight: 4 }} />
                #{tag}
              </Tag>
            ))}
            {parsed.category && (
              <Tag color="green" style={{ borderRadius: 4 }}>
                <FolderOutlined style={{ marginRight: 4 }} />
                @{parsed.category}
              </Tag>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        {isExpanded && (
          <div style={{
            padding: '12px 16px',
            background: isDarkMode ? '#141414' : '#fafafa',
            borderTop: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Space size="small">
              <Button
                size="small"
                icon={<CalendarOutlined />}
                onClick={() => {
                  // TODO: 打开日期选择器
                }}
              >
                设置日期
              </Button>
              <Button
                size="small"
                icon={<FlagOutlined />}
                onClick={() => {
                  // TODO: 设置优先级
                }}
              >
                优先级
              </Button>
              <Button
                size="small"
                icon={<TagOutlined />}
                onClick={() => {
                  // TODO: 添加标签
                }}
              >
                标签
              </Button>
            </Space>
            <Space size="small">
              <Button onClick={() => setIsExpanded(false)}>
                取消
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleSubmit}
                disabled={!value.trim()}
              >
                添加
              </Button>
            </Space>
          </div>
        )}
      </div>

      {/* 日期建议 */}
      {showSuggestions && (
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
          <div style={{ fontSize: 12, color: isDarkMode ? '#666' : '#999', marginBottom: 8 }}>
            选择日期：
          </div>
          <Space wrap>
            {suggestions.map((suggestion, i) => (
              <Tag
                key={i}
                onClick={() => {
                  const date = suggestion.match(/\d{4}-\d{2}-\d{2}/)?.[0];
                  if (date) {
                    setValue(value + ' ' + date);
                  }
                  setShowSuggestions(false);
                }}
                style={{ cursor: 'pointer', borderRadius: 4 }}
              >
                {suggestion}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
};
