# React + Ant Design 学习案例

**访问地址**: http://localhost:3030/react-antd-learning

---

## 📚 案例概述

这是一个完整的 React + Ant Design 学习案例，展示了学生管理系统的 CRUD 操作。

### 技术栈

- **React 19** - UI 框架
- **Ant Design 5** - UI 组件库
- **TypeScript** - 类型系统
- **Next.js 16** - React 框架

---

## 🎯 学习目标

完成本案例后，你将掌握：

1. ✅ React Hooks（useState、useEffect）
2. ✅ 表单处理与验证
3. ✅ 表格数据展示
4. ✅ CRUD 操作（创建、读取、更新、删除）
5. ✅ 条件渲染与列表渲染
6. ✅ 事件处理
7. ✅ Ant Design 常用组件

---

## 📖 知识点详解

### 1. useState - 状态管理

```typescript
// 定义状态
const [students, setStudents] = useState<Student[]>([]);
const [loading, setLoading] = useState(false);
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingStudent, setEditingStudent] = useState<Student | null>(null);

// 更新状态
setStudents([...students, newStudent]); // 添加
setStudents(students.filter(s => s.id !== id)); // 删除
setStudents(students.map(s => s.id === id ? updated : s)); // 更新
```

**要点**:
- 状态更新是异步的
- 不要直接修改状态，要使用 setter 函数
- 对象/数组更新需要创建新引用

### 2. useEffect - 副作用处理

```typescript
// 组件挂载时执行一次
useEffect(() => {
  fetchStudents();
}, []); // 空依赖数组

// 依赖特定状态变化
useEffect(() => {
  console.log('学生列表变化了', students);
}, [students]); // 依赖 students
```

**要点**:
- 依赖数组为空：只在挂载时执行
- 依赖数组有值：在依赖变化时执行
- 没有依赖数组：每次渲染都执行

### 3. 表单处理

```typescript
// 定义表单类型
interface StudentFormValues {
  name: string;
  age: number;
  email: string;
  grade: string;
  rating: number;
  status: boolean;
}

// 创建表单实例
const [form] = Form.useForm();

// 表单提交处理
const onFinish: FormProps<StudentFormValues>['onFinish'] = async (values) => {
  // values 包含所有表单字段
  console.log(values);
};

// 设置表单值（编辑时）
form.setFieldsValue({
  name: '张三',
  age: 20,
  // ...
});

// 重置表单
form.resetFields();
```

### 4. 表格展示

```typescript
// 定义列
const columns: TableColumnsType<Student> = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    sorter: (a, b) => a.name.localeCompare(b.name), // 排序
  },
  {
    title: '等级',
    dataIndex: 'grade',
    filters: [ // 筛选
      { text: 'A', value: 'A' },
      { text: 'B', value: 'B' },
    ],
    onFilter: (value, record) => record.grade === value,
    render: (grade) => <Tag color={grade === 'A' ? 'green' : 'blue'}>{grade}</Tag>,
  },
  {
    title: '操作',
    render: (_, record) => (
      <Space>
        <Button onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm onConfirm={() => handleDelete(record.id)}>
          <Button danger>删除</Button>
        </Popconfirm>
      </Space>
    ),
  },
];

// 使用表格
<Table
  columns={columns}
  dataSource={students}
  loading={loading}
  rowKey="id"
  pagination={{ pageSize: 10 }}
/>
```

### 5. CRUD 操作

#### 创建（Create）

```typescript
const handleCreate = async (values: StudentFormValues) => {
  const newStudent: Student = {
    id: Date.now(),
    ...values,
    createdAt: new Date().toISOString().split('T')[0],
  };
  setStudents([...students, newStudent]);
  message.success('创建成功');
};
```

#### 读取（Read）

```typescript
const fetchStudents = async () => {
  setLoading(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 500)); // 模拟延迟
    const data = [...]; // 获取数据
    setStudents(data);
  } finally {
    setLoading(false);
  }
};
```

#### 更新（Update）

```typescript
const handleUpdate = async (values: StudentFormValues) => {
  if (!editingStudent) return;
  
  setStudents(
    students.map(student =>
      student.id === editingStudent.id
        ? { ...student, ...values }
        : student
    )
  );
  message.success('更新成功');
};
```

#### 删除（Delete）

```typescript
const handleDelete = async (id: number) => {
  setStudents(students.filter(student => student.id !== id));
  message.success('删除成功');
};
```

### 6. 条件渲染

```typescript
// 根据状态显示不同内容
{loading ? (
  <Spin tip="加载中..." />
) : students.length === 0 ? (
  <Empty description="暂无数据" />
) : (
  <Table columns={columns} dataSource={students} />
)}

// 根据条件显示按钮
{editingStudent ? (
  <Button type="primary">更新</Button>
) : (
  <Button type="primary">创建</Button>
)}
```

### 7. 列表渲染

