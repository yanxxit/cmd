import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Modal,
  Form,
  Descriptions,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Typography,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ClearOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Order } from '../api/mock-orders';
import {
  PageHeader,
  PageTitle,
  BatchActions,
  FilterCard,
  TableCard,
  ErrorAlert,
  ActionSpace,
} from './orders.styled';

const { Title, Text } = Typography;

const statusMap = {
  pending: { color: 'gold', text: '待处理', icon: <ClockCircleOutlined /> },
  processing: { color: 'blue', text: '处理中', icon: <ShoppingOutlined /> },
  shipped: { color: 'cyan', text: '已发货', icon: <ShoppingOutlined /> },
  delivered: { color: 'green', text: '已送达', icon: <CheckCircleOutlined /> },
  cancelled: { color: 'red', text: '已取消', icon: <CloseCircleOutlined /> },
};

export default function OrderManagement() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  
  const [searchText, setSearchText] = useState('');
  const [searchStatus, setSearchStatus] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  
  const [form] = Form.useForm();

  // 统计数据（仅用于显示，不再展示在顶部）
  const statistics = useMemo(() => {
    const total = allOrders.length;
    const pending = allOrders.filter(o => o.status === 'pending').length;
    const processing = allOrders.filter(o => o.status === 'processing').length;
    const delivered = allOrders.filter(o => o.status === 'delivered').length;
    const totalAmount = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    return { total, pending, processing, delivered, totalAmount };
  }, [allOrders]);

  const handleBatchDelete = useCallback(() => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个订单吗？此操作不可恢复。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      icon: null,
      onOk: async () => {
        try {
          // TODO: 实现批量删除 API
          message.success('批量删除成功');
          setSelectedRowKeys([]);
        } catch (e) {
          message.error('批量删除失败');
        }
      },
    });
  }, [selectedRowKeys.length]);

  const handleClearSelection = useCallback(() => {
    setSelectedRowKeys([]);
    message.info('已取消选择');
  }, []);

  useEffect(() => {
    const apiUrl = '/next/api/mock-orders?count=150';
    
    setLoading(true);
    setError(undefined);
    fetch(apiUrl)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        setAllOrders(data);
      })
      .catch((err) => {
        message.error('获取模拟订单数据失败');
        setError(err.message || '获取数据失败');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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

  useEffect(() => {
    setPagination(prev => ({ ...prev, total: filteredOrders.length }));
  }, [filteredOrders.length]);

  const currentData = useMemo(() => {
    const start = ((pagination.current || 1) - 1) * (pagination.pageSize || 10);
    const end = start + (pagination.pageSize || 10);
    return filteredOrders.slice(start, end);
  }, [filteredOrders, pagination.current, pagination.pageSize]);

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

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      fixed: 'left',
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 150,
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },
    {
      title: '订单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount: number) => (
        <Text strong style={{ color: '#f5222d' }}>
          ¥{amount.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: keyof typeof statusMap) => {
        const config = statusMap[status];
        return (
          <Tag icon={config?.icon} color={config?.color}>
            {config?.text || status}
          </Tag>
        );
      },
      filters: Object.entries(statusMap).map(([key, value]) => ({
        text: value.text,
        value: key,
      })),
      onFilter: (value, record) => record.status === value,
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
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此订单吗？"
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
    <AdminLayout>
      {/* 页面头部 */}
      <PageHeader>
        <PageTitle level={2}>订单列表</PageTitle>
        <BatchActions>
          {selectedRowKeys.length > 0 && (
            <>
              <Tooltip title="取消选择已选项">
                <Button 
                  icon={<ClearOutlined />} 
                  onClick={handleClearSelection}
                >
                  取消选择 ({selectedRowKeys.length})
                </Button>
              </Tooltip>
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                onClick={handleBatchDelete}
              >
                批量删除
              </Button>
            </>
          )}
        </BatchActions>
      </PageHeader>

      {/* 筛选区域 */}
      <FilterCard>
        <Form layout="inline">
          <Form.Item label="搜索">
            <Input
              placeholder="订单号或客户姓名"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={() => setPagination(prev => ({ ...prev, current: 1 }))}
              allowClear
              style={{ width: 220 }}
              prefix={<SearchOutlined />}
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              placeholder="订单状态"
              allowClear
              value={searchStatus}
              onChange={setSearchStatus}
              style={{ width: 140 }}
              options={Object.entries(statusMap).map(([key, value]) => ({
                label: value.text,
                value: key,
              }))}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => setPagination(prev => ({ ...prev, current: 1 }))}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => {
                setSearchText('');
                setSearchStatus(undefined);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </FilterCard>

      {/* 数据表格 */}
      <TableCard>
        {error && (
          <ErrorAlert
            message={error}
            type="error"
            showIcon
            closable
          />
        )}
        
        <Table
          columns={columns}
          dataSource={currentData}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total: filteredOrders.length,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          size="middle"
        />
      </TableCard>

      {/* 查看弹窗 */}
      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: '#1890ff' }} />
            <span>订单详情</span>
          </Space>
        }
        open={isViewModalOpen}
        onCancel={() => setIsViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={700}
        destroyOnClose
      >
        {currentOrder && (
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="订单号">{currentOrder.orderNo}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag icon={statusMap[currentOrder.status]?.icon} color={statusMap[currentOrder.status]?.color}>
                {statusMap[currentOrder.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="客户姓名">{currentOrder.customerName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{currentOrder.customerPhone}</Descriptions.Item>
            <Descriptions.Item label="订单金额" span={2}>
              <Text strong style={{ color: '#f5222d', fontSize: 18 }}>
                ¥{currentOrder.totalAmount.toFixed(2)}
              </Text>
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
        title={
          <Space>
            <EditOutlined style={{ color: '#1890ff' }} />
            <span>编辑订单</span>
          </Space>
        }
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
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="客户姓名"
                rules={[{ required: true, message: '请输入客户姓名' }]}
              >
                <Input placeholder="请输入客户姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerPhone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input placeholder="请输入手机号" maxLength={11} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalAmount"
                label="订单金额"
                rules={[{ required: true, message: '请输入订单金额' }]}
              >
                <InputNumber
                  prefix="¥"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  step={0.01}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="订单状态"
                rules={[{ required: true, message: '请选择订单状态' }]}
              >
                <Select
                  placeholder="请选择状态"
                  options={Object.entries(statusMap).map(([key, value]) => ({
                    label: value.text,
                    value: key,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="shippingAddress"
            label="收货地址"
            rules={[{ required: true, message: '请输入收货地址' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入详细收货地址" showCount maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
