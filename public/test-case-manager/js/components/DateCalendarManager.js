const { createElement: h, useEffect, useMemo, useState } = React;
const {
  Badge, Button, Calendar, Card, Col, DatePicker, Drawer, Empty, Form, Input, InputNumber, Row, Segmented, Space, Tag, Typography, message,
} = antd;
const { Search, TextArea } = Input;
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

function getItemColor(item) {
  if (item.type === 'pomodoro') return 'processing';
  if (item.completed) return 'success';
  if (Number(item.priority) >= 3) return 'error';
  if (Number(item.priority) === 2) return 'warning';
  return 'default';
}

function getItemTag(item) {
  if (item.type === 'pomodoro') {
    return h(Tag, { color: 'blue' }, `${item.duration || 0} 分钟`);
  }
  if (item.isCrossDay) {
    return h(Tag, { color: 'purple' }, '跨天');
  }
  if (item.category) {
    return h(Tag, { color: 'geekblue' }, item.category);
  }
  return null;
}

function serializeTags(text = '') {
  return JSON.stringify(String(text || '').split(/[，,]/).map((item) => item.trim()).filter(Boolean));
}

function buildDefaultTodoRange(dateText = '') {
  return [
    dayjs(`${dateText}T09:00:00`),
    dayjs(`${dateText}T18:00:00`),
  ];
}

function buildDefaultPomodoroStart(dateText = '') {
  return dayjs(`${dateText}T09:00:00`);
}

