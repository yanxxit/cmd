const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: MemberUserManager } = await import(window.getModuleUrl('./js/components/MemberUserManager.js'));

function MembersPage({ currentAdmin }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '用户管理'),
      h(Text, { type: 'secondary' }, '管理用户手机号、昵称、性别和年龄，并在操作台中体验登录、签到、领券和使用优惠券流程')
    ),
    h(MemberUserManager, { currentAdmin })
  );
}

export default MembersPage;

