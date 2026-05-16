// 主入口页面模块：布局壳（Sider + Header + Content） + 登录态与权限路由分发
const { createElement: h, useEffect, useMemo, useState } = React;
const {
  Layout, Menu, Breadcrumb, Button, Space, Tooltip, Badge, Avatar,
  Dropdown, Divider, ConfigProvider, theme: antdTheme, Typography, Spin, message,
} = antd;
const { Header, Content, Sider } = Layout;
const { Text } = Typography;
const [
  { api, clearAuthToken, getAuthToken },
  { default: LoginPage },
  { default: DashboardPage },
  { default: CasesPage },
  { default: CollectionsPage },
  { default: EnvsPage },
  { default: ArticlesPage },
  { default: AdminUsersPage },
  { default: RolesPage },
  { default: AccountPage },
] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
  import(window.getModuleUrl('./js/components/LoginPage.js')),
  import(window.getModuleUrl('./js/pages/dashboard.page.js')),
  import(window.getModuleUrl('./js/pages/cases.page.js')),
  import(window.getModuleUrl('./js/pages/collections.page.js')),
  import(window.getModuleUrl('./js/pages/envs.page.js')),
  import(window.getModuleUrl('./js/pages/articles.page.js')),
  import(window.getModuleUrl('./js/pages/admin-users.page.js')),
  import(window.getModuleUrl('./js/pages/roles.page.js')),
  import(window.getModuleUrl('./js/pages/account.page.js')),
]);

const THEME_KEY = 'tcm-theme';
const COLLAPSED_KEY = 'tcm-sider-collapsed';
const PAGE_REGISTRY = {
  dashboard: {
    title: '系统概览',
    section: '首页',
    permission: 'dashboard.view',
    icon: 'layout-dashboard',
    Component: DashboardPage,
  },
  cases: {
    title: '全部案例',
    section: '测试案例管理',
    permission: 'cases.view',
    icon: 'layout-list',
    Component: CasesPage,
  },
  collections: {
    title: '集合管理',
    section: '测试案例管理',
    permission: 'collections.view',
    icon: 'folder-tree',
    Component: CollectionsPage,
  },
  envs: {
    title: '环境变量',
    section: '系统管理',
    permission: 'envs.view',
    icon: 'sliders-horizontal',
    Component: EnvsPage,
  },
  articles: {
    title: '文章管理',
    section: '内容管理',
    permission: 'articles.view',
    icon: 'newspaper',
    Component: ArticlesPage,
  },
  admins: {
    title: '管理员列表',
    section: '系统管理',
    permission: 'admins.view',
    icon: 'shield-check',
    Component: AdminUsersPage,
  },
  roles: {
    title: '角色与权限',
    section: '系统管理',
    permission: 'roles.view',
    icon: 'key-round',
    Component: RolesPage,
  },
  account: {
    title: '账号安全',
    section: '个人中心',
    permission: 'profile.view',
    icon: 'user-circle-2',
    Component: AccountPage,
  },
};

function hasPermission(admin, permission) {
  return Array.isArray(admin?.permissions) && admin.permissions.includes(permission);
}

function getAvailablePages(admin) {
  return Object.entries(PAGE_REGISTRY)
    .filter(([, page]) => hasPermission(admin, page.permission))
    .map(([key, page]) => ({ key, ...page }));
}

function buildMenuItems(admin) {
  return getAvailablePages(admin).map((page) => ({
    key: page.key,
    icon: h('i', { 'data-lucide': page.icon, className: 'menu-svg' }),
    label: page.title,
  }));
}

