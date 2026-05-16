const { createElement: h, useEffect, useMemo, useState } = React;
const {
  Button, Card, Checkbox, Col, Descriptions, Modal, Row, Space, Table, Tag, Typography, message,
} = antd;
const { Text } = Typography;
const [{ api }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

function renderPermissionTags(permissions = []) {
  return h(
    Space,
    { wrap: true, size: 4 },
    ...permissions.map((permission) => h(Tag, { key: permission, color: 'processing' }, permission))
  );
}

function RolePermissionManager({ currentAdmin }) {
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [checkedPermissions, setCheckedPermissions] = useState([]);
  const canManage = useMemo(
    () => Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes('roles.manage'),
    [currentAdmin]
  );

  const loadData = async () => {
    try {
      const [roleList, permissionCatalog] = await Promise.all([
        api.get('/api/admin-roles'),
        api.get('/api/admin-roles/permissions'),
      ]);
      setRoles(roleList || []);
      setPermissionGroups(permissionCatalog.groups || []);
    } catch (error) {
      message.error('加载角色权限数据失败：' + error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    {
      title: '角色',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (_, record) => h(
        Space,
        { direction: 'vertical', size: 0 },
        h('span', { style: { fontWeight: 600 } }, record.name),
        h('span', { style: { color: 'var(--tcm-text-secondary)', fontSize: 12 } }, record.code)
      ),
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      width: 260,
      render: (value) => value || '-',
    },
    {
      title: '成员数',
      dataIndex: 'memberCount',
      key: 'memberCount',
      width: 100,
      render: (value) => h(Tag, { color: 'geekblue' }, value || 0),
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: renderPermissionTags,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => h(
        Button,
        {
          type: 'link',
          disabled: !canManage || !record.editable,
          onClick: () => {
            setEditingRole(record);
            setCheckedPermissions(record.permissions || []);
          },
        },
        '编辑权限'
      ),
    },
  ];

  return h(
    React.Fragment,
    null,
    h(
      Row,
      { gutter: [16, 16], style: { marginBottom: 16 } },
      ...roles.map((role) => h(
        Col,
        { xs: 24, md: 12, key: role.code },
        h(
          Card,
          { bordered: false, className: 'info-card' },
          h(Descriptions, {
            title: role.name,
            size: 'small',
            column: 1,
            items: [
              { key: 'code', label: '角色编码', children: role.code },
              { key: 'desc', label: '角色说明', children: role.description || '-' },
              { key: 'members', label: '成员数', children: String(role.memberCount || 0) },
              { key: 'editable', label: '是否可编辑', children: role.editable ? '是' : '否' },
            ],
          })
        )
      ))
    ),
    h(
      'div',
      { className: 'table-container' },
      h(Table, {
        rowKey: 'code',
        dataSource: roles,
        columns,
        pagination: false,
      })
    ),
    h(
      Modal,
      {
        open: !!editingRole,
        title: editingRole ? `编辑角色权限：${editingRole.name}` : '编辑角色权限',
        width: 760,
        onCancel: () => {
          setEditingRole(null);
          setCheckedPermissions([]);
        },
        onOk: async () => {
          try {
            await api.put(`/api/admin-roles/${editingRole.code}`, {
              permissions: checkedPermissions,
            });
            message.success('角色权限已更新');
            setEditingRole(null);
            setCheckedPermissions([]);
            loadData();
          } catch (error) {
            message.error('更新角色权限失败：' + error.message);
          }
        },
        okButtonProps: { disabled: !canManage || !editingRole?.editable },
        destroyOnClose: true,
      },
      h(
        Space,
        { direction: 'vertical', size: 16, style: { width: '100%' } },
        h(Text, { type: 'secondary' }, '建议保留“查看个人账号”和“修改密码”能力，避免普通用户无法自助维护账号。'),
        ...permissionGroups.map((group) => h(
          Card,
          { key: group.group, size: 'small', bordered: true },
          h('div', { style: { fontWeight: 600, marginBottom: 12 } }, group.group),
          h(
            Checkbox.Group,
            {
              value: checkedPermissions,
              onChange: (values) => setCheckedPermissions(values),
              style: { width: '100%' },
            },
            h(
              Row,
              { gutter: [12, 12] },
              ...group.permissions.map((permission) => h(
                Col,
                { span: 12, key: permission.key },
                h(
                  'div',
                  { className: 'permission-check-item' },
                  h(Checkbox, { value: permission.key }, permission.label),
                  h('div', { className: 'permission-desc' }, permission.description)
                )
              ))
            )
          )
        ))
      )
    )
  );
}

export default RolePermissionManager;
