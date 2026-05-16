const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: RolePermissionManager } = await import(window.getModuleUrl('./js/components/RolePermissionManager.js'));

function RolesPage({ currentAdmin }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '角色与权限'),
      h(Text, { type: 'secondary' }, '查看不同角色的权限边界，并按需调整可编辑角色的权限配置')
    ),
    h(RolePermissionManager, { currentAdmin })
  );
}

export default RolesPage;
