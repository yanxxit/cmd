/**
 * 顶部导航栏组件
 */

'use client';

import React from 'react';
import { Layout, Input, Button, Space, Dropdown, theme } from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
  MoonOutlined,
  SunOutlined,
  MenuOutlined,
} from '@ant-design/icons';

const { Header } = Layout;

interface TopNavProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onMenuClick: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  isDarkMode,
  onToggleTheme,
  onMenuClick,
  searchValue,
  onSearchChange,
}) => {
  const { token } = theme.useToken();

  return (
    <Header
      style={{
        background: isDarkMode ? 'rgba(31, 31, 31, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* 左侧：Logo 和菜单按钮 */}
      <Space size="large">
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={onMenuClick}
          style={{ display: 'none' }} // 移动端显示
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🎯</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: isDarkMode ? '#fff' : '#000' }}>
            TODO
          </span>
        </div>
      </Space>

      {/* 中间：搜索框 */}
      <div style={{ flex: 1, maxWidth: 400, margin: '0 24px' }}>
        <Input
          placeholder="搜索任务..."
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            background: isDarkMode ? '#1f1f1f' : '#f5f5f5',
            border: 'none',
          }}
        />
      </div>

      {/* 右侧：操作按钮 */}
      <Space size="large">
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{ color: isDarkMode ? '#fff' : '#000' }}
        />
        <Button
          type="text"
          icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
          onClick={onToggleTheme}
          style={{ color: isDarkMode ? '#fff' : '#000' }}
          title={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
        />
        <Button
          type="text"
          icon={<SettingOutlined />}
          style={{ color: isDarkMode ? '#fff' : '#000' }}
        />
        <Dropdown
          menu={{
            items: [
              { key: 'profile', label: '个人资料' },
              { key: 'settings', label: '设置' },
              { type: 'divider' },
              { key: 'logout', label: '退出登录' },
            ],
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            U
          </div>
        </Dropdown>
      </Space>
    </Header>
  );
};
