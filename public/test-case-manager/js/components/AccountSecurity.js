const { createElement: h, useState } = React;
const {
  Alert, Button, Card, Descriptions, Form, Input, Space, Tag, Typography, message,
} = antd;
const { Text } = Typography;
const [{ api }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

function AccountSecurity({ currentAdmin, onPasswordChanged }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await api.post('/api/admin-auth/change-password', values);
      message.success('密码修改成功，请使用新密码重新登录');
      form.resetFields();
      if (typeof onPasswordChanged === 'function') {
        onPasswordChanged();
      }
    } catch (error) {
      message.error('修改密码失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return h(
    React.Fragment,
    null,
    h(
      Card,
      { bordered: false, className: 'info-card', style: { marginBottom: 16 } },
      h(Descriptions, {
        title: '账号概览',
        column: 2,
        items: [
          { key: 'displayName', label: '姓名', children: currentAdmin?.displayName || '-' },
          { key: 'username', label: '用户名', children: currentAdmin?.username || '-' },
          {
            key: 'roles',
            label: '角色',
            span: 2,
            children: h(
              Space,
              { wrap: true, size: 4 },
              ...((currentAdmin?.roles || []).map((role) => h(Tag, { key: role.code, color: role.code === 'super_admin' ? 'volcano' : 'blue' }, role.name)))
            ),
          },
          {
            key: 'permissions',
            label: '权限',
            span: 2,
            children: h(
              Space,
              { wrap: true, size: 4 },
              ...((currentAdmin?.permissions || []).map((permission) => h(Tag, { key: permission }, permission)))
            ),
          },
          {
            key: 'lastLoginAt',
            label: '最近登录',
            span: 2,
            children: currentAdmin?.lastLoginAt ? dayjs(currentAdmin.lastLoginAt).format('YYYY-MM-DD HH:mm:ss') : '-',
          },
        ],
      })
    ),
    h(
      Card,
      { bordered: false, className: 'info-card' },
      h(
        Space,
        { direction: 'vertical', size: 8, style: { width: '100%', marginBottom: 16 } },
        h('div', { style: { fontSize: 16, fontWeight: 600 } }, '修改密码'),
        h(Text, { type: 'secondary' }, '建议定期修改管理员密码。修改成功后当前登录态将会失效。'),
        h(Alert, {
          type: 'info',
          showIcon: true,
          message: '密码至少 6 位，建议包含字母和数字。',
        })
      ),
      h(
        Form,
        {
          form,
          layout: 'vertical',
          onFinish: handleSubmit,
          style: { maxWidth: 520 },
        },
        h(Form.Item, {
          label: '旧密码',
          name: 'oldPassword',
          rules: [{ required: true, message: '请输入旧密码' }],
        }, h(Input.Password, { placeholder: '请输入当前密码' })),
        h(Form.Item, {
          label: '新密码',
          name: 'newPassword',
          rules: [{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少 6 位' }],
        }, h(Input.Password, { placeholder: '请输入新密码' })),
        h(Form.Item, {
          label: '确认新密码',
          name: 'confirmPassword',
          dependencies: ['newPassword'],
          rules: [
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ],
        }, h(Input.Password, { placeholder: '请再次输入新密码' })),
        h(Form.Item, { style: { marginBottom: 0 } }, h(Button, {
          type: 'primary',
          htmlType: 'submit',
          loading,
        }, '更新密码'))
      )
    )
  );
}

export default AccountSecurity;
