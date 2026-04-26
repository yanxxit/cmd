import React from 'react';
import Head from 'next/head';
import { Typography, Card, Row, Col, Statistic } from 'antd';
import { AdminLayout } from '../../components/admin/layout';

const { Title } = Typography;

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Head>
        <title>后台控制台 - 测试案例管理</title>
      </Head>
      <Title level={2}>控制台概览</Title>

      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="总测试案例" value={112} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="涉及接口数" value={24} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="今日新增" value={5} />
          </Card>
        </Col>
      </Row>
    </AdminLayout>
  );
}
