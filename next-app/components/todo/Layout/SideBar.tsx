/**
 * 侧边栏组件
 */

'use client';

import React from 'react';
import { Layout, Menu, Badge, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  InboxOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FolderOutlined,
  TagOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

interface SideBarProps {
  isDarkMode: boolean;
  currentView: string;
  onViewChange: (view: string) => void;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  stats?: {
    today: number;
    week: number;
    overdue: number;
  };
}

export const SideBar: React.FC<SideBarProps> = ({
  isDarkMode,
  currentView,
  onViewChange,
  collapsed = false,
  onCollapse,
  stats,
}) => {
  const { token } = theme.useToken();

  const menuItems: MenuProps['items'] = [
    {
      key: 'all',
      icon: <InboxOutlined />,
      label: '全部任务',
    },
    {
      key: 'today',
      icon: <CalendarOutlined />,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>今天</span>
          {stats && stats.today > 0 && (
            <Badge count={stats.today} size="small" color="#ff4d4f" />
          )}
        </div>
      ),
    },
    {
      key: 'week',
      icon: <ClockCircleOutlined />,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>本周</span>
          {stats && stats.week > 0 && (
            <Badge count={stats.week} size="small" color="#1890ff" />
          )}
        </div>
      ),
    },
    {
      key: 'upcoming',
      icon: <ClockCircleOutlined />,
      label: '即将到期',
    },
    {
      key: 'completed',
      icon: <CheckCircleOutlined />,
      label: '已完成',
    },
    {
      type: 'divider',
    },
    {
      key: 'categories',
      icon: <FolderOutlined />,
      label: '分类',
      children: [
        { key: 'cat-work', label: '工作', icon: <FolderOutlined /> },
        { key: 'cat-personal', label: '个人', icon: <FolderOutlined /> },
        { key: 'cat-shopping', label: '购物', icon: <FolderOutlined /> },
        {
          key: 'cat-add',
          label: '创建分类',
          icon: <PlusOutlined />,
          style: { color: '#1890ff' },
        },
      ],
    },
    {
      key: 'tags',
      icon: <TagOutlined />,
      label: '标签',
      children: [
        { key: 'tag-urgent', label: '紧急', icon: <TagOutlined /> },
        { key: 'tag-important', label: '重要', icon: <TagOutlined /> },
        {
          key: 'tag-add',
          label: '管理标签',
          icon: <PlusOutlined />,
          style: { color: '#1890ff' },
        },
      ],
    },
  ];

  return (
    <Sider
      width={240}
      collapsedWidth={80}
      collapsed={collapsed}
      onCollapse={onCollapse}
      breakpoint="lg"
      style={{
        background: isDarkMode ? '#1f1f1f' : '#ffffff',
        borderRight: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
        overflow: 'auto',
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: 64,
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[currentView]}
        items={menuItems}
        onClick={({ key }) => onViewChange(key)}
        style={{
          background: 'transparent',
          borderRight: 'none',
        }}
        theme={isDarkMode ? 'dark' : 'light'}
      />
    </Sider>
  );
};