```typescript
// 使用 Table 组件（推荐）
<Table
  columns={columns}
  dataSource={students}
  rowKey="id"
/>

// 使用 map（自定义列表）
{students.map(student => (
  <Card key={student.id} style={{ marginBottom: 16 }}>
    <h3>{student.name}</h3>
    <p>{student.email}</p>
  </Card>
))}
```

### 8. 事件处理

```typescript
// 点击事件
<Button onClick={() => setIsModalOpen(true)}>
  打开弹窗
</Button>

// 表单提交
<Form onFinish={onFinish}>
  {/* 表单字段 */}
</Form>

// 确认删除
<Popconfirm
  title="确定要删除吗？"
  onConfirm={() => handleDelete(id)}
  okText="确定"
  cancelText="取消"
>
  <Button danger>删除</Button>
</Popconfirm>

// 输入变化
<Input
  value={searchText}
  onChange={(e) => setSearchText(e.target.value)}
/>
```

---

## 🎨 Ant Design 常用组件

### 输入类

```typescript
// 输入框
<Input placeholder="请输入" />
<TextArea placeholder="多行输入" rows={4} />

// 下拉选择
<Select placeholder="请选择">
  <Option value="1">选项 1</Option>
  <Option value="2">选项 2</Option>
</Select>

// 数字输入
<InputNumber min={0} max={100} />
```

### 选择类

```typescript
// 开关
<Switch checkedChildren="开" unCheckedChildren="关" />

// 滑块
<Slider min={0} max={100} defaultValue={50} />

// 评分
<Rate />
```

### 反馈类

```typescript
// 按钮
<Button type="primary">主要按钮</Button>
<Button>默认按钮</Button>
<Button danger>危险按钮</Button>
<Button loading>加载按钮</Button>

// 消息提示
message.success('成功');
message.error('失败');
message.warning('警告');
message.info('提示');

// 确认框
Modal.confirm({
  title: '确认删除？',
  onOk: () => handleDelete(),
});
```

### 布局类

```typescript
// 卡片
<Card title="标题">内容</Card>

// 分割线
<Divider />

// 间距
<Space>
  <Button>按钮 1</Button>
  <Button>按钮 2</Button>
</Space>
```

---

## 💡 最佳实践

### 1. 类型定义

```typescript
// 定义数据类型
interface Student {
  id: number;
  name: string;
  age: number;
  email: string;
  grade: string;
  status: 'active' | 'inactive';
  rating: number;
  createdAt: string;
}

// 定义表单类型
interface StudentFormValues {
  name: string;
  age: number;
  email: string;
  grade: string;
  rating: number;
  status: boolean;
}
```

### 2. 异步处理

```typescript
// 使用 try-catch-finally
const fetchData = async () => {
  setLoading(true);
  try {
    const data = await api.getStudents();
    setStudents(data);
  } catch (error) {
    message.error('加载失败');
  } finally {
    setLoading(false);
  }
};
```

### 3. 表单验证

```typescript
<Form.Item
  name="email"
  label="邮箱"
  rules={[
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '请输入有效的邮箱地址' },
  ]}
>
  <Input />
</Form.Item>
```

### 4. 性能优化

```typescript
// 使用 useMemo 缓存计算结果
const filteredStudents = useMemo(() => {
  return students.filter(s => s.grade === filterGrade);
}, [students, filterGrade]);

// 使用 useCallback 缓存函数
const handleDelete = useCallback((id: number) => {
  setStudents(prev => prev.filter(s => s.id !== id));
}, []);
```

---

## 🔧 练习任务

### 基础任务

1. 添加"性别"字段
2. 添加"出生日期"字段
3. 实现按等级筛选
4. 实现按状态筛选

### 进阶任务

1. 添加批量删除功能
2. 添加导出为 Excel 功能
3. 添加导入 Excel 功能
4. 实现分页功能

### 挑战任务

1. 添加拖拽排序功能
2. 实现实时搜索（防抖）
3. 添加图表统计
4. 实现深色模式

---

## 📚 扩展阅读

- [React 官方文档](https://react.dev)
- [Ant Design 文档](https://ant.design)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Next.js 文档](https://nextjs.org/docs)

---

## ❓ 常见问题

### 1. 状态更新后视图不更新？

确保创建了新对象/数组：
```typescript
// ❌ 错误
student.name = '新名字';
setStudents(students);

// ✅ 正确
setStudents(students.map(s => 
  s.id === id ? { ...s, name: '新名字' } : s
));
```

### 2. useEffect 无限循环？

检查依赖数组：
```typescript
// ❌ 可能导致无限循环
useEffect(() => {
  fetchData();
}); // 没有依赖数组

// ✅ 正确
useEffect(() => {
  fetchData();
}, []); // 空依赖数组，只执行一次
```

### 3. 表单值无法重置？

使用 `form.resetFields()`：
```typescript
const handleClose = () => {
  setIsModalOpen(false);
  form.resetFields(); // 重置表单
};
```

---

**最后更新**: 2026-03-22  
**适用版本**: React 19 + Ant Design 5
