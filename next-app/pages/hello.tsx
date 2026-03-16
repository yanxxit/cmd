import { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Table, 
  Space, 
  Modal, 
  message, 
  Popconfirm, 
  Tag, 
  Card, 
  Typography,
  Divider,
  Spin,
  Alert
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface UserFormValues {
  name: string;
  email: string;
  age: number;
}

export default function HelloPage() {
  // 1. useState - 状态管理
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

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

  // 8. 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '未激活'}
        </Tag>
      ),
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
              <li><Text strong>事件处理</Text> - 表单提交、删除确认、编辑等事件</li>
              <li><Text strong>条件渲染</Text> - 根据状态显示不同内容</li>
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

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />

        {/* 新增/编辑弹窗 */}
        <Modal
          title={editingUser ? '编辑用户' : '新增用户'}
          open={isModalOpen}
          onCancel={handleCloseModal}
          footer={null}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ status: 'active' }}
          >
            <Form.Item
              name="name"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              name="age"
              label="年龄"
              rules={[
                { required: true, message: '请输入年龄' },
                { type: 'number', min: 1, max: 150, message: '年龄必须在 1-150 之间' }
              ]}
            >
              <Input type="number" placeholder="请输入年龄" min={1} max={150} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Button onClick={handleCloseModal} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '创建'}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
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
          <code>{`// 1. useState - 状态管理
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(false);

// 2. useEffect - 副作用处理
useEffect(() => {
  fetchUsers();
}, []);

// 3. 模拟 API 调用
const fetchUsers = async () => {
  setLoading(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const data = [...]; // 模拟数据
    setUsers(data);
  } finally {
    setLoading(false);
  }
};

// 4. 表单提交
const onFinish = async (values) => {
  await api.save(values);
  setUsers([...users, newUser]);
  message.success('成功');
};

// 5. 删除操作
const handleDelete = async (id) => {
  await api.delete(id);
  setUsers(users.filter(u => u.id !== id));
};`}</code>
        </pre>
      </Card>
    </div>
  );
}
