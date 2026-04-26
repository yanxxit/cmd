/**
 * 任务项组件
 */

'use client';

import React, { useState } from 'react';
import { Checkbox, Tag, Space, Button, Tooltip, theme } from 'antd';
import {
  FlagOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  UpOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { Todo, Priority } from '../types';
import type { CSSProperties } from 'react';

interface TodoItemProps {
  todo: Todo;
  isDarkMode: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (todo: Todo) => void;
  onExpand?: () => void;
  isExpanded?: boolean;
  showSubTasks?: boolean;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  isDarkMode,
  onToggle,
  onDelete,
  onEdit,
  onExpand,
  isExpanded = false,
  showSubTasks = false,
}) => {
  const { token } = theme.useToken();
  const [isHovered, setIsHovered] = useState(false);

  // 优先级配置
  const priorityConfig: Record<Priority, { color: string; label: string; icon: string }> = {
    1: { color: '#ff4d4f', label: '高', icon: '🔴' },
    2: { color: '#fa8c16', label: '中', icon: '🟡' },
    3: { color: '#52c41a', label: '低', icon: '🟢' },
  };

  // 检查是否逾期
  const isOverdue = !todo.completed && todo.due_date && new Date(todo.due_date) < new Date();
  const isToday = todo.due_date && new Date(todo.due_date).toDateString() === new Date().toDateString();

  // 优先级标签
  const renderPriorityTag = () => {
    const config = priorityConfig[todo.priority];
    return (
      <Tag color={config.color} style={{ borderRadius: 4, marginRight: 0 }}>
        {config.icon}
      </Tag>
    );
  };

  // 截止日期标签
  const renderDueDateTag = () => {
    if (!todo.due_date) return null;

    const date = new Date(todo.due_date);
    const dateStr = date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });

    let color = '';
    let text = dateStr;

    if (isToday) {
      color = 'orange';
      text = '今天';
    } else if (isOverdue) {
      color = 'red';
      const diff = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      text = `逾期 ${diff}天`;
    } else {
      color = 'blue';
    }

    return (
      <Tag color={color} style={{ borderRadius: 4 }}>
        <CalendarOutlined style={{ marginRight: 4 }} />
        {text}
      </Tag>
    );
  };

  // 子任务进度
  const renderSubTaskProgress = () => {
    if (!todo.subTodos || todo.subTodos.length === 0) return null;

    const completed = todo.subTodos.filter(t => t.completed).length;
    const total = todo.subTodos.length;
    const percentage = Math.round((completed / total) * 100);

    return (
      <div style={{ fontSize: 12, color: isDarkMode ? '#666' : '#999' }}>
        <CheckOutlined style={{ marginRight: 4, fontSize: 10 }} />
        {completed}/{total} 子任务
      </div>
    );
  };

  // 样式
  const containerStyle: CSSProperties = {
    padding: 16,
    background: isDarkMode ? '#1f1f1f' : '#fff',
    borderRadius: 8,
    marginBottom: 12,
    transition: 'all 0.3s',
    boxShadow: isHovered
      ? (isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)')
      : (isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'),
    border: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
  };

  return (
    <div
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* 复选框 */}
        <Checkbox
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          style={{ marginTop: 2 }}
        />

        {/* 内容区 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 任务内容 */}
          <div style={{
            fontSize: 14,
            color: isDarkMode
              ? (todo.completed ? '#666' : '#fff')
              : (todo.completed ? '#999' : '#000'),
            textDecoration: todo.completed ? 'line-through' : 'none',
            marginBottom: 8,
            wordBreak: 'break-word',
          }}>
            {todo.content}
          </div>

          {/* 备注 */}
          {todo.note && (
            <div style={{
              fontSize: 12,
              color: isDarkMode ? '#666' : '#999',
              marginBottom: 8,
              lineHeight: 1.5,
            }}>
              {todo.note}
            </div>
          )}

          {/* 标签行 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {renderPriorityTag()}
            {renderDueDateTag()}
            {todo.tags?.map((tag, i) => (
              <Tag key={i} color="purple" style={{ borderRadius: 4 }}>
                #{tag}
              </Tag>
            ))}
            {todo.subTodos && todo.subTodos.length > 0 && renderSubTaskProgress()}
          </div>
        </div>

        {/* 操作按钮 */}
        <Space size="small" style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s' }}>
          {showSubTasks && onExpand && (
            <Tooltip title={isExpanded ? '收起子任务' : '展开子任务'}>
              <Button
                type="text"
                size="small"
                icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                onClick={onExpand}
              />
            </Tooltip>
          )}
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(todo)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(todo.id)}
            />
          </Tooltip>
        </Space>
      </div>
    </div>
  );
};
