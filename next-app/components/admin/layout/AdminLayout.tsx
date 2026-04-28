import React, { useState, useMemo } from 'react';
import { Layout, Menu, Button, theme, Dropdown, Space, Avatar, Typography, Breadcrumb, Badge } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  CodeOutlined,
  DashboardOutlined,
  LogoutOutlined,
  ShoppingOutlined,
  BellOutlined,
  SettingOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

// 面包屑路径映射
const breadcrumbNameMap: Record<string, string> = {
  '/admin': '控制台',
  '/admin/test-cases': '测试案例管理',
  '/admin/orders': '订单管理',
  '/admin/editor-demo': '编辑器演示',
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const router = useRouter();

  const menuItems = useMemo(() => [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: <Link href="/admin">控制台</Link>,
    },
    {
      key: '/admin/test-cases',
      icon: <CodeOutlined />,
      label: <Link href="/admin/test-cases">测试案例管理</Link>,
    },
    {
      key: '/admin/orders',
      icon: <ShoppingOutlined />,
      label: <Link href="/admin/orders">订单管理</Link>,
    },
  ], []);

  const userMenuItems = useMemo(() => [
    {
      key: 'profile',
      label: '个人设置',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: '系统设置',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: <span style={{ color: '#ff4d4f' }}>退出登录</span>,
      icon: <LogoutOutlined />,
      onClick: () => {
        router.push('/login');
      },
    },
  ], [router]);

  // 生成面包屑路径
  const breadcrumbItems = useMemo(() => {
    const pathSnippets = router.pathname.split('/').filter((i) => i);
    const items: Array<{ key: string; title: React.ReactNode }> = [{
      key: 'home',
      title: (
        <Link href="/admin">
          <HomeOutlined /> 首页
        </Link>
      ),
    }];
    
    let url = '';
    pathSnippets.forEach((snippet, index) => {
      url += `/${snippet}`;
      items.push({
        key: url,
        title: breadcrumbNameMap[url] || snippet,
      });
    });
    
    return items;
  }, [router.pathname]);

  const selectedKeys = [router.pathname];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        theme="dark"
        width={256}
        collapsedWidth={80}
        style={{
          boxShadow: '2px 0 8px 0 rgba(29,35,41,0.05)',
        }}
      >
        <div
          className="logo"
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            marginBottom: 8,
          }}
        >
          {collapsed ? (
            <DashboardOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          ) : (
            <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
              <DashboardOutlined style={{ marginRight: 8 }} />
              管理系统
            </Typography.Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header 
          style={{ 
            padding: '0 24px', 
            background: colorBgContainer, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 32,
                height: 32,
              }}
            />
            {title && !collapsed && (
              <Typography.Title level={4} style={{ margin: 0, fontWeight: 500 }}>
                {title}
              </Typography.Title>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* 通知铃铛 */}
            <Badge count={5} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                style={{ fontSize: 16 }}
              />
            </Badge>

            {/* 用户下拉菜单 */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <a onClick={(e) => e.preventDefault()} style={{ color: 'inherit' }}>
                <Space>
                  <Avatar 
                    icon={<UserOutlined />} 
                    style={{ backgroundColor: '#1890ff' }}
                  />
                  {!collapsed && (
                    <span style={{ marginLeft: 8 }}>
                      <Text strong>Admin</Text>
                    </span>
                  )}
                </Space>
              </a>
            </Dropdown>
          </div>
        </Header>
        
        {/* 面包屑导航 */}
        <div 
          style={{ 
            padding: '16px 24px', 
            background: colorBgContainer,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <Content
          style={{
            margin: 24,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
