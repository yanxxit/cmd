// 主入口页面模块：布局壳（Sider + Header + Content） + 登录态与权限路由分发
const { createElement: h, useEffect, useMemo, useRef, useState } = React;
const {
  Layout, Menu, Breadcrumb, Button, Space, Tooltip, Badge, Avatar,
  Dropdown, Divider, ConfigProvider, theme: antdTheme, Typography, Spin, message, Modal, Input, Empty, Tag,
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
  { default: ShortLinksPage },
  { default: MembersPage },
  { default: CouponsPage },
  { default: CouponClaimsPage },
  { default: CouponUsagesPage },
  { default: LotteryPage },
  { default: DateCalendarPage },
  { default: PomodoroPage },
  { default: TodosPage },
  { default: JsondbPage },
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
  import(window.getModuleUrl('./js/pages/shortlinks.page.js')),
  import(window.getModuleUrl('./js/pages/members.page.js')),
  import(window.getModuleUrl('./js/pages/coupons.page.js')),
  import(window.getModuleUrl('./js/pages/coupon-claims.page.js')),
  import(window.getModuleUrl('./js/pages/coupon-usages.page.js')),
  import(window.getModuleUrl('./js/pages/lottery.page.js')),
  import(window.getModuleUrl('./js/pages/date-calendar.page.js')),
  import(window.getModuleUrl('./js/pages/pomodoro.page.js')),
  import(window.getModuleUrl('./js/pages/todos.page.js')),
  import(window.getModuleUrl('./js/pages/jsondb.page.js')),
  import(window.getModuleUrl('./js/pages/admin-users.page.js')),
  import(window.getModuleUrl('./js/pages/roles.page.js')),
  import(window.getModuleUrl('./js/pages/account.page.js')),
]);

const THEME_KEY = 'tcm-theme';
const COLLAPSED_KEY = 'tcm-sider-collapsed';
const MENU_OPEN_KEYS_KEY = 'tcm-menu-open-keys';
const MENU_GROUPS = [
  {
    key: 'time',
    title: '时间',
    icon: 'calendar-clock',
    pageKeys: ['dateCalendar', 'pomodoro', 'todos'],
  },
  {
    key: 'database',
    title: '数据库',
    icon: 'database',
    pageKeys: ['jsondb'],
  },
];
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
  shortlinks: {
    title: '短链接管理',
    section: '内容管理',
    permission: 'shortlinks.view',
    icon: 'link',
    Component: ShortLinksPage,
  },
  members: {
    title: '用户管理',
    section: '用户运营',
    permission: 'users.view',
    icon: 'users',
    Component: MembersPage,
  },
  coupons: {
    title: '优惠券管理',
    section: '用户运营',
    permission: 'coupons.view',
    icon: 'ticket-percent',
    Component: CouponsPage,
  },
  couponClaims: {
    title: '领取记录',
    section: '用户运营',
    permission: 'coupons.view',
    icon: 'receipt-text',
    Component: CouponClaimsPage,
    hidden: true,
  },
  couponUsages: {
    title: '使用记录',
    section: '用户运营',
    permission: 'coupons.view',
    icon: 'scroll-text',
    Component: CouponUsagesPage,
    hidden: true,
  },
  lottery: {
    title: '活动大转盘',
    section: '用户运营',
    permission: 'lottery.view',
    icon: 'badge-percent',
    Component: LotteryPage,
  },
  dateCalendar: {
    title: '日历列表',
    section: '时间',
    permission: 'calendar.view',
    icon: 'calendar-range',
    Component: DateCalendarPage,
  },
  pomodoro: {
    title: '番茄时钟',
    section: '时间',
    permission: 'pomodoro.view',
    icon: 'timer-reset',
    Component: PomodoroPage,
  },
  todos: {
    title: 'TODO 列表',
    section: '时间',
    permission: 'todos.view',
    icon: 'list-todo',
    Component: TodosPage,
  },
  jsondb: {
    title: 'JSONDB 管理',
    section: '数据库',
    permission: 'jsondb.view',
    icon: 'table2',
    Component: JsondbPage,
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
  const pages = getAvailablePages(admin).filter((page) => !page.hidden);
  const pageMap = new Map(pages.map((page) => [page.key, page]));
  const groupedPageKeys = new Set(MENU_GROUPS.flatMap((group) => group.pageKeys));
  const insertedGroups = new Set();

  return pages.flatMap((page) => {
    if (groupedPageKeys.has(page.key)) {
      const group = MENU_GROUPS.find((item) => item.pageKeys.includes(page.key));
      if (!group || insertedGroups.has(group.key)) {
        return [];
      }
      insertedGroups.add(group.key);
      const children = group.pageKeys
        .map((key) => pageMap.get(key))
        .filter(Boolean)
        .map((child) => ({
          key: child.key,
          icon: h('i', { 'data-lucide': child.icon, className: 'menu-svg' }),
          label: child.title,
        }));
      if (!children.length) {
        return [];
      }
      return [{
        key: `group:${group.key}`,
        icon: h('i', { 'data-lucide': group.icon, className: 'menu-svg' }),
        label: group.title,
        children,
      }];
    }
    return [{
      key: page.key,
      icon: h('i', { 'data-lucide': page.icon, className: 'menu-svg' }),
      label: page.title,
    }];
  });
}