function DateCalendarManager({ currentAdmin }) {
  const [todoQuickForm] = Form.useForm();
  const [pomodoroQuickForm] = Form.useForm();
  const [monthValue, setMonthValue] = useState(() => dayjs().startOf('month'));
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [calendarData, setCalendarData] = useState({ days: [], summary: {} });
  const [detailDate, setDetailDate] = useState('');
  const [drawerQuickType, setDrawerQuickType] = useState('');

  const canManageTodos = useMemo(
    () => Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes('todos.manage'),
    [currentAdmin]
  );
  const canManagePomodoro = useMemo(
    () => Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes('pomodoro.manage'),
    [currentAdmin]
  );

  const loadCalendar = async (nextMonth = monthValue, nextKeyword = keyword) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('month', nextMonth.format('YYYY-MM'));
      if (nextKeyword) query.set('keyword', nextKeyword);
      const data = await api.get(`/api/admin-date/calendar?${query.toString()}`);
      setCalendarData(data || { days: [], summary: {} });
    } catch (error) {
      message.error('加载日历数据失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar(monthValue, keyword);
  }, [monthValue, keyword]);

  useEffect(() => {
    if (!detailDate) return;
    todoQuickForm.setFieldsValue({
      content: '',
      priority: 2,
      category: '跨天任务',
      tagsText: 'mock,跨天',
      note: '',
      scheduleRange: buildDefaultTodoRange(detailDate),
    });
    pomodoroQuickForm.setFieldsValue({
      taskName: '',
      duration: 25,
      tag: '专注',
      note: '',
      startTime: buildDefaultPomodoroStart(detailDate),
    });
    setDrawerQuickType('');
  }, [detailDate]);

  const dayMap = useMemo(() => {
    const map = new Map();
    (calendarData.days || []).forEach((day) => map.set(day.date, day));
    return map;
  }, [calendarData]);

  const selectedDay = useMemo(() => dayMap.get(detailDate) || { items: [] }, [dayMap, detailDate]);

  const filterItems = (items = []) => {
    if (typeFilter === 'all') return items;
    if (typeFilter === 'todo') return items.filter((item) => item.type === 'todo');
    return items.filter((item) => item.type === 'pomodoro');
  };

  const buildCrossDayTodoMock = (overrides = {}) => {
    const anchorDay = detailDate || `${monthValue.format('YYYY-MM')}-15`;
    const startAt = dayjs(`${anchorDay}T22:00:00`);
    const endAt = startAt.add(1, 'day').hour(10).minute(30).second(0).millisecond(0);
    return {
      content: '跨天 TODO Mock：日历格联调验证',
      priority: 3,
      completed: false,
      category: '日历联调',
      note: '用于验证跨天任务会在起始日和结束日的日期格中都展示。',
      tags: serializeTags('mock,跨天,日历'),
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      due_date: endAt.format('YYYY-MM-DD'),
      ...overrides,
    };
  };

  const createCrossDayTodoMock = async (overrides = {}) => {
    const payload = buildCrossDayTodoMock(overrides);
    const result = await api.post('/api/admin-date/todos', payload);
    await loadCalendar(monthValue, keyword);
    setDetailDate(dayjs(payload.start_at).format('YYYY-MM-DD'));
    return { payload, result };
  };

  useEffect(() => {
    window.__TCM_CALENDAR_DEV__ = {
      buildCrossDayTodoMock,
      createCrossDayTodoMock,
    };
    return () => {
      delete window.__TCM_CALENDAR_DEV__;
    };
  }, [detailDate, monthValue, keyword]);

  const handleQuickCreateTodo = async (values) => {
    try {
      const startAt = values.scheduleRange?.[0] ? values.scheduleRange[0].toISOString() : '';
      const endAt = values.scheduleRange?.[1] ? values.scheduleRange[1].toISOString() : '';
      await api.post('/api/admin-date/todos', {
        content: values.content,
        priority: Number(values.priority || 2),
        completed: false,
        category: values.category || '',
        note: values.note || '',
        tags: serializeTags(values.tagsText || ''),
        start_at: startAt,
        end_at: endAt,
        due_date: endAt ? endAt.slice(0, 10) : startAt ? startAt.slice(0, 10) : detailDate,
      });
      message.success('TODO 已新增到当前日期');
      await loadCalendar(monthValue, keyword);
      setDrawerQuickType('');
      todoQuickForm.setFieldsValue({
        content: '',
        note: '',
        scheduleRange: buildDefaultTodoRange(detailDate),
      });
    } catch (error) {
      message.error('新增 TODO 失败：' + error.message);
    }
  };

  const handleQuickCreatePomodoro = async (values) => {
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
      message.success('番茄记录已新增到当前日期');
      await loadCalendar(monthValue, keyword);
      setDrawerQuickType('');
      pomodoroQuickForm.setFieldsValue({
        taskName: '',
        note: '',
        startTime: buildDefaultPomodoroStart(detailDate),
        duration: 25,
      });
    } catch (error) {
      message.error('新增番茄记录失败：' + error.message);
    }
  };

  const dateCellRender = (current) => {
    const dateKey = current.format('YYYY-MM-DD');
    const dayData = dayMap.get(dateKey);
    if (!dayData) {
      return h('div', { className: 'date-calendar-empty-cell' });
    }
    const items = filterItems(dayData.items || []);
    return h(
      'div',
      {
        className: `date-calendar-cell ${items.length ? 'date-calendar-cell-active' : ''}`,
        onClick: () => setDetailDate(dateKey),
      },
      ...items.slice(0, 3).map((item) => h(
        'div',
        { key: item.id, className: `date-calendar-item date-calendar-item-${item.type}` },
        h('span', { className: 'date-calendar-item-time' }, item.timeLabel || '--:--'),
        h('span', { className: 'date-calendar-item-title' }, item.title)
      )),
      items.length > 3 ? h('div', { className: 'date-calendar-more' }, `+${items.length - 3} 条更多`) : null
    );
  };

  const drawerExtra = (canManageTodos || canManagePomodoro) ? h(
    Space,
    { size: 8, wrap: true },
    canManageTodos ? h(Button, { size: 'small', type: drawerQuickType === 'todo' ? 'primary' : 'default', onClick: () => setDrawerQuickType(drawerQuickType === 'todo' ? '' : 'todo') }, '快速新增 TODO') : null,
    canManagePomodoro ? h(Button, { size: 'small', type: drawerQuickType === 'pomodoro' ? 'primary' : 'default', onClick: () => setDrawerQuickType(drawerQuickType === 'pomodoro' ? '' : 'pomodoro') }, '快速新增番茄') : null,
  ) : null;

  return h(
    React.Fragment,
    null,
    h(
      Row,
      { gutter: [16, 16], style: { marginBottom: 16 } },
      h(Col, { xs: 24, sm: 8 }, renderStatCard('月内 TODO', calendarData.summary?.todoCount || 0, '#1677ff', 'rgba(22,119,255,0.18)')),
      h(Col, { xs: 24, sm: 8 }, renderStatCard('月内番茄记录', calendarData.summary?.pomodoroCount || 0, '#722ed1', 'rgba(114,46,209,0.18)')),
      h(Col, { xs: 24, sm: 8 }, renderStatCard('跨天任务', calendarData.summary?.crossDayTodoCount || 0, '#fa8c16', 'rgba(250,140,22,0.18)')),
    ),
    h(
      Card,
      { bordered: false, className: 'info-card', style: { marginBottom: 16 } },
      h(
        Space,
        { wrap: true, size: 12, style: { width: '100%', justifyContent: 'space-between' } },
        h(Search, {
          allowClear: true,
          placeholder: '搜索 TODO / 番茄任务',
          style: { width: 280 },
          onSearch: setKeyword,
          onChange: (event) => setKeyword(event.target.value),
          value: keyword,
        }),
        h(Segmented, {
          value: typeFilter,
          onChange: setTypeFilter,
          options: [
            { label: '全部', value: 'all' },
            { label: 'TODO', value: 'todo' },
            { label: '番茄', value: 'pomodoro' },
          ],
        }),
        h(Text, { type: 'secondary' }, `${calendarData.month || monthValue.format('YYYY-MM')} · 点击日期可查看当天详情`)
      )
    ),
    h(
      Card,
      { bordered: false, className: 'info-card date-calendar-panel' },
      h(Calendar, {
        value: monthValue,
        mode: 'month',
        fullscreen: true,
        onPanelChange: (nextValue) => setMonthValue(nextValue.startOf('month')),
        onSelect: (nextValue) => setDetailDate(nextValue.format('YYYY-MM-DD')),
        dateCellRender,
      })
    ),
    h(
      Drawer,
      {
        title: detailDate ? `${detailDate} 日程明细` : '日程明细',
        width: 460,
        open: !!detailDate,
        extra: drawerExtra,
        onClose: () => setDetailDate(''),
      },
      h(
        Space,
        { direction: 'vertical', size: 12, style: { width: '100%' } },
        detailDate ? h(Text, { type: 'secondary' }, '可在当前抽屉中直接补录 TODO 和番茄记录，保存后日历格会立即刷新。') : null,
        drawerQuickType === 'todo'
          ? h(
              Card,
              { size: 'small', bordered: false, className: 'date-quick-create-card' },
              h(
                Form,
                { form: todoQuickForm, layout: 'vertical', onFinish: handleQuickCreateTodo },
                h(Form.Item, { name: 'content', label: '任务内容', rules: [{ required: true, message: '请输入任务内容' }] }, h(Input, { placeholder: '例如：跨天联调任务' })),
                h(
                  Row,
                  { gutter: 12 },
                  h(Col, { span: 12 }, h(Form.Item, { name: 'priority', label: '优先级', initialValue: 2 }, h(InputNumber, { min: 1, max: 3, style: { width: '100%' } }))),
                  h(Col, { span: 12 }, h(Form.Item, { name: 'category', label: '分类' }, h(Input, { placeholder: '例如：日历联调' })))
                ),
                h(Form.Item, { name: 'scheduleRange', label: '时间范围', rules: [{ required: true, message: '请选择时间范围' }] }, h(DatePicker.RangePicker, { showTime: { format: 'HH:mm' }, style: { width: '100%' } })),
                h(Form.Item, { name: 'tagsText', label: '标签' }, h(Input, { placeholder: '例如：mock,跨天' })),
                h(Form.Item, { name: 'note', label: '备注' }, h(TextArea, { rows: 3, placeholder: '补充这条任务的说明' })),
                h(Space, { size: 8 }, h(Button, { type: 'primary', onClick: () => todoQuickForm.submit() }, '保存 TODO'), h(Button, { onClick: () => setDrawerQuickType('') }, '取消'))
              )
            )
          : null,
        drawerQuickType === 'pomodoro'
          ? h(
              Card,
              { size: 'small', bordered: false, className: 'date-quick-create-card' },
              h(
                Form,
                { form: pomodoroQuickForm, layout: 'vertical', onFinish: handleQuickCreatePomodoro },
                h(Form.Item, { name: 'taskName', label: '任务名称', rules: [{ required: true, message: '请输入任务名称' }] }, h(Input, { placeholder: '例如：需求整理番茄' })),
                h(
                  Row,
                  { gutter: 12 },
                  h(Col, { span: 12 }, h(Form.Item, { name: 'startTime', label: '开始时间', rules: [{ required: true, message: '请选择开始时间' }] }, h(DatePicker, { showTime: { format: 'HH:mm' }, style: { width: '100%' } }))),
                  h(Col, { span: 12 }, h(Form.Item, { name: 'duration', label: '专注时长', initialValue: 25 }, h(InputNumber, { min: 1, max: 180, style: { width: '100%' } })))
                ),
                h(Form.Item, { name: 'tag', label: '标签' }, h(Input, { placeholder: '例如：专注 / 学习' })),
                h(Form.Item, { name: 'note', label: '备注' }, h(TextArea, { rows: 3, placeholder: '可选，补充记录说明' })),
                h(Space, { size: 8 }, h(Button, { type: 'primary', onClick: () => pomodoroQuickForm.submit() }, '保存番茄记录'), h(Button, { onClick: () => setDrawerQuickType('') }, '取消'))
              )
            )
          : null,
        filterItems(selectedDay.items || []).length
          ? h(
              Space,
              { direction: 'vertical', size: 12, style: { width: '100%' } },
              ...filterItems(selectedDay.items || []).map((item) => h(
                Card,
                { key: item.id, size: 'small', bordered: false, className: 'date-detail-card' },
                h(
                  Space,
                  { direction: 'vertical', size: 8, style: { width: '100%' } },
                  h(
                    Space,
                    { size: 8, wrap: true },
                    h(Badge, { color: item.type === 'pomodoro' ? '#1677ff' : '#722ed1', text: item.type === 'pomodoro' ? '番茄时钟' : 'TODO 任务' }),
                    h(Tag, { color: getItemColor(item) }, item.timeLabel || '全天'),
                    getItemTag(item)
                  ),
                  h('div', { style: { fontWeight: 600, fontSize: 15 } }, item.title),
                  item.note ? h(Text, { type: 'secondary' }, item.note) : null
                )
              ))
            )
          : h(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: '当前日期暂无相关记录' })
      )
    )
  );
}

export default DateCalendarManager;
