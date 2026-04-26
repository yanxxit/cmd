import React, { useState } from 'react';
import Head from 'next/head';
import { Typography, Breadcrumb, Button, Space, message, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { AdminLayout } from '../../../components/admin/layout';
import { TestCaseTable } from '../../../components/admin/test-case/TestCaseTable';
import { TestCaseFilters } from '../../../components/admin/test-case/TestCaseFilters';
import { TestCaseModal } from '../../../components/admin/test-case/TestCaseModal';
import { TestCaseDetailModal } from '../../../components/admin/test-case/TestCaseDetailModal';
import { request } from '../../../components/common/request';
import type { TestCase } from '../../../types/test-case';

const { Title } = Typography;

export default function TestCasesPage() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

  // 弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentRecord, setCurrentRecord] = useState<TestCase | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);

  // 获取数据
  const { data, loading, refresh } = useRequest(
    () => {
      const params = {
        ...filters,
        page: pagination.current,
        limit: pagination.pageSize,
      };
      return request('/test-cases', { params });
    },
    { refreshDeps: [filters, pagination] }
  );

  const testCases = data?.data || [];
  const total = data?.pagination?.total || 0;

  const handleSearch = (values: any) => {
    setFilters(values);
    setPagination({ ...pagination, current: 1 });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ current: page, pageSize });
  };

  const handleCreate = () => {
    setModalMode('create');
    setCurrentRecord(null);
    setModalOpen(true);
  };

  const handleEdit = (record: TestCase) => {
    setModalMode('edit');
    setCurrentRecord(record);
    setModalOpen(true);
  };

  const handleView = (record: TestCase) => {
    setCurrentRecord(record);
    setDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request(`/test-cases/${id}`, { method: 'DELETE' });
      message.success('删除成功');
      refresh();
      setSelectedRowKeys(selectedRowKeys.filter((key) => key !== id));
    } catch (e) {
      // 错误已经在 request 中提示
    }
  };

  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个测试案例吗？此操作不可恢复。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await request('/test-cases/batch', {
            method: 'POST',
            body: JSON.stringify({
              operation: 'delete',
              ids: selectedRowKeys,
            }),
          });
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          refresh();
        } catch (e) {
          // 错误已经在 request 中提示
        }
      },
    });
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    refresh();
  };

  return (
    <AdminLayout>
      <Head>
        <title>测试案例管理 - 后台系统</title>
      </Head>

      <Breadcrumb
        items={[
          { title: '首页' },
          { title: '测试案例管理' },
          { title: '案例列表' },
        ]}
        style={{ marginBottom: 16 }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>案例列表</Title>
        <Space>
          {selectedRowKeys.length > 0 && (
            <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建案例
          </Button>
        </Space>
      </div>

      <TestCaseFilters onSearch={handleSearch} loading={loading} />

      <TestCaseTable
        data={testCases}
        loading={loading}
        total={total}
        current={pagination.current}
        pageSize={pagination.pageSize}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
      />

      <TestCaseModal
        open={modalOpen}
        mode={modalMode}
        initialData={currentRecord}
        onCancel={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <TestCaseDetailModal
        open={detailOpen}
        data={currentRecord}
        onCancel={() => setDetailOpen(false)}
        onEdit={() => {
          setDetailOpen(false);
          handleEdit(currentRecord!);
        }}
      />
    </AdminLayout>
  );
}
