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
  Typography,
  Row,
  Col,
  Alert,
  Card,
  Form,
  Empty,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { Article, ArticleFilters } from '../../../types/article';
import { request } from '../../../lib/request';
import Link from 'next/link';
import {
  FilterCard,
  TableCard,
  ErrorAlert,
  TitleContainer,
  TitleText,
  SummaryText,
  HelpIcon,
  CreateButtonContainer,
  EmptyState,
  EmptyDescription,
  ActionSpace,
} from './index.styled';

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

  // 防抖延迟
  const DEBOUNCE_DELAY = 500;
  let debounceTimer: NodeJS.Timeout;

  /**
   * 防抖搜索
   */
  const debouncedSearch = useCallback((keyword: string) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      setFilters(prev => ({ ...prev, keyword }));
      setPagination(prev => ({ ...prev, current: 1 }));
    }, DEBOUNCE_DELAY);
  }, []);

  /**
   * 加载文章列表
   */
  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      };

      const data = await request('/articles', { params });

      setArticles(data.data);
      setTotal(data.total);
    } catch (err: any) {
      setError('加载文章列表失败，请稍后重试');
      message.error('加载文章列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  /**
   * 页面加载时初始化数据
   */
  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  /**
   * 删除文章
   */
  const handleDelete = useCallback(async (id: string) => {
    try {
      await request(`/articles/manage`, {
        method: 'DELETE',
        params: { id },
      });
      message.success('删除成功');
      loadArticles();
    } catch (err: any) {
      // 错误已在 loadArticles 中处理
    }
  }, [loadArticles]);

  /**
   * 表格列配置 - 使用 useMemo 避免每次渲染重新创建
   */
  const columns = useMemo(() => [
    {
      title: (
        <span>
          标题
          <Tooltip title="支持标题和摘要模糊搜索" placement="right">
            <HelpIcon>?</HelpIcon>
          </Tooltip>
        </span>
      ),
      dataIndex: 'title',
      key: 'title',
      width: 280,
      render: (text: string, record: Article) => (
        <TitleContainer>
          <TitleText>
            {text}
          </TitleText>
          {record.summary && (
            <SummaryText ellipsis>
              {record.summary}
            </SummaryText>
          )}
        </TitleContainer>
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
      width: 90,
      render: (status: keyof typeof statusMap) => {
        const config = statusMap[status];
        return (
          <Tag
            color={config.color === 'green' ? 'success' : config.color === 'gray' ? 'default' : 'warning'}
          >
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '阅读量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80,
      align: 'center',
      sorter: (a: Article, b: Article) => a.viewCount - b.viewCount,
    },
    {
      title: '点赞数',
      dataIndex: 'likeCount',
      key: 'likeCount',
      width: 80,
      align: 'center',
      sorter: (a: Article, b: Article) => a.likeCount - b.likeCount,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
      sorter: (a: Article, b: Article) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: Article) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Link href={`/admin/articles/edit/${record._id}`}>
              <Button type="link" size="small" icon={<EditOutlined />}>
                编辑
              </Button>
            </Link>
          </Tooltip>
          <Tooltip title="查看">
            <Link href={`/admin/articles/view/${record._id}`} target="_blank">
              <Button type="link" size="small" icon={<EyeOutlined />}>
                查看
              </Button>
            </Link>
          </Tooltip>
          <Popconfirm
            title="确定要删除此文章吗？"
            onConfirm={() => handleDelete(record._id!)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ], []);

  // 处理分页变化
  const handlePaginationChange = useCallback((pag: any) => {
    setPagination({
      current: pag.current || 1,
      pageSize: pag.pageSize || 10,
    });
  }, []);

  // 处理重置
  const handleReset = useCallback(() => {
    setFilters({
      keyword: '',
      status: undefined,
      category: undefined,
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  // 处理清除筛选
  const handleClearFilters = useCallback(() => {
    setFilters({ keyword: '', status: undefined, category: undefined });
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  return (
    <AdminLayout>
      {/* 筛选区域 */}
      <FilterCard bordered={false}>
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Form.Item label="关键字搜索">
                <Input
                  placeholder="输入标题或摘要，自动搜索"
                  value={filters.keyword}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  onPressEnter={() => {
                    setPagination({ ...pagination, current: 1 });
                    loadArticles();
                  }}
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="状态">
                <Select
                  placeholder="选择状态"
                  allowClear
                  value={filters.status || undefined}
                  onChange={(value) => {
                    setFilters({ ...filters, status: value });
                    setPagination({ ...pagination, current: 1 });
                  }}
                  options={Object.entries(statusMap).map(([key, value]) => ({
                    label: value.text,
                    value: key,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="&nbsp;">
                <Space>
                  <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={loadArticles}
                    loading={loading}
                  >
                    搜索
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <CreateButtonContainer>
          <Link href="/admin/articles/edit/new">
            <Button type="primary" icon={<PlusOutlined />}>
              新建文章
            </Button>
          </Link>
        </CreateButtonContainer>
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
          onChange={handlePaginationChange}
          scroll={{ x: 1400 }}
          size="middle"
          locale={{
            emptyText: (
              <EmptyState
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <EmptyDescription>
                    {filters.keyword || filters.status ? '未找到匹配的文章' : '暂无文章，点击右上角「新建文章」开始创作'}
                  </EmptyDescription>
                }
              >
                {filters.keyword || filters.status ? (
                  <Button type="primary" onClick={handleClearFilters}>
                    清除筛选
                  </Button>
                ) : null}
              </EmptyState>
            ),
          }}
        />
      </TableCard>
    </AdminLayout>
  );
}
