const { createElement: h } = React;
const { Card, Col, Row } = antd;

function renderAdminStatCard(card) {
  return h(
    Col,
    { xs: 24, sm: 12, md: 12, lg: 6, key: card.key },
    h(
      Card,
      { className: 'stat-card', bordered: false },
      h(
        'div',
        { className: 'stat-card-inner' },
        h(
          'div',
          { className: 'stat-icon-badge', style: { background: card.bg, color: card.color } },
          h('i', { 'data-lucide': card.icon })
        ),
        h(
          'div',
          { className: 'stat-meta' },
          h('div', { className: 'stat-title' }, card.title),
          h('div', { className: 'stat-value', style: { color: card.color } }, card.value),
          h('div', { className: 'stat-desc' }, card.desc)
        )
      )
    )
  );
}

function AdminStatsPanel({ adminStats = {} }) {
  const cards = [
    {
      key: 'totalAdmins',
      title: '管理员总数',
      value: adminStats.totalAdmins || 0,
      icon: 'users',
      color: '#1677ff',
      bg: 'rgba(22,119,255,0.12)',
      desc: '系统内已注册的管理员账号',
    },
    {
      key: 'activeAdmins',
      title: '启用管理员',
      value: adminStats.activeAdmins || 0,
      icon: 'badge-check',
      color: '#52c41a',
      bg: 'rgba(82,196,26,0.12)',
      desc: '当前可正常登录并使用后台的账号',
    },
    {
      key: 'totalRoles',
      title: '角色数量',
      value: adminStats.totalRoles || 0,
      icon: 'key-round',
      color: '#722ed1',
      bg: 'rgba(114,46,209,0.12)',
      desc: '系统内可分配的角色模板',
    },
    {
      key: 'superAdmins',
      title: '超级管理员',
      value: adminStats.superAdmins || 0,
      icon: 'shield-check',
      color: '#fa8c16',
      bg: 'rgba(250,140,22,0.12)',
      desc: '拥有全量管理能力的账号数量',
    },
  ];

  return h(
    Row,
    { gutter: [16, 16], style: { marginBottom: 24 } },
    ...cards.map(renderAdminStatCard)
  );
}

export default AdminStatsPanel;
