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
  const [memberStats, setMemberStats] = React.useState({ totalUsers: 0, activeUsers: 0, todaySignedUsers: 0 });
  const [couponStats, setCouponStats] = React.useState({ totalClaims: 0, luckyDrawClaims: 0, totalUsages: 0 });
  const [shortLinkStats, setShortLinkStats] = React.useState({ total: 0, totalHits: 0 });

  React.useEffect(() => {
    async function loadDashboardStats() {
      try {
        const [nextContentStats, nextMemberStats, nextCouponStats, nextShortLinkStats] = await Promise.all([
          api.get('/api/admin-articles/stats'),
          api.get('/api/admin-members/stats'),
          api.get('/api/admin-coupons/stats'),
          api.get('/api/admin-short-links/stats'),
        ]);
        setContentStats(nextContentStats || { total: 0, published: 0, totalViews: 0 });
        setMemberStats(nextMemberStats || { totalUsers: 0, activeUsers: 0, todaySignedUsers: 0 });
        setCouponStats(nextCouponStats || { totalClaims: 0, luckyDrawClaims: 0, totalUsages: 0 });
        setShortLinkStats(nextShortLinkStats || { total: 0, totalHits: 0 });
      } catch (error) {}
    }
    loadDashboardStats();
  }, []);

  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '系统概览'),
      h(Text, { type: 'secondary' }, '集中查看管理员、用户、优惠券、短链接与内容系统的整体运行情况')
    ),
    h(AdminStatsPanel, { adminStats }),
    h(
      Row,
      { gutter: [16, 16], style: { marginBottom: 24 } },
      h(
        Col,
        { xs: 24, sm: 12, xl: 6 },
        h(
          Card,
          { bordered: false, className: 'info-card' },
          h('div', { className: 'dashboard-highlight dashboard-highlight-blue' }, `用户总数 ${memberStats.totalUsers || 0} · 今日签到 ${memberStats.todaySignedUsers || 0}`)
        )
      ),
      h(
        Col,
        { xs: 24, sm: 12, xl: 6 },
        h(
          Card,
          { bordered: false, className: 'info-card' },
          h('div', { className: 'dashboard-highlight dashboard-highlight-purple' }, `领券总数 ${couponStats.totalClaims || 0} · 已使用 ${couponStats.totalUsages || 0}`)
        )
      ),
      h(
        Col,
        { xs: 24, sm: 12, xl: 6 },
        h(
          Card,
          { bordered: false, className: 'info-card' },
          h('div', { className: 'dashboard-highlight dashboard-highlight-orange' }, `大转盘参与 ${couponStats.luckyDrawClaims || 0} 人次`)
        )
      ),
      h(
        Col,
        { xs: 24, sm: 12, xl: 6 },
        h(
          Card,
          { bordered: false, className: 'info-card' },
          h('div', { className: 'dashboard-highlight dashboard-highlight-green' }, `短链 ${shortLinkStats.total || 0} 条 · 点击 ${shortLinkStats.totalHits || 0}`)
        )
      )
    ),
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
              ),
              h(
                'div',
                { className: 'dashboard-meta-item' },
                h('div', { className: 'dashboard-meta-label' }, '活跃用户'),
                h('div', { className: 'dashboard-meta-value' }, memberStats?.activeUsers || 0)
              ),
              h(
                'div',
                { className: 'dashboard-meta-item' },
                h('div', { className: 'dashboard-meta-label' }, '短链累计点击'),
                h('div', { className: 'dashboard-meta-value' }, shortLinkStats?.totalHits || 0)
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
            h('div', { className: 'dashboard-highlight dashboard-highlight-orange' }, `超级管理员 ${adminStats?.superAdmins || 0} 个 · 大转盘 ${couponStats.luckyDrawClaims || 0} 次`),
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
