import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Tag,
  Popconfirm,
  message,
  Modal,
  Form,
  Descriptions,
  DatePicker,
  InputNumber
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';

// --- 类型定义 ---
export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress: string;
}

// --- 模拟数据生成 ---
const generateMockOrders = (count: number = 100): Order[] => {
  return Array.from({ length: count }).map(() => ({
    id: faker.string.uuid(),
    orderNo: 'ORD' + faker.string.numeric(8),
    customerName: faker.person.fullName(),
    customerPhone: '13' + faker.string.numeric(9),
    totalAmount: parseFloat(faker.commerce.price({ min: 10, max: 5000, dec: 2 })),
    status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
    shippingAddress: faker.location.streetAddress({ useFullAddress: true }),
  }));
};

const statusMap = {
  pending: { color: 'gold', text: '待处理' },
  processing: { color: 'blue', text: '处理中' },
  shipped: { color: 'cyan', text: '已发货' },
  delivered: { color: 'green', text: '已送达' },
  cancelled: { color: 'red', text: '已取消' },
};

export default function OrderManagement() {
  // --- 状态管理 ---
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // 搜索和分页状态
  const [searchText, setSearchText] = useState('');
  const [searchStatus, setSearchStatus] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
  });

  // 弹窗状态
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  
  const [form] = Form.useForm();

  // --- 初始化数据 ---
  useEffect(() => {
    // 模拟从服务器获取数据
    setLoading(true);
    setTimeout(() => {
      const data = generateMockOrders(150);
      // 按时间倒序排序
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllOrders(data);
      setLoading(false);
    }, 600);
  }, []);

  // --- 过滤和分页逻辑 ---
  const filteredOrders = useMemo(() => {
    let result = allOrders;
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      result = result.filter(
        order =>
          order.orderNo.toLowerCase().includes(lowerSearchText) ||
          order.customerName.toLowerCase().includes(lowerSearchText)
      );
    }
    if (searchStatus) {
      result = result.filter(order => order.status === searchStatus);
    }
    return result;
  }, [allOrders, searchText, searchStatus]);

  // 更新总数
  useEffect(() => {
    setPagination(prev => ({ ...prev, total: filteredOrders.length }));
  }, [filteredOrders.length]);

  // 当前页显示的数据
  const currentData = useMemo(() => {
    const start = ((pagination.current || 1) - 1) * (pagination.pageSize || 10);
    const end = start + (pagination.pageSize || 10);
    return filteredOrders.slice(start, end);
  }, [filteredOrders, pagination.current, pagination.pageSize]);

  // --- 操作处理 ---
  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setSearchText('');
    setSearchStatus(undefined);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleView = (record: Order) => {
    setCurrentOrder(record);
    setIsViewModalOpen(true);
  };

  const handleEdit = (record: Order) => {
    setCurrentOrder(record);
    form.setFieldsValue({
      ...record,
      createdAt: dayjs(record.createdAt),
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setLoading(true);
    setTimeout(() => {
      setAllOrders(prev => prev.filter(order => order.id !== id));
      message.success('删除成功');
      setLoading(false);
    }, 300);
  };

  const handleEditSubmit = async (values: any) => {
    try {
      setLoading(true);
      // 模拟请求延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedOrder = {
        ...currentOrder,
        ...values,
        createdAt: values.createdAt ? values.createdAt.toISOString() : currentOrder?.createdAt
      } as Order;

      setAllOrders(prev => prev.map(order => order.id === updatedOrder.id ? updatedOrder : order));
      message.success('更新订单成功');
      setIsEditModalOpen(false);
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  // --- 列定义 ---
  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 120,
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
    },
    {
      title: '订单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount: number) => `¥${(amount ?? 0).toFixed(2)}`,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: keyof typeof statusMap) => {
        const config = statusMap[status];
        return <Tag color={config?.color}>{config?.text || status}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此订单吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card bordered={false} style={{ marginBottom: 16, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Space wrap>
            <Input
              placeholder="搜索订单号或客户姓名"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="订单状态"
              allowClear
              value={searchStatus}
              onChange={setSearchStatus}
              style={{ width: 150 }}
              options={Object.entries(statusMap).map(([key, value]) => ({
                label: value.text,
                value: key,
              }))}
            />
            <Button type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </div>
      </Card>

      <Card bordered={false} style={{ borderRadius: 8 }}>
        <Table
          columns={columns}
          dataSource={currentData}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 查看弹窗 */}
      <Modal
        title="订单详情"
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {currentOrder && (
          <Descriptions bordered column={2} style={{ marginTop: 16 }}>
            <Descriptions.Item label="订单号">{currentOrder.orderNo}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[currentOrder.status]?.color}>
                {statusMap[currentOrder.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="客户姓名">{currentOrder.customerName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{currentOrder.customerPhone}</Descriptions.Item>
            <Descriptions.Item label="订单金额" span={2}>
              <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                ¥{currentOrder.totalAmount.toFixed(2)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="收货地址" span={2}>
              {currentOrder.shippingAddress}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {dayjs(currentOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑订单"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          style={{ marginTop: 16 }}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="customerName"
              label="客户姓名"
              rules={[{ required: true, message: '请输入客户姓名' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入客户姓名" />
            </Form.Item>
            <Form.Item
              name="customerPhone"
              label="联系电话"
              rules={[{ required: true, message: '请输入联系电话' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="totalAmount"
              label="订单金额"
              rules={[{ required: true, message: '请输入订单金额' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                prefix="¥"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                step={0.01}
              />
            </Form.Item>
            <Form.Item
              name="status"
              label="订单状态"
              rules={[{ required: true, message: '请选择订单状态' }]}
              style={{ flex: 1 }}
            >
              <Select
                options={Object.entries(statusMap).map(([key, value]) => ({
                  label: value.text,
                  value: key,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="shippingAddress"
            label="收货地址"
            rules={[{ required: true, message: '请输入收货地址' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入收货地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
    </AdminLayout>
  );
}
