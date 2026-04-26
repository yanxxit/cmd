import React from 'react';
import { Table, Space, Button, Popconfirm, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { TestCase } from '../../../types/test-case';

interface TestCaseTableProps {
  data: TestCase[];
  loading: boolean;
  total: number;
  current: number;
  pageSize: number;
  selectedRowKeys: React.Key[];
  onSelectChange: (selectedRowKeys: React.Key[]) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (record: TestCase) => void;
  onView: (record: TestCase) => void;
  onDelete: (id: string) => void;
}

export const TestCaseTable: React.FC<TestCaseTableProps> = ({
  data,
  loading,
  total,
  current,
  pageSize,
  selectedRowKeys,
  onSelectChange,
  onPageChange,
  onEdit,
  onView,
  onDelete,
}) => {
  const columns = [
    {
      title: '接口名称',
      dataIndex: 'apiName',
      key: 'apiName',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '案例标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: TestCase) => (
        <a onClick={() => onView(record)}>{text}</a>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags?.map((tag) => (
            <Tag color="cyan" key={tag}>
              {tag}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '请求时间',
      dataIndex: 'requestTime',
      key: 'requestTime',
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TestCase) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个测试案例吗？"
              onConfirm={() => onDelete(record._id!)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="_id"
      columns={columns}
      dataSource={data}
      loading={loading}
      rowSelection={{
        selectedRowKeys,
        onChange: onSelectChange,
      }}
      pagination={{
        total,
        current,
        pageSize,
        onChange: onPageChange,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条数据`,
      }}
    />
  );
};
