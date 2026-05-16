// 测试案例列表组件模块
const { createElement: h, useState, useEffect, useMemo } = React;
const {
  Table, Button, Input, Select, Space, Modal, Form,
  message, Tag, Popconfirm, Row, Col,
} = antd;
const { Search } = Input;
const { Option } = Select;
const [{ api }, { ICON_EMOJI_MAP }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
  import(window.getModuleUrl('./js/icons.js')),
]);

function safeJsonStringify(value) {
  if (value === undefined) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value ?? '');
  }
}

function parseStructuredValue(text) {
  if (typeof text !== 'string' || !text.trim()) return text;
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function renderTagList(tagList) {
  const items = (tagList || []).slice(0, 3).map((tag) => h(Tag, { color: 'blue', key: tag }, tag));
  if ((tagList || []).length > 3) {
    items.push(h(Tag, { color: 'default', key: '__rest__' }, `+${(tagList || []).length - 3}`));
  }
  return h(Space, null, ...items);
}

function TestCaseList({ collectionId }) {
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

      Object.entries(filters || {}).forEach(([key, value]) => {
        if (key === 'collectionId') return;
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const effectiveCollectionId = collectionId || filters.collectionId;
      if (effectiveCollectionId) {
        params.append('collectionId', effectiveCollectionId);
      }

      const response = await fetch(`/api/test-cases?${params.toString()}`);
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

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [apiNameData, tagData, collectionData] = await Promise.all([
          api.get('/api/test-cases/api-names'),
          api.get('/api/test-cases/tags'),
          api.get('/api/test-case-collections/all'),
        ]);
        setApiNames(apiNameData || []);
        setTags(tagData || []);
        setCollections(collectionData || []);
      } catch (err) {
        console.error('加载筛选数据失败:', err);
      }
    };

    loadMeta();
  }, []);

  useEffect(() => {
    loadData(1, pagination.pageSize);
  }, [collectionId, filters]);

  const handleTableChange = (pag) => {
    loadData(pag.current, pag.pageSize);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingCase(null);
    form.resetFields();
  };

  const openCreateModal = () => {
    setEditingCase(null);
    form.resetFields();
    setShowCreateModal(true);
  };

  const handleCreate = async (values) => {
    try {
      const nextValues = {
        ...values,
        requestParams: parseStructuredValue(values.requestParamsText),
        responseData: parseStructuredValue(values.responseDataText),
      };
      delete nextValues.requestParamsText;
      delete nextValues.responseDataText;

      if (collectionId) {
        nextValues.collectionId = collectionId;
      } else if (!editingCase) {
        try {
          const allCols = await api.get('/api/test-case-collections/all');
          const defaultCol = (allCols || []).find((c) => c.name === '默认集合');
          if (defaultCol) nextValues.collectionId = defaultCol._id;
        } catch (error) {
          console.warn('获取默认集合失败：', error);
        }
      }

      if (editingCase) {
        await api.put(`/api/test-cases/${editingCase._id}`, nextValues);
        message.success('案例已更新');
      } else {
        await api.post('/api/test-cases', nextValues);
        message.success('案例已创建');
      }

      closeModal();
      loadData(pagination.current, pagination.pageSize);
      const tagData = await api.get('/api/test-cases/tags');
      setTags(tagData || []);
    } catch (err) {
      message.error('操作失败：' + err.message);
    }
  };

  const handleEdit = (record) => {
    setEditingCase(record);
    form.setFieldsValue({
      ...record,
      requestParamsText: safeJsonStringify(record.requestParams),
      responseDataText: safeJsonStringify(record.responseData),
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

  const collectionMap = useMemo(() => {
    const map = {};
    (collections || []).forEach((item) => {
      map[item._id] = item;
    });
    return map;
  }, [collections]);

  const columns = [
    {
      title: '接口名称',
      dataIndex: 'apiName',
      key: 'apiName',
      width: 200,
      render: (text) => h('span', { style: { color: '#1890ff', fontWeight: 500 } }, text),
    },
    {
      title: '案例标题',
      dataIndex: 'title',
      key: 'title',
      width: 220,
      render: (text) => h('span', { style: { color: '#1890ff' } }, text),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tagList) => renderTagList(tagList),
    },
    ...(!collectionId ? [{
      title: '所属集合',
      dataIndex: 'collectionId',
      key: 'collectionId',
      width: 160,
      render: (cid) => {
        if (!cid) return h('span', { style: { color: '#bfbfbf' } }, '-');
        const col = collectionMap[cid];
        if (!col) return h('span', { style: { color: '#bfbfbf' } }, '-');
        return h(
          Tag,
          { color: 'geekblue' },
          h('span', { style: { marginRight: 4 } }, ICON_EMOJI_MAP[col.icon] || '📁'),
          col.name
        );
      },
    }] : []),
    {
      title: '子案例',
      dataIndex: 'subCases',
      key: 'subCases',
      width: 90,
      render: (subCases) => {
        const count = Array.isArray(subCases) ? subCases.length : 0;
        return h(Tag, { color: count > 0 ? 'green' : 'default' }, count);
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => h(
        Space,
        null,
        h(
          Button,
          {
            type: 'link',
            size: 'small',
            onClick: () => window.open(`/test-case-manager/sub-cases.html?caseId=${encodeURIComponent(record._id)}`, '_blank'),
          },
          '子案例'
        ),
        h(Button, { type: 'link', size: 'small', onClick: () => handleEdit(record) }, '编辑'),
        h(
          Popconfirm,
          {
            title: '确定要删除这个案例吗？',
            onConfirm: () => handleDelete(record._id),
            okText: '确定',
            cancelText: '取消',
          },
          h(Button, { type: 'link', size: 'small', danger: true }, '删除')
        )
      ),
    },
  ];

  return h(
    'div',
    null,
    h(
      'div',
      { className: 'filter-section' },
      h(
        Row,
        { gutter: 16 },
        h(
          Col,
          { flex: '300px' },
          h(Search, {
            placeholder: '搜索接口名、案例标题',
            value: filters.search,
            onChange: (e) => setFilters({ ...filters, search: e.target.value }),
            onSearch: () => loadData(),
            allowClear: true,
          })
        ),
        h(
          Col,
          { flex: '200px' },
          h(
            Select,
            {
              placeholder: '接口名',
              style: { width: '100%' },
              value: filters.apiName || undefined,
              onChange: (value) => setFilters({ ...filters, apiName: value }),
              allowClear: true,
            },
            ...apiNames.map((name) => h(Option, { key: name, value: name }, name))
          )
        ),
        h(
          Col,
          { flex: '200px' },
          h(
            Select,
            {
              placeholder: '标签',
              style: { width: '100%' },
              value: filters.tags || undefined,
              onChange: (value) => setFilters({ ...filters, tags: value }),
              allowClear: true,
            },
            ...tags.map((tag) => h(Option, { key: tag, value: tag }, tag))
          )
        ),
        !collectionId
          ? h(
              Col,
              { flex: '220px' },
              h(
                Select,
                {
                  placeholder: '所属集合',
                  style: { width: '100%' },
                  value: filters.collectionId || undefined,
                  onChange: (value) => setFilters({ ...filters, collectionId: value || '' }),
                  allowClear: true,
                  showSearch: true,
                  optionFilterProp: 'children',
                },
                ...collections.map((col) => h(
                  Option,
                  { key: col._id, value: col._id },
                  `${ICON_EMOJI_MAP[col.icon] || '📁'} ${col.name}`
                ))
              )
            )
          : null,
        h(
          Col,
          { flex: 'auto' },
          h(Button, { type: 'primary', onClick: openCreateModal }, '新建案例')
        )
      )
    ),
    h(
      'div',
      { className: 'table-container' },
      h(Table, {
        columns,
        dataSource: testCases,
        loading,
        pagination,
        onChange: handleTableChange,
        rowKey: '_id',
      })
    ),
    h(
      Modal,
      {
        title: editingCase ? '编辑测试案例' : '新建测试案例',
        open: showCreateModal,
        onCancel: closeModal,
        onOk: () => form.submit(),
        width: 800,
      },
      h(
        Form,
        { form, layout: 'vertical', onFinish: handleCreate },
        h(
          Row,
          { gutter: 16 },
          h(
            Col,
            { span: 12 },
            h(
              Form.Item,
              {
                name: 'apiName',
                label: '接口名称',
                rules: [{ required: true, message: '请输入接口名称' }],
              },
              h(Input, { placeholder: '例如：/api/users' })
            )
          ),
          h(
            Col,
            { span: 12 },
            h(
              Form.Item,
              {
                name: 'title',
                label: '案例标题',
                rules: [{ required: true, message: '请输入案例标题' }],
              },
              h(Input, { placeholder: '例如：查询用户列表 - 正常场景' })
            )
          )
        ),
        h(
          Form.Item,
          { name: 'requestParamsText', label: '请求参数 (JSON)', tooltip: '支持粘贴 JSON 字符串' },
          h(Input.TextArea, { rows: 6, className: 'json-editor', placeholder: '{"key": "value"}' })
        ),
        h(
          Form.Item,
          { name: 'responseDataText', label: '返回数据 (JSON)', tooltip: '支持粘贴 JSON 字符串' },
          h(Input.TextArea, { rows: 6, className: 'json-editor', placeholder: '{"code": 200, "data": {}}' })
        ),
        h(
          Form.Item,
          { name: 'tags', label: '标签', tooltip: '可选择已有标签或输入新标签后回车创建' },
          h(
            Select,
            {
              mode: 'tags',
              style: { width: '100%' },
              placeholder: '选择或输入新标签，回车确认',
              tokenSeparators: [',', ' '],
              allowClear: true,
            },
            ...tags.map((tag) => h(Option, { key: tag, value: tag }, tag))
          )
        ),
        h(
          Form.Item,
          { name: 'remark', label: '备注' },
          h(Input.TextArea, {
            autoSize: { minRows: 3, maxRows: 10 },
            placeholder: '补充说明...',
          })
        )
      )
    )
  );
}

export default TestCaseList;
