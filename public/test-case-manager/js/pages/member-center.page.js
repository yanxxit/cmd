const { createElement: h, useEffect, useMemo, useState } = React;
const {
  Alert, Button, Card, Col, ConfigProvider, Descriptions, Divider, Empty, Form, Input,
  InputNumber, Modal, Row, Space, Table, Tabs, Tag, Typography, message,
  theme: antdTheme,
} = antd;
const { Title, Text } = Typography;
const [{ memberApi, getMemberToken, setMemberToken, clearMemberToken }] = await Promise.all([
  import(window.getModuleUrl('./js/member-api.js')),
]);

const DEMO_ACCOUNTS = [
  { phone: '13800000001', password: '000001', nickname: '演示用户-A' },
  { phone: '13800000002', password: '000002', nickname: '演示用户-B' },
  { phone: '13800000003', password: '000003', nickname: '演示用户-C' },
];

function renderStatCard(title, value, color, bg) {
  return h(
    'div',
    { className: 'member-stat-card' },
    h('div', { className: 'member-stat-label' }, title),
    h('div', { className: 'member-stat-value', style: { color } }, value),
    h('div', { className: 'member-stat-bar', style: { background: bg } })
  );
}

function getRuleText(item) {
  if (!item) return '-';
  if (item.type === 'shipping') return '全场包邮';
  if (item.type === 'discount') return `满 ${item.conditionAmount || 0} 元打 ${item.benefitValue || 0} 折`;
  return `满 ${item.conditionAmount || 0} 减 ${item.benefitValue || 0}`;
}

function getSourceLabel(source) {
  if (source === 'daily_random') return '每日随机';
  if (source === 'lucky_draw') return '大转盘';
  if (source === 'manual_grant') return '手动发放';
  return source || '-';
}

function getGenderLabel(gender) {
  if (gender === 'male') return '男';
  if (gender === 'female') return '女';
  return gender || '-';
}

function getPresetAccountByPhone(phone = '') {
  return DEMO_ACCOUNTS.find((item) => item.phone === phone) || null;
}

function getInitialLoginParams() {
  const params = new URLSearchParams(window.location.search || '');
  const phone = params.get('phone') || '';
  const loginType = params.get('loginType') || 'password';
  const preset = getPresetAccountByPhone(phone);
  return {
    phone: phone || DEMO_ACCOUNTS[0].phone,
    password: preset?.password || (phone ? String(phone).slice(-6) : DEMO_ACCOUNTS[0].password),
    smsCode: '',
    loginType: loginType === 'sms' ? 'sms' : 'password',
    preset,
  };
}

