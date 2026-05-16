// 主入口页面模块：布局壳（Sider + Header + Content） + 子页面路由分发
const { createElement: h, useState, useEffect } = React;
const {
  Layout, Menu, Breadcrumb, Button, Space, Tooltip, Badge,
  Avatar, Dropdown, Divider, ConfigProvider, theme: antdTheme, Typography,
} = antd;
const { Header, Content, Sider } = Layout;
const { Text } = Typography;
const [{ default: CasesPage }, { default: CollectionsPage }] = await Promise.all([
  import(window.getModuleUrl('./js/pages/cases.page.js')),
  import(window.getModuleUrl('./js/pages/collections.page.js')),
]);

const THEME_KEY = 'tcm-theme';
const COLLAPSED_KEY = 'tcm-sider-collapsed';
const PAGE_REGISTRY = {
  cases: {
    title: '全部案例',
    Component: CasesPage,
  },
  collections: {
    title: '集合管理',
    Component: CollectionsPage,
  },
};

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
      icon: h('i', { 'data-lucide': 'layout-list', className: 'menu-svg' }),
      label: '全部案例',
    },
    {
      key: 'collections',
      icon: h('i', { 'data-lucide': 'folder-tree', className: 'menu-svg' }),
      label: '集合管理',
    },
  ];

  const userMenu = {
    items: [
      { key: 'profile', icon: h('i', { 'data-lucide': 'user' }), label: '个人中心' },
      { key: 'settings', icon: h('i', { 'data-lucide': 'settings' }), label: '偏好设置' },
      { type: 'divider' },
      { key: 'logout', icon: h('i', { 'data-lucide': 'log-out' }), label: '退出登录' },
    ],
  };

  const renderContent = () => {
    const pageMod = PAGE_REGISTRY[activeMenu];
    if (!pageMod || !pageMod.Component) {
      return h('div', { style: { padding: 24 } }, `页面 "${activeMenu}" 未找到`);
    }
    const Page = pageMod.Component;
    return h(Page);
  };

  const currentPage = PAGE_REGISTRY[activeMenu];
  const breadcrumbItems = [
    {
      title: h(
        'span',
        null,
        h('i', { 'data-lucide': 'home', style: { width: 14, height: 14, verticalAlign: '-2px' } }),
        ' 首页'
      ),
    },
    { title: '测试案例管理' },
    { title: currentPage?.title || activeMenu },
  ];

  return h(
    ConfigProvider,
    {
      theme: {
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
      },
    },
    h(
      Layout,
      { className: 'app-container' },
      h(
        Sider,
        {
          className: 'sidebar',
          theme: 'dark',
          collapsible: true,
          collapsed,
          onCollapse: setCollapsed,
          width: 232,
          collapsedWidth: 64,
          trigger: null,
        },
        h(
          'div',
          { className: 'logo' },
          h('div', { className: 'logo-icon' }, h('i', { 'data-lucide': 'square-check-big' })),
          !collapsed ? h('span', { className: 'logo-text' }, '案例管理') : null
        ),
        h(Menu, {
          theme: 'dark',
          mode: 'inline',
          selectedKeys: [activeMenu],
          items: menuItems,
          onClick: ({ key }) => setActiveMenu(key),
          className: 'app-menu',
        }),
        h(
          'div',
          { className: 'sider-footer' },
          !collapsed
            ? h(
                'div',
                { className: 'sider-version' },
                h(Text, { type: 'secondary', style: { fontSize: 12 } }, 'v1.0.0 · ESM')
              )
            : null
        )
      ),
      h(
        Layout,
        null,
        h(
          Header,
          { className: 'header' },
          h(
            'div',
            { className: 'header-left' },
            h(Button, {
              type: 'text',
              className: 'collapse-btn',
              icon: h('i', { 'data-lucide': collapsed ? 'panel-left-open' : 'panel-left-close' }),
              onClick: () => setCollapsed(!collapsed),
            }),
            h(Breadcrumb, { className: 'breadcrumb', items: breadcrumbItems })
          ),
          h(
            Space,
            { size: 4, className: 'header-right' },
            h(
              Tooltip,
              { title: '搜索' },
              h(Button, { type: 'text', shape: 'circle', icon: h('i', { 'data-lucide': 'search' }) })
            ),
            h(
              Tooltip,
              { title: '刷新' },
              h(Button, {
                type: 'text',
                shape: 'circle',
                icon: h('i', { 'data-lucide': 'refresh-cw' }),
                onClick: () => window.location.reload(),
              })
            ),
            h(
              Tooltip,
              { title: dark ? '切换至亮色' : '切换至暗色' },
              h(Button, {
                type: 'text',
                shape: 'circle',
                icon: h('i', { 'data-lucide': dark ? 'sun' : 'moon' }),
                onClick: () => setDark(!dark),
              })
            ),
            h(
              Tooltip,
              { title: '消息' },
              h(
                Badge,
                { count: 0, dot: false },
                h(Button, { type: 'text', shape: 'circle', icon: h('i', { 'data-lucide': 'bell' }) })
              )
            ),
            h(Divider, { type: 'vertical', style: { height: 24 } }),
            h(
              Dropdown,
              { menu: userMenu, trigger: ['click'], placement: 'bottomRight' },
              h(
                'div',
                { className: 'user-profile' },
                h(Avatar, { size: 28, style: { background: '#1677ff' } }, 'QA'),
                h('span', { className: 'user-name' }, '测试工程师')
              )
            )
          )
        ),
        h(Content, { className: 'content' }, renderContent())
      )
    )
  );
}

export default App;
