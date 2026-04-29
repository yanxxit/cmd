import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { Typography, Card, Row, Col, Statistic, Progress, Table, Tag, Timeline, Space, Avatar, Spin, Empty, Alert, message, Button } from 'antd';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import {
  ShoppingOutlined,
  DollarOutlined,
  TeamOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  UserOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { DashboardStats } from '../api/dashboard-stats';

const { Title, Text, Paragraph } = Typography;

// 模拟最近订单数据
const recentOrders = [
  { key: '1', orderNo: 'ORD20240520001', customer: '张三', amount: 1299.00, status: 'delivered' },
  { key: '2', orderNo: 'ORD20240520002', customer: '李四', amount: 599.00, status: 'processing' },
  { key: '3', orderNo: 'ORD20240520003', customer: '王五', amount: 2399.00, status: 'pending' },
  { key: '4', orderNo: 'ORD20240520004', customer: '赵六', amount: 899.00, status: 'shipped' },
  { key: '5', orderNo: 'ORD20240520005', customer: '孙七', amount: 1599.00, status: 'delivered' },
];

// 模拟系统动态
const systemUpdates = [
  { color: 'green', text: '新增订单 ORD20240520001，金额 ¥1,299.00', time: '10 分钟前' },
  { color: 'blue', text: '订单 ORD20240520002 已发货', time: '25 分钟前' },
  { color: 'orange', text: '订单 ORD20240520003 待处理', time: '1 小时前' },
  { color: 'green', text: '用户 张三 完成注册', time: '2 小时前' },
  { color: 'red', text: '订单 ORD20240519099 已取消', time: '3 小时前' },
];

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'gold', text: '待处理' },
  processing: { color: 'blue', text: '处理中' },
  shipped: { color: 'cyan', text: '已发货' },
  delivered: { color: 'green', text: '已送达' },
  cancelled: { color: 'red', text: '已取消' },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 获取统计数据
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/next/api/dashboard-stats');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
      message.error('获取统计数据失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const orderColumns = useMemo(() => [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <Text strong style={{ color: '#f5222d' }}>¥{amount.toFixed(2)}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
      ),
    },
  ], []);

  return (
    <AdminLayout title="控制台">
      <Head>
        <title>控制台 - 管理系统</title>
      </Head>

      {/* 刷新按钮 */}
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchDashboardStats}
          loading={loading}
        >
          刷新数据
        </Button>
      </div>

      {/* 加载状态 */}
      {loading && !stats && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="加载统计数据中..." />
        </div>
      )}

      {/* 错误状态 */}
      {error && !stats && (
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" onClick={fetchDashboardStats}>
              重新加载
            </Button>
          }
        />
      )}

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="总订单数"
                value={stats.totalOrders}
                precision={0}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ShoppingOutlined />}
                suffix="个"
              />
              <Progress 
                percent={stats.orderGrowth > 0 ? Math.min(stats.orderGrowth * 4, 100) : 50} 
                strokeColor="#1890ff" 
                showInfo={false} 
                style={{ marginTop: 16 }}
                size="small"
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                较上周增长 {stats.orderGrowth}%
              </Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="总销售额"
                value={stats.totalSales}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
                prefix={<DollarOutlined />}
                suffix="元"
              />
              <Progress 
                percent={(stats.totalSales / stats.salesTarget) * 100} 
                strokeColor="#52c41a" 
                showInfo={false} 
                style={{ marginTop: 16 }}
                size="small"
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                本月目标完成度 {((stats.totalSales / stats.salesTarget) * 100).toFixed(1)}%
              </Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="活跃用户"
                value={stats.activeUsers}
                precision={0}
                valueStyle={{ color: '#722ed1' }}
                prefix={<TeamOutlined />}
                suffix="人"
              />
              <Progress 
                percent={89} 
                strokeColor="#722ed1" 
                showInfo={false} 
                style={{ marginTop: 16 }}
                size="small"
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                较昨日新增 {stats.userGrowth} 人
              </Text>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} hoverable>
              <Statistic
                title="转化率"
                value={stats.conversionRate}
                precision={1}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<RiseOutlined />}
                suffix="%"
              />
              <Progress 
                percent={(stats.conversionRate / stats.targetConversion) * 100} 
                strokeColor="#fa8c16" 
                showInfo={false} 
                style={{ marginTop: 16 }}
                size="small"
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                目标转化率 {stats.targetConversion}%
              </Text>
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        {/* 最近订单 */}
        <Col xs={24} lg={16}>
          <Card 
            title={<><ShoppingOutlined style={{ marginRight: 8 }} />最近订单</>}
            bordered={false}
            hoverable
            style={{ marginBottom: 24 }}
          >
            <Table 
              columns={orderColumns} 
              dataSource={recentOrders} 
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 系统动态 */}
        <Col xs={24} lg={8}>
          <Card 
            title={<><ClockCircleOutlined style={{ marginRight: 8 }} />系统动态</>}
            bordered={false}
            hoverable
            style={{ marginBottom: 24 }}
          >
            <Timeline
              items={systemUpdates.map((update, index) => ({
                color: update.color,
                children: (
                  <div>
                    <Text style={{ fontSize: 14 }}>{update.text}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{update.time}</Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷入口 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title={<><WarningOutlined style={{ marginRight: 8 }} />待办事项</>}
            bordered={false}
            hoverable
          >
            <Row gutter={16}>
              <Col span={8}>
                <Card type="inner" hoverable>
                  <div style={{ textAlign: 'center' }}>
                    <Avatar 
                      size={48} 
                      icon={<ClockCircleOutlined />} 
                      style={{ backgroundColor: '#1890ff', marginBottom: 8 }}
                    />
                    <div>
                      <Text strong style={{ fontSize: 24, display: 'block' }}>12</Text>
                      <Text type="secondary">待处理订单</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card type="inner" hoverable>
                  <div style={{ textAlign: 'center' }}>
                    <Avatar 
                      size={48} 
                      icon={<CheckCircleOutlined />} 
                      style={{ backgroundColor: '#52c41a', marginBottom: 8 }}
                    />
                    <div>
                      <Text strong style={{ fontSize: 24, display: 'block' }}>45</Text>
                      <Text type="secondary">已完成订单</Text>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card type="inner" hoverable>
                  <div style={{ textAlign: 'center' }}>
                    <Avatar 
                      size={48} 
                      icon={<WarningOutlined />} 
                      style={{ backgroundColor: '#faad14', marginBottom: 8 }}
                    />
                    <div>
                      <Text strong style={{ fontSize: 24, display: 'block' }}>3</Text>
                      <Text type="secondary">异常订单</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
}
