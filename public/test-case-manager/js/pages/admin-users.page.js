const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: AdminUserManager } = await import(window.getModuleUrl('./js/components/AdminUserManager.js'));

function AdminUsersPage({ currentAdmin }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '管理员列表'),
      h(Text, { type: 'secondary' }, '管理后台管理员账号、状态、角色分配与密码重置')
    ),
    h(AdminUserManager, { currentAdmin })
  );
}

export default AdminUsersPage;
