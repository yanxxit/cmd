const { createElement: h, useEffect, useMemo, useState } = React;
const { Button, Card, Empty, Row, Col, Select, Space, Tag, message } = antd;
const [{ api }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

function renderLotteryStat(title, value, color, bg) {
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

function getRuleText(item) {
  if (!item) return '-';
  if (item.type === 'shipping') return '全场包邮';
  if (item.type === 'discount') return `满 ${item.conditionAmount || 0} 元打 ${item.benefitValue || 0} 折`;
  return `满 ${item.conditionAmount || 0} 减 ${item.benefitValue || 0}`;
}

function LotteryManager() {
  const [users, setUsers] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const prizeMap = useMemo(() => new Map(prizes.map((item) => [item._id, item])), [prizes]);

  const loadData = async () => {
    try {
      const [userList, prizeList] = await Promise.all([
        api.get('/api/admin-members'),
        api.get('/api/admin-coupons/prizes'),
      ]);
      setUsers(userList || []);
      setPrizes(prizeList || []);
      if (!selectedUserId && userList?.[0]?._id) {
        setSelectedUserId(userList[0]._id);
      }
    } catch (error) {
      message.error('加载大转盘数据失败：' + error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedPrize = lastResult?.couponId ? prizeMap.get(lastResult.couponId) : null;

  const handleDraw = async () => {
    if (!selectedUserId) {
      message.warning('请先选择抽奖用户');
      return;
    }
    setDrawing(true);
    try {
      const claim = await api.post('/api/admin-coupons/lucky-draw', { userId: selectedUserId });
      setLastResult(claim);
      message.success('大转盘抽奖完成');
    } catch (error) {
      message.error('抽奖失败：' + error.message);
    } finally {
      setDrawing(false);
    }
  };

  return h(
    React.Fragment,
    null,
    h(
      Row,
      { gutter: [16, 16], style: { marginBottom: 16 } },
      h(Col, { xs: 24, md: 12, lg: 8 }, renderLotteryStat('奖池数量', prizes.length, '#1677ff', 'rgba(22,119,255,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 8 }, renderLotteryStat('可抽用户', users.length, '#52c41a', 'rgba(82,196,26,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 8 }, renderLotteryStat('最近抽中', selectedPrize?.title || '暂无', '#722ed1', 'rgba(114,46,209,0.18)'))
    ),
    h(
      Card,
      { bordered: false, className: 'info-card', style: { marginBottom: 16 } },
      h(
        Space,
        { direction: 'vertical', size: 16, style: { width: '100%' } },
        h('div', { style: { fontSize: 16, fontWeight: 600 } }, '活动大转盘'),
        h('div', { style: { color: 'var(--tcm-text-secondary)' } }, '奖池默认使用系统内前 10 种启用中的优惠券，单个用户每日最多参与一次。'),
        h(
          Space,
          { wrap: true },
          h(Select, {
            showSearch: true,
            optionFilterProp: 'label',
            value: selectedUserId || undefined,
            style: { width: 320 },
            placeholder: '请选择抽奖用户',
            onChange: setSelectedUserId,
            options: users.map((item) => ({ label: `${item.nickname} (${item.phone})`, value: item._id })),
          }),
          h(Button, { type: 'primary', loading: drawing, onClick: handleDraw }, '开始抽奖')
        ),
        selectedPrize
          ? h(
              'div',
              { className: 'dashboard-highlight dashboard-highlight-purple' },
              `恭喜 ${users.find((item) => item._id === selectedUserId)?.nickname || '用户'} 抽中：${selectedPrize.title}，规则：${getRuleText(selectedPrize)}`
            )
          : h('div', { className: 'dashboard-highlight dashboard-highlight-blue' }, '选择用户后即可模拟抽奖流程')
      )
    ),
    prizes.length
      ? h(
          Row,
          { gutter: [16, 16] },
          ...prizes.map((item) => h(
            Col,
            { xs: 24, md: 12, lg: 8, xl: 6, key: item._id },
            h(
              Card,
              {
                bordered: false,
                className: 'info-card',
                style: selectedPrize?._id === item._id ? { border: '1px solid #722ed1', boxShadow: '0 0 0 2px rgba(114,46,209,0.12)' } : null,
              },
              h(
                Space,
                { direction: 'vertical', size: 12, style: { width: '100%' } },
                h(
                  Space,
                  { wrap: true },
                  h('div', { style: { fontSize: 16, fontWeight: 600 } }, item.title),
                  h(Tag, { color: item.status === 'active' ? 'success' : 'default' }, item.status === 'active' ? '启用' : '停用')
                ),
                h('div', { style: { color: 'var(--tcm-text-secondary)', minHeight: 40 } }, item.description || getRuleText(item)),
                h('div', { className: 'dashboard-meta-grid' },
                  h('div', { className: 'dashboard-meta-item' }, h('div', { className: 'dashboard-meta-label' }, '领取量'), h('div', { className: 'dashboard-meta-value' }, item.claimedCount || 0)),
                  h('div', { className: 'dashboard-meta-item' }, h('div', { className: 'dashboard-meta-label' }, '使用量'), h('div', { className: 'dashboard-meta-value' }, item.usedCount || 0))
                )
              )
            )
          ))
        )
      : h(Empty, { description: '暂无奖池数据' })
  );
}

export default LotteryManager;

