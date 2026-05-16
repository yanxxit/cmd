const { createElement: h, useEffect, useState } = React;
const {
  AutoComplete, Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm,
  Row, Select, Space, Switch, Table, Tag, Typography, message,
} = antd;
const { TextArea, Search } = Input;
const { Text } = Typography;
const [{ api }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

const TYPE_OPTIONS = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔值', value: 'boolean' },
  { label: 'JSON 对象', value: 'json' },
  { label: '数据库对象', value: 'db_ref' },
  { label: '数组', value: 'array' },
];

function renderEnvStat(title, value, color, bg) {
  return h(
    Card,
    { bordered: false, className: 'info-card', bodyStyle: { padding: 18 } },
    h(
      Space,
      { direction: 'vertical', size: 2 },
      h('div', { style: { color: 'var(--tcm-text-secondary)', fontSize: 12 } }, title),
      h('div', { style: { fontSize: 26, fontWeight: 700, color } }, value),
      h('div', { style: { width: 48, height: 4, borderRadius: 999, background: bg } })
    )
  );
}

function EnvVariableManager({ currentAdmin }) {
  const [form] = Form.useForm();
  const currentType = Form.useWatch('type', form);
  const currentCollectionName = Form.useWatch('collectionName', form);
  const currentLabelField = Form.useWatch('labelField', form);
  const currentIdField = Form.useWatch('idField', form);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [groups, setGroups] = useState([]);
  const [runtimeConfig, setRuntimeConfig] = useState({});
  const [keyword, setKeyword] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refOptions, setRefOptions] = useState([]);

  const canManage = Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes('envs.manage');

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (keyword) query.set('keyword', keyword);
      if (groupFilter) query.set('group', groupFilter);
      if (typeFilter) query.set('type', typeFilter);
      const [list, nextStats, nextGroups, nextRuntime] = await Promise.all([
        api.get(`/api/admin-envs?${query.toString()}`),
        api.get('/api/admin-envs/stats'),
        api.get('/api/admin-envs/groups'),
        api.get('/api/admin-envs/runtime'),
      ]);
      setItems(list || []);
      setStats(nextStats || {});
      setGroups(nextGroups || []);
      setRuntimeConfig(nextRuntime || {});
    } catch (error) {
      message.error('加载环境变量失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [keyword, groupFilter, typeFilter]);

  useEffect(() => {
    async function loadRefOptions() {
      if (currentType !== 'db_ref') {
        setRefOptions([]);
        return;
      }
      const collectionName = form.getFieldValue('collectionName');
      if (!collectionName) {
        setRefOptions([]);
        return;
      }
      try {
        const options = await api.get(`/api/admin-envs/ref-options?collectionName=${encodeURIComponent(collectionName)}&labelField=${encodeURIComponent(currentLabelField || 'title')}&idField=${encodeURIComponent(currentIdField || '_id')}`);
        setRefOptions(options || []);
      } catch (error) {
        setRefOptions([]);
      }
    }
    loadRefOptions();
  }, [currentType, currentCollectionName, currentLabelField, currentIdField]);

  const openCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'string',
      enabled: true,
      group: '默认分组',
      valueText: '',
      arrayItemType: 'string',
      idField: '_id',
      labelField: 'title',
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      key: item.key,
      title: item.title,
      group: item.group,
      description: item.description,
      type: item.type,
      enabled: !!item.enabled,
      valueText: item.type === 'json' || item.type === 'array'
        ? JSON.stringify(item.value, null, 2)
        : item.type === 'db_ref'
          ? item.value
          : item.type === 'boolean'
            ? !!item.value
            : item.value,
      arrayItemType: item.arrayItemType || 'string',
      collectionName: item.refConfig?.collectionName || '',
      idField: item.refConfig?.idField || '_id',
      labelField: item.refConfig?.labelField || 'title',
    });
    setShowModal(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        key: values.key,
        title: values.title,
        group: values.group,
        description: values.description,
        type: values.type,
        enabled: values.enabled,
        value: values.valueText,
        arrayItemType: values.arrayItemType,
        collectionName: values.collectionName,
        idField: values.idField,
        labelField: values.labelField,
      };
      if (editingItem) {
        await api.put(`/api/admin-envs/${editingItem._id}`, payload);
        message.success('环境变量已更新，修改即时生效');
      } else {
        await api.post('/api/admin-envs', payload);
        message.success('环境变量已创建');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      message.error('保存环境变量失败：' + error.message);
    }
  };

  const handleDelete = async (item) => {
    try {
      await api.delete(`/api/admin-envs/${item._id}`);
      message.success('环境变量已删除');
      loadData();
    } catch (error) {
      message.error('删除失败：' + error.message);
    }
  };

  const columns = [
    {
      title: '变量',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      render: (_, record) => h(
        Space,
        { direction: 'vertical', size: 0 },
        h('span', { style: { fontWeight: 600 } }, record.title),
        h('span', { style: { color: 'var(--tcm-text-secondary)', fontSize: 12 } }, record.key)
      ),
    },
    {
      title: '分组',
      dataIndex: 'group',
      key: 'group',
      width: 120,
      render: (value) => h(Tag, { color: 'blue' }, value || '默认分组'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (value) => {
        const option = TYPE_OPTIONS.find((item) => item.value === value);
        return option?.label || value;
      },
    },
    {
      title: '当前值',
      dataIndex: 'valuePreview',
      key: 'valuePreview',
      render: (value) => h('code', { className: 'inline-code-preview' }, value),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 90,
      render: (value) => h(Tag, { color: value ? 'success' : 'default' }, value ? '生效中' : '已停用'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => h(
        Space,
        null,
        h(Button, { type: 'link', size: 'small', disabled: !canManage, onClick: () => openEdit(record) }, '编辑'),
        h(
          Popconfirm,
          {
            title: '确定删除该环境变量吗？',
            okText: '确定',
            cancelText: '取消',
            disabled: !canManage,
            onConfirm: () => handleDelete(record),
          },
          h(Button, { type: 'link', size: 'small', danger: true, disabled: !canManage }, '删除')
        )
      ),
    },
  ];

  const renderValueField = () => {
    if (currentType === 'number') {
      return h(InputNumber, { style: { width: '100%' }, placeholder: '请输入数字值' });
    }
    if (currentType === 'boolean') {
      return h(Switch, { checkedChildren: 'true', unCheckedChildren: 'false' });
    }
    if (currentType === 'json') {
      return h(TextArea, { rows: 8, placeholder: '请输入 JSON 对象，例如：{\"feature\": true}' });
    }
    if (currentType === 'array') {
      return h(TextArea, { rows: 8, placeholder: '请输入 JSON 数组，例如：["a", "b", "c"]' });
    }
    if (currentType === 'db_ref') {
      return h(
        Space,
        { direction: 'vertical', size: 12, style: { width: '100%' } },
        h(
          Row,
          { gutter: 12 },
          h(Col, { span: 12 }, h(Form.Item, { label: '数据集合', name: 'collectionName', rules: [{ required: true, message: '请输入 collection/table 名称' }] }, h(Input, { placeholder: '例如：articles / admins' }))),
          h(Col, { span: 6 }, h(Form.Item, { label: 'ID 字段', name: 'idField' }, h(Input, { placeholder: '_id' }))),
          h(Col, { span: 6 }, h(Form.Item, { label: '展示字段', name: 'labelField' }, h(Input, { placeholder: 'title' })))
        ),
        h(
          Form.Item,
          {
            label: '记录 ID',
            name: 'valueText',
            rules: [{ required: true, message: '请选择或输入记录 ID' }],
          },
          h(AutoComplete, {
            placeholder: '请选择数据库对象记录或直接输入 ID',
            options: refOptions.map((item) => ({ label: `${item.label} (${item.value})`, value: item.value })),
            filterOption: true,
          })
        )
      );
    }
    return h(Input, { placeholder: '请输入变量值' });
  };

  return h(
    React.Fragment,
    null,
    h(
      Row,
      { gutter: [16, 16], style: { marginBottom: 16 } },
      h(Col, { xs: 24, md: 12, lg: 6 }, renderEnvStat('环境变量总数', stats.total || 0, '#1677ff', 'rgba(22,119,255,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderEnvStat('生效中的变量', stats.enabled || 0, '#52c41a', 'rgba(82,196,26,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderEnvStat('变量分组', stats.groups || 0, '#722ed1', 'rgba(114,46,209,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderEnvStat('数据库对象变量', stats.dbRefs || 0, '#fa8c16', 'rgba(250,140,22,0.18)'))
    ),
    h(
      Card,
      { bordered: false, className: 'info-card', style: { marginBottom: 16 } },
      h(
        Space,
        { direction: 'vertical', size: 10, style: { width: '100%' } },
        h('div', { style: { fontSize: 16, fontWeight: 600 } }, '运行时配置快照'),
        h(Text, { type: 'secondary' }, '变量保存后会立即进入运行时配置，无需重启服务。'),
        h('pre', { className: 'runtime-json-block' }, JSON.stringify(runtimeConfig, null, 2))
      )
    ),
    h(
      'div',
      { className: 'filter-section' },
      h(
        Row,
        { gutter: 16 },
        h(Col, { flex: '280px' }, h(Search, { placeholder: '搜索 Key / 标题 / 描述', value: keyword, onChange: (e) => setKeyword(e.target.value), allowClear: true })),
        h(Col, { flex: '180px' }, h(Select, {
          placeholder: '按分组筛选',
          value: groupFilter || undefined,
          onChange: (value) => setGroupFilter(value || ''),
          allowClear: true,
          style: { width: '100%' },
          options: groups.map((group) => ({ label: group, value: group })),
        })),
        h(Col, { flex: '180px' }, h(Select, {
          placeholder: '按类型筛选',
          value: typeFilter || undefined,
          onChange: (value) => setTypeFilter(value || ''),
          allowClear: true,
          style: { width: '100%' },
          options: TYPE_OPTIONS,
        })),
        h(Col, { flex: 'auto', style: { textAlign: 'right' } }, h(Button, { type: 'primary', disabled: !canManage, onClick: openCreate }, '新增环境变量'))
      )
    ),
    h(
      'div',
      { className: 'table-container' },
      h(Table, {
        rowKey: '_id',
        loading,
        dataSource: items,
        columns,
        pagination: false,
      })
    ),
    h(
      Modal,
      {
        open: showModal,
        title: editingItem ? '编辑环境变量' : '新增环境变量',
        width: 760,
        onCancel: () => {
          setShowModal(false);
          form.resetFields();
          setEditingItem(null);
        },
        onOk: () => form.submit(),
        okText: editingItem ? '保存并生效' : '创建并生效',
        destroyOnClose: true,
      },
      h(
        Form,
        {
          form,
          layout: 'vertical',
          onFinish: handleSubmit,
        },
        h(
          Row,
          { gutter: 12 },
          h(Col, { span: 12 }, h(Form.Item, { label: '变量名称', name: 'title', rules: [{ required: true, message: '请输入变量名称' }] }, h(Input, { placeholder: '例如：站点标题' }))),
          h(Col, { span: 12 }, h(Form.Item, { label: '变量 Key', name: 'key', rules: [{ required: true, message: '请输入变量 Key' }] }, h(Input, { placeholder: '例如：site.title' })))
        ),
        h(
          Row,
          { gutter: 12 },
          h(Col, { span: 12 }, h(Form.Item, { label: '分组', name: 'group', rules: [{ required: true, message: '请输入变量分组' }] }, h(Input, { placeholder: '例如：文章配置' }))),
          h(Col, { span: 12 }, h(Form.Item, { label: '类型', name: 'type', rules: [{ required: true, message: '请选择变量类型' }] }, h(Select, { options: TYPE_OPTIONS })))
        ),
        h(Form.Item, { label: '描述', name: 'description' }, h(TextArea, { rows: 2, placeholder: '描述变量用途和影响范围' })),
        currentType === 'array'
          ? h(Form.Item, { label: '数组元素类型', name: 'arrayItemType' }, h(Select, { options: TYPE_OPTIONS.filter((item) => item.value !== 'array') }))
          : null,
        currentType !== 'db_ref'
          ? h(Form.Item, { label: '变量值', name: 'valueText', valuePropName: currentType === 'boolean' ? 'checked' : 'value', rules: currentType === 'boolean' ? [] : [{ required: true, message: '请输入变量值' }] }, renderValueField())
          : renderValueField(),
        h(Form.Item, { label: '启用状态', name: 'enabled', valuePropName: 'checked' }, h(Switch, { checkedChildren: '启用', unCheckedChildren: '停用' }))
      )
    )
  );
}

export default EnvVariableManager;
