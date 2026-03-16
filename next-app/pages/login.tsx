import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Form, Input, Button, Checkbox, Typography, Divider, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onFinish: FormProps<LoginFormValues>['onFinish'] = async (values) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      message.success('登录成功！');
      router.push('/');
    } catch (error) {
      message.error('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>登录 - Next App</title>
        <meta name="description" content="登录到您的账户" />
      </Head>

      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        {/* 动态背景光斑 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        {/* 登录卡片 */}
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8">
            {/* 标题区域 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 mb-4 shadow-lg">
                <UserOutlined className="text-2xl text-white" />
              </div>
              <Title level={2} className="text-white !mb-2 !font-bold">欢迎回来</Title>
              <Text className="text-white/60">登录到您的账户继续</Text>
            </div>

            {/* Ant Design 表单 */}
            <Form
              name="login"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              size="large"
            >
              {/* 邮箱输入 */}
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-white/60" />}
                  placeholder="your@email.com"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </Form.Item>

              {/* 密码输入 */}
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少需要 6 个字符' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-white/60" />}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </Form.Item>

              {/* 记住我 & 忘记密码 */}
              <Form.Item>
                <div className="flex items-center justify-between">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox className="text-white/80 hover:text-white">记住我</Checkbox>
                  </Form.Item>
                  <a className="text-purple-300 hover:text-purple-200" href="#">
                    忘记密码？
                  </a>
                </div>
              </Form.Item>

              {/* 登录按钮 */}
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  size="large"
                  className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-none font-semibold rounded-xl shadow-lg"
                >
                  {isLoading ? '登录中...' : '登录'}
                </Button>
              </Form.Item>
            </Form>

            {/* 分割线 */}
            <Divider className="!border-white/10 !my-6">
              <span className="text-white/40">或</span>
            </Divider>

            {/* 社交登录 */}
            <div className="space-y-3">
              <Button
                size="large"
                className="w-full h-12 bg-white/5 hover:bg-white/10 border-white/20 text-white font-medium rounded-xl"
              >
                使用 Google 账号登录
              </Button>

              <Button
                size="large"
                className="w-full h-12 bg-white/5 hover:bg-white/10 border-white/20 text-white font-medium rounded-xl"
              >
                使用 GitHub 账号登录
              </Button>
            </div>

            {/* 注册链接 */}
            <div className="mt-8 text-center">
              <Text className="text-white/60">还没有账户？</Text>{' '}
              <a href="#" className="text-purple-300 hover:text-purple-200 font-medium">
                立即注册
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
