const { createElement: h, useEffect, useMemo, useState } = React;
const { Button, Card, Col, Input, Row, Space, Table, Tag, message } = antd;
const { Search } = Input;
const [{ api }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

function renderUsageStat(title, value, color, bg) {
  return h(
    Card,
    { bordered: false, className: 'info-card', bodyStyle: { padding: 18 } },
    h(
      Space,
      { direction: 'vertical', size: 2 },
      h('div', { style: { color: 'var(--tcm-text-secondary)', fontSize: 12 } }, title),
      h('div', { style: { fontSize: 26, fontWeight: 700, color } }, value),
      h('div', { style: { width: 48, height: 4, borderRadius: 999, background: bg } })
    )
  );
}

function CouponUsageRecordList({ navigate, pagePayload }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (pagePayload?.couponId) query.set('couponId', pagePayload.couponId);
      const list = await api.get(`/api/admin-coupons/usages?${query.toString()}`);
      setRecords(list || []);
    } catch (error) {
      message.error('加载使用记录失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pagePayload?.couponId]);

  const visibleRecords = useMemo(() => {
    if (!keyword) return records;
    const lower = keyword.toLowerCase();
    return records.filter((item) =>
      String(item.user?.nickname || '').toLowerCase().includes(lower) ||
      String(item.user?.phone || '').includes(keyword) ||
      String(item.coupon?.title || '').toLowerCase().includes(lower)
    );
  }, [records, keyword]);

  const stats = useMemo(() => ({
    total: visibleRecords.length,
    orderAmount: visibleRecords.reduce((sum, item) => sum + Number(item.orderAmount || 0), 0),
    recent: visibleRecords.filter((item) => dayjs(item.usedAt).isAfter(dayjs().subtract(7, 'day'))).length,
    userCount: new Set(visibleRecords.map((item) => item.userId)).size,
  }), [visibleRecords]);

  const columns = [
    {
      title: '优惠券',
      key: 'coupon',
      render: (_, record) => record.coupon?.title || pagePayload?.couponTitle || '-',
    },
    {
      title: '使用用户',
      key: 'user',
      render: (_, record) => record.user ? `${record.user.nickname || '-'} (${record.user.phone || '-'})` : '-',
    },
    {
      title: '订单金额',
      dataIndex: 'orderAmount',
      key: 'orderAmount',
      width: 120,
      render: (value) => h(Tag, { color: 'geekblue' }, `¥${Number(value || 0).toFixed(2)}`),
    },
    {
      title: '领取来源',
      key: 'source',
      width: 120,
      render: (_, record) => record.claim?.source || '-',
    },
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      key: 'usedAt',
      width: 180,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ];

  return h(
    React.Fragment,
    null,
    h(
      Row,
      { gutter: [16, 16], style: { marginBottom: 16 } },
      h(Col, { xs: 24, md: 12, lg: 6 }, renderUsageStat('记录总数', stats.total, '#1677ff', 'rgba(22,119,255,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderUsageStat('近 7 天使用', stats.recent, '#52c41a', 'rgba(82,196,26,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderUsageStat('使用用户数', stats.userCount, '#722ed1', 'rgba(114,46,209,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderUsageStat('订单总额', `¥${stats.orderAmount.toFixed(0)}`, '#fa8c16', 'rgba(250,140,22,0.18)'))
    ),
    h(
      'div',
      { className: 'filter-section' },
      h(
        Row,
        { gutter: 16 },
        h(Col, { flex: '280px' }, h(Search, {
          placeholder: '搜索用户昵称、手机号或优惠券',
          value: keyword,
          onChange: (event) => setKeyword(event.target.value),
          allowClear: true,
        })),
        h(Col, { flex: 'auto', style: { textAlign: 'right' } }, h(Button, { onClick: () => navigate('coupons') }, '返回优惠券列表'))
      )
    ),
    h(
      'div',
      { className: 'table-container' },
      h(Table, {
        rowKey: '_id',
        loading,
        dataSource: visibleRecords,
        columns,
        pagination: false,
      })
    )
  );
}

export default CouponUsageRecordList;

