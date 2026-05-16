const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: LotteryManager } = await import(window.getModuleUrl('./js/components/LotteryManager.js'));

function LotteryPage() {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '活动大转盘'),
      h(Text, { type: 'secondary' }, '奖池默认采用系统内 10 种优惠券，可选择用户进行每日一次的大转盘抽奖模拟')
    ),
    h(LotteryManager)
  );
}

export default LotteryPage;

