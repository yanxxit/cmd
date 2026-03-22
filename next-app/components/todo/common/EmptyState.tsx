/**
 * 空状态组件
 */

'use client';

import React from 'react';
import { Empty, Button, theme } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface EmptyStateProps {
  isDarkMode: boolean;
  description?: string;
  onAdd?: () => void;
  image?: 'simple' | 'custom';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isDarkMode,
  description = '暂无数据',
  onAdd,
  image = 'simple',
}) => {
  return (
    <div style={{
      padding: '60px 20px',
      textAlign: 'center',
    }}>
      <Empty
        image={image === 'simple' ? Empty.PRESENTED_IMAGE_SIMPLE : undefined}
        description={
          <div style={{ color: isDarkMode ? '#666' : '#999' }}>
            {description}
          </div>
        }
      >
        {onAdd && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAdd}
            size="large"
          >
            添加任务
          </Button>
        )}
      </Empty>
    </div>
  );
};
