// 主入口页面 ESM descriptor：布局壳（Sider + Header + Content） + 子页面路由分发
const { useState, useEffect } = React;
const {
  Layout, Menu, Breadcrumb, Button, Space, Tooltip, Badge,
  Avatar, Dropdown, Divider, ConfigProvider, theme: antdTheme, Typography,
} = antd;
const { Header, Content, Sider } = Layout;
const { Text } = Typography;

const THEME_KEY = 'tcm-theme';
const COLLAPSED_KEY = 'tcm-sider-collapsed';
const PAGE_KEYS = ['cases', 'collections'];

function App() {
  const [activeMenu, setActiveMenu] = useState('cases');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1');
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    document.body.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  useEffect(() => {
    const t = setTimeout(() => { try { lucide.createIcons(); } catch (e) {} }, 50);
    return () => clearTimeout(t);
  }, [activeMenu, collapsed, dark]);

  const menuItems = [
    {
      key: 'cases',
      icon: <i data-lucide="layout-list" className="menu-svg"></i>,
      label: '全部案例',
    },
    {
      key: 'collections',
      icon: <i data-lucide="folder-tree" className="menu-svg"></i>,
      label: '集合管理',
    },
  ];

  const userMenu = {
    items: [
      { key: 'profile', icon: <i data-lucide="user"></i>, label: '个人中心' },
      { key: 'settings', icon: <i data-lucide="settings"></i>, label: '偏好设置' },
      { type: 'divider' },
      { key: 'logout', icon: <i data-lucide="log-out"></i>, label: '退出登录' },
    ],
  };

  const renderContent = () => {
    const pageMod = window.__APP__.pages?.[activeMenu];
    if (!pageMod || !pageMod.Component) {
      return <div style={{ padding: 24 }}>页面 "{activeMenu}" 未找到</div>;
    }
    const Page = pageMod.Component;
    return <Page />;
  };

  const currentPage = window.__APP__.pages?.[activeMenu];
  const breadcrumbItems = [
    { title: <span><i data-lucide="home" style={{ width: 14, height: 14, verticalAlign: '-2px' }}></i> 首页</span> },
    { title: '测试案例管理' },
    { title: currentPage?.title || activeMenu },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontSize: 14,
        },
        components: {
          Layout: {
            headerBg: dark ? '#141414' : '#ffffff',
            siderBg: '#001529',
            bodyBg: dark ? '#000000' : '#f5f7fa',
            headerHeight: 56,
          },
          Menu: {
            darkItemBg: '#001529',
            darkItemSelectedBg: '#1677ff',
            darkSubMenuItemBg: '#000c17',
          },
        },
      }}
    >
      <Layout className="app-container">
        <Sider
          className="sidebar"
          theme="dark"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={232}
          collapsedWidth={64}
          trigger={null}
        >
          <div className="logo">
            <div className="logo-icon">
              <i data-lucide="square-check-big"></i>
            </div>
            {!collapsed && <span className="logo-text">案例管理</span>}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeMenu]}
            items={menuItems}
            onClick={({ key }) => setActiveMenu(key)}
            className="app-menu"
          />
          <div className="sider-footer">
            {!collapsed && (
              <div className="sider-version">
                <Text type="secondary" style={{ fontSize: 12 }}>v1.0.0 · ESM</Text>
              </div>
            )}
          </div>
        </Sider>
        <Layout>
          <Header className="header">
            <div className="header-left">
              <Button
                type="text"
                className="collapse-btn"
                icon={<i data-lucide={collapsed ? 'panel-left-open' : 'panel-left-close'}></i>}
                onClick={() => setCollapsed(!collapsed)}
              />
              <Breadcrumb className="breadcrumb" items={breadcrumbItems} />
            </div>
            <Space size={4} className="header-right">
              <Tooltip title="搜索">
                <Button type="text" shape="circle" icon={<i data-lucide="search"></i>} />
              </Tooltip>
              <Tooltip title="刷新">
                <Button type="text" shape="circle" icon={<i data-lucide="refresh-cw"></i>} onClick={() => window.location.reload()} />
              </Tooltip>
              <Tooltip title={dark ? '切换至亮色' : '切换至暗色'}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<i data-lucide={dark ? 'sun' : 'moon'}></i>}
                  onClick={() => setDark(!dark)}
                />
              </Tooltip>
              <Tooltip title="消息">
                <Badge count={0} dot={false}>
                  <Button type="text" shape="circle" icon={<i data-lucide="bell"></i>} />
                </Badge>
              </Tooltip>
              <Divider type="vertical" style={{ height: 24 }} />
              <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
                <div className="user-profile">
                  <Avatar size={28} style={{ background: '#1677ff' }}>QA</Avatar>
                  <span className="user-name">测试工程师</span>
                </div>
              </Dropdown>
            </Space>
          </Header>
          <Content className="content">
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default {
  type: 'page',
  key: 'index',
  title: '首页',
  App,
  registeredKeys: PAGE_KEYS,
};
