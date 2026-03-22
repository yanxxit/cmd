/**
 * React + Ant Design 基础学习案例
 * 
 * 本案例展示 React 和 Ant Design 的核心功能：
 * - useState 状态管理
 * - useEffect 副作用处理
 * - 表单处理
 * - 列表渲染
 * - 条件渲染
 * - 事件处理
 * - Ant Design 组件使用
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Form,
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
  Alert,
  Select,
  DatePicker,
  Rate,
  Switch,
  Slider,
  Checkbox,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { FormProps, TableColumnsType } from 'antd';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 数据类型定义
interface Student {
  id: number;
  name: string;
  age: number;
  email: string;
  grade: string;
  status: 'active' | 'inactive';
  rating: number;
  createdAt: string;
}

// 表单数据类型
interface StudentFormValues {
  name: string;
  age: number;
  email: string;
  grade: string;
  rating: number;
  status: boolean;
}

export default function ReactAntdLearning() {
  // 1. useState - 状态管理
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [form] = Form.useForm();

  // 2. useEffect - 副作用处理（组件挂载时执行）
  useEffect(() => {
    fetchStudents();
  }, []);

  // 3. 模拟 API 调用（异步操作）
  const fetchStudents = async () => {
    setLoading(true);
    try {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 模拟数据
      const mockData: Student[] = [
        {
          id: 1,
          name: '张三',
          age: 20,
          email: 'zhangsan@example.com',
          grade: 'A',
          status: 'active',
          rating: 4,
          createdAt: '2024-01-01',
        },
        {
          id: 2,
          name: '李四',
          age: 22,
          email: 'lisi@example.com',
          grade: 'B',
          status: 'active',
          rating: 3,
          createdAt: '2024-01-02',
        },
        {
          id: 3,
          name: '王五',
          age: 19,
          email: 'wangwu@example.com',
          grade: 'A',
          status: 'inactive',
          rating: 5,
          createdAt: '2024-01-03',
        },
      ];

      setStudents(mockData);
      message.success('加载成功');
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 4. 表单提交处理
  const onFinish: FormProps<StudentFormValues>['onFinish'] = async (values) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (editingStudent) {
        // 更新学生
        setStudents(
          students.map((student) =>
            student.id === editingStudent.id
              ? {
                  ...student,
                  ...values,
                  status: values.status ? 'active' : 'inactive',
                }
              : student
          )
        );
        message.success('更新成功');
      } else {
        // 新增学生
        const newStudent: Student = {
          id: Date.now(),
          ...values,
          status: values.status ? 'active' : 'inactive',
          createdAt: new Date().toISOString().split('T')[0],
        };
        setStudents([...students, newStudent]);
        message.success('创建成功');
      }

      handleCloseModal();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 5. 删除处理
  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setStudents(students.filter((student) => student.id !== id));
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 6. 编辑处理
  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    form.setFieldsValue({
      ...student,
      status: student.status === 'active',
    });
    setIsModalOpen(true);
  };

  // 7. 关闭弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    form.resetFields();
  };

  // 8. 表格列定义
  const columns: TableColumnsType<Student> = [
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
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      sorter: (a, b) => a.age - b.age,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '等级',
      dataIndex: 'grade',
      key: 'grade',
      width: 80,
      filters: [
        { text: 'A', value: 'A' },
        { text: 'B', value: 'B' },
      ],
      onFilter: (value, record) => record.grade === value,
      render: (grade: string) => (
        <Tag color={grade === 'A' ? 'green' : 'blue'}>{grade}</Tag>
      ),
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
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      render: (rating: number) => <Rate disabled value={rating} />,
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

  // 9. 过滤数据
  const filteredStudents = students.filter((student) => {
    const matchSearch = student.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchGrade = filterGrade === 'all' || student.grade === filterGrade;
    return matchSearch && matchGrade;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card>
        {/* 页面标题 */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>📚 React + Ant Design 基础教程</Title>
          <Text type="secondary">
            本示例展示了 React 的常用功能：useState、useEffect、表单处理、CRUD
            操作等
          </Text>
        </div>

        <Divider />

        {/* 知识点说明 */}
        <Alert
          message="本示例包含的 React 知识点"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <Text strong>useState</Text> - 状态管理（学生列表、加载状态、弹窗状态等）
              </li>
              <li>
                <Text strong>useEffect</Text> - 副作用处理（页面加载时获取数据）
              </li>
              <li>
                <Text strong>事件处理</Text> - 表单提交、删除确认、编辑等事件
              </li>
              <li>
                <Text strong>条件渲染</Text> - 根据状态显示不同内容
              </li>
              <li>
                <Text strong>列表渲染</Text> - 使用 Table 组件展示数据
              </li>
              <li>
                <Text strong>表单验证</Text> - Ant Design Form 的内置验证
              </li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              新增学生
            </Button>
            <Button
              icon={<SyncOutlined />}
              onClick={fetchStudents}
              loading={loading}
            >
              刷新
            </Button>
          </Space>

          <Space style={{ marginLeft: 16 }}>
            <Input
              placeholder="搜索姓名..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              value={filterGrade}
              onChange={setFilterGrade}
              style={{ width: 120 }}
            >
              <Option value="all">全部等级</Option>
              <Option value="A">A</Option>
              <Option value="B">B</Option>
            </Select>
          </Space>
        </div>

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={filteredStudents}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />

        {/* 新增/编辑弹窗 */}
        <Modal
          title={editingStudent ? '编辑学生' : '新增学生'}
          open={isModalOpen}
          onCancel={handleCloseModal}
          footer={null}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              status: true,
              rating: 3,
              grade: 'B',
            }}
          >
            <Form.Item
              name="name"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>

            <Form.Item
              name="age"
              label="年龄"
              rules={[
                { required: true, message: '请输入年龄' },
                { type: 'number', min: 1, max: 150, message: '年龄必须在 1-150 之间' },
              ]}
            >
              <Input type="number" placeholder="请输入年龄" min={1} max={150} />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              name="grade"
              label="等级"
              rules={[{ required: true, message: '请选择等级' }]}
            >
              <Select placeholder="请选择等级">
                <Option value="A">A</Option>
                <Option value="B">B</Option>
              </Select>
            </Form.Item>

            <Form.Item name="rating" label="评分">
              <Rate />
            </Form.Item>

            <Form.Item name="status" label="状态" valuePropName="checked">
              <Switch checkedChildren="活跃" unCheckedChildren="未激活" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Button onClick={handleCloseModal} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingStudent ? '更新' : '创建'}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Card>

      {/* 代码示例区域 */}
      <Card title="核心代码示例" style={{ marginTop: 24 }}>
        <pre
          style={{
            background: '#f5f5f5',
            padding: 16,
            borderRadius: 4,
            overflow: 'auto',
            fontSize: '12px',
          }}
        >
          <code>{`// 1. useState - 状态管理
const [students, setStudents] = useState<Student[]>([]);
const [loading, setLoading] = useState(false);
const [isModalOpen, setIsModalOpen] = useState(false);

// 2. useEffect - 副作用处理
useEffect(() => {
  fetchStudents(); // 页面加载时获取数据
}, []);

// 3. 模拟 API 调用
const fetchStudents = async () => {
  setLoading(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const data = [...]; // 模拟数据
    setStudents(data);
    message.success('加载成功');
  } finally {
    setLoading(false);
  }
};

// 4. 表单提交
const onFinish = async (values) => {
  if (editingStudent) {
    // 更新逻辑
    setStudents(students.map(s => 
      s.id === editingStudent.id ? { ...s, ...values } : s
    ));
  } else {
    // 新增逻辑
    setStudents([...students, { id: Date.now(), ...values }]);
  }
  message.success('成功');
};

// 5. 删除操作
const handleDelete = async (id) => {
  setStudents(students.filter(s => s.id !== id));
  message.success('删除成功');
};

// 6. 表格列定义
const columns: TableColumnsType<Student> = [
  { title: '姓名', dataIndex: 'name' },
  { title: '年龄', dataIndex: 'age' },
  { 
    title: '操作', 
    render: (_, record) => (
      <Space>
        <Button onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm onConfirm={() => handleDelete(record.id)}>
          <Button danger>删除</Button>
        </Popconfirm>
      </Space>
    )
  },
];`}</code>
        </pre>
      </Card>

      {/* Ant Design 组件展示 */}
      <Card title="Ant Design 常用组件" style={{ marginTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          <div>
            <Text strong>输入类</Text>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input placeholder="普通输入框" />
              <TextArea placeholder="文本域" rows={2} />
              <Select placeholder="下拉选择" style={{ width: '100%' }}>
                <Option value="1">选项 1</Option>
                <Option value="2">选项 2</Option>
              </Select>
            </Space>
          </div>
          <div>
            <Text strong>选择类</Text>
            <Divider />
            <Space direction="vertical">
              <Switch checkedChildren="开" unCheckedChildren="关" />
              <Slider defaultValue={50} />
              <Rate defaultValue={3} />
            </Space>
          </div>
          <div>
            <Text strong>反馈类</Text>
            <Divider />
            <Space>
              <Button type="primary">主要按钮</Button>
              <Button>默认按钮</Button>
              <Button danger>危险按钮</Button>
            </Space>
          </div>
        </div>
      </Card>
    </div>
  );
}
