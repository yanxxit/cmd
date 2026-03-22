# TODO List 应用需求文档

**版本**: 1.0.0  
**创建日期**: 2026-03-22  
**技术栈**: Next.js 16 + React 19 + Ant Design 5

---

## 📋 目录

1. [项目概述](#项目概述)
2. [功能需求](#功能需求)
3. [技术架构](#技术架构)
4. [UI/UX 设计](#uiux-设计)
5. [API 接口](#api-接口)
6. [数据结构](#数据结构)
7. [开发计划](#开发计划)

---

## 项目概述

### 背景

基于现有 Ant Design TODO 应用（CDN 版本）的功能，使用 Next.js 16 + React 19 重构为现代化 SPA 应用，部署在 `/todo-v8` 路径下。

### 目标

- ✅ 复用现有 API 接口
- ✅ 继承 Ant Design TODO 的所有功能
- ✅ 使用 Next.js 16 + React 19 技术栈
- ✅ 提供更好的开发体验和性能

### 技术选型

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.2.1 | React 框架 |
| **React** | 19.2.4 | UI 库 |
| **Ant Design** | 5.29.3 | UI 组件库 |
| **TypeScript** | 5.8.3 | 类型系统 |
| **Day.js** | 1.x | 日期处理 |

---

## 功能需求

### 1. 核心功能

#### 1.1 任务管理

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 添加任务 | 创建新任务，支持内容、优先级、截止日期、备注 | P0 |
| 编辑任务 | 修改任务的所有属性 | P0 |
| 删除任务 | 删除任务，支持确认对话框 | P0 |
| 完成状态 | 切换任务完成/未完成状态 | P0 |
| 批量操作 | 批量完成/删除任务 | P1 |

#### 1.2 任务属性

| 属性 | 类型 | 说明 | 优先级 |
|------|------|------|--------|
| content | string | 任务内容，必填 | P0 |
| priority | number | 优先级：1-高，2-中，3-低 | P0 |
| due_date | string | 截止日期，可选 | P0 |
| note | string | 备注信息，可选 | P1 |
| tags | array | 标签列表，可选 | P2 |
| category | string | 分类，可选 | P2 |

#### 1.3 子任务功能

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 添加子任务 | 为主任务添加子任务 | P0 |
| 子任务完成 | 独立完成子任务 | P0 |
| 折叠/展开 | 展开查看子任务列表 | P0 |
| 进度显示 | 显示子任务完成进度 | P1 |

### 2. 筛选和排序

#### 2.1 筛选功能

| 筛选方式 | 选项 | 说明 |
|----------|------|------|
| 状态筛选 | 全部/未完成/已完成 | 按完成状态筛选 |
| 优先级筛选 | 全部/高/中/低 | 按优先级筛选 |
| 日期筛选 | 全部/今天/本周/本月/逾期 | 按截止日期筛选 |

#### 2.2 排序功能

| 排序方式 | 方向 | 说明 |
|----------|------|------|
| 创建时间 | 升序/降序 | 按任务创建时间 |
| 优先级 | 升序/降序 | 按优先级高低 |
| 截止日期 | 升序/降序 | 按截止日期先后 |
| 更新时间 | 升序/降序 | 按最后更新时间 |

#### 2.3 搜索功能

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 关键词搜索 | 搜索任务内容和备注 | P0 |
| 实时搜索 | 输入时实时过滤 | P1 |
| 高亮匹配 | 搜索结果高亮关键词 | P2 |

### 3. 统计功能

#### 3.1 统计面板

| 统计项 | 说明 | 展示位置 |
|--------|------|----------|
| 总任务数 | 所有任务数量 | 头部 |
| 未完成数 | 未完成的任务数量 | 头部 |
| 已完成数 | 已完成的任务数量 | 头部 |
| 逾期数 | 已过期的任务数量 | 头部 |
| 今日到期 | 今天到期的任务数量 | 头部 |

#### 3.2 统计图表（可选）

| 图表类型 | 数据 | 优先级 |
|----------|------|--------|
| 饼图 | 任务状态分布 | P2 |
| 柱状图 | 每日完成任务数 | P2 |
| 趋势图 | 任务完成趋势 | P3 |

---

## 技术架构

### 1. 项目结构

```
next-app/
├── app/
│   └── todo-v8/
│       ├── page.tsx           # 主页面
│       └── layout.tsx         # 布局
├── components/
│   └── todo/
│       ├── index.ts           # 统一导出
│       ├── TodoApp.tsx        # 主应用组件
│       ├── TodoList.tsx       # 任务列表
│       ├── TodoItem.tsx       # 任务项
│       ├── SubTaskList.tsx    # 子任务列表
│       ├── TodoForm.tsx       # 任务表单
│       ├── FilterBar.tsx      # 筛选栏
│       ├── SortBar.tsx        # 排序栏
│       ├── StatsPanel.tsx     # 统计面板
│       └── EmptyState.tsx     # 空状态
├── hooks/
│   └── useTodo.ts             # TODO 自定义 Hook
├── lib/
│   └── todo-api.ts            # API 调用
└── types/
    └── todo.ts                # 类型定义
```

### 2. 组件设计

#### 2.1 TodoApp（主应用）

```typescript
interface TodoAppProps {
  initialFilter?: FilterType;
  initialSort?: SortType;
}

// 功能：
// - 状态管理
// - API 调用
// - 子组件协调
```

#### 2.2 TodoList（任务列表）

```typescript
interface TodoListProps {
  todos: Todo[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (todo: Todo) => void;
}

// 功能：
// - 渲染任务列表
// - 处理任务交互
```

#### 2.3 TodoItem（任务项）

```typescript
interface TodoItemProps {
  todo: Todo;
  subTodos?: Todo[];
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onAddSubTask: () => void;
}

// 功能：
// - 单个任务展示
// - 子任务折叠面板
// - 操作按钮
```

### 3. 自定义 Hook

#### useTodo

```typescript
interface UseTodoOptions {
  initialFilter?: FilterType;
  initialSort?: SortType;
}

interface UseTodoReturn {
  // 数据
  todos: Todo[];
  filteredTodos: Todo[];
  stats: TodoStats;
  loading: boolean;
  
  // 筛选和排序
  filter: FilterType;
  sort: SortType;
  search: string;
  
  // 操作
  addTodo: (data: TodoCreate) => Promise<void>;
  updateTodo: (id: number, data: TodoUpdate) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  toggleTodo: (id: number) => Promise<void>;
  setFilter: (filter: FilterType) => void;
  setSort: (sort: SortType) => void;
  setSearch: (search: string) => void;
}

export function useTodo(options?: UseTodoOptions): UseTodoReturn;
```

### 4. API 调用

#### lib/todo-api.ts

```typescript
// 获取任务列表
export async function getTodos(params?: TodoParams): Promise<Todo[]>;

// 创建任务
export async function createTodo(data: TodoCreate): Promise<Todo>;

// 更新任务
export async function updateTodo(id: number, data: TodoUpdate): Promise<Todo>;

// 删除任务
export async function deleteTodo(id: number): Promise<void>;

// 获取统计
export async function getStats(): Promise<TodoStats>;
```

---

## UI/UX 设计

### 1. 页面布局

```
┌─────────────────────────────────────────┐
│  📊 统计面板                              │
│  总计：10 | 未完成：6 | 已完成：4         │
├─────────────────────────────────────────┤
│  ➕ 添加任务  [输入框]     [优先级] [添加] │
├─────────────────────────────────────────┤
│  🔍 搜索  [筛选：全部▼] [排序：时间▼]    │
├─────────────────────────────────────────┤
│  📋 任务列表                              │
│  ┌─────────────────────────────────┐    │
│  │ ☐ 任务 1                        │    │
│  │   🔴 高  📅 2026-03-25          │    │
│  │   [➕ 子任务] [✏️ 编辑] [🗑️ 删除]│    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ ☑ 任务 2 (已完成)               │    │
│  │   🟢 低  📅 2026-03-20          │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 2. 组件设计

#### 2.1 优先级标签

```typescript
// 高优先级 - 红色
<Tag color="red">🔴 高</Tag>

// 中优先级 - 橙色
<Tag color="orange">🟡 中</Tag>

// 低优先级 - 绿色
<Tag color="green">🟢 低</Tag>
```

#### 2.2 截止日期标签

```typescript
// 逾期 - 红色
<Tag color="red">逾期 {days} 天</Tag>

// 今天 - 橙色
<Tag color="orange">今天</Tag>

// 本周 - 蓝色
<Tag color="blue">本周</Tag>

// 正常 - 灰色
<Tag>YYYY-MM-DD</Tag>
```

#### 2.3 空状态

```typescript
<Empty
  image={Empty.PRESENTED_IMAGE_SIMPLE}
  description="暂无任务，添加一个开始吧"
>
  <Button type="primary" icon={<PlusOutlined />}>
    添加任务
  </Button>
</Empty>
```

### 3. 响应式设计

| 断点 | 宽度 | 布局 |
|------|------|------|
| xs | < 576px | 单列，紧凑布局 |
| sm | ≥ 576px | 单列，标准布局 |
| md | ≥ 768px | 双列（可选） |
| lg | ≥ 992px | 双列（可选） |
| xl | ≥ 1200px | 三列（可选） |

### 4. 动画效果

```typescript
// 任务添加动画
<AnimatePresence>
  {todos.map(todo => (
    <motion.div
      key={todo.id}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
    >
      <TodoItem todo={todo} />
    </motion.div>
  ))}
</AnimatePresence>
```

---

## API 接口

### 基础信息

| 项目 | 值 |
|------|-----|
| 基础路径 | `/api/todos` |
| 数据格式 | JSON |
| 认证方式 | 无（可选添加） |

### 接口列表

#### 1. 获取任务列表

```
GET /api/todos
```

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filter | string | all | 筛选：all/pending/completed |
| priority | string | all | 优先级：all/high/medium/low |
| due_date | string | all | 日期：all/today/week/month/overdue |
| sort | string | created_desc | 排序：created_asc/created_desc/priority_asc/priority_desc/due_asc/due_desc |
| search | string | - | 搜索关键词 |
| parent_id | string | null | 父任务 ID，null 表示主任务 |

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "任务内容",
      "completed": false,
      "priority": 2,
      "due_date": "2026-12-31",
      "note": "备注",
      "parent_id": null,
      "tags": [],
      "category": "",
      "created_at": "2026-03-12T10:00:00Z",
      "updated_at": "2026-03-12T10:00:00Z"
    }
  ]
}
```

#### 2. 创建任务

```
POST /api/todos
```

**请求体**:

```json
{
  "content": "任务内容",
  "priority": 2,
  "due_date": "2026-12-31",
  "note": "备注信息",
  "parent_id": null,
  "tags": [],
  "category": ""
}
```

**必填字段**: `content`

#### 3. 更新任务

```
PUT /api/todos/:id
```

**请求体**:

```json
{
  "content": "新内容",
  "completed": true,
  "priority": 1,
  "due_date": "2026-12-31",
  "note": "新备注"
}
```

#### 4. 删除任务

```
DELETE /api/todos/:id
```

#### 5. 批量操作

```
POST /api/todos/batch
```

**请求体**:

```json
{
  "ids": [1, 2, 3],
  "action": "complete"
}
```

**action 选项**: `complete` | `uncomplete` | `delete`

#### 6. 获取统计

```
GET /api/todos/stats
```

**响应**:

```json
{
  "success": true,
  "data": {
    "total": 10,
    "completed": 4,
    "pending": 6,
    "overdue": 2,
    "today": 3
  }
}
```

---

## 数据结构

### TypeScript 类型定义

```typescript
// 任务对象
interface Todo {
  id: number;
  content: string;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  note: string | null;
  parent_id: number | null;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
}

// 优先级
type Priority = 1 | 2 | 3;  // 1-高，2-中，3-低

// 筛选类型
type FilterType = 'all' | 'pending' | 'completed';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'overdue';

// 排序类型
type SortType = 
  | 'created_asc' 
  | 'created_desc' 
  | 'priority_asc' 
  | 'priority_desc' 
  | 'due_asc' 
  | 'due_desc';

// 创建任务
interface TodoCreate {
  content: string;
  priority?: Priority;
  due_date?: string;
  note?: string;
  parent_id?: number | null;
  tags?: string[];
  category?: string;
}

// 更新任务
interface TodoUpdate {
  content?: string;
  completed?: boolean;
  priority?: Priority;
  due_date?: string;
  note?: string;
}

// 统计信息
interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  today: number;
}

// API 响应
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

---

## 开发计划

### 阶段一：基础功能（P0）

| 任务 | 预计时间 | 状态 |
|------|----------|------|
| 项目搭建 | 2h | ⬜ |
| 类型定义 | 1h | ⬜ |
| API 调用封装 | 2h | ⬜ |
| useTodo Hook | 3h | ⬜ |
| TodoApp 主组件 | 4h | ⬜ |
| TodoList 列表组件 | 3h | ⬜ |
| TodoItem 任务项 | 4h | ⬜ |
| TodoForm 表单组件 | 3h | ⬜ |

**小计**: 22h

### 阶段二：筛选排序（P1）

| 任务 | 预计时间 | 状态 |
|------|----------|------|
| FilterBar 筛选栏 | 3h | ⬜ |
| SortBar 排序栏 | 2h | ⬜ |
| 搜索功能 | 2h | ⬜ |
| StatsPanel 统计面板 | 2h | ⬜ |

**小计**: 9h

### 阶段三：子任务功能（P1）

| 任务 | 预计时间 | 状态 |
|------|----------|------|
| SubTaskList 子任务列表 | 3h | ⬜ |
| 子任务添加/编辑 | 3h | ⬜ |
| 进度显示 | 2h | ⬜ |

**小计**: 8h

### 阶段四：UI 优化（P2）

| 任务 | 预计时间 | 状态 |
|------|----------|------|
| 响应式布局 | 3h | ⬜ |
| 动画效果 | 3h | ⬜ |
| 空状态设计 | 1h | ⬜ |
| 主题定制 | 2h | ⬜ |

**小计**: 9h

### 阶段五：测试和优化（P2）

| 任务 | 预计时间 | 状态 |
|------|----------|------|
| 单元测试 | 4h | ⬜ |
| 性能优化 | 3h | ⬜ |
| Bug 修复 | 3h | ⬜ |
| 文档编写 | 2h | ⬜ |

**小计**: 12h

---

## 总计

| 阶段 | 预计时间 | 占比 |
|------|----------|------|
| 阶段一：基础功能 | 22h | 37% |
| 阶段二：筛选排序 | 9h | 15% |
| 阶段三：子任务功能 | 8h | 13% |
| 阶段四：UI 优化 | 9h | 15% |
| 阶段五：测试优化 | 12h | 20% |
| **总计** | **60h** | **100%** |

---

## 验收标准

### 功能验收

- [ ] 所有 P0 功能正常工作
- [ ] 所有 P1 功能正常工作
- [ ] 筛选和排序正确
- [ ] 子任务功能完整
- [ ] 统计数据显示正确

### 性能验收

- [ ] 首屏加载 < 2s
- [ ] 任务列表渲染 < 100ms（100 条数据）
- [ ] API 响应 < 500ms
- [ ] 无内存泄漏

### 质量验收

- [ ] TypeScript 类型完整
- [ ] ESLint 无错误
- [ ] 单元测试覆盖率 > 80%
- [ ] 无明显 Bug

---

## 附录

### 参考资源

- [Ant Design 文档](https://ant.design)
- [Next.js 16 文档](https://nextjs.org/docs/16)
- [React 19 文档](https://react.dev)
- [Day.js 文档](https://day.js.org)

### 相关文件

- [开发规范](./DEVELOPMENT_GUIDELINES.md)
- [快速参考](./QUICK_REFERENCE.md)
- [Ant Design 兼容性修复](./ANTD_REACT19_FIX.md)

---

**文档创建时间**: 2026-03-22  
**项目版本**: 2.0.0  
**状态**: 📝 待开发
