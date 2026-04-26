import { useState, useEffect } from 'react';
import {
  Form,
  Button,
  message,
  Card,
  Typography,
  Divider,
  Alert
} from 'antd';
import { PlusOutlined, SyncOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { User, UserFormValues } from '../components/hello/types';
import UserTable from '../components/hello/UserTable';
import UserFormModal from '../components/hello/UserFormModal';

const { Title, Text } = Typography;

export default function HelloPage() {
  // 1. useState - 状态管理
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // 将 form 实例放在顶层，方便传递和在父组件操作
  const [form] = Form.useForm<UserFormValues>();

  // 2. useEffect - 副作用处理
  useEffect(() => {
    fetchUsers();
  }, []);

  // 3. 模拟 API 调用
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      // 模拟数据
      const mockData: User[] = [
        { id: 1, name: '张三', email: 'zhangsan@example.com', age: 25, status: 'active', createdAt: '2024-01-01' },
        { id: 2, name: '李四', email: 'lisi@example.com', age: 30, status: 'active', createdAt: '2024-01-02' },
        { id: 3, name: '王五', email: 'wangwu@example.com', age: 28, status: 'inactive', createdAt: '2024-01-03' },
      ];

      setUsers(mockData);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 4. 表单提交处理
  const onFinish: FormProps<UserFormValues>['onFinish'] = async (values) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      if (editingUser) {
        // 更新用户
        setUsers(users.map(user =>
          user.id === editingUser.id
            ? { ...user, ...values }
            : user
        ));
        message.success('更新成功');
      } else {
        // 新增用户
        const newUser: User = {
          id: Date.now(),
          ...values,
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0]
        };
        setUsers([...users, newUser]);
        message.success('创建成功');
      }

      handleCloseModal();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 5. 删除处理
  const handleDelete = async (id: number) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setUsers(users.filter(user => user.id !== id));
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 6. 编辑处理
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalOpen(true);
  };

  // 7. 关闭弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        {/* 页面标题 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>React + Ant Design 基础教程</Title>
          <Text type="secondary">
            本示例展示了 React 的常用功能：useState、useEffect、表单处理、CRUD 操作等
          </Text>
        </div>

        <Divider />

        {/* 知识点说明 */}
        <Alert
          message="本示例包含的 React 知识点"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><Text strong>useState</Text> - 状态管理（用户列表、加载状态、弹窗状态等）</li>
              <li><Text strong>useEffect</Text> - 副作用处理（页面加载时获取数据）</li>
              <li><Text strong>组件拆分</Text> - 拆分出了独立的 Table 和 Modal 组件，数据由父组件下发</li>
              <li><Text strong>事件传递</Text> - 子组件触发事件，通过 Props 通知父组件处理状态</li>
              <li><Text strong>列表渲染</Text> - 使用 Table 组件展示数据</li>
              <li><Text strong>表单验证</Text> - Ant Design Form 的内置验证</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            新增用户
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={fetchUsers}
            loading={loading}
            style={{ marginLeft: 8 }}
          >
            刷新
          </Button>
        </div>

        {/* 数据表格组件 */}
        <UserTable
          users={users}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* 新增/编辑弹窗组件 */}
        <UserFormModal
          open={isModalOpen}
          editingUser={editingUser}
          form={form}
          onCancel={handleCloseModal}
          onFinish={onFinish}
        />
      </Card>

      {/* 代码示例区域 */}
      <Card title="核心代码示例" style={{ marginTop: 24 }}>
        <pre style={{
          background: '#f5f5f5',
          padding: 16,
          borderRadius: 4,
          overflow: 'auto',
          fontSize: '12px'
        }}>
          <code>{`// 1. 父组件管理状态和业务逻辑 (pages/hello.tsx)
const [users, setUsers] = useState<User[]>([]);
const [form] = Form.useForm<UserFormValues>();

// 2. 将数据和事件处理通过 Props 传递给子组件
<UserTable
  users={users}
  loading={loading}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>

// 3. 弹窗和表单组件 (components/hello/UserFormModal.tsx)
<UserFormModal
  open={isModalOpen}
  editingUser={editingUser}
  form={form}
  onCancel={handleCloseModal}
  onFinish={onFinish}
/>`}</code>
        </pre>
      </Card>
    </div>
  );
}
