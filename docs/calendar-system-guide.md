# 日历管理系统开发文档

> 📅 创建时间：2026-03-13  
> 📋 技术栈：Vue 3 + FullCalendar 6 + Tailwind CSS

---

## 🎯 功能概述

基于 FullCalendar 实现的日历管理页面，支持：
- ✅ 月/周/日视图切换
- ✅ 在日历上显示任务
- ✅ 点击日期添加任务
- ✅ 点击事件编辑任务
- ✅ 今日任务列表
- ✅ 月度统计信息
- ✅ 优先级颜色区分
- ✅ 响应式设计
- ✅ 夜间模式 🌙

---

## 📁 文件结构

```
public/calendar/
└── index.html          # 日历页面

src/http-server/
└── static.js           # 路由配置（已添加 /calendar）
```

---

## 🔧 技术栈

| 技术 | 版本 | CDN | 说明 |
|------|------|-----|------|
| Vue 3 | 3.4.21 | staticfile.org | 响应式框架 |
| FullCalendar | 6.1.11 | staticfile.org | 日历组件库 |
| Axios | 1.6.2 | staticfile.org | HTTP 请求库 |
| Tailwind CSS | - | cdn.tailwindcss.com | CSS 框架 |

---

## 🎨 页面布局

```
┌─────────────────────────────────────────────────────┐
│  📅 日历管理                                         │
│     查看和管理您的日程安排                            │
├───────────────────────────┬─────────────────────────┤
│                           │  📋 今日任务             │
│     FullCalendar          │  - 任务 1               │
│     日历组件               │  - 任务 2               │
│                           │                         │
│                           │  📊 本月统计             │
│                           │  总任务  已完成          │
│                           │  待处理  今日            │
│                           │                         │
│                           │  ⚡ 快捷操作             │
│                           │  月视图 周视图 日视图    │
└───────────────────────────┴─────────────────────────┘
```

---

## 📡 API 集成

### 获取任务列表

```javascript
// GET /api/todos
const res = await axios.get('/api/todos');
// 返回：{ success: true, data: [...] }
```

### 创建任务

```javascript
// POST /api/todos
await axios.post('/api/todos', {
  content: '任务内容',
  due_date: '2026-03-13',
  priority: 2,
  note: '备注'
});
```

### 更新任务

```javascript
// PUT /api/todos/:id
await axios.put(`/api/todos/${id}`, {
  content: '新内容',
  due_date: '2026-03-14',
  priority: 1,
  completed: true
});
```

### 删除任务

```javascript
// DELETE /api/todos/:id
await axios.delete(`/api/todos/${id}`);
```

---

## 🎯 核心功能

### 1. 日历视图

```javascript
const calendar = new FullCalendar.Calendar(calendarRef, {
  initialView: 'dayGridMonth',
  locale: 'zh-cn',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek,dayGridDay'
  },
  buttonText: {
    today: '今天',
    month: '月',
    week: '周',
    day: '日'
  }
});
```

### 2. 事件显示

```javascript
// 将任务转换为日历事件
const events = todos.map(todo => ({
  id: todo.id,
  title: todo.content,
  start: todo.due_date,
  backgroundColor: getEventColor(todo.priority),
  borderColor: getEventColor(todo.priority)
}));

// 优先级颜色
const getEventColor = (priority) => {
  return { 1: '#ef4444', 2: '#f59e0b', 3: '#10b981' }[priority];
};
```

### 3. 点击事件

```javascript
// 点击日期 - 添加任务
dateClick: (info) => {
  openAddModal(info.dateStr);
}

// 点击事件 - 编辑任务
eventClick: (info) => {
  openEditModal(info.event.extendedProps);
}
```

### 4. 今日任务

```javascript
const todayTasks = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return todos.value.filter(t => t.due_date === today);
});
```

### 5. 月度统计

```javascript
const stats = computed(() => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const monthTasks = todos.value.filter(t => {
    const d = new Date(t.due_date || t.created_at);
    return d >= monthStart && d <= monthEnd;
  });
  
  return {
    total: monthTasks.length,
    completed: monthTasks.filter(t => t.completed).length,
    pending: monthTasks.filter(t => !t.completed).length,
    today: todos.value.filter(t => t.due_date === today).length
  };
});
```

---

## 💻 使用指南

### 访问页面

```bash
# 1. 启动服务
x-static

# 2. 访问日历
http://127.0.0.1:3000/calendar/
```

