/**
 * 筛选栏组件
 */

'use client';

import React from 'react';
import { Select, Space, theme } from 'antd';
import {
  FilterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';

interface FilterBarProps {
  isDarkMode: boolean;
  filter: string;
  priority: string;
  dateFilter: string;
  onFilterChange: (filter: string) => void;
  onPriorityChange: (priority: string) => void;
  onDateFilterChange: (dateFilter: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  isDarkMode,
  filter,
  priority,
  dateFilter,
  onFilterChange,
  onPriorityChange,
  onDateFilterChange,
}) => {
  const { token } = theme.useToken();

  const selectStyle = {
    width: 120,
    background: isDarkMode ? '#1f1f1f' : '#fff',
    borderColor: isDarkMode ? '#303030' : '#d9d9d9',
  };

  return (
    <div style={{
      marginBottom: 16,
      padding: 12,
      background: isDarkMode ? '#1f1f1f' : '#fff',
      borderRadius: 8,
      boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <span style={{ 
        fontSize: 13, 
        fontWeight: 500, 
        color: isDarkMode ? '#fff' : '#000',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <FilterOutlined />
        筛选：
      </span>
      
      <Space size="small" wrap>
        {/* 状态筛选 */}
        <Select
          value={filter}
          onChange={onFilterChange}
          style={selectStyle}
          options={[
            { value: 'all', label: '全部状态', icon: <InboxOutlined /> },
            { value: 'pending', label: '未完成', icon: <ClockCircleOutlined /> },
            { value: 'completed', label: '已完成', icon: <CheckCircleOutlined /> },
          ]}
          optionRender={(option) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {option.data.icon}
              {option.label}
            </div>
          )}
        />

        {/* 优先级筛选 */}
        <Select
          value={priority}
          onChange={onPriorityChange}
          style={selectStyle}
          placeholder="优先级"
          options={[
            { value: 'all', label: '全部优先级' },
            { value: 'high', label: '🔴 高优先级' },
            { value: 'medium', label: '🟡 中优先级' },
            { value: 'low', label: '🟢 低优先级' },
          ]}
        />

        {/* 日期筛选 */}
        <Select
          value={dateFilter}
          onChange={onDateFilterChange}
          style={selectStyle}
          placeholder="日期"
          options={[
            { value: 'all', label: '全部日期' },
            { value: 'today', label: '📅 今天' },
            { value: 'week', label: '📅 本周' },
            { value: 'month', label: '📅 本月' },
            { value: 'overdue', label: '⚠️ 逾期', style: { color: '#ff4d4f' } },
          ]}
        />
      </Space>

      {/* 清除筛选 */}
      {(filter !== 'all' || priority !== 'all' || dateFilter !== 'all') && (
        <a
          onClick={() => {
            onFilterChange('all');
            onPriorityChange('all');
            onDateFilterChange('all');
          }}
          style={{ fontSize: 12, color: '#1890ff' }}
        >
          清除筛选
        </a>
      )}
    </div>
  );
};