function getMenuParentKey(pageKey = '') {
  const group = MENU_GROUPS.find((item) => item.pageKeys.includes(pageKey));
  return group ? `group:${group.key}` : '';
}

function getInitials(name) {
  const text = String(name || '').trim();
  if (!text) return 'A';
  return text.slice(0, 2).toUpperCase();
}

function getHeaderQuickLinks(admin) {
  const preferredKeys = ['dashboard', 'members', 'coupons', 'shortlinks', 'articles', 'account'];
  const pages = getAvailablePages(admin).filter((page) => !page.hidden);
  return preferredKeys
    .map((key) => pages.find((page) => page.key === key))
    .filter(Boolean);
}

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [pagePayload, setPagePayload] = useState(null);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1');
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const [menuOpenKeys, setMenuOpenKeys] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(MENU_OPEN_KEYS_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const commandInputRef = useRef(null);

  const availablePages = useMemo(() => getAvailablePages(currentAdmin), [currentAdmin]);
  const menuItems = useMemo(() => buildMenuItems(currentAdmin), [currentAdmin]);
  const quickLinkPages = useMemo(() => getHeaderQuickLinks(currentAdmin), [currentAdmin]);

  const navigate = (pageKey, payload = null) => {
    if (!PAGE_REGISTRY[pageKey]) return;
    setActiveMenu(pageKey);
    setPagePayload(payload);
  };

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
    localStorage.setItem(MENU_OPEN_KEYS_KEY, JSON.stringify(menuOpenKeys));
  }, [menuOpenKeys]);

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
      navigate(firstAvailableKey, null);
    }
  }, [activeMenu, availablePages]);

  useEffect(() => {
    if (collapsed) {
      setMenuOpenKeys([]);
      return;
    }
    const parentKey = getMenuParentKey(activeMenu);
    if (!parentKey) return;
    setMenuOpenKeys((prev) => (prev.includes(parentKey) ? prev : [parentKey]));
  }, [activeMenu, collapsed]);

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
    setPagePayload(null);
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
      navigate(firstAvailableKey, null);
    }
  };

  const currentPage = PAGE_REGISTRY[activeMenu];
  const currentAdminRoleText = currentAdmin?.roles?.map((role) => role.name).join(' / ') || '管理员';
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
        navigate(key, null);
      }
    },
  };

  const quickAccessMenu = {
    items: quickLinkPages.map((page) => ({
      key: page.key,
      icon: h('i', { 'data-lucide': page.icon }),
      label: page.title,
    })),
    onClick: ({ key }) => navigate(key, null),
  };

  const noticeMenu = {
    items: [
      {
        key: 'notice-admins',
        label: `当前启用管理员 ${adminStats?.activeAdmins || 0} 人`,
      },
      {
        key: 'notice-roles',
        label: `系统角色模板 ${adminStats?.totalRoles || 0} 个`,
      },
      {
        key: 'notice-page',
        label: `当前所在：${currentPage?.title || '未知页面'}`,
      },
    ],
  };

  const commandItems = useMemo(() => {
    const pages = availablePages
      .filter((page) => !page.hidden)
      .map((page) => ({
        key: `page:${page.key}`,
        type: 'page',
        group: '页面跳转',
        title: page.title,
        subtitle: page.section,
        icon: page.icon,
        keywords: `${page.title} ${page.section} ${page.key}`,
        run: () => {
          navigate(page.key, null);
          setCommandOpen(false);
          setCommandQuery('');
        },
      }));

    const actions = [
      {
        key: 'action:refresh',
        type: 'action',
        group: '快捷操作',
        title: '刷新当前页面',
        subtitle: '重新加载整个后台页面',
        icon: 'refresh-cw',
        keywords: '刷新 reload refresh',
        run: () => window.location.reload(),
      },
      {
        key: 'action:theme',
        type: 'action',
        group: '快捷操作',
        title: dark ? '切换到亮色主题' : '切换到暗色主题',
        subtitle: '快速切换后台主题外观',
        icon: dark ? 'sun' : 'moon',
        keywords: `主题 dark light ${dark ? '亮色' : '暗色'}`,
        run: () => {
          setDark(!dark);
          setCommandOpen(false);
          setCommandQuery('');
        },
      },
      {
        key: 'action:account',
        type: 'action',
        group: '快捷操作',
        title: '打开账号安全',
        subtitle: '查看当前管理员账号与密码设置',
        icon: 'user-circle-2',
        keywords: '账号 安全 profile account',
        run: () => {
          navigate('account', null);
          setCommandOpen(false);
          setCommandQuery('');
        },
      },
      {
        key: 'action:logout',
        type: 'action',
        group: '快捷操作',
        title: '退出登录',
        subtitle: '退出当前管理员会话',
        icon: 'log-out',
        keywords: '退出 logout signout',
        run: () => {
          setCommandOpen(false);
          setCommandQuery('');
          handleLogout();
        },
      },
    ];

    return [...pages, ...actions];
  }, [availablePages, dark]);

  const filteredCommandItems = useMemo(() => {
    const keyword = commandQuery.trim().toLowerCase();
    if (!keyword) return commandItems;
    return commandItems.filter((item) => {
      const text = `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [commandItems, commandQuery]);

  const groupedCommandItems = useMemo(() => {
    const groups = new Map();
    filteredCommandItems.forEach((item) => {
      if (!groups.has(item.group)) {
        groups.set(item.group, []);
      }
      groups.get(item.group).push(item);
    });
    return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
  }, [filteredCommandItems]);

  const firstCommandItem = filteredCommandItems[0] || null;

  const rootSubmenuKeys = useMemo(() => MENU_GROUPS.map((group) => `group:${group.key}`), []);

  const handleMenuOpenChange = (nextOpenKeys = []) => {
    if (collapsed) {
      setMenuOpenKeys([]);
      return;
    }
    const latestOpenKey = nextOpenKeys.find((key) => !menuOpenKeys.includes(key));
    if (latestOpenKey && rootSubmenuKeys.includes(latestOpenKey)) {
      setMenuOpenKeys([latestOpenKey]);
      return;
    }
    setMenuOpenKeys(nextOpenKeys.filter((key) => rootSubmenuKeys.includes(key)));
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isShortcut) {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (event.key === 'Escape') {
        setCommandOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!commandOpen) return;
    const timer = setTimeout(() => {
      commandInputRef.current?.focus?.();
    }, 60);
    return () => clearTimeout(timer);
  }, [commandOpen]);

  const renderContent = () => {
    if (!currentPage || !currentPage.Component) {
      return h('div', { style: { padding: 24 } }, `页面 "${activeMenu}" 未找到`);
    }
    const Page = currentPage.Component;
    return h(Page, {
      currentAdmin,
      adminStats,
      navigate,
      pagePayload,
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
            darkItemHoverBg: 'rgba(255,255,255,0.08)',
            darkItemSelectedBg: 'rgba(22,119,255,0.2)',
            darkItemSelectedColor: '#ffffff',
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
          openKeys: collapsed ? [] : menuOpenKeys,
          onOpenChange: handleMenuOpenChange,
          items: menuItems,
          onClick: ({ key }) => navigate(key, null),
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
            h(
              'div',
              { className: 'header-page-meta' },
              h(
                'div',
                { className: 'header-page-title-row' },
                h('span', { className: 'header-page-title' }, currentPage?.title || '管理后台'),
                h('span', { className: 'header-page-section' }, currentPage?.section || '系统导航')
              ),
              h(Breadcrumb, { className: 'breadcrumb', items: breadcrumbItems })
            )
          ),
          h(
            'div',
            { className: 'header-center' },
            h(Button, {
              type: 'text',
              className: 'command-trigger',
              onClick: () => setCommandOpen(true),
            },
            h('i', { 'data-lucide': 'search', className: 'header-search-icon' }),
            h('span', { className: 'command-trigger-placeholder' }, '搜索页面、执行命令'),
            h('span', { className: 'command-trigger-shortcut' }, '⌘K'))
          ),
          h(
            Space,
            { size: 8, className: 'header-right' },
            h(
              Dropdown,
              { menu: quickAccessMenu, trigger: ['click'], placement: 'bottomRight' },
              h(
                Button,
                {
                  type: 'text',
                  className: 'header-action-btn header-action-wide',
                },
                h(Space, { size: 6 }, h('i', { 'data-lucide': 'sparkles' }), h('span', null, '快捷入口'))
              )
            ),
            h(
              Tooltip,
              { title: '刷新' },
              h(Button, {
                type: 'text',
                className: 'header-action-btn',
                icon: h('i', { 'data-lucide': 'refresh-cw' }),
                onClick: () => window.location.reload(),
              })
            ),
            h(
              Tooltip,
              { title: dark ? '切换至亮色' : '切换至暗色' },
              h(Button, {
                type: 'text',
                className: 'header-action-btn',
                icon: h('i', { 'data-lucide': dark ? 'sun' : 'moon' }),
                onClick: () => setDark(!dark),
              })
            ),
            h(
              Dropdown,
              { menu: noticeMenu, trigger: ['click'], placement: 'bottomRight' },
              h(
                Badge,
                { count: adminStats?.totalRoles || 0, size: 'small' },
                h(Button, {
                  type: 'text',
                  className: 'header-action-btn',
                  icon: h('i', { 'data-lucide': 'bell' }),
                })
              )
            ),
            h(Divider, { type: 'vertical', style: { height: 24 } }),
            h(
              Dropdown,
              { menu: userMenu, trigger: ['click'], placement: 'bottomRight' },
              h(
                'div',
                {
                  className: 'user-profile',
                  title: `${currentAdmin.displayName || currentAdmin.username} · ${currentAdminRoleText}`,
                },
                h(
                  'div',
                  { className: 'user-avatar-wrap' },
                  h(Avatar, { size: 32, className: 'user-avatar', style: { background: '#1677ff' } }, getInitials(currentAdmin.displayName || currentAdmin.username))
                ),
                h(
                  'div',
                  { className: 'user-identity' },
                  h('span', { className: 'user-name' }, currentAdmin.displayName || currentAdmin.username)
                ),
                h('i', { 'data-lucide': 'chevrons-up-down', className: 'user-caret' })
              )
            )
          )
        ),
        h(Content, { className: 'content' }, renderContent()),
        h(
          Modal,
          {
            open: commandOpen,
            footer: null,
            onCancel: () => {
              setCommandOpen(false);
              setCommandQuery('');
            },
            width: 680,
            className: 'command-modal',
            closable: false,
            destroyOnClose: false,
          },
          h(
            'div',
            { className: 'command-panel' },
            h(
              'div',
              { className: 'command-panel-header' },
              h('i', { 'data-lucide': 'search', className: 'command-panel-search-icon' }),
              h(Input, {
                ref: commandInputRef,
                value: commandQuery,
                bordered: false,
                className: 'command-panel-input',
                placeholder: '输入页面名、分组名或动作关键词',
                onChange: (event) => setCommandQuery(event.target.value),
                onPressEnter: () => {
                  if (firstCommandItem) {
                    firstCommandItem.run();
                  }
                },
              }),
              h('span', { className: 'command-panel-shortcut' }, 'ESC')
            ),
            groupedCommandItems.length
              ? h(
                  'div',
                  { className: 'command-panel-body' },
                  ...groupedCommandItems.map((group) => h(
                    'div',
                    { className: 'command-group', key: group.group },
                    h('div', { className: 'command-group-title' }, group.group),
                    ...group.items.map((item, index) => h(
                      'button',
                      {
                        type: 'button',
                        key: item.key,
                        className: `command-item${index === 0 && item.key === firstCommandItem?.key ? ' is-active' : ''}`,
                        onClick: item.run,
                      },
                      h('div', { className: `command-item-icon command-item-icon-${item.type}` }, h('i', { 'data-lucide': item.icon })),
                      h(
                        'div',
                        { className: 'command-item-meta' },
                        h('div', { className: 'command-item-title-row' },
                          h('span', { className: 'command-item-title' }, item.title),
                          item.type === 'page'
                            ? h(Tag, { bordered: false, className: 'command-item-tag' }, item.subtitle)
                            : h(Tag, { bordered: false, className: 'command-item-tag command-item-tag-action' }, '操作')
                        ),
                        h('div', { className: 'command-item-subtitle' }, item.subtitle)
                      ),
                      h('i', { 'data-lucide': 'arrow-up-right', className: 'command-item-arrow' })
                    ))
                  ))
                )
              : h(
                  'div',
                  { className: 'command-empty' },
                  h(Empty, {
                    image: Empty.PRESENTED_IMAGE_SIMPLE,
                    description: '没有匹配到命令，换个关键词试试',
                  })
                )
          )
        )
      )
    )
  );
}

export default App;