function MemberCenterPage() {
  const [form] = Form.useForm();
  const [useCouponForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('password');
  const [currentUser, setCurrentUser] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [actionResult, setActionResult] = useState(null);
  const [smsPreview, setSmsPreview] = useState(null);
  const [usingCoupon, setUsingCoupon] = useState(null);
  const [dark, setDark] = useState(false);

  const loadCurrentUser = async () => {
    if (!getMemberToken()) {
      setCurrentUser(null);
      setCoupons([]);
      setPrizes([]);
      return;
    }
    setLoading(true);
    try {
      const [user, couponList, prizeList] = await Promise.all([
        memberApi.get('/api/user-auth/me'),
        memberApi.get('/api/user-actions/coupons'),
        memberApi.get('/api/user-actions/prizes'),
      ]);
      setCurrentUser(user || null);
      setCoupons(couponList || []);
      setPrizes(prizeList || []);
    } catch (error) {
      clearMemberToken();
      setCurrentUser(null);
      setCoupons([]);
      setPrizes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = getInitialLoginParams();
    setLoginType(initial.loginType);
    form.setFieldsValue({
      phone: initial.phone,
      password: initial.password,
      smsCode: initial.smsCode,
    });
    if (initial.preset) {
      setActionResult({
        type: 'prefill',
        text: `已从后台带入手机号 ${initial.phone}，默认密码已自动填入。`,
      });
    } else if (initial.phone && initial.phone !== DEMO_ACCOUNTS[0].phone) {
      setActionResult({
        type: 'prefill',
        text: `已从后台带入手机号 ${initial.phone}，可直接使用密码或验证码登录。`,
      });
    }
    loadCurrentUser();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        lucide.createIcons();
      } catch (error) {}
    }, 50);
    return () => clearTimeout(t);
  }, [currentUser, coupons.length, prizes.length, actionResult, dark]);

  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      setCoupons([]);
      setPrizes([]);
      message.warning('登录态已失效，请重新登录');
    };
    window.addEventListener('tcm-member-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('tcm-member-auth-expired', handleAuthExpired);
  }, []);

  const handleSendCode = async () => {
    const phone = form.getFieldValue('phone');
    if (!phone) {
      message.warning('请先输入手机号');
      return;
    }
    setLoading(true);
    try {
      const result = await memberApi.post('/api/user-auth/send-code', { phone });
      setSmsPreview(result);
      form.setFieldValue('smsCode', result.code || '');
      setActionResult({
        type: 'sms',
        text: `模拟验证码已生成：${result.code}，5 分钟内有效`,
      });
      message.success('验证码已发送');
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const payload = {
        phone: values.phone,
        loginType,
      };
      if (loginType === 'sms') {
        payload.smsCode = values.smsCode;
      } else {
        payload.password = values.password;
      }
      const result = await memberApi.post('/api/user-auth/login', payload);
      setMemberToken(result.token, result.expiresAt);
      setCurrentUser(result.user || null);
      setActionResult({
        type: 'login',
        text: `登录成功，欢迎你，${result.user?.nickname || result.user?.phone || '用户'}。`,
      });
      setSmsPreview(null);
      message.success('登录成功');
      await loadCurrentUser();
    } catch (error) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await memberApi.post('/api/user-auth/logout', {});
    } catch (error) {}
    clearMemberToken();
    setCurrentUser(null);
    setCoupons([]);
    setPrizes([]);
    setActionResult({ type: 'logout', text: '已退出会员登录状态。' });
    message.success('已退出登录');
  };

  const runAction = async (url, successBuilder) => {
    setLoading(true);
    try {
      const result = await memberApi.post(url, {});
      await loadCurrentUser();
      const nextText = typeof successBuilder === 'function' ? successBuilder(result) : successBuilder;
      setActionResult({ type: 'action', text: nextText });
      message.success('操作成功');
      return result;
    } catch (error) {
      message.error(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const openUseCouponModal = (record) => {
    setUsingCoupon(record);
    useCouponForm.setFieldsValue({
      orderAmount: Math.max(Number(record?.coupon?.conditionAmount || 0), 99),
    });
  };

  const handleUseCoupon = async (values) => {
    if (!usingCoupon) return;
    setLoading(true);
    try {
      await memberApi.post('/api/user-actions/use-coupon', {
        claimId: usingCoupon._id,
        orderAmount: Number(values.orderAmount || 0),
      });
      setActionResult({
        type: 'use',
        text: `优惠券“${usingCoupon.coupon?.title || ''}”已成功使用。`,
      });
      setUsingCoupon(null);
      useCouponForm.resetFields();
      message.success('优惠券已使用');
      await loadCurrentUser();
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const couponStats = useMemo(() => ({
    total: coupons.length,
    unused: coupons.filter((item) => item.status === 'claimed').length,
    used: coupons.filter((item) => item.status === 'used').length,
    lucky: coupons.filter((item) => item.source === 'lucky_draw').length,
  }), [coupons]);

  const couponColumns = [
    {
      title: '优惠券',
      key: 'coupon',
      render: (_, record) => h(
        Space,
        { direction: 'vertical', size: 0 },
        h('span', { style: { fontWeight: 600 } }, record.coupon?.title || '-'),
        h('span', { style: { color: 'var(--mc-text-secondary)', fontSize: 12 } }, getRuleText(record.coupon))
      ),
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

  const renderLoginCard = () => h(
    Card,
    { bordered: false, className: 'member-card' },
    h(
      Space,
      { direction: 'vertical', size: 16, style: { width: '100%' } },
      h('div', null,
        h('div', { className: 'member-section-title' }, '用户登录'),
        h('div', { className: 'member-section-desc' }, '支持手机号 + 密码，或手机号 + 短信验证码两种方式登录')
      ),
      h(
        Form,
        {
          form,
          layout: 'vertical',
          onFinish: handleLogin,
        },
        h(Tabs, {
          activeKey: loginType,
          onChange: setLoginType,
          items: [
            { key: 'password', label: '密码登录' },
            { key: 'sms', label: '短信验证码登录' },
          ],
        }),
        h(Form.Item, { label: '手机号', name: 'phone', rules: [{ required: true, message: '请输入手机号' }] }, h(Input, { placeholder: '请输入手机号' })),
        loginType === 'password'
          ? h(Form.Item, { label: '密码', name: 'password', rules: [{ required: true, message: '请输入密码' }] }, h(Input.Password, { placeholder: '请输入密码' }))
          : h(
              Space,
              { direction: 'vertical', size: 12, style: { width: '100%' } },
              h(Form.Item, { label: '短信验证码', name: 'smsCode', rules: [{ required: true, message: '请输入验证码' }] }, h(Input, { placeholder: '请输入 6 位验证码' })),
              h(Button, { onClick: handleSendCode, loading }, '发送验证码'),
              smsPreview
                ? h('div', { className: 'member-highlight member-highlight-blue' }, `本地演示验证码：${smsPreview.code}`)
                : null
            ),
        h(Form.Item, { style: { marginBottom: 0 } }, h(Button, { type: 'primary', htmlType: 'submit', block: true, size: 'large', loading }, '登录会员中心'))
      ),
      actionResult && !currentUser
        ? h(Alert, { type: 'info', showIcon: true, message: actionResult.text })
        : null,
      h(Divider, { style: { margin: '8px 0' } }),
      h(
        Space,
        { direction: 'vertical', size: 12, style: { width: '100%' } },
        h('div', { className: 'member-section-title', style: { fontSize: 16 } }, '本地演示账号'),
        ...DEMO_ACCOUNTS.map((item) => h(
          'div',
          { className: 'member-demo-account', key: item.phone },
          h(Space, { direction: 'vertical', size: 2 },
            h('div', null, h('strong', null, item.nickname)),
            h('div', null, '手机号：', h('code', null, item.phone)),
            h('div', null, '密码：', h('code', null, item.password)),
            h(Button, {
              size: 'small',
              type: 'link',
              style: { paddingLeft: 0 },
              onClick: () => form.setFieldsValue({ phone: item.phone, password: item.password, smsCode: '' }),
            }, '填入表单')
          )
        ))
      )
    )
  );

  const renderUserPanel = () => h(
    React.Fragment,
    null,
    h('div', { className: 'member-stat-grid' },
      renderStatCard('我的优惠券', couponStats.total, '#1677ff', 'rgba(22,119,255,0.18)'),
      renderStatCard('待使用', couponStats.unused, '#52c41a', 'rgba(82,196,26,0.18)'),
      renderStatCard('已使用', couponStats.used, '#fa8c16', 'rgba(250,140,22,0.18)'),
      renderStatCard('大转盘获得', couponStats.lucky, '#722ed1', 'rgba(114,46,209,0.18)')
    ),
    h(
      Row,
      { gutter: [16, 16] },
      h(
        Col,
        { xs: 24, xl: 11 },
        h(
          Card,
          { bordered: false, className: 'member-card member-primary-card' },
          h(
            Space,
            { direction: 'vertical', size: 16, style: { width: '100%' } },
            h('div', null,
              h('div', { className: 'member-section-title' }, '我的资料'),
              h('div', { className: 'member-section-desc' }, '查看手机号、昵称、签到和默认密码等信息')
            ),
            h(Descriptions, {
              column: 1,
              items: [
                { key: 'phone', label: '手机号', children: currentUser?.phone || '-' },
                { key: 'nickname', label: '昵称', children: currentUser?.nickname || '-' },
                { key: 'gender', label: '性别', children: getGenderLabel(currentUser?.gender) },
                { key: 'age', label: '年龄', children: `${currentUser?.age || 0} 岁` },
                { key: 'password', label: '默认密码', children: h('span', { className: 'member-inline-code' }, currentUser?.defaultPassword || '-') },
                { key: 'streak', label: '连续签到', children: `${currentUser?.signInStreak || 0} 天` },
                { key: 'total', label: '累计签到', children: `${currentUser?.totalSignInDays || 0} 天` },
              ],
            }),
            h(
              Space,
              { wrap: true },
              h(Button, { type: 'primary', onClick: () => runAction('/api/user-actions/check-in', (result) => result?.alreadySigned ? '今天已经签到过了。' : `签到成功，已连续签到 ${result?.signInStreak || 1} 天。`), loading }, '今日签到'),
              h(Button, { onClick: () => runAction('/api/user-actions/claim-daily-coupon', (result) => `今日随机券领取成功：${result?.coupon?.title || '优惠券'}。`), loading }, '领取今日随机券'),
              h(Button, { onClick: () => runAction('/api/user-actions/lucky-draw', (result) => `大转盘抽奖成功：${result?.coupon?.title || '优惠券'}。`), loading }, '参与大转盘'),
              h(Button, { onClick: handleLogout }, '退出登录')
            ),
            actionResult
              ? h('div', { className: 'member-highlight member-highlight-green' }, actionResult.text)
              : h('div', { className: 'member-highlight member-highlight-blue' }, '登录后即可体验签到、领券和大转盘抽奖流程。')
          )
        )
      ),
      h(
        Col,
        { xs: 24, xl: 13 },
        h(
          Card,
          { bordered: false, className: 'member-card member-primary-card' },
          h(
            Space,
            { direction: 'vertical', size: 16, style: { width: '100%' } },
            h('div', null,
              h('div', { className: 'member-section-title' }, '今日奖池预览'),
              h('div', { className: 'member-section-desc' }, '奖池默认取前 10 张启用中的优惠券，单用户每天最多参与一次')
            ),
            prizes.length
              ? h('div', { className: 'member-prize-grid' },
                  ...prizes.map((item) => h(
                    'div',
                    { className: 'member-prize-item', key: item._id },
                    h('div', { className: 'member-prize-title' }, item.title),
                    h('div', { className: 'member-prize-desc' }, getRuleText(item)),
                    h(Space, { size: 8, style: { marginTop: 8 } },
                      h(Tag, { color: item.status === 'active' ? 'success' : 'default' }, item.status === 'active' ? '启用' : '停用'),
                      h(Tag, { color: 'blue' }, `已领 ${item.claimedCount || 0}`)
                    )
                  ))
                )
              : h(Empty, { className: 'member-empty', description: '登录后查看今日奖池' })
          )
        )
      )
    ),
    h(
      Card,
      { bordered: false, className: 'member-card' },
      h(
        Space,
        { direction: 'vertical', size: 16, style: { width: '100%' } },
        h('div', { className: 'member-coupon-header' },
          h('div', null,
            h('div', { className: 'member-section-title' }, '我的优惠券'),
            h('div', { className: 'member-section-desc' }, '查看领取记录、来源、过期时间，并可在满足门槛后直接使用')
          ),
          h(Button, { onClick: loadCurrentUser }, '刷新')
        ),
        h(Table, {
          rowKey: '_id',
          dataSource: coupons,
          columns: couponColumns,
          pagination: false,
          locale: { emptyText: '暂未领取优惠券' },
        })
      )
    )
  );

  return h(
    ConfigProvider,
    {
      theme: {
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 10,
          fontSize: 14,
        },
      },
    },
    h(
      'div',
      { className: 'member-shell' },
      h(
        'div',
        { className: 'member-page' },
        h(
          'section',
          { className: 'member-hero' },
          h('div', { className: 'member-hero-badge' }, 'Member Center'),
          h('div', { className: 'member-hero-title' }, '会员中心演示页'),
          h('div', { className: 'member-hero-desc' }, '这是独立的前台页面，直接走用户登录、签到、每日随机领券、大转盘和用券接口，方便你本地验证整条会员流程是否顺畅。'),
          h('div', { className: 'member-footer-links' },
            h(Space, { wrap: true, size: 16 },
              h('a', { href: './index.html', target: '_blank', rel: 'noreferrer' }, '打开后台管理'),
                h('a', { href: './member-center.html?phone=13800000001', target: '_blank', rel: 'noreferrer' }, '打开演示账号入口'),
              h(Button, {
                type: 'link',
                style: { color: '#fff', paddingInline: 0 },
                onClick: () => setDark(!dark),
              }, dark ? '切换亮色主题' : '切换暗色主题')
            )
          )
        ),
        h(
          'div',
          { className: 'member-grid' },
          renderLoginCard(),
          currentUser
            ? renderUserPanel()
            : h(
                Card,
                { bordered: false, className: 'member-card' },
                h(
                  Space,
                  { direction: 'vertical', size: 16, style: { width: '100%' } },
                  h('div', null,
                    h('div', { className: 'member-section-title' }, '登录后可体验'),
                    h('div', { className: 'member-section-desc' }, '用演示账号快速验证用户登录、领券、抽奖和用券的全链路')
                  ),
                  h('div', { className: 'member-highlight member-highlight-blue' }, '1. 选择左侧演示账号并登录。'),
                  h('div', { className: 'member-highlight member-highlight-green' }, '2. 点击“今日签到”“领取今日随机券”“参与大转盘”。'),
                  h('div', { className: 'member-highlight member-highlight-purple' }, '3. 在“我的优惠券”里选择一张待使用券，输入订单金额完成核销。'),
                  h('div', { className: 'member-highlight member-highlight-orange' }, '4. 如需验证码登录，先点发送验证码，页面会直接展示本地演示验证码。')
                )
              )
        ),
        h(
          Modal,
          {
            open: !!usingCoupon,
            title: usingCoupon ? `使用优惠券：${usingCoupon.coupon?.title || ''}` : '使用优惠券',
            onCancel: () => {
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
      )
    )
  );
}

export default MemberCenterPage;
