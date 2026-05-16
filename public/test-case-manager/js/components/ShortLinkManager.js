const { createElement: h, useEffect, useMemo, useState } = React;
const {
  Button, Card, Col, Input, Popconfirm, Row, Select, Space, Table, Tag, Tooltip, message,
} = antd;
const { Search } = Input;
const [{ api }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

function renderLinkStat(title, value, color, bg) {
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

function getShortLinkUrl(code) {
  return `${window.location.origin}/s/${code}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    return false;
  }
}

function ShortLinkManager({ currentAdmin }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');

  const canManage = useMemo(
    () => Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes('shortlinks.manage'),
    [currentAdmin]
  );

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((item) => item.active !== false).length;
    const disabled = total - active;
    const totalHits = items.reduce((sum, item) => sum + Number(item.hitCount || 0), 0);
    return { total, active, disabled, totalHits };
  }, [items]);

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (keyword) query.set('keyword', keyword);
      if (typeFilter) query.set('type', typeFilter);
      if (activeFilter !== '') query.set('active', activeFilter);
      if (sortBy) query.set('sortBy', sortBy);
      const list = await api.get(`/api/admin-short-links?${query.toString()}`);
      setItems(list || []);
    } catch (error) {
      message.error('加载短链接失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [keyword, typeFilter, activeFilter, sortBy]);

  const handleToggleActive = async (record) => {
    try {
      await api.put(`/api/admin-short-links/${record._id}`, { active: !(record.active !== false) });
      message.success(record.active !== false ? '短链接已停用' : '短链接已启用');
      loadData();
    } catch (error) {
      message.error('更新状态失败：' + error.message);
    }
  };

  const handleDelete = async (record) => {
    try {
      await api.delete(`/api/admin-short-links/${record._id}`);
      message.success('短链接已删除');
      loadData();
    } catch (error) {
      message.error('删除短链接失败：' + error.message);
    }
  };

  const columns = [
    {
      title: '短链接',
      key: 'code',
      width: 220,
      render: (_, record) => h(
        Space,
        { direction: 'vertical', size: 0 },
        h('span', { style: { fontWeight: 600 } }, record.title || record.code),
        h('a', {
          href: getShortLinkUrl(record.code),
          target: '_blank',
          rel: 'noreferrer',
          style: { fontSize: 12 },
        }, `/s/${record.code}`)
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (value) => h(Tag, { color: value === 'article' ? 'blue' : 'purple' }, value || 'generic'),
    },
    {
      title: '资源 ID',
      dataIndex: 'resourceId',
      key: 'resourceId',
      width: 160,
      render: (value) => value || '-',
    },
    {
      title: '目标地址',
      dataIndex: 'targetUrl',
      key: 'targetUrl',
      render: (value) => value
        ? h(
            Tooltip,
            { title: value },
            h('a', {
              href: value,
              target: '_blank',
              rel: 'noreferrer',
              className: 'table-link-ellipsis',
            }, value)
          )
        : '-',
    },
    {
      title: '点击数',
      dataIndex: 'hitCount',
      key: 'hitCount',
      width: 110,
      render: (value) => h(Tag, { color: value > 0 ? 'geekblue' : 'default' }, value || 0),
    },
    {
      title: '最后访问',
      dataIndex: 'lastHitAt',
      key: 'lastHitAt',
      width: 170,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '状态',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (value) => h(Tag, { color: value !== false ? 'success' : 'default' }, value !== false ? '启用' : '停用'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => h(
        Space,
        null,
        h(Button, {
          type: 'link',
          size: 'small',
          onClick: async () => {
            const copied = await copyText(getShortLinkUrl(record.code));
            if (copied) {
              message.success('短链接已复制');
            } else {
              message.info(getShortLinkUrl(record.code));
            }
          },
        }, '复制'),
        h(Button, {
          type: 'link',
          size: 'small',
          disabled: !canManage,
          onClick: () => handleToggleActive(record),
        }, record.active !== false ? '停用' : '启用'),
        h(
          Popconfirm,
          {
            title: '确定删除该短链接吗？',
            okText: '确定',
            cancelText: '取消',
            disabled: !canManage,
            onConfirm: () => handleDelete(record),
          },
          h(Button, { type: 'link', size: 'small', danger: true, disabled: !canManage }, '删除')
        )
      ),
    },
  ];

  return h(
    React.Fragment,
    null,
    h(
      Row,
      { gutter: [16, 16], style: { marginBottom: 16 } },
      h(Col, { xs: 24, md: 12, lg: 6 }, renderLinkStat('短链接总数', stats.total, '#1677ff', 'rgba(22,119,255,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderLinkStat('启用中', stats.active, '#52c41a', 'rgba(82,196,26,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderLinkStat('已停用', stats.disabled, '#fa8c16', 'rgba(250,140,22,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderLinkStat('累计点击', stats.totalHits, '#722ed1', 'rgba(114,46,209,0.18)'))
    ),
    h(
      'div',
      { className: 'filter-section' },
      h(
        Row,
        { gutter: 16 },
        h(Col, { flex: '280px' }, h(Search, {
          placeholder: '搜索 code / 标题 / 目标地址 / 资源 ID',
          value: keyword,
          onChange: (event) => setKeyword(event.target.value),
          allowClear: true,
        })),
        h(Col, { flex: '180px' }, h(Select, {
          placeholder: '按类型筛选',
          value: typeFilter || undefined,
          allowClear: true,
          style: { width: '100%' },
          onChange: (value) => setTypeFilter(value || ''),
          options: [
            { label: '文章', value: 'article' },
            { label: '通用', value: 'generic' },
          ],
        })),
        h(Col, { flex: '180px' }, h(Select, {
          placeholder: '按状态筛选',
          value: activeFilter === '' ? undefined : activeFilter,
          allowClear: true,
          style: { width: '100%' },
          onChange: (value) => setActiveFilter(value ?? ''),
          options: [
            { label: '启用', value: 'true' },
            { label: '停用', value: 'false' },
          ],
        })),
        h(Col, { flex: '180px' }, h(Select, {
          value: sortBy,
          style: { width: '100%' },
          onChange: setSortBy,
          options: [
            { label: '按最近更新排序', value: 'updatedAt' },
            { label: '按点击数排序', value: 'hitCount' },
            { label: '按创建时间排序', value: 'createdAt' },
          ],
        }))
      )
    ),
    h(
      'div',
      { className: 'table-container' },
      h(Table, {
        rowKey: '_id',
        loading,
        dataSource: items,
        columns,
        pagination: false,
      })
    )
  );
}

export default ShortLinkManager;

