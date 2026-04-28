/**
 * 文章管理页面
 * 
 * 功能：
 * - 文章列表展示
 * - 分页查询
 * - 筛选（状态、分类、关键词）
 * - 文章操作（查看、编辑、删除）
 */

'use client';

import React, { useState, useEffect } from 'react';
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
  Typography,
  Row,
  Col,
  Statistic,
  Spin,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { Article, ArticleFilters, ArticleStats } from '../../../types/article';
import { request } from '../../../lib/request';
import Link from 'next/link';

const { Title, Text } = Typography;

/**
 * 状态映射配置
 */
const statusMap = {
  draft: { color: 'gray', text: '草稿' },
  published: { color: 'green', text: '已发布' },
  archived: { color: 'orange', text: '已归档' },
};

/**
 * 文章管理页面组件
 */
export default function ArticleManagement() {
  // 数据状态
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  
  // 筛选状态
  const [filters, setFilters] = useState<ArticleFilters>({
    keyword: '',
    status: undefined,
    category: undefined,
  });
  
  // 统计数据
  const [stats, setStats] = useState<ArticleStats>({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    totalViews: 0,
    totalLikes: 0,
  });

  /**
   * 加载文章列表
   */
  const loadArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      };
      
      console.log('📝 请求文章列表，参数:', params);
      const data = await request('/articles', { params });
      console.log('📝 响应数据:', data);
      
      setArticles(data.data);
      setTotal(data.total);
    } catch (err: any) {
      console.error('❌ 加载文章列表失败:', err);
      setError('加载文章列表失败，请稍后重试');
      message.error('加载文章列表失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载统计数据
   */
  const loadStats = async () => {
    try {
      const data = await request('/articles/stats');
      setStats(data);
    } catch (err: any) {
      console.error('❌ 加载统计失败:', err);
    }
  };

  /**
   * 页面加载时初始化数据
   */
  useEffect(() => {
    loadArticles();
    loadStats();
  }, [pagination.current, pagination.pageSize]);

  /**
   * 删除文章
   */
  const handleDelete = async (id: string) => {
    try {
      // 使用查询参数方式调用 API，避免 Turbopack 动态路由问题
      await request(`/articles/manage`, {
        method: 'DELETE',
        params: { id },
      });
      message.success('删除成功');
      loadArticles();
      loadStats();
    } catch (err: any) {
      console.error('❌ 删除失败:', err);
      message.error('删除失败');
    }
  };

  /**
   * 表格列配置
   */
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (text: string, record: Article) => (
        <div>
          <Title level={5} style={{ margin: 0, marginBottom: 4 }}>{text}</Title>
          {record.summary && (
            <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
              {record.summary}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 100,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category?: string) => category || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: keyof typeof statusMap) => {
        const config = statusMap[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '阅读量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80,
      sorter: (a: Article, b: Article) => a.viewCount - b.viewCount,
    },
    {
      title: '点赞数',
      dataIndex: 'likeCount',
      key: 'likeCount',
      width: 80,
      sorter: (a: Article, b: Article) => a.likeCount - b.likeCount,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
      sorter: (a: Article, b: Article) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: any, record: Article) => (
        <Space size="small">
          <Link href={`/admin/articles/edit/${record._id}`}>
            <Button type="link" size="small" icon={<EditOutlined />}>
              编辑
            </Button>
          </Link>
          <Link href={`/admin/articles/view/${record._id}`} target="_blank">
            <Button type="link" size="small" icon={<EyeOutlined />}>
              查看
            </Button>
          </Link>
          <Popconfirm
            title="确定要删除此文章吗？"
            onConfirm={() => handleDelete(record._id!)}
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
    <AdminLayout title="文章管理">
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="总文章数"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="已发布"
              value={stats.published}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="草稿"
              value={stats.draft}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="已归档"
              value={stats.archived}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选区域 */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 16 
        }}>
          <Space wrap>
            <Input
              placeholder="搜索标题或摘要"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onPressEnter={() => {
                setPagination({ ...pagination, current: 1 });
                loadArticles();
              }}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Select
              placeholder="状态"
              allowClear
              value={filters.status || undefined}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: 120 }}
              options={Object.entries(statusMap).map(([key, value]) => ({
                label: value.text,
                value: key,
              }))}
            />
            <Button 
              type="primary" 
              onClick={() => {
                setPagination({ ...pagination, current: 1 });
                loadArticles();
              }}
            >
              查询
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                setFilters({
                  keyword: '',
                  status: undefined,
                  category: undefined,
                });
                setPagination({ ...pagination, current: 1 });
                loadArticles();
              }}
            >
              重置
            </Button>
            <Link href="/admin/articles/edit/new">
              <Button type="primary" icon={<PlusOutlined />}>
                新建文章
              </Button>
            </Link>
          </Space>
        </div>
      </Card>

      {/* 数据表格 */}
      <Card bordered={false}>
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Table
          columns={columns}
          dataSource={articles}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={(pag) => {
            setPagination({
              current: pag.current || 1,
              pageSize: pag.pageSize || 10,
            });
          }}
          scroll={{ x: 1400 }}
          size="middle"
        />
      </Card>
    </AdminLayout>
  );
}
