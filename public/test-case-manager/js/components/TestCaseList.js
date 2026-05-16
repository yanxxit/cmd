// 测试案例列表组件 ESM descriptor
const { useState, useEffect } = React;
const {
  Table, Button, Input, Select, Space, Modal, Form,
  message, Tag, Popconfirm, Row, Col,
} = antd;
const { Search } = Input;
const { Option } = Select;

function TestCaseList({ collectionId }) {
  const api = window.__APP__.api;
  const { ICON_EMOJI_MAP } = window.__APP__.icons;
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ search: '', apiName: '', tags: '', collectionId: '' });
  const [apiNames, setApiNames] = useState([]);
  const [tags, setTags] = useState([]);
  const [collections, setCollections] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [form] = Form.useForm();

  const loadData = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(pageSize));

      Object.entries(filters || {}).forEach(([k, v]) => {
        if (k === 'collectionId') return;
        if (v !== undefined && v !== null && v !== '') {
          params.append(k, String(v));
        }
      });

      const effectiveCollectionId = collectionId || filters.collectionId;
      if (effectiveCollectionId) {
        params.append('collectionId', effectiveCollectionId);
      }

      const response = await fetch(`/api/test-cases?${params}`);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '请求失败');
      }

      setTestCases(result.data || []);
      const pg = result.pagination || {};
      setPagination({
        current: pg.page || 1,
        pageSize: pg.limit || pageSize,
        total: pg.total || 0,
      });
    } catch (err) {
      message.error('加载数据失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadApiNames = async () => {
    try {
      const data = await api.get('/api/test-cases/api-names');
      setApiNames(data);
    } catch (err) {
      console.error('加载接口名失败:', err);
    }
  };

  const loadTags = async () => {
    try {
      const data = await api.get('/api/test-cases/tags');
      setTags(data);
    } catch (err) {
      console.error('加载标签失败:', err);
    }
  };

  const loadCollections = async () => {
    try {
      const data = await api.get('/api/test-case-collections/all');
      setCollections(data || []);
    } catch (err) {
      console.error('加载集合失败:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadApiNames();
    loadTags();
    loadCollections();
  }, [collectionId, filters]);

  const handleTableChange = (pag) => {
    loadData(pag.current, pag.pageSize);
  };

  const handleCreate = async (values) => {
    try {
      if (values.requestParamsText) {
        try { values.requestParams = JSON.parse(values.requestParamsText); }
        catch (e) { values.requestParams = values.requestParamsText; }
      }
      if (values.responseDataText) {
        try { values.responseData = JSON.parse(values.responseDataText); }
        catch (e) { values.responseData = values.responseDataText; }
      }

      if (collectionId) {
        values.collectionId = collectionId;
      } else if (!editingCase) {
        try {
          const allCols = await api.get('/api/test-case-collections/all');
          const defaultCol = (allCols || []).find((c) => c.name === '默认集合');
          if (defaultCol) values.collectionId = defaultCol._id;
        } catch (e) {
          console.warn('获取默认集合失败：', e);
        }
      }

      if (editingCase) {
        await api.put(`/api/test-cases/${editingCase._id}`, values);
        message.success('案例已更新');
      } else {
        await api.post('/api/test-cases', values);
        message.success('案例已创建');
      }

      setShowCreateModal(false);
      setEditingCase(null);
      form.resetFields();
      loadData(pagination.current, pagination.pageSize);
      loadTags();
    } catch (err) {
      message.error('操作失败：' + err.message);
    }
  };

  const handleEdit = (record) => {
    setEditingCase(record);
    form.setFieldsValue({
      ...record,
      requestParamsText: JSON.stringify(record.requestParams, null, 2),
      responseDataText: JSON.stringify(record.responseData, null, 2),
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/test-cases/${id}`);
      message.success('案例已删除');
      loadData(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error('删除失败：' + err.message);
    }
  };

  const collectionMap = React.useMemo(() => {
    const map = {};
    (collections || []).forEach((c) => { map[c._id] = c; });
    return map;
  }, [collections]);

  const iconEmojiMap = ICON_EMOJI_MAP;

  const columns = [
    {
      title: '接口名称', dataIndex: 'apiName', key: 'apiName', width: 200,
      render: (text) => <span style={{ color: '#1890ff', fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '案例标题', dataIndex: 'title', key: 'title', width: 220,
      render: (text) => <span style={{ color: '#1890ff' }}>{text}</span>,
    },
    {
      title: '标签', dataIndex: 'tags', key: 'tags', width: 200,
      render: (tagList) => (
        <Space>
          {(tagList || []).slice(0, 3).map((tag) => (
            <Tag color="blue" key={tag}>{tag}</Tag>
          ))}
          {(tagList || []).length > 3 && (
            <Tag color="default">+{(tagList || []).length - 3}</Tag>
          )}
        </Space>
      ),
    },
    ...(!collectionId ? [{
      title: '所属集合', dataIndex: 'collectionId', key: 'collectionId', width: 160,
      render: (cid) => {
        if (!cid) return <span style={{ color: '#bfbfbf' }}>-</span>;
        const col = collectionMap[cid];
        if (!col) return <span style={{ color: '#bfbfbf' }}>-</span>;
        return (
          <Tag color="geekblue">
            <span style={{ marginRight: 4 }}>{iconEmojiMap[col.icon] || '📁'}</span>
            {col.name}
          </Tag>
        );
      },
    }] : []),
    {
      title: '子案例', dataIndex: 'subCases', key: 'subCases', width: 90,
      render: (subCases) => {
        const count = Array.isArray(subCases) ? subCases.length : 0;
        return <Tag color={count > 0 ? 'green' : 'default'}>{count}</Tag>;
      },
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作', key: 'action', width: 220,
      render: (_, record) => (
        <Space>
          <Button
            type="link" size="small"
            onClick={() => window.open(`/test-case-manager/sub-cases.html?caseId=${encodeURIComponent(record._id)}`, '_blank')}
          >子案例</Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定要删除这个案例吗？"
            onConfirm={() => handleDelete(record._id)}
            okText="确定" cancelText="取消"
          >
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="filter-section">
        <Row gutter={16}>
          <Col flex="300px">
            <Search
              placeholder="搜索接口名、案例标题"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onSearch={() => loadData()}
              allowClear
            />
          </Col>
          <Col flex="200px">
            <Select
              placeholder="接口名" style={{ width: '100%' }}
              value={filters.apiName || undefined}
              onChange={(value) => setFilters({ ...filters, apiName: value })}
              allowClear
            >
              {apiNames.map((name) => (
                <Option key={name} value={name}>{name}</Option>
              ))}
            </Select>
          </Col>
          <Col flex="200px">
            <Select
              placeholder="标签" style={{ width: '100%' }}
              value={filters.tags || undefined}
              onChange={(value) => setFilters({ ...filters, tags: value })}
              allowClear
            >
              {tags.map((tag) => (
                <Option key={tag} value={tag}>{tag}</Option>
              ))}
            </Select>
          </Col>
          {!collectionId && (
            <Col flex="220px">
              <Select
                placeholder="所属集合" style={{ width: '100%' }}
                value={filters.collectionId || undefined}
                onChange={(value) => setFilters({ ...filters, collectionId: value || '' })}
                allowClear showSearch optionFilterProp="children"
              >
                {collections.map((col) => (
                  <Option key={col._id} value={col._id}>
                    {(iconEmojiMap[col.icon] || '📁') + ' ' + col.name}
                  </Option>
                ))}
              </Select>
            </Col>
          )}
          <Col flex="auto">
            <Button type="primary" onClick={() => {
              setEditingCase(null);
              form.resetFields();
              setShowCreateModal(true);
            }}>新建案例</Button>
          </Col>
        </Row>
      </div>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={testCases}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey="_id"
        />
      </div>

      <Modal
        title={editingCase ? '编辑测试案例' : '新建测试案例'}
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          setEditingCase(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="apiName" label="接口名称"
                rules={[{ required: true, message: '请输入接口名称' }]}
              >
                <Input placeholder="例如：/api/users" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title" label="案例标题"
                rules={[{ required: true, message: '请输入案例标题' }]}
              >
                <Input placeholder="例如：查询用户列表 - 正常场景" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="requestParamsText" label="请求参数 (JSON)" tooltip="支持粘贴 JSON 字符串">
            <Input.TextArea rows={6} className="json-editor" placeholder='{"key": "value"}' />
          </Form.Item>

          <Form.Item name="responseDataText" label="返回数据 (JSON)" tooltip="支持粘贴 JSON 字符串">
            <Input.TextArea rows={6} className="json-editor" placeholder='{"code": 200, "data": {}}' />
          </Form.Item>

          <Form.Item name="tags" label="标签" tooltip="可选择已有标签或输入新标签后回车创建">
            <Select
              mode="tags" style={{ width: '100%' }}
              placeholder="选择或输入新标签，回车确认"
              tokenSeparators={[',', ' ']} allowClear
            >
              {tags.map((tag) => (
                <Option key={tag} value={tag}>{tag}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 10 }} placeholder="补充说明..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default {
  type: 'component',
  name: 'TestCaseList',
  component: TestCaseList,
};
