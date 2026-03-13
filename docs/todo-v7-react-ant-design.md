# TODO v7 - React + Ant Design v5 开发文档

> 📅 创建时间：2026-03-13  
> 📋 技术栈：React 18 + Ant Design v5 + Axios

---

## 🎯 版本特点

### 技术栈

| 技术 | 版本 | CDN | 说明 |
|------|------|-----|------|
| React | 18.3.1 | staticfile.org | Facebook 前端框架 |
| ReactDOM | 18.3.1 | staticfile.org | React DOM 渲染器 |
| Babel | 7.24.0 | staticfile.org | JSX 转译器 |
| Ant Design | 5.15.0 | staticfile.org | 企业级 UI 组件库 |
| Dayjs | 2.0.0 | staticfile.org | 日期处理库 |
| Axios | 1.6.2 | staticfile.org | HTTP 请求库 |

### CDN 说明

所有依赖均使用 **staticfile.org** 国内 CDN，确保稳定访问：

```html
<!-- React -->
<script src="https://cdn.staticfile.org/react/18.3.1/umd/react.production.min.js"></script>

<!-- Ant Design -->
<script src="https://cdn.staticfile.org/antd/5.15.0/antd.min.js"></script>

<!-- Axios -->
<script src="https://cdn.staticfile.org/axios/1.6.2/axios.min.js"></script>
```

---

## 🏗️ 架构设计

### 组件结构

```
TodoApp (主应用)
├── Header (头部卡片)
│   ├── Logo & 标题
│   ├── 模式切换 (工作/学习/生活)
│   └── 统计信息
├── Layout (布局)
│   ├── Sider (侧边栏)
│   │   ├── 筛选菜单
│   │   └── 排序选择器
│   └── Content (主内容)
│       ├── 添加任务表单
│       ├── 搜索栏
│       └── 任务列表
│           ├── 批量操作栏
│           └── 任务卡片
└── Modal (编辑模态框)
    ├── 任务信息表单
    └── 子任务管理
```

### 状态管理

```javascript
// 使用 React Hooks 管理状态
const [todos, setTodos] = useState([]);           // 任务列表
const [stats, setStats] = useState({});           // 统计数据
const [filter, setFilter] = useState('all');      // 筛选条件
const [sort, setSort] = useState('created_desc'); // 排序方式
const [search, setSearch] = useState('');         // 搜索关键词
const [loading, setLoading] = useState(false);    // 加载状态
const [selectedIds, setSelectedIds] = useState([]); // 选中任务
const [modalVisible, setModalVisible] = useState(false); // 模态框
const [editingTodo, setEditingTodo] = useState(null);    // 编辑中任务
const [subtasks, setSubtasks] = useState([]);     // 子任务
```

---

## 📦 核心功能

### 1. 任务管理

```javascript
// 添加任务
const handleAddTodo = async (values) => {
  const res = await axios.post('/api/todos', { 
    ...values, 
    priority: 2 
  });
  if (res.data.success) {
    message.success('任务添加成功');
    loadTodos();
  }
};

// 切换完成状态
const toggleTodoStatus = async (id, completed) => {
  const res = await axios.put(`/api/todos/${id}`, { completed });
  message.success(completed ? '任务已完成' : '任务已恢复');
};

// 删除任务
const handleDelete = async (id) => {
  Modal.confirm({
    title: '确认删除',
    onOk: async () => {
      await axios.delete(`/api/todos/${id}`);
      message.success('任务已删除');
    }
  });
};
```

### 2. 子任务管理

```javascript
// 添加子任务
const handleAddSubtask = async () => {
  const values = await subtaskForm.validateFields();
  const res = await axios.post('/api/todos/subtasks', {
    todo_id: editingTodo.id,
    content: values.content
  });
  message.success('子任务添加成功');
  loadSubtasks(editingTodo.id);
};

// 编辑子任务（双击）
const startEditSubtask = (subtask) => {
  setEditingSubtaskId(subtask.id);
  setEditingSubtaskContent(subtask.content);
};

// 保存子任务编辑
const saveSubtaskEdit = async (id) => {
  await axios.put(`/api/todos/subtasks/${id}`, { 
    content: editingSubtaskContent 
  });
  message.success('子任务已更新');
};
```

### 3. 批量操作

```javascript
// 批量完成
const batchComplete = async () => {
  await Promise.all(
    selectedIds.map(id => 
      axios.put(`/api/todos/${id}`, { completed: true })
    )
  );
  message.success(`已完成 ${selectedIds.length} 个任务`);
};

// 批量删除
const batchDelete = async () => {
  Modal.confirm({
    title: '确认删除',
    onOk: async () => {
      await Promise.all(
        selectedIds.map(id => axios.delete(`/api/todos/${id}`))
      );
      message.success(`已删除 ${selectedIds.length} 个任务`);
    }
  });
};
```

---

## 🎨 UI 组件使用

### Ant Design 组件

```javascript
const {
  Layout, Card, Button, Input, Select, Menu,
  Badge, Tag, Modal, Form, DatePicker, Checkbox,
  message, Empty, Spin, Statistic, Row, Col,
  Divider, Space, Typography, Dropdown
} = antd;
```

### 任务卡片

