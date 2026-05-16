const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: CouponUsageRecordList } = await import(window.getModuleUrl('./js/components/CouponUsageRecordList.js'));

function CouponUsagesPage({ navigate, pagePayload }) {
  const subtitle = pagePayload?.couponTitle
    ? `查看“${pagePayload.couponTitle}”的使用记录和订单金额`
    : '查看所有优惠券的使用记录与消费数据';

  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '使用记录'),
      h(Text, { type: 'secondary' }, subtitle)
    ),
    h(CouponUsageRecordList, { navigate, pagePayload })
  );
}

export default CouponUsagesPage;

