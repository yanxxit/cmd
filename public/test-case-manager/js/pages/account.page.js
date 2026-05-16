const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: AccountSecurity } = await import(window.getModuleUrl('./js/components/AccountSecurity.js'));

function AccountPage({ currentAdmin, onPasswordChanged }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '账号安全'),
      h(Text, { type: 'secondary' }, '查看当前账号权限范围，维护登录密码与个人信息')
    ),
    h(AccountSecurity, { currentAdmin, onPasswordChanged })
  );
}

export default AccountPage;