```jsx
<Card className="task-card" size="small">
  <Space align="start">
    <Checkbox checked={todo.completed} onChange={...} />
    <div className="task-content">
      <Text>{todo.content}</Text>
      <Space wrap>
        <span className="priority-badge">🔴 高</span>
        <Tag>📅 明天</Tag>
        <span className="subtask-info">📝 1/3</span>
      </Space>
    </div>
    <Space>
      <Button size="small" onClick={openEditModal}>✏️</Button>
      <Button size="small" danger onClick={handleDelete}>🗑️</Button>
    </Space>
  </Space>
</Card>
```

### 编辑模态框

```jsx
<Modal
  title="编辑任务"
  open={modalVisible}
  onOk={handleSaveEdit}
  onCancel={() => setModalVisible(false)}
  footer={[
    <Button danger onClick={handleDelete}>🗑️ 删除</Button>,
    <Button onClick={() => setModalVisible(false)}>取消</Button>,
    <Button type="primary" onClick={handleSaveEdit}>💾 保存</Button>
  ]}
>
  <Form form={form} layout="vertical">
    <Form.Item name="completed" valuePropName="checked">
      <Checkbox>标记为已完成</Checkbox>
    </Form.Item>
    <Form.Item name="content" label="任务内容">
      <Input.TextArea rows={3} />
    </Form.Item>
    <Form.Item name="due_date" label="截止日期">
      <DatePicker />
    </Form.Item>
  </Form>
</Modal>
```

---

## ⚛️ React Hooks 应用

### useEffect - 数据加载

```javascript
useEffect(() => {
  loadTodos();
  loadStats();
  const interval = setInterval(() => {
    loadTodos();
    loadStats();
  }, 30000);
  return () => clearInterval(interval);
}, [loadTodos, loadStats]);
```

### useMemo - 过滤和排序

```javascript
const filteredTodos = useMemo(() => {
  let result = [...todos];
  
  // 筛选
  if (filter === 'pending') result = result.filter(t => !t.completed);
  else if (filter === 'completed') result = result.filter(t => t.completed);
  
  // 搜索
  if (search) result = result.filter(t => 
    t.content.toLowerCase().includes(search.toLowerCase())
  );
  
  // 排序
  result.sort((a, b) => {
    switch (sort) {
      case 'created_asc': return new Date(a.created_at) - new Date(b.created_at);
      case 'priority_desc': return b.priority - a.priority;
      // ...
    }
  });
  
  return result;
}, [todos, filter, sort, search]);
```

### useCallback - 缓存函数

```javascript
const loadTodos = useCallback(async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    params.set('sort', sort);
    if (search) params.set('search', search);
    const res = await axios.get(`/api/todos?${params}`);
    if (res.data.success) setTodos(res.data.data);
  } catch (err) {
    message.error('加载任务失败');
  }
  setLoading(false);
}, [filter, sort, search]);
```

---

## 🎯 访问地址

| 环境 | 地址 |
|------|------|
| 本地开发 | http://127.0.0.1:3000/todo-v7/ |
| API 接口 | http://127.0.0.1:3000/api/todos |

---

## 📝 快速开始

```bash
# 1. 启动服务
x-static

# 2. 访问应用
http://127.0.0.1:3000/todo-v7/

# 3. 查看控制台
# React 开发工具将显示组件树
```

---

## 🔧 开发建议

### 1. 组件拆分

```javascript
// 推荐：拆分为独立组件
function TaskCard({ todo, onEdit, onDelete, onToggle }) {
  return (
    <Card>
      {/* 任务内容 */}
    </Card>
  );
}

function TaskList({ todos }) {
  return (
    <div>
      {todos.map(todo => (
        <TaskCard key={todo.id} todo={todo} {...handlers} />
      ))}
    </div>
  );
}
```

### 2. 状态提升

```javascript
// 父组件管理状态
function TodoApp() {
  const [todos, setTodos] = useState([]);
  
  return (
    <TaskList 
      todos={todos} 
      onAdd={handleAdd}
      onDelete={handleDelete}
    />
  );
}
```

### 3. 错误处理

```javascript
try {
  const res = await axios.post('/api/todos', data);
  message.success('操作成功');
} catch (err) {
  message.error('操作失败：' + err.message);
  console.error('Error:', err);
}
```

---

## 📊 性能优化

### 1. 使用 React.memo

```javascript
const TaskCard = React.memo(({ todo, onToggle }) => {
  console.log('TaskCard rendered');
  return <Card>...</Card>;
});
```

### 2. 使用 useMemo 缓存计算结果

```javascript
const filteredTodos = useMemo(() => {
  // 复杂计算
}, [todos, filter, sort]);
```

### 3. 使用 useCallback 缓存函数

```javascript
const handleToggle = useCallback((id) => {
  toggleTodoStatus(id);
}, []);
```

---

## 🐛 常见问题

### 1. CDN 加载失败

**解决：** 检查网络连接，或切换到其他 CDN 源

```html
<!-- 备用 CDN -->
<script src="https://cdn.bootcdn.net/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
```

### 2. Babel 转译错误

**解决：** 检查 JSX 语法，确保使用 `type="text/babel"`

```html
<script type="text/babel">
  // JSX 代码
</script>
```

### 3. Ant Design 组件不显示

**解决：** 确保 antd 对象已加载

```javascript
const { Button, Card } = antd;
console.log(antd); // 检查是否定义
```

---

## 📚 相关资源

- [React 官方文档](https://zh-hans.react.dev/)
- [Ant Design 文档](https://ant.design/)
- [staticfile CDN](https://www.staticfile.org/)
- [Axios 文档](https://axios-http.com/)

---

*本文档基于 v7 版本编写，如有更新请参考最新代码。*
