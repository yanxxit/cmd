/**
 * 排序栏组件
 */

'use client';

import React from 'react';
import { Select, Space, theme } from 'antd';
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  CalendarOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';

interface SortBarProps {
  isDarkMode: boolean;
  sort: string;
  onSortChange: (sort: string) => void;
}

export const SortBar: React.FC<SortBarProps> = ({
  isDarkMode,
  sort,
  onSortChange,
}) => {
  const { token } = theme.useToken();

  // 解析排序方向和类型
  const [sortType, sortDirection] = sort.split('_');

  const selectStyle = {
    width: 150,
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
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ 
          fontSize: 13, 
          fontWeight: 500, 
          color: isDarkMode ? '#fff' : '#000',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <SortAscendingOutlined />
          排序：
        </span>
        
        <Space size="small">
          {/* 排序类型 */}
          <Select
            value={sortType}
            onChange={(value) => onSortChange(`${value}_${sortDirection}`)}
            style={selectStyle}
            options={[
              { value: 'created', label: '创建时间', icon: <CalendarOutlined /> },
              { value: 'priority', label: '优先级', icon: <FlagOutlined /> },
              { value: 'due', label: '截止日期', icon: <ClockCircleOutlined /> },
              { value: 'updated', label: '更新时间', icon: <EditOutlined /> },
            ]}
            optionRender={(option) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {option.data.icon}
                {option.label}
              </div>
            )}
          />

          {/* 排序方向 */}
          <Select
            value={sortDirection}
            onChange={(value) => onSortChange(`${sortType}_${value}`)}
            style={{ width: 100, ...selectStyle }}
            options={[
              { value: 'desc', label: '降序', icon: <SortDescendingOutlined /> },
              { value: 'asc', label: '升序', icon: <SortAscendingOutlined /> },
            ]}
            optionRender={(option) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {option.data.icon}
                {option.label}
              </div>
            )}
          />
        </Space>
      </div>

      {/* 排序提示 */}
      <div style={{ fontSize: 12, color: isDarkMode ? '#666' : '#999' }}>
        按 {
          sortType === 'created' ? '创建时间' :
          sortType === 'priority' ? '优先级' :
          sortType === 'due' ? '截止日期' : '更新时间'
        } {sortDirection === 'desc' ? '降序' : '升序'} 排列
      </div>
    </div>
  );
};