function getInitials(name) {
  const text = String(name || '').trim();
  if (!text) return 'A';
  return text.slice(0, 2).toUpperCase();
}

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1');
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const [authLoading, setAuthLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [adminStats, setAdminStats] = useState(null);

  const availablePages = useMemo(() => getAvailablePages(currentAdmin), [currentAdmin]);
  const menuItems = useMemo(() => buildMenuItems(currentAdmin), [currentAdmin]);

  const refreshAdminStats = async () => {
    try {
      const stats = await api.get('/api/admin-auth/stats');
      setAdminStats(stats);
    } catch (error) {
      console.warn('加载管理员统计失败：', error.message);
    }
  };

  const loadCurrentAdmin = async () => {
    const token = getAuthToken();
    if (!token) {
      setCurrentAdmin(null);
      setAdminStats(null);
      setAuthLoading(false);
      return;
    }

    try {
      const admin = await api.get('/api/admin-auth/me');
      setCurrentAdmin(admin);
      await refreshAdminStats();
    } catch (error) {
      clearAuthToken();
      setCurrentAdmin(null);
      setAdminStats(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    document.body.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);

  useEffect(() => {
    loadCurrentAdmin();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentAdmin(null);
      setAdminStats(null);
      setAuthLoading(false);
      message.warning('登录态已失效，请重新登录');
    };

    window.addEventListener('tcm-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('tcm-auth-expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    const firstAvailableKey = availablePages[0]?.key;
    if (!firstAvailableKey) return;
    const stillVisible = availablePages.some((page) => page.key === activeMenu);
    if (!stillVisible) {
      setActiveMenu(firstAvailableKey);
    }
  }, [activeMenu, availablePages]);

  useEffect(() => {
    const t = setTimeout(() => { try { lucide.createIcons(); } catch (e) {} }, 50);
    return () => clearTimeout(t);
  }, [activeMenu, collapsed, dark, currentAdmin, menuItems.length]);

  const handleLogout = async (showMessage = true) => {
    try {
      await api.post('/api/admin-auth/logout', {});
    } catch (error) {}
    clearAuthToken();
    setCurrentAdmin(null);
    setAdminStats(null);
    setActiveMenu('dashboard');
    if (showMessage) {
      message.success('已退出登录');
    }
  };

  const handleLoginSuccess = async (admin) => {
    setCurrentAdmin(admin);
    setAuthLoading(false);
    await refreshAdminStats();
    const firstAvailableKey = getAvailablePages(admin)[0]?.key;
    if (firstAvailableKey) {
      setActiveMenu(firstAvailableKey);
    }
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
    { title: currentPage?.section || '测试案例管理' },
    { title: currentPage?.title || activeMenu },
  ];

  const userMenu = {
    items: [
      { key: 'account', icon: h('i', { 'data-lucide': 'user-circle-2' }), label: '账号安全' },
      { type: 'divider' },
      { key: 'logout', icon: h('i', { 'data-lucide': 'log-out' }), label: '退出登录' },
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        handleLogout();
        return;
      }
      if (PAGE_REGISTRY[key]) {
        setActiveMenu(key);
      }
    },
  };

  const renderContent = () => {
    if (!currentPage || !currentPage.Component) {
      return h('div', { style: { padding: 24 } }, `页面 "${activeMenu}" 未找到`);
    }
    const Page = currentPage.Component;
    return h(Page, {
      currentAdmin,
      adminStats,
      onPasswordChanged: () => handleLogout(false),
    });
  };

  if (authLoading) {
    return h(
      ConfigProvider,
      {
        theme: {
          algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        },
      },
      h(
        'div',
        { className: 'loading-shell' },
        h(Spin, { size: 'large', tip: '正在加载后台配置...' })
      )
    );
  }

  if (!currentAdmin) {
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
        },
      },
      h(LoginPage, { onLoginSuccess: handleLoginSuccess })
    );
  }

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
          h('div', { className: 'logo-icon' }, h('i', { 'data-lucide': 'shield-check' })),
          !collapsed ? h('span', { className: 'logo-text' }, '管理后台') : null
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
                h(Text, { type: 'secondary', style: { fontSize: 12 } }, `管理员 ${adminStats?.activeAdmins || 0} · 角色 ${adminStats?.totalRoles || 0}`)
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
              { title: '系统角色数' },
              h(
                Badge,
                { count: adminStats?.totalRoles || 0, size: 'small' },
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
                h(Avatar, { size: 28, style: { background: '#1677ff' } }, getInitials(currentAdmin.displayName || currentAdmin.username)),
                h(
                  'div',
                  { className: 'user-identity' },
                  h('span', { className: 'user-name' }, currentAdmin.displayName || currentAdmin.username),
                  h('span', { className: 'user-role' }, currentAdmin.roles?.map((role) => role.name).join(' / ') || '管理员')
                )
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
