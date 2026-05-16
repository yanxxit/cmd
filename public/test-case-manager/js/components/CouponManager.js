const { createElement: h, useEffect, useMemo, useState } = React;
const {
  Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Table, Tag, message,
} = antd;
const { Search, TextArea } = Input;
const [{ api }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

const COUPON_TYPE_OPTIONS = [
  { label: '满减券', value: 'full_reduction' },
  { label: '折扣券', value: 'discount' },
  { label: '包邮券', value: 'shipping' },
];

function renderCouponStat(title, value, color, bg) {
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

function getCouponTypeLabel(type) {
  return COUPON_TYPE_OPTIONS.find((item) => item.value === type)?.label || type;
}

function getCouponRuleText(record) {
  if (record.type === 'shipping') return '全场包邮';
  if (record.type === 'discount') return `满 ${record.conditionAmount || 0} 元打 ${record.benefitValue || 0} 折`;
  return `满 ${record.conditionAmount || 0} 减 ${record.benefitValue || 0}`;
}

function CouponManager({ currentAdmin, navigate }) {
  const [form] = Form.useForm();
  const [grantForm] = Form.useForm();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantTarget, setGrantTarget] = useState(null);

  const canManage = useMemo(
    () => Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes('coupons.manage'),
    [currentAdmin]
  );

  const loadUsers = async () => {
    try {
      const list = await api.get('/api/admin-members');
      setUsers(list || []);
    } catch (error) {
      message.error('加载用户列表失败：' + error.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (keyword) query.set('keyword', keyword);
      if (typeFilter) query.set('type', typeFilter);
      if (statusFilter) query.set('status', statusFilter);
      if (sortBy) query.set('sortBy', sortBy);
      const [list, nextStats] = await Promise.all([
        api.get(`/api/admin-coupons?${query.toString()}`),
        api.get('/api/admin-coupons/stats'),
      ]);
      setItems(list || []);
      setStats(nextStats || {});
    } catch (error) {
      message.error('加载优惠券失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [keyword, typeFilter, statusFilter, sortBy]);

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'full_reduction',
      status: 'active',
      category: '通用',
      totalQuantity: 500,
      perUserLimit: 1,
      validDays: 7,
      conditionAmount: 99,
      benefitValue: 20,
    });
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      title: record.title,
      type: record.type,
      description: record.description,
      category: record.category,
      status: record.status,
      totalQuantity: record.totalQuantity,
      perUserLimit: record.perUserLimit,
      validDays: record.validDays,
      conditionAmount: record.conditionAmount,
      benefitValue: record.benefitValue,
    });
    setShowModal(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        conditionAmount: Number(values.conditionAmount || 0),
        benefitValue: Number(values.benefitValue || 0),
        totalQuantity: Number(values.totalQuantity || 0),
        perUserLimit: Number(values.perUserLimit || 1),
        validDays: Number(values.validDays || 7),
      };
      if (editingItem) {
        await api.put(`/api/admin-coupons/${editingItem._id}`, payload);
        message.success('优惠券已更新');
      } else {
        await api.post('/api/admin-coupons', payload);
        message.success('优惠券已创建');
      }
      setShowModal(false);
      setEditingItem(null);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('保存优惠券失败：' + error.message);
    }
  };

  const handleDelete = async (record) => {
    try {
      await api.delete(`/api/admin-coupons/${record._id}`);
      message.success('优惠券已删除');
      loadData();
    } catch (error) {
      message.error('删除优惠券失败：' + error.message);
    }
  };

  const openGrantModal = (record) => {
    setGrantTarget(record);
    grantForm.resetFields();
    setShowGrantModal(true);
  };

  const handleGrant = async (values) => {
    try {
      await api.post(`/api/admin-coupons/${grantTarget._id}/grant`, values);
      message.success('优惠券发放成功');
      setShowGrantModal(false);
      setGrantTarget(null);
      grantForm.resetFields();
      loadData();
    } catch (error) {
      message.error('发放失败：' + error.message);
    }
  };

  const columns = [
    {
      title: '优惠券',
      key: 'title',
      render: (_, record) => h(
        Space,
        { direction: 'vertical', size: 0 },
        h('span', { style: { fontWeight: 600 } }, record.title),
        h('span', { style: { color: 'var(--tcm-text-secondary)', fontSize: 12 } }, record.description || getCouponRuleText(record))
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (value) => h(Tag, { color: value === 'full_reduction' ? 'blue' : value === 'discount' ? 'purple' : 'green' }, getCouponTypeLabel(value)),
    },
    {
      title: '规则',
      key: 'rule',
      width: 180,
      render: (_, record) => getCouponRuleText(record),
    },
    {
      title: '发放 / 使用',
      key: 'count',
      width: 150,
      render: (_, record) => `${record.claimedCount || 0} / ${record.usedCount || 0}`,
    },
    {
      title: '每人限领',
      dataIndex: 'perUserLimit',
      key: 'perUserLimit',
      width: 100,
      render: (value) => value || 0,
    },
    {
      title: '有效期',
      dataIndex: 'validDays',
      key: 'validDays',
      width: 100,
      render: (value) => `${value || 0} 天`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => h(Tag, { color: value === 'active' ? 'success' : 'default' }, value === 'active' ? '启用' : '停用'),
    },
    {
      title: '操作',
      key: 'action',
      width: 360,
      render: (_, record) => h(
        Space,
        null,
        h(Button, { type: 'link', size: 'small', disabled: !canManage, onClick: () => openGrantModal(record) }, '发放'),
        h(Button, { type: 'link', size: 'small', onClick: () => navigate('couponClaims', { couponId: record._id, couponTitle: record.title }) }, '领取记录'),
        h(Button, { type: 'link', size: 'small', onClick: () => navigate('couponUsages', { couponId: record._id, couponTitle: record.title }) }, '使用记录'),
        h(Button, { type: 'link', size: 'small', disabled: !canManage, onClick: () => openEditModal(record) }, '编辑'),
        h(
          Popconfirm,
          {
            title: '确定删除该优惠券吗？',
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
      h(Col, { xs: 24, md: 12, lg: 6 }, renderCouponStat('优惠券总数', stats.totalCoupons || 0, '#1677ff', 'rgba(22,119,255,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderCouponStat('启用中', stats.activeCoupons || 0, '#52c41a', 'rgba(82,196,26,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderCouponStat('领取总数', stats.totalClaims || 0, '#722ed1', 'rgba(114,46,209,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderCouponStat('使用总数', stats.totalUsages || 0, '#fa8c16', 'rgba(250,140,22,0.18)'))
    ),
    h(
      'div',
      { className: 'filter-section' },
      h(
        Row,
        { gutter: 16 },
        h(Col, { flex: '280px' }, h(Search, {
          placeholder: '搜索优惠券名称或描述',
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
          options: COUPON_TYPE_OPTIONS,
        })),
        h(Col, { flex: '180px' }, h(Select, {
          placeholder: '按状态筛选',
          value: statusFilter || undefined,
          allowClear: true,
          style: { width: '100%' },
          onChange: (value) => setStatusFilter(value || ''),
          options: [
            { label: '启用', value: 'active' },
            { label: '停用', value: 'inactive' },
          ],
        })),
        h(Col, { flex: '180px' }, h(Select, {
          value: sortBy,
          style: { width: '100%' },
          onChange: setSortBy,
          options: [
            { label: '按最近更新排序', value: 'updatedAt' },
            { label: '按领取量排序', value: 'claimedCount' },
            { label: '按使用量排序', value: 'usedCount' },
          ],
        })),
        h(Col, { flex: 'auto', style: { textAlign: 'right' } }, h(Button, { type: 'primary', disabled: !canManage, onClick: openCreateModal }, '新建优惠券'))
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
    ),
    h(
      Modal,
      {
        open: showModal,
        title: editingItem ? '编辑优惠券' : '新建优惠券',
        width: 760,
        onCancel: () => {
          setShowModal(false);
          setEditingItem(null);
          form.resetFields();
        },
        onOk: () => form.submit(),
        okText: editingItem ? '保存' : '创建',
        destroyOnClose: true,
      },
      h(
        Form,
        {
          form,
          layout: 'vertical',
          onFinish: handleSubmit,
        },
        h(Form.Item, { label: '优惠券名称', name: 'title', rules: [{ required: true, message: '请输入优惠券名称' }] }, h(Input, { placeholder: '例如：满 199 减 40' })),
        h(
          Row,
          { gutter: 12 },
          h(Col, { span: 8 }, h(Form.Item, { label: '类型', name: 'type', rules: [{ required: true, message: '请选择优惠券类型' }] }, h(Select, { options: COUPON_TYPE_OPTIONS }))),
          h(Col, { span: 8 }, h(Form.Item, { label: '分类', name: 'category' }, h(Input, { placeholder: '例如：通用 / 美妆' }))),
          h(Col, { span: 8 }, h(Form.Item, { label: '状态', name: 'status', rules: [{ required: true, message: '请选择状态' }] }, h(Select, { options: [
            { label: '启用', value: 'active' },
            { label: '停用', value: 'inactive' },
          ] })))
        ),
        h(Form.Item, { label: '描述', name: 'description' }, h(TextArea, { rows: 3, placeholder: '描述优惠券使用规则和适用场景' })),
        h(
          Row,
          { gutter: 12 },
          h(Col, { span: 12 }, h(Form.Item, { label: '门槛金额', name: 'conditionAmount' }, h(InputNumber, { min: 0, style: { width: '100%' } }))),
          h(Col, { span: 12 }, h(Form.Item, { label: '优惠值', name: 'benefitValue' }, h(InputNumber, { min: 0, style: { width: '100%' } })))
        ),
        h(
          Row,
          { gutter: 12 },
          h(Col, { span: 8 }, h(Form.Item, { label: '总库存', name: 'totalQuantity' }, h(InputNumber, { min: 0, style: { width: '100%' } }))),
          h(Col, { span: 8 }, h(Form.Item, { label: '每人限领', name: 'perUserLimit' }, h(InputNumber, { min: 1, style: { width: '100%' } }))),
          h(Col, { span: 8 }, h(Form.Item, { label: '有效天数', name: 'validDays' }, h(InputNumber, { min: 1, style: { width: '100%' } })))
        )
      )
    ),
    h(
      Modal,
      {
        open: showGrantModal,
        title: grantTarget ? `发放优惠券：${grantTarget.title}` : '发放优惠券',
        onCancel: () => {
          setShowGrantModal(false);
          setGrantTarget(null);
          grantForm.resetFields();
        },
        onOk: () => grantForm.submit(),
        okText: '确认发放',
        destroyOnClose: true,
      },
      h(
        Form,
        {
          form: grantForm,
          layout: 'vertical',
          onFinish: handleGrant,
        },
        h(Form.Item, { label: '发放给用户', name: 'userId', rules: [{ required: true, message: '请选择用户' }] }, h(Select, {
          showSearch: true,
          optionFilterProp: 'label',
          placeholder: '请选择用户',
          options: users.map((item) => ({ label: `${item.nickname} (${item.phone})`, value: item._id })),
        }))
      )
    )
  );
}

export default CouponManager;

