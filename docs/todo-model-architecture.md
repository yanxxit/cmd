# TODO Model 层架构说明

## 📁 目录结构

```
cmd/
├── src/
│   ├── model/                    # 数据模型层
│   │   ├── index.js              # 模型导出
│   │   ├── database.js           # 数据库连接管理
│   │   └── todo.js               # TODO 数据操作
│   └── http-server/
│       ├── static.js             # 主服务
│       └── todo-api.js           # API 路由（使用 model 层）
├── public/
│   └── todo/                     # 前端页面
└── .pgdata/
    └── todo/                     # PGLite 数据文件
```

---

## 🏗️ 架构说明

### 三层架构

```
┌─────────────────┐
│   Controller    │  ← todo-api.js (路由层)
│   (API Routes)  │     处理 HTTP 请求/响应
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Model       │  ← model/todo.js (数据模型)
│   (Data Layer)  │     处理数据操作逻辑
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │  ← model/database.js (数据库)
│   (PGLite)      │     处理数据库连接
└─────────────────┘
```

---

## 📦 Model 层说明

### database.js - 数据库连接管理

```javascript
// 初始化数据库
await initDatabase();

// 获取数据库实例
const db = getDatabase();

// 关闭数据库连接
await closeDatabase();
```

**功能**:
- 单例模式管理数据库连接
- 自动创建数据表
- 错误处理

---

### todo.js - TODO 数据操作

**导出函数**:

| 函数 | 说明 | 参数 |
|------|------|------|
| `getTodos(options)` | 获取任务列表 | `{ filter, sort, search }` |
| `getTodoById(id)` | 获取单个任务 | `id` |
| `createTodo(data)` | 创建任务 | `{ content, priority, due_date, note }` |
| `updateTodo(id, data)` | 更新任务 | `id`, `{ content, completed, ... }` |
| `deleteTodo(id)` | 删除任务 | `id` |
| `batchOperate(ids, action)` | 批量操作 | `ids`, `action` |
| `getTodoStats()` | 获取统计 | 无 |

---

## 🔌 API 路由使用 Model

### todo-api.js

```javascript
import { 
  initDatabase, 
  getTodos, 
  createTodo, 
  updateTodo, 
  deleteTodo,
  batchOperate,
  getTodoStats 
} from '../model/index.js';

// 初始化数据库中间件
router.use(initDB);

// 使用 model 层函数
router.get('/', async (req, res) => {
  const todos = await getTodos({ filter, sort, search });
  res.json({ success: true, data: todos });
});
```

---

## ✅ 优势

### 1. 职责分离
- **路由层**: 处理 HTTP 请求/响应
- **模型层**: 处理数据操作逻辑
- **数据库层**: 处理连接和查询

### 2. 代码复用
- Model 层函数可在多处使用
- 易于单元测试

### 3. 易于维护
- 数据操作逻辑集中管理
- 修改数据库不影响路由层

### 4. 易于扩展
- 添加新函数只需修改 model 层
- 可轻松切换数据库实现

---

## 📝 使用示例

### 创建任务

```javascript
// Controller 层 (todo-api.js)
router.post('/', async (req, res) => {
  const { content, priority, due_date, note } = req.body;
  
  // 调用 Model 层
  const todo = await createTodo({ content, priority, due_date, note });
  
  res.json({ success: true, data: todo });
});
```

### 获取任务列表

```javascript
// Controller 层 (todo-api.js)
router.get('/', async (req, res) => {
  const { filter, sort, search } = req.query;
  
  // 调用 Model 层
  const todos = await getTodos({ filter, sort, search });
  
  res.json({ success: true, data: todos });
});
```

---

## 🔄 数据流

```
用户请求
   │
   ▼
┌─────────────────┐
│  GET /api/todos │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  todo-api.js    │  ← 解析请求参数
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  getTodos()     │  ← 构建 SQL 查询
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PGLite         │  ← 执行查询
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  返回结果       │
└─────────────────┘
```

---

## 🛡️ 错误处理

### Model 层

```javascript
export async function createTodo(data) {
  // 验证数据
  if (!data.content) {
    throw new Error('任务内容不能为空');
  }
  
  // 数据库操作
  const db = getDatabase();
  const result = await db.exec(...);
  
  return rowToObject(result.rows[0]);
}
```

### Controller 层

```javascript
router.post('/', async (req, res) => {
  try {
    const todo = await createTodo(req.body);
    res.json({ success: true, data: todo });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
```

---

## 📊 数据库表结构

```sql
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 2,
  due_date DATE,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 扩展建议

### 添加新功能

1. **在 model/todo.js 中添加函数**:
```javascript
export async function searchTodos(keyword) {
  const db = getDatabase();
  const result = await db.exec(
    'SELECT * FROM todos WHERE content ILIKE $1',
    [`%${keyword}%`]
  );
  return result.rows.map(rowToObject);
}
```

2. **在 model/index.js 中导出**:
```javascript
export { searchTodos } from './todo.js';
```

3. **在 todo-api.js 中添加路由**:
```javascript
router.get('/search', async (req, res) => {
  const { keyword } = req.query;
  const todos = await searchTodos(keyword);
  res.json({ success: true, data: todos });
});
```

---

*文档更新时间：2026-03-10*
