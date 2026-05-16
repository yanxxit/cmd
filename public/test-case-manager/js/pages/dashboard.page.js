const { createElement: h } = React;
const { Alert, Card, Col, Row, Space, Tag, Typography } = antd;
const { Title, Text } = Typography;
const [{ default: AdminStatsPanel }, { default: StatsPanel }, { api }] = await Promise.all([
  import(window.getModuleUrl('./js/components/AdminStatsPanel.js')),
  import(window.getModuleUrl('./js/components/StatsPanel.js')),
  import(window.getModuleUrl('./js/api.js')),
]);

function DashboardPage({ currentAdmin, adminStats }) {
  const roleNames = (currentAdmin?.roles || []).map((role) => role.name);
  const [contentStats, setContentStats] = React.useState({ total: 0, published: 0, totalViews: 0 });

  React.useEffect(() => {
    async function loadContentStats() {
      try {
        const stats = await api.get('/api/admin-articles/stats');
        setContentStats(stats || { total: 0, published: 0, totalViews: 0 });
      } catch (error) {}
    }
    loadContentStats();
  }, []);

  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '系统概览'),
      h(Text, { type: 'secondary' }, '集中查看管理员状态、角色规模以及测试案例系统的整体运行情况')
    ),
    h(AdminStatsPanel, { adminStats }),
    h(
      Row,
      { gutter: [16, 16], style: { marginBottom: 24 } },
      h(
        Col,
        { xs: 24, lg: 15 },
        h(
          Card,
          { bordered: false, className: 'info-card' },
          h(
            Space,
            { direction: 'vertical', size: 12, style: { width: '100%' } },
            h('div', { style: { fontSize: 16, fontWeight: 600 } }, '当前登录账号'),
            h(Alert, {
              type: 'success',
              showIcon: true,
              message: `欢迎回来，${currentAdmin?.displayName || currentAdmin?.username || '管理员'}`,
              description: '你当前看到的菜单与操作入口会根据角色权限自动收敛。',
            }),
            h(
              'div',
              { className: 'dashboard-meta-grid' },
              h(
                'div',
                { className: 'dashboard-meta-item' },
                h('div', { className: 'dashboard-meta-label' }, '登录账号'),
                h('div', { className: 'dashboard-meta-value' }, currentAdmin?.username || '-')
              ),
              h(
                'div',
                { className: 'dashboard-meta-item' },
                h('div', { className: 'dashboard-meta-label' }, '最近登录'),
                h('div', { className: 'dashboard-meta-value' }, currentAdmin?.lastLoginAt ? dayjs(currentAdmin.lastLoginAt).format('YYYY-MM-DD HH:mm:ss') : '-')
              )
            ),
            h(
              Space,
              { wrap: true, size: 8 },
              ...roleNames.map((roleName) => h(Tag, { color: roleName.includes('超级') ? 'volcano' : 'blue', key: roleName }, roleName))
            )
          )
        )
      ),
      h(
        Col,
        { xs: 24, lg: 9 },
        h(
          Card,
          { bordered: false, className: 'info-card' },
          h(
            Space,
            { direction: 'vertical', size: 10, style: { width: '100%' } },
            h('div', { style: { fontSize: 16, fontWeight: 600 } }, '系统状态提示'),
            h('div', { className: 'dashboard-highlight dashboard-highlight-blue' }, `启用管理员 ${adminStats?.activeAdmins || 0} / ${adminStats?.totalAdmins || 0}`),
            h('div', { className: 'dashboard-highlight dashboard-highlight-purple' }, `角色模板 ${adminStats?.totalRoles || 0} 个`),
            h('div', { className: 'dashboard-highlight dashboard-highlight-orange' }, `超级管理员 ${adminStats?.superAdmins || 0} 个`),
            h('div', { className: 'dashboard-highlight dashboard-highlight-green' }, `文章 ${contentStats.published || 0}/${contentStats.total || 0} 已发布 · 总阅读 ${contentStats.totalViews || 0}`)
          )
        )
      )
    ),
    h(
      'div',
      { className: 'dashboard-section-header' },
      h('div', { style: { fontSize: 16, fontWeight: 600 } }, '业务统计'),
      h(Text, { type: 'secondary' }, '下方保留测试案例与集合的业务统计卡片，便于统一观察系统状态')
    ),
    h(StatsPanel)
  );
}

export default DashboardPage;
