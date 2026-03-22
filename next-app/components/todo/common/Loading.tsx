/**
 * 加载状态组件
 */

'use client';

import React from 'react';
import { Spin, theme } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingProps {
  isDarkMode: boolean;
  text?: string;
  size?: 'small' | 'default' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({
  isDarkMode,
  text = '加载中...',
  size = 'large',
}) => {
  return (
    <div style={{
      padding: '60px 20px',
      textAlign: 'center',
    }}>
      <Spin
        indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 32 : size === 'default' ? 24 : 16 }} spin />}
        size={size}
      />
      {text && (
        <div style={{
          marginTop: 16,
          fontSize: 14,
          color: isDarkMode ? '#666' : '#999',
        }}>
          {text}
        </div>
      )}
    </div>
  );
};
