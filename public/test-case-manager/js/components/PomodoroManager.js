const { createElement: h, useEffect, useMemo, useState } = React;
const {
  Button, Card, Col, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Row, Space, Table, Tag, Typography, message,
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

function PomodoroManager({ currentAdmin }) {
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [range, setRange] = useState([]);
  const [sessionsResult, setSessionsResult] = useState({ sessions: [], count: 0 });
  const [stats, setStats] = useState({});
  const [history, setHistory] = useState({});
  const [settings, setSettings] = useState({});
  const [showModal, setShowModal] = useState(false);

  const canManage = useMemo(
    () => Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes('pomodoro.manage'),
    [currentAdmin]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (keyword) query.set('keyword', keyword);
      if (range?.[0]) query.set('startDate', range[0].format('YYYY-MM-DD'));
      if (range?.[1]) query.set('endDate', range[1].format('YYYY-MM-DD'));
      query.set('limit', '300');
      const [sessions, nextStats, nextHistory, nextSettings] = await Promise.all([
        api.get(`/api/admin-date/pomodoro/sessions?${query.toString()}`),
        api.get('/api/admin-date/pomodoro/statistics'),
        api.get('/api/admin-date/pomodoro/history?days=7'),
        api.get('/api/admin-date/pomodoro/settings'),
      ]);
      setSessionsResult(sessions || { sessions: [], count: 0 });
      setStats(nextStats || {});
      setHistory(nextHistory || {});
      setSettings(nextSettings || {});
      settingsForm.setFieldsValue(nextSettings || {});
    } catch (error) {
      message.error('加载番茄数据失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [keyword, range?.[0]?.valueOf(), range?.[1]?.valueOf()]);

  const handleCreate = async (values) => {
    try {
      const startTime = values.startTime;
      await api.post('/api/admin-date/pomodoro/sessions', {
        taskName: values.taskName,
        duration: Number(values.duration || 25),
        note: values.note || '',
        tag: values.tag || '',
        date: startTime.format('YYYY-MM-DD'),
        startTime: startTime.toISOString(),
      });
      message.success('番茄记录已新增');
      setShowModal(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('新增番茄记录失败：' + error.message);
    }
  };

  const handleDelete = async (record) => {
    try {
      await api.delete(`/api/admin-date/pomodoro/sessions/${record.id}`);
      message.success('番茄记录已删除');
      loadData();
    } catch (error) {
      message.error('删除失败：' + error.message);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const values = await settingsForm.validateFields();
      const result = await api.post('/api/admin-date/pomodoro/settings', values);
      setSettings(result || {});
      message.success('番茄设置已更新');
    } catch (error) {
      if (error?.errorFields) return;
      message.error('保存设置失败：' + error.message);
    }
  };

  const columns = [
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 180,
      render: (value, record) => h(
        Space,
        { direction: 'vertical', size: 0 },
        h('span', null, dayjs(value).format('YYYY-MM-DD HH:mm')),
        h(Text, { type: 'secondary' }, record.date || '-')
      ),
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      render: (value) => value || '番茄专注',
    },
    {
      title: '时长',
      dataIndex: 'duration',
      width: 100,
      render: (value) => `${value || 0} 分钟`,
    },
    {
      title: '标签',
      dataIndex: 'tag',
      width: 120,
      render: (value) => value ? h(Tag, { color: 'blue' }, value) : '-',
    },
    {
      title: '备注',
      dataIndex: 'note',
      ellipsis: true,
      render: (value) => value || '-',
    },
    canManage ? {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => h(
        Popconfirm,
        { title: '确认删除该番茄记录？', onConfirm: () => handleDelete(record) },
        h(Button, { type: 'link', danger: true }, '删除')
      ),
    } : null,
  ].filter(Boolean);

  const historyItems = Object.values(history || {}).sort((a, b) => b.date.localeCompare(a.date));

  return h(
    React.Fragment,
    null,
    h(
      Row,
      { gutter: [16, 16], style: { marginBottom: 16 } },
      h(Col, { xs: 24, sm: 8 }, renderStatCard('累计番茄次数', stats.totalSessions || 0, '#1677ff', 'rgba(22,119,255,0.18)')),
      h(Col, { xs: 24, sm: 8 }, renderStatCard('累计专注时长', `${stats.totalFocusTime || 0} 分钟`, '#722ed1', 'rgba(114,46,209,0.18)')),
      h(Col, { xs: 24, sm: 8 }, renderStatCard('本周番茄次数', stats.weekSessions || 0, '#52c41a', 'rgba(82,196,26,0.18)')),
    ),
    h(
      Row,
      { gutter: [16, 16] },
      h(
        Col,
        { xs: 24, xl: 16 },
        h(
          Card,
          { bordered: false, className: 'info-card', style: { marginBottom: 16 } },
          h(
            Space,
            { wrap: true, style: { width: '100%', justifyContent: 'space-between' } },
            h(Search, {
              allowClear: true,
              placeholder: '搜索任务名称、标签或备注',
              style: { width: 260 },
              value: keyword,
              onChange: (event) => setKeyword(event.target.value),
              onSearch: setKeyword,
            }),
            h(RangePicker, { value: range, onChange: (value) => setRange(value || []) }),
            canManage ? h(Button, { type: 'primary', onClick: () => setShowModal(true) }, '新增番茄记录') : null
          )
        ),
        h(
          Card,
          { bordered: false, className: 'info-card' },
          h(Table, {
            rowKey: 'id',
            loading,
            columns,
            dataSource: sessionsResult.sessions || [],
            pagination: { pageSize: 10, showSizeChanger: false },
            scroll: { x: 920 },
          })
        )
      ),
      h(
        Col,
        { xs: 24, xl: 8 },
        h(
          Card,
          { bordered: false, className: 'info-card', style: { marginBottom: 16 } },
          h(
            Space,
            { direction: 'vertical', size: 12, style: { width: '100%' } },
            h('div', { style: { fontSize: 16, fontWeight: 600 } }, '最近 7 天'),
            ...historyItems.map((item) => h(
              'div',
              { key: item.date, className: 'date-side-summary' },
              h('div', { className: 'date-side-summary-main' }, `${item.date} · ${item.dayOfWeek}`),
              h(Text, { type: 'secondary' }, `${item.sessions} 次 · ${item.focusTime} 分钟`)
            ))
          )
        ),
        h(
          Card,
          { bordered: false, className: 'info-card' },
          h(
            Form,
            {
              form: settingsForm,
              layout: 'vertical',
              onFinish: handleSaveSettings,
            },
            h('div', { style: { fontSize: 16, fontWeight: 600, marginBottom: 12 } }, '番茄设置'),
            h(Form.Item, { name: 'workDuration', label: '专注时长（分钟）', rules: [{ required: true, message: '请输入专注时长' }] }, h(InputNumber, { min: 1, max: 180, style: { width: '100%' } })),
            h(Form.Item, { name: 'shortBreak', label: '短休息（分钟）', rules: [{ required: true, message: '请输入短休息时长' }] }, h(InputNumber, { min: 1, max: 60, style: { width: '100%' } })),
            h(Form.Item, { name: 'longBreak', label: '长休息（分钟）', rules: [{ required: true, message: '请输入长休息时长' }] }, h(InputNumber, { min: 1, max: 120, style: { width: '100%' } })),
            h(Form.Item, { name: 'sessionsBeforeLongBreak', label: '多少次后长休息', rules: [{ required: true, message: '请输入阈值' }] }, h(InputNumber, { min: 1, max: 12, style: { width: '100%' } })),
            canManage ? h(Button, { type: 'primary', htmlType: 'submit', block: true }, '保存设置') : null,
            !canManage ? h(Text, { type: 'secondary' }, '当前账号只有查看权限') : null
          )
        )
      )
    ),
    h(
      Modal,
      {
        open: showModal,
        title: '新增番茄记录',
        onCancel: () => {
          setShowModal(false);
          form.resetFields();
        },
        onOk: () => form.submit(),
        destroyOnClose: true,
      },
      h(
        Form,
        { form, layout: 'vertical', onFinish: handleCreate },
        h(Form.Item, { name: 'taskName', label: '任务名称', rules: [{ required: true, message: '请输入任务名称' }] }, h(Input, { placeholder: '例如：整理需求文档' })),
        h(Form.Item, { name: 'startTime', label: '开始时间', rules: [{ required: true, message: '请选择开始时间' }] }, h(DatePicker, { showTime: { format: 'HH:mm' }, style: { width: '100%' } })),
        h(Form.Item, { name: 'duration', label: '专注时长（分钟）', initialValue: Number(settings.workDuration || 25), rules: [{ required: true, message: '请输入时长' }] }, h(InputNumber, { min: 1, max: 180, style: { width: '100%' } })),
        h(Form.Item, { name: 'tag', label: '标签' }, h(Input, { placeholder: '例如：开发 / 学习' })),
        h(Form.Item, { name: 'note', label: '备注' }, h(TextArea, { rows: 3, placeholder: '补充本次番茄时钟的说明' })),
      )
    )
  );
}

export default PomodoroManager;

