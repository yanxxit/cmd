const { createElement: h, useState } = React;
const {
  Alert, Button, Card, Checkbox, Form, Input, Space, Typography, message,
} = antd;
const { Title, Text } = Typography;
const [{ api, setAuthToken }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

function LoginPage({ onLoginSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (values) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await api.post('/api/admin-auth/login', values);
      setAuthToken(result.token, result.expiresAt);
      message.success('登录成功');
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(result.admin);
      }
    } catch (error) {
      setErrorMessage(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return h(
    'div',
    { className: 'login-shell' },
    h(
      'div',
      { className: 'login-hero' },
      h(
        'div',
        { className: 'login-hero-badge' },
        'Admin'
      ),
      h(Title, { level: 2, style: { margin: 0, color: '#fff' } }, '测试案例管理后台'),
      h(
        Text,
        { style: { color: 'rgba(255,255,255,0.78)', fontSize: 14 } },
        '支持管理员、角色权限、登录态与账号安全，数据持久化到 @yanit/jsondb'
      ),
      h(
        Space,
        { direction: 'vertical', size: 8, style: { marginTop: 24 } },
        h('div', { className: 'login-tip-item' }, '默认管理员：admin'),
        h('div', { className: 'login-tip-item' }, '默认密码：admin123456'),
        h('div', { className: 'login-tip-item' }, '首次登录后可在「账号安全」中修改密码')
      )
    ),
    h(
      Card,
      { className: 'login-card', bordered: false },
      h(
        Space,
        { direction: 'vertical', size: 4, style: { width: '100%', marginBottom: 20 } },
        h(Title, { level: 4, style: { margin: 0 } }, '管理员登录'),
        h(Text, { type: 'secondary' }, '使用管理员账号登录后进入后台管理系统')
      ),
      errorMessage
        ? h(Alert, {
            type: 'error',
            showIcon: true,
            message: errorMessage,
            style: { marginBottom: 16 },
          })
        : null,
      h(
        Form,
        {
          form,
          layout: 'vertical',
          initialValues: {
            username: 'admin',
            password: 'admin123456',
            remember: true,
          },
          onFinish: handleSubmit,
        },
        h(
          Form.Item,
          {
            label: '用户名',
            name: 'username',
            rules: [{ required: true, message: '请输入用户名' }],
          },
          h(Input, { size: 'large', placeholder: '请输入管理员用户名' })
        ),
        h(
          Form.Item,
          {
            label: '密码',
            name: 'password',
            rules: [{ required: true, message: '请输入密码' }],
          },
          h(Input.Password, { size: 'large', placeholder: '请输入登录密码' })
        ),
        h(
          Form.Item,
          { name: 'remember', valuePropName: 'checked', style: { marginBottom: 16 } },
          h(Checkbox, null, '记住登录状态（30 天）')
        ),
        h(
          Form.Item,
          { style: { marginBottom: 0 } },
          h(
            Button,
            {
              type: 'primary',
              htmlType: 'submit',
              size: 'large',
              loading,
              block: true,
            },
            '登录后台'
          )
        )
      )
    )
  );
}

export default LoginPage;