### 添加任务

1. **点击日期格子** - 在日历上点击任意日期
2. **点击"添加"按钮** - 在今日任务区域点击添加
3. **填写表单** - 输入任务内容、选择日期和优先级
4. **保存** - 点击保存按钮

### 编辑任务

1. **点击日历事件** - 点击日历上的任务条
2. **修改信息** - 更新任务内容、日期或优先级
3. **保存** - 点击保存按钮

### 删除任务

1. **打开编辑模态框**
2. **点击"删除"按钮**
3. **确认删除**

### 切换视图

- **月视图** - 点击"月"按钮或左侧菜单
- **周视图** - 点击"周"按钮
- **日视图** - 点击"日"按钮
- **回到今天** - 点击"今天"按钮

---

## 🎨 样式定制

### 主题颜色

```css
:root {
  --fc-button-bg-color: #0ea5e9;
  --fc-event-bg-color: #3b82f6;
  --fc-today-bg-color: rgba(14, 165, 233, 0.1);
}
```

### 优先级颜色

```javascript
const priorityColors = {
  1: { bg: '#ef4444', text: '高' },   // 红色
  2: { bg: '#f59e0b', text: '中' },   // 橙色
  3: { bg: '#10b981', text: '低' }    // 绿色
};
```

---

## 📱 响应式设计

### 桌面端 (> 1024px)
- 完整布局：日历 + 侧边栏
- 三栏统计信息
- 快捷操作菜单

### 平板端 (768px - 1024px)
- 日历为主
- 侧边栏折叠

### 移动端 (< 768px)
- 仅显示日历
- 侧边栏隐藏
- 工具栏垂直排列

---

## 🔧 扩展功能

### 1. 任务拖拽

```javascript
const calendar = new FullCalendar.Calendar(calendarRef, {
  editable: true,
  eventDrop: (info) => {
    // 更新任务日期
    axios.put(`/api/todos/${info.event.id}`, {
      due_date: info.event.startStr
    });
  }
});
```

### 2. 任务分类

```javascript
// 添加分类字段
const categories = [
  { id: 1, name: '工作', color: '#3b82f6' },
  { id: 2, name: '生活', color: '#10b981' },
  { id: 3, name: '学习', color: '#8b5cf6' }
];
```

### 3. 重复任务

```javascript
// 添加重复规则
const recurrenceRules = {
  daily: '每天',
  weekly: '每周',
  monthly: '每月',
  yearly: '每年'
};
```

### 4. 提醒功能

```javascript
// 添加提醒时间
const reminders = [
  { minutes: 15, label: '提前 15 分钟' },
  { minutes: 60, label: '提前 1 小时' },
  { minutes: 1440, label: '提前 1 天' }
];
```

---

## 🐛 常见问题

### 1. 日历不显示

**原因：** Vue 挂载时机问题

**解决：**
```javascript
onMounted(() => {
  setTimeout(() => {
    initCalendar();
  }, 100);
});
```

### 2. 事件不更新

**原因：** 响应式数据未触发更新

**解决：**
```javascript
// 刷新日历事件
calendarInstance.value.removeAllEvents();
calendarInstance.value.addEventSource(newEvents);
```

### 3. 中文显示异常

**原因：** 语言包未加载

**解决：** 确保设置 `locale: 'zh-cn'`

---

## 📊 性能优化

### 1. 事件懒加载

```javascript
const calendar = new FullCalendar.Calendar(calendarRef, {
  events: (info, successCallback, failureCallback) => {
    axios.get(`/api/todos?start=${info.startStr}&end=${info.endStr}`)
      .then(res => successCallback(res.data.data));
  }
});
```

### 2. 虚拟滚动

对于大量任务，使用虚拟滚动优化列表渲染。

### 3. 防抖处理

```javascript
// 搜索防抖
const search = ref('');
const debouncedSearch = debounce((value) => {
  // 执行搜索
}, 300);
```

---

## 🔗 相关资源

- [FullCalendar 文档](https://fullcalendar.io/docs)
- [Vue 3 文档](https://vuejs.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)

---

## 📝 更新日志

### v1.0.0 (2026-03-13)
- ✅ 初始版本发布
- ✅ 月/周/日视图
- ✅ 任务添加/编辑/删除
- ✅ 今日任务列表
- ✅ 月度统计
- ✅ 响应式设计

---

*本文档基于 v1 版本编写，如有更新请参考最新代码。*
