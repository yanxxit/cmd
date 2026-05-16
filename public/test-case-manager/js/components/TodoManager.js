const { createElement: h, useEffect, useMemo, useState } = React;
const {
  Button, Card, Col, DatePicker, Form, Input, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tag, Typography, message,
} = antd;
const { Search, TextArea } = Input;
const { RangePicker } = DatePicker;
const { Text } = Typography;
const [{ api }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

function renderStatCard(title, value, color, bg) {
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

function parseTagsText(value) {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join('，');
  } catch (error) {}
  return String(value);
}

function serializeTags(text = '') {
  return JSON.stringify(String(text || '').split(/[，,]/).map((item) => item.trim()).filter(Boolean));
}

function formatSchedule(record) {
  if (!record.start_at && !record.end_at && !record.due_date) return '-';
  if (record.start_at && record.end_at) {
    return `${dayjs(record.start_at).format('YYYY-MM-DD HH:mm')} ~ ${dayjs(record.end_at).format('YYYY-MM-DD HH:mm')}`;
  }
  if (record.start_at) return dayjs(record.start_at).format('YYYY-MM-DD HH:mm');
  return record.due_date || '-';
}

function TodoManager({ currentAdmin }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [range, setRange] = useState([]);
  const [stats, setStats] = useState({});
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const canManage = useMemo(
    () => Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes('todos.manage'),
    [currentAdmin]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (keyword) query.set('keyword', keyword);
      if (statusFilter) query.set('status', statusFilter);
      if (priorityFilter) query.set('priority', priorityFilter);
      if (range?.[0]) query.set('startDate', range[0].format('YYYY-MM-DD'));
      if (range?.[1]) query.set('endDate', range[1].format('YYYY-MM-DD'));
      const [list, nextStats] = await Promise.all([
        api.get(`/api/admin-date/todos?${query.toString()}`),
        api.get('/api/admin-date/todos/stats'),
      ]);
      setItems(list || []);
      setStats(nextStats || {});
    } catch (error) {
      message.error('加载 TODO 数据失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [keyword, statusFilter, priorityFilter, range?.[0]?.valueOf(), range?.[1]?.valueOf()]);

  const openCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ priority: 2, completed: false });
    setShowModal(true);
  };

  const openEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      content: record.content,
      category: record.category || '',
      note: record.note || '',
      priority: Number(record.priority || 2),
      completed: !!record.completed,
      tagsText: parseTagsText(record.tags),
      scheduleRange: record.start_at && record.end_at ? [dayjs(record.start_at), dayjs(record.end_at)] : null,
    });
    setShowModal(true);
  };

  const handleSubmit = async (values) => {
    try {
      const startAt = values.scheduleRange?.[0] ? values.scheduleRange[0].toISOString() : '';
      const endAt = values.scheduleRange?.[1] ? values.scheduleRange[1].toISOString() : '';
      const payload = {
        content: values.content,
        category: values.category || '',
        note: values.note || '',
        priority: Number(values.priority || 2),
        completed: !!values.completed,
        tags: serializeTags(values.tagsText || ''),
        start_at: startAt,
        end_at: endAt,
        due_date: endAt ? endAt.slice(0, 10) : startAt ? startAt.slice(0, 10) : null,
      };
      if (editingItem) {
        await api.put(`/api/admin-date/todos/${editingItem.id}`, payload);
        message.success('TODO 已更新');
      } else {
        await api.post('/api/admin-date/todos', payload);
        message.success('TODO 已新增');
      }
      setShowModal(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('保存 TODO 失败：' + error.message);
    }
  };

  const handleDelete = async (record) => {
    try {
      await api.delete(`/api/admin-date/todos/${record.id}`);
      message.success('TODO 已删除');
      loadData();
    } catch (error) {
      message.error('删除 TODO 失败：' + error.message);
    }
  };

  const columns = [
    {
      title: '任务内容',
      dataIndex: 'content',
      render: (value, record) => h(
        Space,
        { direction: 'vertical', size: 2 },
        h('span', { style: { fontWeight: 600 } }, value),
        record.note ? h(Text, { type: 'secondary' }, record.note) : null
      ),
    },
    {
      title: '时间安排',
      dataIndex: 'start_at',
      width: 260,
      render: (_, record) => formatSchedule(record),
    },
    {
      title: '分类 / 标签',
      dataIndex: 'category',
      width: 200,
      render: (_, record) => h(
        Space,
        { wrap: true, size: 6 },
        record.category ? h(Tag, { color: 'geekblue' }, record.category) : null,
        ...parseTagsText(record.tags).split('，').filter(Boolean).slice(0, 3).map((item) => h(Tag, { key: item }, item))
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 100,
      render: (value) => h(Tag, { color: Number(value) >= 3 ? 'red' : Number(value) === 2 ? 'orange' : 'blue' }, `P${value || 1}`),
    },
    {
      title: '状态',
      dataIndex: 'completed',
      width: 100,
      render: (value) => h(Tag, { color: value ? 'success' : 'default' }, value ? '已完成' : '待处理'),
    },
    canManage ? {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => h(
        Space,
        { size: 4 },
        h(Button, { type: 'link', onClick: () => openEdit(record) }, '编辑'),
        h(
          Popconfirm,
          { title: '确认删除该 TODO？', onConfirm: () => handleDelete(record) },
          h(Button, { type: 'link', danger: true }, '删除')
        )
      ),
    } : null,
  ].filter(Boolean);

  return h(
    React.Fragment,
    null,
    h(
      Row,
      { gutter: [16, 16], style: { marginBottom: 16 } },
      h(Col, { xs: 24, sm: 8 }, renderStatCard('任务总数', stats.total || 0, '#1677ff', 'rgba(22,119,255,0.18)')),
      h(Col, { xs: 24, sm: 8 }, renderStatCard('待处理', stats.pending || 0, '#fa8c16', 'rgba(250,140,22,0.18)')),
      h(Col, { xs: 24, sm: 8 }, renderStatCard('跨天任务', stats.crossDay || 0, '#722ed1', 'rgba(114,46,209,0.18)')),
    ),
    h(
      Card,
      { bordered: false, className: 'info-card', style: { marginBottom: 16 } },
      h(
        Space,
        { wrap: true, style: { width: '100%', justifyContent: 'space-between' } },
        h(Search, {
          allowClear: true,
          placeholder: '搜索任务内容、备注或分类',
          style: { width: 260 },
          value: keyword,
          onChange: (event) => setKeyword(event.target.value),
          onSearch: setKeyword,
        }),
        h(Select, {
          placeholder: '状态筛选',
          allowClear: true,
          value: statusFilter || undefined,
          onChange: (value) => setStatusFilter(value || ''),
          style: { width: 140 },
          options: [
            { label: '待处理', value: 'pending' },
            { label: '已完成', value: 'completed' },
          ],
        }),
        h(Select, {
          placeholder: '优先级',
          allowClear: true,
          value: priorityFilter || undefined,
          onChange: (value) => setPriorityFilter(value || ''),
          style: { width: 120 },
          options: [
            { label: 'P1', value: '1' },
            { label: 'P2', value: '2' },
            { label: 'P3', value: '3' },
          ],
        }),
        h(RangePicker, { value: range, onChange: (value) => setRange(value || []) }),
        canManage ? h(Button, { type: 'primary', onClick: openCreate }, '新增 TODO') : null
      )
    ),
    h(
      Card,
      { bordered: false, className: 'info-card' },
      h(Table, {
        rowKey: 'id',
        loading,
        columns,
        dataSource: items,
        pagination: { pageSize: 10, showSizeChanger: false },
        scroll: { x: 1080 },
      })
    ),
    h(
      Modal,
      {
        open: showModal,
        title: editingItem ? '编辑 TODO' : '新增 TODO',
        onCancel: () => {
          setShowModal(false);
          form.resetFields();
        },
        onOk: () => form.submit(),
        width: 680,
        destroyOnClose: true,
      },
      h(
        Form,
        { form, layout: 'vertical', onFinish: handleSubmit },
        h(Form.Item, { name: 'content', label: '任务内容', rules: [{ required: true, message: '请输入任务内容' }] }, h(Input, { placeholder: '例如：整理下周排期' })),
        h(
          Row,
          { gutter: 16 },
          h(Col, { span: 12 }, h(Form.Item, { name: 'priority', label: '优先级', initialValue: 2 }, h(Select, { options: [
            { label: 'P1 - 低', value: 1 },
            { label: 'P2 - 中', value: 2 },
            { label: 'P3 - 高', value: 3 },
          ] }))),
          h(Col, { span: 12 }, h(Form.Item, { name: 'category', label: '分类' }, h(Input, { placeholder: '例如：项目管理 / 生活' })))
        ),
        h(Form.Item, { name: 'scheduleRange', label: '时间安排（支持跨天）' }, h(RangePicker, { showTime: { format: 'HH:mm' }, style: { width: '100%' } })),
        h(Form.Item, { name: 'tagsText', label: '标签' }, h(Input, { placeholder: '多个标签用逗号分隔，例如：会议,输出,跨天' })),
        h(Form.Item, { name: 'note', label: '备注' }, h(TextArea, { rows: 4, placeholder: '补充任务说明、上下文或执行要求' })),
        h(Form.Item, { name: 'completed', label: '完成状态', valuePropName: 'checked' }, h(Switch, { checkedChildren: '已完成', unCheckedChildren: '待处理' }))
      )
    )
  );
}

export default TodoManager;

