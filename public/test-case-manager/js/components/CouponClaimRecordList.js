const { createElement: h, useEffect, useMemo, useState } = React;
const { Button, Card, Col, Input, Row, Select, Space, Table, Tag, message } = antd;
const { Search } = Input;
const [{ api }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

function renderRecordStat(title, value, color, bg) {
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

function getSourceLabel(value) {
  if (value === 'daily_random') return '每日随机';
  if (value === 'lucky_draw') return '大转盘';
  if (value === 'manual_grant') return '手动发放';
  return value || '-';
}

function CouponClaimRecordList({ navigate, pagePayload }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (pagePayload?.couponId) query.set('couponId', pagePayload.couponId);
      if (sourceFilter) query.set('source', sourceFilter);
      if (statusFilter) query.set('status', statusFilter);
      const list = await api.get(`/api/admin-coupons/claims?${query.toString()}`);
      setRecords(list || []);
    } catch (error) {
      message.error('加载领取记录失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pagePayload?.couponId, sourceFilter, statusFilter]);

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
    used: visibleRecords.filter((item) => item.status === 'used').length,
    claimed: visibleRecords.filter((item) => item.status === 'claimed').length,
    luckyDraw: visibleRecords.filter((item) => item.source === 'lucky_draw').length,
  }), [visibleRecords]);

  const columns = [
    {
      title: '优惠券',
      key: 'coupon',
      render: (_, record) => record.coupon?.title || pagePayload?.couponTitle || '-',
    },
    {
      title: '领取用户',
      key: 'user',
      render: (_, record) => record.user ? `${record.user.nickname || '-'} (${record.user.phone || '-'})` : '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (value) => h(Tag, { color: value === 'lucky_draw' ? 'purple' : value === 'daily_random' ? 'blue' : 'green' }, getSourceLabel(value)),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => h(Tag, { color: value === 'used' ? 'processing' : 'success' }, value === 'used' ? '已使用' : '待使用'),
    },
    {
      title: '领取时间',
      dataIndex: 'claimedAt',
      key: 'claimedAt',
      width: 180,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 180,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
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
      h(Col, { xs: 24, md: 12, lg: 6 }, renderRecordStat('记录总数', stats.total, '#1677ff', 'rgba(22,119,255,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderRecordStat('待使用', stats.claimed, '#52c41a', 'rgba(82,196,26,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderRecordStat('已使用', stats.used, '#fa8c16', 'rgba(250,140,22,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderRecordStat('大转盘来源', stats.luckyDraw, '#722ed1', 'rgba(114,46,209,0.18)'))
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
        h(Col, { flex: '180px' }, h(Select, {
          placeholder: '按来源筛选',
          value: sourceFilter || undefined,
          allowClear: true,
          style: { width: '100%' },
          onChange: (value) => setSourceFilter(value || ''),
          options: [
            { label: '手动发放', value: 'manual_grant' },
            { label: '每日随机', value: 'daily_random' },
            { label: '大转盘', value: 'lucky_draw' },
          ],
        })),
        h(Col, { flex: '180px' }, h(Select, {
          placeholder: '按状态筛选',
          value: statusFilter || undefined,
          allowClear: true,
          style: { width: '100%' },
          onChange: (value) => setStatusFilter(value || ''),
          options: [
            { label: '待使用', value: 'claimed' },
            { label: '已使用', value: 'used' },
          ],
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

export default CouponClaimRecordList;

