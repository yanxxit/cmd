const { createElement: h, useEffect, useMemo, useState } = React;
const {
  Alert, Button, Card, ConfigProvider, Empty, Form, Input, Modal, Space, Tabs, Tag, Typography, message,
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

const EMPTY_SEGMENT_COUNT = 2;
const WHEEL_COLORS = ['#1677ff', '#52c41a', '#722ed1', '#fa8c16', '#13c2c2', '#eb2f96'];
const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const DEFAULT_REWARD_DAYS = [3, 7, 14];

function getTodayKey() {
  return dayjs().format('YYYY-MM-DD');
}

function getRuleText(item) {
  if (!item) return '本次未中奖';
  if (item.type === 'shipping') return '全场包邮券';
  if (item.type === 'discount') return `满 ${item.conditionAmount || 0} 元打 ${item.benefitValue || 0} 折`;
  return `满 ${item.conditionAmount || 0} 减 ${item.benefitValue || 0}`;
}

function getSourceLabel(source) {
  if (source === 'daily_random') return '每日随机';
  if (source === 'lucky_draw') return '大转盘';
  if (source === 'manual_grant') return '后台发放';
  return source || '-';
}

function getInitialLoginParams() {
  const params = new URLSearchParams(window.location.search || '');
  const phone = params.get('phone') || '';
  const loginType = params.get('loginType') === 'sms' ? 'sms' : 'password';
  const preset = DEMO_ACCOUNTS.find((item) => item.phone === phone) || null;
  return {
    phone: phone || DEMO_ACCOUNTS[0].phone,
    password: preset?.password || (phone ? String(phone).slice(-6) : DEMO_ACCOUNTS[0].password),
    loginType,
  };
}

function buildWheelSegments(prizes = []) {
  const prizeSegments = (prizes || []).slice(0, 10).map((item, index) => ({
    key: item._id,
    label: item.title,
    type: 'coupon',
    couponId: item._id,
    color: WHEEL_COLORS[index % WHEEL_COLORS.length],
  }));
  const emptySegments = Array.from({ length: EMPTY_SEGMENT_COUNT }).map((_, index) => ({
    key: `empty-${index}`,
    label: '谢谢参与',
    type: 'empty',
    emptyIndex: index,
    color: index % 2 === 0 ? '#d9d9d9' : '#bfbfbf',
  }));
  const segments = [...prizeSegments, ...emptySegments];
  return segments.length ? segments : emptySegments;
}

function buildWheelBackground(segments = []) {
  if (!segments.length) return '#d9d9d9';
  const step = 360 / segments.length;
  return `conic-gradient(${segments.map((segment, index) => {
    const start = (index * step).toFixed(2);
    const end = ((index + 1) * step).toFixed(2);
    return `${segment.color} ${start}deg ${end}deg`;
  }).join(', ')})`;
}

function getWheelTargetIndex(result, segments = []) {
  if (!segments.length) return 0;
  if (result?.resultType === 'coupon' && result?.coupon?._id) {
    const couponIndex = segments.findIndex((segment) => segment.couponId === result.coupon._id);
    if (couponIndex >= 0) return couponIndex;
  }
  const emptySegments = segments
    .map((segment, index) => ({ segment, index }))
    .filter((item) => item.segment.type === 'empty');
  if (!emptySegments.length) return 0;
  const hit = emptySegments.find((item) => item.segment.emptyIndex === Number(result?.emptySlotIndex || 0));
  return hit ? hit.index : emptySegments[0].index;
}

function buildMemberH5Url(phone = '') {
  const url = new URL('./member-h5.html', window.location.href);
  if (phone) url.searchParams.set('phone', phone);
  return `${url.pathname}${url.search}`;
}

function renderSummaryCard(title, value, extra, tone) {
  return h(
    'div',
    { className: `member-h5-summary-card tone-${tone}` },
    h('div', { className: 'member-h5-summary-title' }, title),
    h('div', { className: 'member-h5-summary-value' }, value),
    h('div', { className: 'member-h5-summary-extra' }, extra)
  );
}

function renderPrizeLegend(segment) {
  return h(
    'div',
    { className: 'member-h5-legend-item', key: segment.key },
    h('span', { className: 'member-h5-legend-dot', style: { background: segment.color } }),
    h('span', { className: 'member-h5-legend-text' }, segment.label)
  );
}

function buildCalendarCells(monthValue, signInMap) {
  const start = monthValue.startOf('month');
  const startWeekday = (start.day() + 6) % 7;
  const startDate = start.subtract(startWeekday, 'day');
  return Array.from({ length: 42 }).map((_, index) => {
    const date = startDate.add(index, 'day');
    const dayKey = date.format('YYYY-MM-DD');
    return {
      key: dayKey,
      date,
      dayKey,
      dayNumber: date.date(),
      inMonth: date.month() === monthValue.month(),
      isToday: dayKey === getTodayKey(),
      isSigned: signInMap.has(dayKey),
    };
  });
}

function buildDefaultRewardProgress(streak = 0) {
  const rewardDays = DEFAULT_REWARD_DAYS.slice();
  const currentStreak = Math.max(0, Number(streak || 0));
  let prevDay = 0;
  let nextTargetDay = rewardDays[rewardDays.length - 1];
  let progressPercent = 100;
  let remainDays = 0;
  for (const day of rewardDays) {
    if (currentStreak < day) {
      nextTargetDay = day;
      const span = Math.max(1, day - prevDay);
      progressPercent = Math.min(100, Math.round((Math.max(0, currentStreak - prevDay) / span) * 100));
      remainDays = day - currentStreak;
      break;
    }
    prevDay = day;
  }
  const completed = currentStreak >= rewardDays[rewardDays.length - 1];
  return {
    rewardDays,
    currentStreak,
    cycleStartKey: '',
    completed,
    nextTargetDay,
    progressPercent: completed ? 100 : progressPercent,
    remainDays: completed ? 0 : remainDays,
    stages: rewardDays.map((day) => ({
      day,
      rewardType: 'lottery_chance',
      rewardCount: 1,
      rewardLabel: '额外 1 次抽奖机会',
      status: currentStreak >= day ? 'claimed' : day === nextTargetDay ? 'current' : 'locked',
      reached: currentStreak >= day,
      claimedAt: '',
      cycleStartKey: '',
    })),
  };
}

function MemberH5Page() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [loginType, setLoginType] = useState('password');
  const [currentUser, setCurrentUser] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [drawRecords, setDrawRecords] = useState([]);
  const [signIns, setSignIns] = useState([]);
  const [rewardProgress, setRewardProgress] = useState(() => buildDefaultRewardProgress(0));
  const [smsPreview, setSmsPreview] = useState(null);
  const [notice, setNotice] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [activeTab, setActiveTab] = useState('draw');
  const [calendarMonth, setCalendarMonth] = useState(() => dayjs().startOf('month'));
  const [rewardModalOpen, setRewardModalOpen] = useState(false);

  const wheelSegments = useMemo(() => buildWheelSegments(prizes), [prizes]);
  const wheelBackground = useMemo(() => buildWheelBackground(wheelSegments), [wheelSegments]);
  const todaySigned = currentUser?.lastSignInDate === getTodayKey();
  const signInMap = useMemo(() => new Map((signIns || []).map((item) => [item.dayKey, item])), [signIns]);
  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth, signInMap), [calendarMonth, signInMap]);
  const monthSignedCount = useMemo(
    () => calendarCells.filter((item) => item.inMonth && item.isSigned).length,
    [calendarCells]
  );

  const loadDashboard = async () => {
    if (!getMemberToken()) {
      setCurrentUser(null);
      setPrizes([]);
      setCoupons([]);
      setDrawRecords([]);
      setSignIns([]);
      setRewardProgress(buildDefaultRewardProgress(0));
      return;
    }
    setLoading(true);
    try {
      const [user, couponList, prizeList, records, signInList, rewardState] = await Promise.all([
        memberApi.get('/api/user-auth/me'),
        memberApi.get('/api/user-actions/coupons'),
        memberApi.get('/api/user-actions/prizes'),
        memberApi.get('/api/user-actions/draw-records'),
        memberApi.get('/api/user-actions/sign-ins'),
        memberApi.get('/api/user-actions/sign-in-rewards'),
      ]);
      setCurrentUser(user || null);
      setCoupons(couponList || []);
      setPrizes(prizeList || []);
      setDrawRecords(records || []);
      setSignIns(signInList || []);
      setRewardProgress(rewardState || buildDefaultRewardProgress(user?.signInStreak || 0));
    } catch (error) {
      clearMemberToken();
      setCurrentUser(null);
      setCoupons([]);
      setPrizes([]);
      setDrawRecords([]);
      setSignIns([]);
      setRewardProgress(buildDefaultRewardProgress(0));
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
      smsCode: '',
    });
    if (initial.phone) {
      setNotice({
        type: 'info',
        text: `已预填手机号 ${initial.phone}，可直接登录参与签到与抽奖。`,
      });
    }
    loadDashboard();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      setCoupons([]);
      setDrawRecords([]);
      setSignIns([]);
      setRewardProgress(buildDefaultRewardProgress(0));
      message.warning('登录状态已失效，请重新登录');
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
      setNotice({
        type: 'success',
        text: `验证码已生成，本地演示验证码：${result.code}。`,
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
      setNotice({
        type: 'success',
        text: `登录成功，欢迎回来，${result.user?.nickname || result.user?.phone || '用户'}。`,
      });
      setActiveTab('draw');
      setSmsPreview(null);
      message.success('登录成功');
      await loadDashboard();
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
    setDrawRecords([]);
    setSignIns([]);
    setRewardProgress(buildDefaultRewardProgress(0));
    setNotice({ type: 'info', text: '已退出登录，你可以切换其他用户重新体验。' });
    message.success('已退出登录');
  };

  const runAction = async (url, successBuilder) => {
    setLoading(true);
    try {
      const result = await memberApi.post(url, {});
      const nextText = typeof successBuilder === 'function' ? successBuilder(result) : successBuilder;
      setNotice({ type: 'success', text: nextText });
      if (result?.user) {
        setCurrentUser(result.user);
      }
      if (result?.rewardProgress) {
        setRewardProgress(result.rewardProgress);
      }
      message.success('操作成功');
      await loadDashboard();
      return result;
    } catch (error) {
      message.error(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleLuckyDraw = async () => {
    if (drawing) return;
    setDrawing(true);
    try {
      const result = await memberApi.post('/api/user-actions/lucky-draw', {});
      const targetIndex = getWheelTargetIndex(result, wheelSegments);
      const segmentAngle = 360 / wheelSegments.length;
      const targetAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2);
      setWheelRotation((prev) => {
        const normalized = ((prev % 360) + 360) % 360;
        const delta = (targetAngle - normalized + 360) % 360;
        return prev + 2160 + delta;
      });
      setNotice({
        type: result.resultType === 'coupon' ? 'success' : 'info',
        text: result.resultType === 'coupon'
          ? `抽奖成功，获得“${result.coupon?.title || '优惠券'}”。`
          : '本次未中奖，但抽奖记录已保存，下次继续加油。',
      });
      setTimeout(async () => {
        if (result?.user) {
          setCurrentUser(result.user);
        }
        setActiveTab('records');
        await loadDashboard();
        setDrawing(false);
      }, 4200);
    } catch (error) {
      setDrawing(false);
      message.error(error.message);
    }
  };

  const renderLogin = () => h(
    React.Fragment,
    null,
    h('section', { className: 'member-h5-hero' },
      h('div', { className: 'member-h5-badge' }, 'H5 用户登录页'),
      h(Title, { level: 2, className: 'member-h5-title' }, '手机号登录后，立即签到抽奖'),
      h('div', { className: 'member-h5-desc' }, '支持手机号 + 密码，或手机号 + 短信验证码登录。签到成功可获得 1 次抽奖机会，机会可累计，点击大转盘会消费 1 次。'),
      h('div', { className: 'member-h5-links' },
        h('a', { href: './index.html', target: '_blank', rel: 'noreferrer' }, '打开后台'),
        h('span', null, '·'),
        h('a', { href: buildMemberH5Url(DEMO_ACCOUNTS[0].phone), target: '_blank', rel: 'noreferrer' }, '演示用户入口')
      )
    ),
    h(
      Card,
      { bordered: false, className: 'member-h5-card member-h5-login-card' },
      h(
        Space,
        { direction: 'vertical', size: 18, style: { width: '100%' } },
        h('div', null,
          h('div', { className: 'member-h5-section-title' }, '用户登录'),
          h('div', { className: 'member-h5-section-desc' }, '登录成功后自动进入签到与大转盘页面')
        ),
        notice ? h(Alert, { showIcon: true, type: notice.type || 'info', message: notice.text }) : null,
        h(
          Form,
          { form, layout: 'vertical', onFinish: handleLogin },
          h(Tabs, {
            activeKey: loginType,
            onChange: setLoginType,
            items: [
              { key: 'password', label: '密码登录' },
              { key: 'sms', label: '短信登录' },
            ],
          }),
          h(Form.Item, { label: '手机号', name: 'phone', rules: [{ required: true, message: '请输入手机号' }] }, h(Input, { placeholder: '请输入手机号' })),
          loginType === 'password'
            ? h(Form.Item, { label: '密码', name: 'password', rules: [{ required: true, message: '请输入密码' }] }, h(Input.Password, { placeholder: '请输入密码' }))
            : h(
                React.Fragment,
                null,
                h(Form.Item, { label: '短信验证码', name: 'smsCode', rules: [{ required: true, message: '请输入验证码' }] }, h(Input, { placeholder: '请输入 6 位验证码' })),
                h(Button, { block: true, onClick: handleSendCode, loading }, '发送验证码')
              ),
          smsPreview ? h('div', { className: 'member-h5-inline-tip' }, `本地演示验证码：${smsPreview.code}`) : null,
          h(Form.Item, { style: { marginBottom: 0, marginTop: 18 } }, h(Button, { type: 'primary', htmlType: 'submit', block: true, size: 'large', loading }, '登录并进入签到页'))
        ),
        h('div', { className: 'member-h5-demo-list' },
          ...DEMO_ACCOUNTS.map((item) => h(
            'button',
            {
              type: 'button',
              key: item.phone,
              className: 'member-h5-demo-item',
              onClick: () => {
                form.setFieldsValue({ phone: item.phone, password: item.password, smsCode: '' });
                setLoginType('password');
              },
            },
            h('div', { className: 'member-h5-demo-name' }, item.nickname),
            h('div', { className: 'member-h5-demo-meta' }, `手机号 ${item.phone}`),
            h('div', { className: 'member-h5-demo-meta' }, `密码 ${item.password}`)
          ))
        )
      )
    ),
    h(
      Card,
      { bordered: false, className: 'member-h5-card' },
      h(
        'div',
        { className: 'member-h5-calendar-wrap' },
        h(
          'div',
          {
            className: 'member-h5-streak-card',
            role: 'button',
            tabIndex: 0,
            onClick: () => setRewardModalOpen(true),
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setRewardModalOpen(true);
              }
            },
          },
          h('div', { className: 'member-h5-streak-header' },
            h('div', null,
              h('div', { className: 'member-h5-section-title' }, '连续签到奖励进度'),
              h('div', { className: 'member-h5-section-desc' }, rewardProgress.completed
                ? `已完成 ${rewardProgress.nextTargetDay || 0} 天阶段目标，继续保持签到节奏`
                : `距离 ${rewardProgress.nextTargetDay || '-'} 天阶段还差 ${rewardProgress.remainDays || 0} 天，点击查看奖励详情`)
            ),
            h('div', { className: 'member-h5-streak-badge' }, `连续 ${currentUser?.signInStreak || 0} 天`)
          ),
          h('div', { className: 'member-h5-streak-progress-track' },
            h('div', {
              className: 'member-h5-streak-progress-bar',
              style: { width: `${rewardProgress.progressPercent || 0}%` },
            })
          ),
          h('div', { className: 'member-h5-streak-step-list' },
            ...(rewardProgress.stages || []).map((step) => {
              const reached = step.status === 'claimed';
              const active = step.status === 'current';
              return h(
                'div',
                {
                  key: step.day,
                  className: `member-h5-streak-step${reached ? ' is-reached' : ''}${active ? ' is-active' : ''}`,
                },
                h('div', { className: 'member-h5-streak-step-day' }, `${step.day} 天`),
                h('div', { className: 'member-h5-streak-step-label' }, step.rewardLabel || '额外 1 次抽奖机会'),
                h('div', { className: 'member-h5-streak-step-desc' }, step.status === 'claimed'
                  ? `已领取 ${step.claimedAt ? dayjs(step.claimedAt).format('MM-DD HH:mm') : ''}`
                  : step.status === 'current'
                    ? '当前进行中阶段'
                    : '继续签到可领取')
              );
            })
          )
        ),
        h(
          'div',
          { className: 'member-h5-calendar-header' },
          h('div', null,
            h('div', { className: 'member-h5-section-title' }, '签到日历'),
            h('div', { className: 'member-h5-section-desc' }, '高亮已签到日期，帮助你跟踪连续签到节奏')
          ),
          h(
            Space,
            { size: 8 },
            h(Button, {
              size: 'small',
              onClick: () => setCalendarMonth((prev) => prev.subtract(1, 'month').startOf('month')),
            }, '上月'),
            h('span', { className: 'member-h5-calendar-title' }, calendarMonth.format('YYYY 年 MM 月')),
            h(Button, {
              size: 'small',
              onClick: () => setCalendarMonth((prev) => prev.add(1, 'month').startOf('month')),
            }, '下月')
          )
        ),
        h('div', { className: 'member-h5-calendar-summary' },
          h('div', { className: 'member-h5-calendar-summary-item' }, `本月已签 ${monthSignedCount} 天`),
          h('div', { className: 'member-h5-calendar-summary-item' }, `累计已签 ${currentUser?.totalSignInDays || 0} 天`),
          h('div', { className: 'member-h5-calendar-summary-item' }, todaySigned ? '今天已签到' : '今天待签到')
        ),
        h('div', { className: 'member-h5-calendar-week' },
          ...WEEK_LABELS.map((label) => h('div', { className: 'member-h5-calendar-weekday', key: label }, label))
        ),
        h('div', { className: 'member-h5-calendar-grid' },
          ...calendarCells.map((cell) => h(
            'div',
            {
              key: cell.key,
              className: `member-h5-calendar-cell${cell.inMonth ? '' : ' is-outside'}${cell.isToday ? ' is-today' : ''}${cell.isSigned ? ' is-signed' : ''}`,
            },
            h('div', { className: 'member-h5-calendar-day' }, cell.dayNumber),
            cell.isSigned ? h('div', { className: 'member-h5-calendar-mark' }, '已签') : null
          ))
        )
      )
    )
  );

  const renderDrawTab = () => h(
    React.Fragment,
    null,
    h('div', { className: 'member-h5-summary-grid' },
      renderSummaryCard('抽奖机会', currentUser?.lotteryChanceBalance || 0, '签到后 +1，可累计', 'blue'),
      renderSummaryCard('连续签到', `${currentUser?.signInStreak || 0} 天`, todaySigned ? '今天已签到' : '今天未签到', 'green'),
      renderSummaryCard('累计抽奖', currentUser?.totalLotteryDraws || 0, '每抽一次消耗 1 次机会', 'purple')
    ),
    notice ? h(Alert, { showIcon: true, type: notice.type || 'info', message: notice.text, className: 'member-h5-alert' }) : null,
    h(
      Card,
      { bordered: false, className: 'member-h5-card' },
      h('div', { className: 'member-h5-checkin-box' },
        h('div', null,
          h('div', { className: 'member-h5-section-title' }, '签到领抽奖机会'),
          h('div', { className: 'member-h5-section-desc' }, '每次签到可获得 1 次抽奖机会，机会可累计保存')
        ),
        h(
          Space,
          { wrap: true, size: 10 },
          h(Button, {
            type: 'primary',
            onClick: () => runAction('/api/user-actions/check-in', (result) => {
              if (result?.alreadySigned) return '今天已经签到过了，抽奖机会余额已保留。';
              if (result?.streakRewardChanceGranted > 0) {
                return `签到成功，基础抽奖机会 +1，连续签到奖励额外 +${result.streakRewardChanceGranted}。`;
              }
              return `签到成功，抽奖机会 +${result?.chanceGranted || 1}。`;
            }),
            loading,
          }, todaySigned ? '今日已签到' : '立即签到'),
          h(Button, {
            onClick: () => runAction('/api/user-actions/claim-daily-coupon', (result) => `随机领券成功：${result?.coupon?.title || '优惠券'}。`),
            loading,
          }, '今日随机领券'),
          h(Button, { onClick: handleLogout }, '退出登录')
        )
      )
    ),
    h(
      Card,
      { bordered: false, className: 'member-h5-card' },
      h('div', { className: 'member-h5-wheel-wrap' },
        h('div', { className: 'member-h5-wheel-panel' },
          h('div', { className: 'member-h5-wheel-pointer' }),
          h('div', { className: 'member-h5-wheel-shell' },
            h('div', {
              className: `member-h5-wheel${drawing ? ' is-drawing' : ''}`,
              style: {
                transform: `rotate(${wheelRotation}deg)`,
                background: wheelBackground,
              },
            },
            ...wheelSegments.map((segment, index) => {
              const angle = (360 / wheelSegments.length) * index + (180 / wheelSegments.length);
              return h(
                'div',
                {
                  key: segment.key,
                  className: 'member-h5-wheel-label',
                  style: {
                    transform: `rotate(${angle}deg) translateY(-41%)`,
                  },
                },
                h('span', null, segment.label)
              );
            }),
            h(
              'button',
              {
                type: 'button',
                className: 'member-h5-wheel-button',
                disabled: drawing || Number(currentUser?.lotteryChanceBalance || 0) <= 0,
                onClick: handleLuckyDraw,
              },
              drawing ? '抽奖中' : '开始抽奖'
            ))
          ),
          h('div', { className: 'member-h5-wheel-hint' }, `当前剩余 ${currentUser?.lotteryChanceBalance || 0} 次抽奖机会`)
        ),
        h('div', { className: 'member-h5-legend' }, ...wheelSegments.map(renderPrizeLegend))
      )
    )
  );

  const renderClaimList = () => {
    if (!coupons.length) {
      return h(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: '暂无领取记录' });
    }
    return h(
      'div',
      { className: 'member-h5-record-list' },
      ...coupons.map((item) => h(
        'div',
        { className: 'member-h5-record-item', key: item._id },
        h('div', { className: 'member-h5-record-main' },
          h('div', { className: 'member-h5-record-title' }, item.coupon?.title || '优惠券'),
          h('div', { className: 'member-h5-record-desc' }, getRuleText(item.coupon))
        ),
        h('div', { className: 'member-h5-record-side' },
          h(Tag, { color: item.status === 'used' ? 'processing' : 'success' }, item.status === 'used' ? '已使用' : '待使用'),
          h(Tag, { color: item.source === 'lucky_draw' ? 'purple' : item.source === 'daily_random' ? 'blue' : 'default' }, getSourceLabel(item.source))
        ),
        h('div', { className: 'member-h5-record-time' }, `领取于 ${item.claimedAt ? dayjs(item.claimedAt).format('MM-DD HH:mm') : '-'}`)
      ))
    );
  };

  const renderDrawRecords = () => {
    if (!drawRecords.length) {
      return h(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: '还没有抽奖记录' });
    }
    return h(
      'div',
      { className: 'member-h5-record-list' },
      ...drawRecords.map((item) => h(
        'div',
        { className: 'member-h5-record-item', key: item._id },
        h('div', { className: 'member-h5-record-main' },
          h('div', { className: 'member-h5-record-title' }, item.resultType === 'coupon' ? (item.coupon?.title || '中奖优惠券') : '谢谢参与'),
          h('div', { className: 'member-h5-record-desc' }, item.resultType === 'coupon' ? getRuleText(item.coupon) : '本次未抽中优惠券，已消耗 1 次抽奖机会')
        ),
        h('div', { className: 'member-h5-record-side' },
          h(Tag, { color: item.resultType === 'coupon' ? 'success' : 'default' }, item.resultType === 'coupon' ? '已中奖' : '空奖')
        ),
        h('div', { className: 'member-h5-record-time' }, `抽奖时间 ${item.drawAt ? dayjs(item.drawAt).format('MM-DD HH:mm') : '-'}`)
      ))
    );
  };

  const renderLoggedIn = () => h(
    React.Fragment,
    null,
    h('section', { className: 'member-h5-user-hero' },
      h('div', { className: 'member-h5-user-badge' }, '已登录'),
      h('div', { className: 'member-h5-user-title' }, currentUser?.nickname || currentUser?.phone || '用户'),
      h('div', { className: 'member-h5-user-meta' }, `${currentUser?.phone || '-'} · 默认密码 ${currentUser?.defaultPassword || '-'}`)
    ),
    h(Tabs, {
      activeKey: activeTab,
      onChange: setActiveTab,
      className: 'member-h5-tabs',
      items: [
        { key: 'draw', label: '签到抽奖', children: renderDrawTab() },
        { key: 'claims', label: `领取记录 (${coupons.length})`, children: renderClaimList() },
        { key: 'records', label: `抽奖记录 (${drawRecords.length})`, children: renderDrawRecords() },
      ],
    })
  );

  return h(
    ConfigProvider,
    {
      theme: {
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 14,
          fontSize: 14,
        },
      },
    },
    h(
      'div',
      { className: 'member-h5-shell' },
      loading && !currentUser
        ? h('div', { className: 'member-h5-loading' }, '加载中...')
        : currentUser
          ? renderLoggedIn()
          : renderLogin()
    ),
    h(
      Modal,
      {
        open: rewardModalOpen,
        title: '连续签到奖励详情',
        footer: null,
        onCancel: () => setRewardModalOpen(false),
      },
      h(
        'div',
        { className: 'member-h5-reward-modal' },
        h('div', { className: 'member-h5-reward-modal-summary' },
          h('div', null, `当前连续签到 ${rewardProgress.currentStreak || 0} 天`),
          h('div', null, rewardProgress.completed
            ? '当前已完成最高阶段奖励'
            : `下一阶段：${rewardProgress.nextTargetDay || '-'} 天，还差 ${rewardProgress.remainDays || 0} 天`)
        ),
        ...(rewardProgress.stages || []).map((stage) => h(
          'div',
          {
            key: stage.day,
            className: `member-h5-reward-modal-item status-${stage.status || 'locked'}`,
          },
          h('div', { className: 'member-h5-reward-modal-head' },
            h('div', { className: 'member-h5-reward-modal-day' }, `连续 ${stage.day} 天`),
            h(Tag, { color: stage.status === 'claimed' ? 'success' : stage.status === 'current' ? 'processing' : 'default' },
              stage.status === 'claimed' ? '已领取' : stage.status === 'current' ? '进行中' : '未达成'
            )
          ),
          h('div', { className: 'member-h5-reward-modal-label' }, stage.rewardLabel || '额外 1 次抽奖机会'),
          h('div', { className: 'member-h5-reward-modal-desc' },
            stage.status === 'claimed'
              ? `领取时间：${stage.claimedAt ? dayjs(stage.claimedAt).format('YYYY-MM-DD HH:mm') : '-'}`
              : stage.status === 'current'
                ? `再签到 ${Math.max(0, stage.day - Number(rewardProgress.currentStreak || 0))} 天即可自动发放`
                : '未达到领取条件'
          )
        ))
      )
    )
  );
}

export default MemberH5Page;
