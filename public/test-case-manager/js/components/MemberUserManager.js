const { createElement: h, useEffect, useMemo, useState } = React;
const {
  Button, Card, Col, Descriptions, Divider, Drawer, Form, Input, InputNumber, Modal,
  Popconfirm, Row, Select, Space, Switch, Table, Tag, message,
} = antd;
const { Search } = Input;
const [{ api }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

async function memberRequest(url, options = {}, token = '') {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '请求失败');
  }
  return result.data;
}

function renderMemberStat(title, value, color, bg) {
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

function getGenderLabel(value) {
  if (value === 'male') return '男';
  if (value === 'female') return '女';
  return '未知';
}

function getSourceLabel(value) {
  if (value === 'daily_random') return '每日随机';
  if (value === 'lucky_draw') return '大转盘';
  if (value === 'manual_grant') return '手动发放';
  return value || '-';
}

function MemberUserManager({ currentAdmin }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [signIns, setSignIns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [playgroundUser, setPlaygroundUser] = useState(null);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [playgroundSession, setPlaygroundSession] = useState(null);
  const [playgroundCoupons, setPlaygroundCoupons] = useState([]);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [loginType, setLoginType] = useState('password');
  const [playgroundPassword, setPlaygroundPassword] = useState('');
  const [playgroundSmsCode, setPlaygroundSmsCode] = useState('');
  const [playgroundSmsMeta, setPlaygroundSmsMeta] = useState(null);
  const [showUseCouponModal, setShowUseCouponModal] = useState(false);
  const [usingCoupon, setUsingCoupon] = useState(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [useCouponForm] = Form.useForm();

  const canManage = useMemo(
    () => Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes('users.manage'),
    [currentAdmin]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (keyword) query.set('keyword', keyword);
      if (genderFilter) query.set('gender', genderFilter);
      if (statusFilter) query.set('status', statusFilter);
      const [list, nextStats, nextSignIns] = await Promise.all([
        api.get(`/api/admin-members?${query.toString()}`),
        api.get('/api/admin-members/stats'),
        api.get('/api/admin-members/sign-ins'),
      ]);
      setUsers(list || []);
      setStats(nextStats || {});
      setSignIns(nextSignIns || []);
      if (playgroundUser) {
        const freshUser = (list || []).find((item) => item._id === playgroundUser._id);
        if (freshUser) {
          setPlaygroundUser(freshUser);
          setPlaygroundPassword(freshUser.defaultPassword || '');
        }
      }
    } catch (error) {
      message.error('加载用户数据失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [keyword, genderFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ gender: 'unknown', age: 18, status: true });
    setShowModal(true);
  };

  const openEditModal = (record) => {
    setEditingUser(record);
    form.setFieldsValue({
      phone: record.phone,
      nickname: record.nickname,
      gender: record.gender || 'unknown',
      age: Number(record.age || 0),
      password: record.defaultPassword || '',
      status: record.status !== 'disabled',
    });
    setShowModal(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        phone: values.phone,
        nickname: values.nickname,
        gender: values.gender,
        age: Number(values.age || 0),
        status: values.status ? 'active' : 'disabled',
      };
      if (!editingUser) {
        payload.password = values.password;
        await api.post('/api/admin-members', payload);
        message.success('用户已创建');
      } else {
        await api.put(`/api/admin-members/${editingUser._id}`, payload);
        message.success('用户信息已更新');
      }
      setShowModal(false);
      setEditingUser(null);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('保存用户失败：' + error.message);
    }
  };

  const handleDelete = async (record) => {
    try {
      await api.delete(`/api/admin-members/${record._id}`);
      message.success('用户已删除');
      loadData();
    } catch (error) {
      message.error('删除用户失败：' + error.message);
    }
  };

  const handleResetPassword = async (values) => {
    try {
      await api.post(`/api/admin-members/${resetTarget._id}/reset-password`, values);
      message.success('密码已重置');
      setShowPasswordModal(false);
      setResetTarget(null);
      passwordForm.resetFields();
      loadData();
    } catch (error) {
      message.error('重置密码失败：' + error.message);
    }
  };

  const openPlayground = (record) => {
    setPlaygroundUser(record);
    setPlaygroundOpen(true);
    setPlaygroundSession(null);
    setPlaygroundCoupons([]);
    setPlaygroundSmsCode('');
    setPlaygroundSmsMeta(null);
    setLoginType('password');
    setPlaygroundPassword(record.defaultPassword || '');
  };

  const refreshPlaygroundCoupons = async (token = '') => {
    const nextToken = token || playgroundSession?.token || '';
    if (!nextToken) return;
    try {
      const coupons = await memberRequest('/api/user-actions/coupons', {}, nextToken);
      setPlaygroundCoupons(coupons || []);
    } catch (error) {
      message.error('加载用户优惠券失败：' + error.message);
    }
  };

  const handleSendCode = async () => {
    if (!playgroundUser) return;
    setPlaygroundLoading(true);
    try {
      const result = await memberRequest('/api/user-auth/send-code', {
        method: 'POST',
        body: JSON.stringify({ phone: playgroundUser.phone }),
      });
      setPlaygroundSmsMeta(result);
      setPlaygroundSmsCode(result.code || '');
      message.success(`模拟验证码已生成：${result.code}`);
    } catch (error) {
      message.error('发送验证码失败：' + error.message);
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const handleMemberLogin = async () => {
    if (!playgroundUser) return;
    setPlaygroundLoading(true);
    try {
      const payload = {
        phone: playgroundUser.phone,
        loginType,
      };
      if (loginType === 'sms') {
        payload.smsCode = playgroundSmsCode;
      } else {
        payload.password = playgroundPassword;
      }
      const result = await memberRequest('/api/user-auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setPlaygroundSession(result);
      await refreshPlaygroundCoupons(result.token);
      message.success('用户登录成功');
      loadData();
    } catch (error) {
      message.error('用户登录失败：' + error.message);
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const handleMemberLogout = async () => {
    try {
      if (playgroundSession?.token) {
        await memberRequest('/api/user-auth/logout', { method: 'POST' }, playgroundSession.token);
      }
    } catch (error) {}
    setPlaygroundSession(null);
    setPlaygroundCoupons([]);
    message.success('用户已退出');
  };

  const runMemberAction = async (url, successText) => {
    if (!playgroundSession?.token) {
      message.warning('请先在操作台登录用户');
      return;
    }
    setPlaygroundLoading(true);
    try {
      const result = await memberRequest(url, { method: 'POST' }, playgroundSession.token);
      message.success(successText);
      await refreshPlaygroundCoupons(playgroundSession.token);
      loadData();
      return result;
    } catch (error) {
      message.error(error.message);
      return null;
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const openUseCouponModal = (record) => {
    setUsingCoupon(record);
    useCouponForm.setFieldsValue({ orderAmount: Math.max(Number(record?.coupon?.conditionAmount || 0), 99) });
    setShowUseCouponModal(true);
  };

  const handleUseCoupon = async (values) => {
    if (!playgroundSession?.token || !usingCoupon) return;
    try {
      await memberRequest('/api/user-actions/use-coupon', {
        method: 'POST',
        body: JSON.stringify({
          claimId: usingCoupon._id,
          orderAmount: Number(values.orderAmount || 0),
        }),
      }, playgroundSession.token);
      message.success('优惠券已使用');
      setShowUseCouponModal(false);
      setUsingCoupon(null);
      useCouponForm.resetFields();
      await refreshPlaygroundCoupons(playgroundSession.token);
    } catch (error) {
      message.error('使用优惠券失败：' + error.message);
    }
  };

  const userColumns = [
    {
      title: '手机号 / 昵称',
      key: 'identity',
      width: 220,
      render: (_, record) => h(
        Space,
        { direction: 'vertical', size: 0 },
        h('span', { style: { fontWeight: 600 } }, record.nickname || '-'),
        h('span', { style: { color: 'var(--tcm-text-secondary)', fontSize: 12 } }, record.phone)
      ),
    },
    {
      title: '性别 / 年龄',
      key: 'profile',
      width: 120,
      render: (_, record) => `${getGenderLabel(record.gender)} / ${record.age || 0} 岁`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => h(Tag, { color: value === 'active' ? 'success' : 'default' }, value === 'active' ? '启用' : '停用'),
    },
    {
      title: '默认密码',
      dataIndex: 'defaultPassword',
      key: 'defaultPassword',
      width: 120,
      render: (value) => h('code', { className: 'inline-code-preview' }, value || '-'),
    },
    {
      title: '签到数据',
      key: 'signIn',
      width: 150,
      render: (_, record) => h(
        Space,
        { direction: 'vertical', size: 0 },
        h('span', null, `连续 ${record.signInStreak || 0} 天`),
        h('span', { style: { color: 'var(--tcm-text-secondary)', fontSize: 12 } }, `累计 ${record.totalSignInDays || 0} 天`)
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 170,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      render: (_, record) => h(
        Space,
        null,
        h(Button, { type: 'link', size: 'small', onClick: () => openPlayground(record) }, '操作台'),
        h(Button, { type: 'link', size: 'small', disabled: !canManage, onClick: () => openEditModal(record) }, '编辑'),
        h(Button, {
          type: 'link',
          size: 'small',
          disabled: !canManage,
          onClick: () => {
            setResetTarget(record);
            passwordForm.setFieldsValue({ newPassword: record.defaultPassword || '' });
            setShowPasswordModal(true);
          },
        }, '重置密码'),
        h(
          Popconfirm,
          {
            title: '确定删除该用户吗？',
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

  const signInColumns = [
    {
      title: '签到用户',
      key: 'user',
      render: (_, record) => record.user ? `${record.user.nickname || '-'} (${record.user.phone || '-'})` : '-',
    },
    {
      title: '签到日期',
      dataIndex: 'dayKey',
      key: 'dayKey',
      width: 120,
    },
    {
      title: '签到时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ];

  const couponColumns = [
    {
      title: '优惠券',
      key: 'coupon',
      render: (_, record) => h(
        Space,
        { direction: 'vertical', size: 0 },
        h('span', { style: { fontWeight: 600 } }, record.coupon?.title || '未知优惠券'),
        h('span', { style: { color: 'var(--tcm-text-secondary)', fontSize: 12 } }, getSourceLabel(record.source))
      ),
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
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 180,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => record.status === 'claimed'
        ? h(Button, { type: 'link', size: 'small', onClick: () => openUseCouponModal(record) }, '使用')
        : '-',
    },
  ];

  return h(
    React.Fragment,
    null,
    h(
      Row,
      { gutter: [16, 16], style: { marginBottom: 16 } },
      h(Col, { xs: 24, md: 12, lg: 6 }, renderMemberStat('用户总数', stats.totalUsers || 0, '#1677ff', 'rgba(22,119,255,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderMemberStat('活跃用户', stats.activeUsers || 0, '#52c41a', 'rgba(82,196,26,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderMemberStat('今日签到', stats.todaySignedUsers || 0, '#722ed1', 'rgba(114,46,209,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderMemberStat('女性用户', stats.femaleUsers || 0, '#fa8c16', 'rgba(250,140,22,0.18)'))
    ),
    h(
      'div',
      { className: 'filter-section' },
      h(
        Row,
        { gutter: 16 },
        h(Col, { flex: '280px' }, h(Search, {
          placeholder: '搜索手机号或昵称',
          value: keyword,
          onChange: (event) => setKeyword(event.target.value),
          allowClear: true,
        })),
        h(Col, { flex: '180px' }, h(Select, {
          placeholder: '按性别筛选',
          value: genderFilter || undefined,
          allowClear: true,
          style: { width: '100%' },
          onChange: (value) => setGenderFilter(value || ''),
          options: [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' },
            { label: '未知', value: 'unknown' },
          ],
        })),
        h(Col, { flex: '180px' }, h(Select, {
          placeholder: '按状态筛选',
          value: statusFilter || undefined,
          allowClear: true,
          style: { width: '100%' },
          onChange: (value) => setStatusFilter(value || ''),
          options: [
            { label: '启用', value: 'active' },
            { label: '停用', value: 'disabled' },
          ],
        })),
        h(Col, { flex: 'auto', style: { textAlign: 'right' } }, h(Button, { type: 'primary', disabled: !canManage, onClick: openCreateModal }, '新增用户'))
      )
    ),
    h(
      'div',
      { className: 'table-container', style: { marginBottom: 16 } },
      h(Table, {
        rowKey: '_id',
        loading,
        dataSource: users,
        columns: userColumns,
        pagination: false,
      })
    ),
    h(
      Card,
      { bordered: false, className: 'info-card' },
      h(
        Space,
        { direction: 'vertical', size: 16, style: { width: '100%' } },
        h('div', { style: { fontSize: 16, fontWeight: 600 } }, '最近签到记录'),
        h(Table, {
          rowKey: '_id',
          size: 'small',
          pagination: { pageSize: 6 },
          dataSource: signIns,
          columns: signInColumns,
        })
      )
    ),
    h(
      Modal,
      {
        open: showModal,
        title: editingUser ? '编辑用户' : '新增用户',
        onCancel: () => {
          setShowModal(false);
          setEditingUser(null);
          form.resetFields();
        },
        onOk: () => form.submit(),
        okText: editingUser ? '保存' : '创建',
        destroyOnClose: true,
      },
      h(
        Form,
        {
          form,
          layout: 'vertical',
          onFinish: handleSubmit,
        },
        h(Form.Item, { label: '手机号', name: 'phone', rules: [{ required: true, message: '请输入手机号' }] }, h(Input, { placeholder: '请输入 11 位手机号' })),
        h(Form.Item, { label: '昵称', name: 'nickname', rules: [{ required: true, message: '请输入昵称' }] }, h(Input, { placeholder: '请输入昵称' })),
        h(
          Row,
          { gutter: 12 },
          h(Col, { span: 12 }, h(Form.Item, { label: '性别', name: 'gender', rules: [{ required: true, message: '请选择性别' }] }, h(Select, {
            options: [
              { label: '男', value: 'male' },
              { label: '女', value: 'female' },
              { label: '未知', value: 'unknown' },
            ],
          }))),
          h(Col, { span: 12 }, h(Form.Item, { label: '年龄', name: 'age', rules: [{ required: true, message: '请输入年龄' }] }, h(InputNumber, { min: 1, max: 120, style: { width: '100%' } })))
        ),
        !editingUser
          ? h(Form.Item, { label: '初始密码', name: 'password' }, h(Input.Password, { placeholder: '可留空，默认取手机号后 6 位' }))
          : null,
        h(Form.Item, { label: '启用状态', name: 'status', valuePropName: 'checked' }, h(Switch, { checkedChildren: '启用', unCheckedChildren: '停用' }))
      )
    ),
    h(
      Modal,
      {
        open: showPasswordModal,
        title: resetTarget ? `重置 ${resetTarget.nickname} 的密码` : '重置密码',
        onCancel: () => {
          setShowPasswordModal(false);
          setResetTarget(null);
          passwordForm.resetFields();
        },
        onOk: () => passwordForm.submit(),
        okText: '确认重置',
        destroyOnClose: true,
      },
      h(
        Form,
        {
          form: passwordForm,
          layout: 'vertical',
          onFinish: handleResetPassword,
        },
        h(Form.Item, { label: '新密码', name: 'newPassword' }, h(Input.Password, { placeholder: '可留空，默认重置为手机号后 6 位' }))
      )
    ),
    h(
      Drawer,
      {
        open: playgroundOpen,
        width: 860,
        title: playgroundUser ? `用户操作台：${playgroundUser.nickname} (${playgroundUser.phone})` : '用户操作台',
        onClose: () => {
          setPlaygroundOpen(false);
          setPlaygroundUser(null);
          setPlaygroundSession(null);
          setPlaygroundCoupons([]);
          setPlaygroundSmsMeta(null);
        },
      },
      playgroundUser
        ? h(
            Space,
            { direction: 'vertical', size: 16, style: { width: '100%' } },
            h(
              Card,
              { bordered: false, className: 'info-card' },
              h(Descriptions, {
                column: 2,
                items: [
                  { key: 'phone', label: '手机号', children: playgroundUser.phone },
                  { key: 'nickname', label: '昵称', children: playgroundUser.nickname },
                  { key: 'gender', label: '性别', children: getGenderLabel(playgroundUser.gender) },
                  { key: 'age', label: '年龄', children: `${playgroundUser.age || 0} 岁` },
                  { key: 'password', label: '默认密码', children: h('code', { className: 'inline-code-preview' }, playgroundUser.defaultPassword || '-') },
                  { key: 'signed', label: '签到累计', children: `${playgroundUser.totalSignInDays || 0} 天` },
                ],
              })
            ),
            h(
              Card,
              { bordered: false, className: 'info-card' },
              h(
                Space,
                { direction: 'vertical', size: 16, style: { width: '100%' } },
                h('div', { style: { fontSize: 16, fontWeight: 600 } }, '登录体验'),
                h(
                  Space,
                  { wrap: true },
                  h(Select, {
                    value: loginType,
                    style: { width: 180 },
                    onChange: setLoginType,
                    options: [
                      { label: '手机号 + 密码', value: 'password' },
                      { label: '手机号 + 验证码', value: 'sms' },
                    ],
                  }),
                  loginType === 'password'
                    ? h(Input.Password, {
                        value: playgroundPassword,
                        style: { width: 220 },
                        placeholder: '请输入密码',
                        onChange: (event) => setPlaygroundPassword(event.target.value),
                      })
                    : h(Input, {
                        value: playgroundSmsCode,
                        style: { width: 220 },
                        placeholder: '请输入短信验证码',
                        onChange: (event) => setPlaygroundSmsCode(event.target.value),
                      }),
                  loginType === 'sms'
                    ? h(Button, { onClick: handleSendCode, loading: playgroundLoading }, '发送验证码')
                    : null,
                  h(Button, { type: 'primary', onClick: handleMemberLogin, loading: playgroundLoading }, '登录'),
                  playgroundSession ? h(Button, { onClick: handleMemberLogout }, '退出') : null
                ),
                playgroundSmsMeta
                  ? h('div', { className: 'dashboard-highlight dashboard-highlight-blue' }, `当前模拟验证码：${playgroundSmsMeta.code}，5 分钟内有效`)
                  : null,
                playgroundSession
                  ? h('div', { className: 'dashboard-highlight dashboard-highlight-green' }, `当前已登录，Token 到期时间：${dayjs(playgroundSession.expiresAt).format('YYYY-MM-DD HH:mm:ss')}`)
                  : h('div', { className: 'dashboard-highlight dashboard-highlight-orange' }, '当前未登录，登录后可体验签到、领券和使用优惠券流程')
              )
            ),
            h(
              Card,
              { bordered: false, className: 'info-card' },
              h(
                Space,
                { direction: 'vertical', size: 16, style: { width: '100%' } },
                h('div', { style: { fontSize: 16, fontWeight: 600 } }, '用户动作'),
                h(
                  Space,
                  { wrap: true },
                  h(Button, { type: 'primary', onClick: () => runMemberAction('/api/user-actions/check-in', '签到成功'), loading: playgroundLoading }, '立即签到'),
                  h(Button, { onClick: () => runMemberAction('/api/user-actions/claim-daily-coupon', '随机优惠券领取成功'), loading: playgroundLoading }, '领取今日随机券'),
                  h(Button, { onClick: () => runMemberAction('/api/user-actions/lucky-draw', '大转盘抽奖成功'), loading: playgroundLoading }, '参与大转盘'),
                  h(Button, { onClick: () => refreshPlaygroundCoupons(), disabled: !playgroundSession?.token }, '刷新我的优惠券')
                )
              )
            ),
            h(
              Card,
              { bordered: false, className: 'info-card' },
              h(
                Space,
                { direction: 'vertical', size: 16, style: { width: '100%' } },
                h('div', { style: { fontSize: 16, fontWeight: 600 } }, '我的优惠券'),
                h(Table, {
                  rowKey: '_id',
                  size: 'small',
                  pagination: false,
                  dataSource: playgroundCoupons,
                  columns: couponColumns,
                  locale: { emptyText: playgroundSession?.token ? '暂无领取记录' : '登录后查看用户优惠券' },
                })
              )
            )
          )
        : null
    ),
    h(
      Modal,
      {
        open: showUseCouponModal,
        title: usingCoupon ? `使用 ${usingCoupon.coupon?.title || '优惠券'}` : '使用优惠券',
        onCancel: () => {
          setShowUseCouponModal(false);
          setUsingCoupon(null);
          useCouponForm.resetFields();
        },
        onOk: () => useCouponForm.submit(),
        okText: '确认使用',
        destroyOnClose: true,
      },
      h(
        Form,
        {
          form: useCouponForm,
          layout: 'vertical',
          onFinish: handleUseCoupon,
        },
        h(Form.Item, { label: '订单金额', name: 'orderAmount', rules: [{ required: true, message: '请输入订单金额' }] }, h(InputNumber, { min: 0, style: { width: '100%' }, placeholder: '请输入订单金额' }))
      )
    )
  );
}

export default MemberUserManager;

