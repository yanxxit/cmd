# React + Ant Design 学习案例 - 完成报告

**创建日期**: 2026-03-22  
**访问地址**: http://localhost:3030/react-antd-learning

---

## 📚 案例概述

这是一个完整的 React + Ant Design 学习案例，展示了学生管理系统的 CRUD 操作。

### 技术栈

- **React 19.2.4** - UI 框架
- **Ant Design 5.29.3** - UI 组件库
- **TypeScript 5.8.3** - 类型系统
- **Next.js 16.2.1** - React 框架

---

## ✨ 功能特性

### 核心功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 学生列表展示 | ✅ | Table 组件展示数据 |
| 新增学生 | ✅ | 表单 + Modal 弹窗 |
| 编辑学生 | ✅ | 表单预填充数据 |
| 删除学生 | ✅ | Popconfirm 确认框 |
| 搜索功能 | ✅ | 按姓名搜索 |
| 筛选功能 | ✅ | 按等级筛选 |
| 表格排序 | ✅ | 点击列头排序 |
| 表格筛选 | ✅ | 内置筛选功能 |
| 分页功能 | ✅ | 每页 10 条数据 |
| 加载状态 | ✅ | Spin 加载指示器 |

### 表单功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 输入框 | ✅ | Input 组件 |
| 文本域 | ✅ | TextArea 组件 |
| 下拉选择 | ✅ | Select 组件 |
| 评分 | ✅ | Rate 组件 |
| 开关 | ✅ | Switch 组件 |
| 表单验证 | ✅ | 必填、类型验证 |

---

## 🎯 学习知识点

### React 核心概念

1. **useState** - 状态管理
   - 学生列表状态
   - 加载状态
   - 弹窗状态
   - 编辑状态

2. **useEffect** - 副作用处理
   - 组件挂载时获取数据
   - 依赖数组的使用

3. **事件处理**
   - 点击事件
   - 表单提交
   - 删除确认
   - 输入变化

4. **条件渲染**
   - 根据状态显示不同内容
   - 根据编辑状态显示不同按钮

5. **列表渲染**
   - Table 组件展示数据
   - rowKey 的设置

### Ant Design 组件

#### 输入类
- Input - 输入框
- TextArea - 文本域
- Select - 下拉选择
- InputNumber - 数字输入

#### 选择类
- Switch - 开关
- Slider - 滑块
- Rate - 评分

#### 反馈类
- Button - 按钮
- message - 消息提示
- Modal - 对话框
- Popconfirm - 确认框

#### 布局类
- Card - 卡片
- Divider - 分割线
- Space - 间距
- Table - 表格

---

## 📁 文件结构

```
app/
└── react-antd-learning/
    └── page.tsx          # 学习案例页面（约 400 行）

docs/
└── REACT_ANTD_LEARNING.md  # 学习文档
```

---

## 🎨 页面布局

```
┌─────────────────────────────────────────┐
│  📚 React + Ant Design 基础教程          │
│  本示例展示了 React 的常用功能...         │
├─────────────────────────────────────────┤
│  ⚠️ 本示例包含的 React 知识点             │
│  - useState - 状态管理                  │
│  - useEffect - 副作用处理               │
│  - ...                                  │
├─────────────────────────────────────────┤
│  [+ 新增学生] [🔄 刷新] [🔍 搜索] [等级▼]│
├─────────────────────────────────────────┤
│  表格数据展示区域                        │
│  ┌───┬────┬────┬──────┬────┬────┬────┐ │
│  │ID │姓名│年龄│邮箱  │等级│状态│操作│ │
│  ├───┼────┼────┼──────┼────┼────┼────┤ │
│  │1  │张三│20  │...   │A   │活跃│编辑│ │
│  └───┴────┴────┴──────┴────┴────┴────┘ │
├─────────────────────────────────────────┤
│  核心代码示例                            │
│  // 1. useState - 状态管理              │
│  const [students, setStudents] = ...    │
├─────────────────────────────────────────┤
│  Ant Design 常用组件展示                 │
│  输入类 | 选择类 | 反馈类                │
└─────────────────────────────────────────┘
```

---

## 💻 核心代码

