const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: CouponManager } = await import(window.getModuleUrl('./js/components/CouponManager.js'));

function CouponsPage({ currentAdmin, navigate }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '优惠券管理'),
      h(Text, { type: 'secondary' }, '支持购物优惠券创建、发放、领取与使用记录查看，并可从列表快速跳转到记录页面')
    ),
    h(CouponManager, { currentAdmin, navigate })
  );
}

export default CouponsPage;

