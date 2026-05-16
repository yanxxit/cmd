const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: CouponClaimRecordList } = await import(window.getModuleUrl('./js/components/CouponClaimRecordList.js'));

function CouponClaimsPage({ navigate, pagePayload }) {
  const subtitle = pagePayload?.couponTitle
    ? `查看“${pagePayload.couponTitle}”的领取明细，支持区分手动发放、每日随机和大转盘来源`
    : '查看所有优惠券的领取记录与状态流转';

  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '领取记录'),
      h(Text, { type: 'secondary' }, subtitle)
    ),
    h(CouponClaimRecordList, { navigate, pagePayload })
  );
}

export default CouponClaimsPage;