### 状态管理

```typescript
// 定义状态
const [students, setStudents] = useState<Student[]>([]);
const [loading, setLoading] = useState(false);
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingStudent, setEditingStudent] = useState<Student | null>(null);
const [searchText, setSearchText] = useState('');
const [filterGrade, setFilterGrade] = useState<string>('all');
const [form] = Form.useForm();
```

### 数据获取

```typescript
// useEffect - 副作用处理
useEffect(() => {
  fetchStudents();
}, []);

// 模拟 API 调用
const fetchStudents = async () => {
  setLoading(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockData: Student[] = [...];
    setStudents(mockData);
    message.success('加载成功');
  } catch (error) {
    message.error('加载失败');
  } finally {
    setLoading(false);
  }
};
```

### 表单提交

```typescript
const onFinish: FormProps<StudentFormValues>['onFinish'] = async (values) => {
  setLoading(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (editingStudent) {
      // 更新学生
      setStudents(students.map(student =>
        student.id === editingStudent.id
          ? { ...student, ...values }
          : student
      ));
      message.success('更新成功');
    } else {
      // 新增学生
      const newStudent: Student = {
        id: Date.now(),
        ...values,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setStudents([...students, newStudent]);
      message.success('创建成功');
    }

    handleCloseModal();
  } catch (error) {
    message.error('操作失败');
  } finally {
    setLoading(false);
  }
};
```

### 表格列定义

```typescript
const columns: TableColumnsType<Student> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: '等级',
    dataIndex: 'grade',
    key: 'grade',
    width: 80,
    filters: [
      { text: 'A', value: 'A' },
      { text: 'B', value: 'B' },
    ],
    onFilter: (value, record) => record.grade === value,
    render: (grade: string) => (
      <Tag color={grade === 'A' ? 'green' : 'blue'}>{grade}</Tag>
    ),
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    render: (_, record) => (
      <Space size="small">
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
        <Popconfirm
          title="确定要删除吗？"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
          >
            删除
          </Button>
        </Popconfirm>
      </Space>
    ),
  },
];
```

---

## 📖 使用方式

### 访问页面

```bash
# 启动开发服务器
cd /Users/mac/github/cmd/next-app
pnpm dev

# 访问学习案例
http://localhost:3030/react-antd-learning
```

### 学习步骤

1. **查看页面展示** - 了解整体功能
2. **阅读代码注释** - 理解每个部分的作用
3. **查看核心代码示例** - 学习关键代码
4. **阅读学习文档** - 深入学习知识点
5. **完成练习任务** - 实践巩固知识

---

## 📚 学习文档

详细学习文档已保存到：
`docs/REACT_ANTD_LEARNING.md`

包含内容：
- 知识点详解
- 代码示例
- 最佳实践
- 练习任务
- 常见问题

---

## 🎯 练习任务

### 基础任务

- [ ] 添加"性别"字段
- [ ] 添加"出生日期"字段
- [ ] 实现按等级筛选
- [ ] 实现按状态筛选

### 进阶任务

- [ ] 添加批量删除功能
- [ ] 添加导出为 Excel 功能
- [ ] 添加导入 Excel 功能
- [ ] 实现分页功能

### 挑战任务

- [ ] 添加拖拽排序功能
- [ ] 实现实时搜索（防抖）
- [ ] 添加图表统计
- [ ] 实现深色模式

---

## ✅ 总结

### 技术要点

✅ **React Hooks** - useState、useEffect  
✅ **表单处理** - Form 组件、验证规则  
✅ **表格展示** - Table 组件、列定义  
✅ **CRUD 操作** - 创建、读取、更新、删除  
✅ **条件渲染** - 根据状态显示不同内容  
✅ **列表渲染** - Table 组件展示数据  
✅ **事件处理** - 点击、提交、删除等  
✅ **Ant Design** - 20+ 个常用组件  

### 适合人群

- React 初学者
- Ant Design 初学者
- 想学习 CRUD 操作的开发者
- 想做实战项目的学习者

---

**创建时间**: 2026-03-22  
**状态**: ✅ 完成  
**访问地址**: http://localhost:3030/react-antd-learning
