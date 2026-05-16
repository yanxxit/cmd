const { createElement: h, useEffect, useMemo, useState } = React;
const {
  Button, Col, Form, Input, Modal, Popconfirm, Row, Select, Space,
  Switch, Table, Tag, message,
} = antd;
const { Search } = Input;
const [{ api }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

function renderRoleTags(roleCodes = []) {
  return h(
    Space,
    { wrap: true, size: 4 },
    ...roleCodes.map((code) => h(Tag, { key: code, color: code === 'super_admin' ? 'volcano' : 'blue' }, code === 'super_admin' ? '超级管理员' : '普通用户'))
  );
}

function AdminUserManager({ currentAdmin }) {
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [status, setStatus] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const canManage = useMemo(
    () => Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes('admins.manage'),
    [currentAdmin]
  );

  const loadRoles = async () => {
    try {
      const roleList = await api.get('/api/admin-roles');
      setRoles(roleList || []);
    } catch (error) {
      message.error('加载角色列表失败：' + error.message);
    }
  };

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (keyword) query.set('keyword', keyword);
      if (roleCode) query.set('roleCode', roleCode);
      if (status) query.set('status', status);
      const list = await api.get(`/api/admin-users?${query.toString()}`);
      setAdmins(list || []);
    } catch (error) {
      message.error('加载管理员列表失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [keyword, roleCode, status]);

  const openCreateModal = () => {
    setEditingAdmin(null);
    form.resetFields();
    form.setFieldsValue({
      status: true,
      roleCodes: ['user'],
    });
    setShowEditModal(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    form.setFieldsValue({
      username: admin.username,
      displayName: admin.displayName,
      status: admin.status === 'active',
      roleCodes: admin.roleCodes,
      password: '',
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        username: values.username,
        displayName: values.displayName,
        roleCodes: values.roleCodes,
        status: values.status ? 'active' : 'disabled',
      };
      if (!editingAdmin) {
        payload.password = values.password;
        await api.post('/api/admin-users', payload);
        message.success('管理员创建成功');
      } else {
        await api.put(`/api/admin-users/${editingAdmin._id}`, payload);
        message.success('管理员信息已更新');
      }
      setShowEditModal(false);
      form.resetFields();
      loadAdmins();
    } catch (error) {
      message.error('保存失败：' + error.message);
    }
  };

  const handleDelete = async (admin) => {
    try {
      await api.delete(`/api/admin-users/${admin._id}`);
      message.success('管理员已删除');
      loadAdmins();
    } catch (error) {
      message.error('删除失败：' + error.message);
    }
  };

  const handleResetPassword = async (values) => {
    try {
      await api.post(`/api/admin-users/${resetTarget._id}/reset-password`, values);
      message.success('密码已重置');
      setShowPasswordModal(false);
      passwordForm.resetFields();
      setResetTarget(null);
    } catch (error) {
      message.error('重置密码失败：' + error.message);
    }
  };

  const columns = [
    {
      title: '管理员',
      dataIndex: 'displayName',
      key: 'displayName',
      width: 200,
      render: (_, record) => h(
        Space,
        { direction: 'vertical', size: 0 },
        h('span', { style: { fontWeight: 600 } }, record.displayName),
        h('span', { style: { color: 'var(--tcm-text-secondary)', fontSize: 12 } }, record.username)
      ),
    },
    {
      title: '角色',
      dataIndex: 'roleCodes',
      key: 'roleCodes',
      width: 220,
      render: renderRoleTags,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value) => h(Tag, { color: value === 'active' ? 'success' : 'default' }, value === 'active' ? '启用' : '停用'),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 170,
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_, record) => h(
        Space,
        null,
        h(Button, { type: 'link', size: 'small', disabled: !canManage, onClick: () => openEditModal(record) }, '编辑'),
        h(Button, {
          type: 'link',
          size: 'small',
          disabled: !canManage,
          onClick: () => {
            setResetTarget(record);
            passwordForm.resetFields();
            setShowPasswordModal(true);
          },
        }, '重置密码'),
        h(
          Popconfirm,
          {
            title: '确定删除该管理员吗？',
            okText: '确定',
            cancelText: '取消',
            disabled: !canManage,
            onConfirm: () => handleDelete(record),
          },
          h(Button, { type: 'link', size: 'small', danger: true, disabled: !canManage || record._id === currentAdmin?._id }, '删除')
        )
      ),
    },
  ];

  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'filter-section' },
      h(
        Row,
        { gutter: 16 },
        h(Col, { flex: '280px' }, h(Search, {
          placeholder: '搜索用户名或姓名',
          value: keyword,
          onChange: (e) => setKeyword(e.target.value),
          allowClear: true,
        })),
        h(
          Col,
          { flex: '220px' },
          h(
            Select,
            {
              placeholder: '按角色筛选',
              value: roleCode || undefined,
              onChange: (value) => setRoleCode(value || ''),
              allowClear: true,
              style: { width: '100%' },
            },
            ...roles.map((role) => h(Select.Option, { key: role.code, value: role.code }, role.name))
          )
        ),
        h(
          Col,
          { flex: '180px' },
          h(
            Select,
            {
              placeholder: '按状态筛选',
              value: status || undefined,
              onChange: (value) => setStatus(value || ''),
              allowClear: true,
              style: { width: '100%' },
            },
            h(Select.Option, { value: 'active' }, '启用'),
            h(Select.Option, { value: 'disabled' }, '停用')
          )
        ),
        h(
          Col,
          { flex: 'auto', style: { textAlign: 'right' } },
          h(Button, { type: 'primary', disabled: !canManage, onClick: openCreateModal }, '新增管理员')
        )
      )
    ),
    h(
      'div',
      { className: 'table-container' },
      h(Table, {
        rowKey: '_id',
        loading,
        dataSource: admins,
        columns,
        pagination: false,
      })
    ),
    h(
      Modal,
      {
        open: showEditModal,
        title: editingAdmin ? '编辑管理员' : '新增管理员',
        onCancel: () => {
          setShowEditModal(false);
          setEditingAdmin(null);
          form.resetFields();
        },
        onOk: () => form.submit(),
        okText: editingAdmin ? '保存' : '创建',
        destroyOnClose: true,
      },
      h(
        Form,
        {
          form,
          layout: 'vertical',
          onFinish: handleSubmit,
        },
        h(Form.Item, { label: '用户名', name: 'username', rules: [{ required: true, message: '请输入用户名' }] }, h(Input, { placeholder: '例如：alice' })),
        h(Form.Item, { label: '姓名', name: 'displayName', rules: [{ required: true, message: '请输入姓名' }] }, h(Input, { placeholder: '例如：张三' })),
        !editingAdmin
          ? h(Form.Item, { label: '初始密码', name: 'password', rules: [{ required: true, message: '请输入初始密码' }, { min: 6, message: '密码至少 6 位' }] }, h(Input.Password, { placeholder: '请输入初始密码' }))
          : null,
        h(
          Form.Item,
          {
            label: '角色',
            name: 'roleCodes',
            rules: [{ required: true, message: '请选择至少一个角色' }],
          },
          h(
            Select,
            {
              mode: 'multiple',
              placeholder: '请选择角色',
              options: roles.map((role) => ({ label: role.name, value: role.code })),
            }
          )
        ),
        h(
          Form.Item,
          { label: '启用状态', name: 'status', valuePropName: 'checked' },
          h(Switch, { checkedChildren: '启用', unCheckedChildren: '停用' })
        )
      )
    ),
    h(
      Modal,
      {
        open: showPasswordModal,
        title: resetTarget ? `重置 ${resetTarget.displayName} 的密码` : '重置密码',
        onCancel: () => {
          setShowPasswordModal(false);
          setResetTarget(null);
          passwordForm.resetFields();
        },
        onOk: () => passwordForm.submit(),
        okText: '确认重置',
        destroyOnClose: true,
      },
      h(
        Form,
        {
          form: passwordForm,
          layout: 'vertical',
          onFinish: handleResetPassword,
        },
        h(Form.Item, { label: '新密码', name: 'newPassword', rules: [{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少 6 位' }] }, h(Input.Password, { placeholder: '请输入新密码' }))
      )
    )
  );
}

export default AdminUserManager;
