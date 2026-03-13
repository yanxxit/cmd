# TODO 应用数据库重构说明

## 📊 数据库结构优化

### 优化前的问题

**单一表结构 (todos)**:
- 使用 `parent_id` 字段自关联
- 主任务和子任务混在一起
- 查询复杂，需要递归
- 结构不清晰

### 优化后的结构

**两个独立的表**:
- `todos` - 主任务表
- `subtasks` - 子任务表
- 清晰的外键关系
- 结构清晰，易于维护

---

## 🗄️ 数据表设计

### 主任务表 (todos)

```sql
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,           -- 任务内容
  completed BOOLEAN DEFAULT false, -- 完成状态
  priority INTEGER DEFAULT 2,      -- 优先级 (1:高 2:中 3:低)
  due_date TEXT,                   -- 截止日期
  note TEXT,                       -- 备注
  tags TEXT DEFAULT '',            -- 标签
  category TEXT DEFAULT '',        -- 分类
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**索引**:
- `idx_todos_completed` - 完成状态索引
- `idx_todos_priority` - 优先级索引
- `idx_todos_due_date` - 截止日期索引
- `idx_todos_created_at` - 创建时间索引

---

### 子任务表 (subtasks)

```sql
CREATE TABLE subtasks (
  id SERIAL PRIMARY KEY,
  todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  content TEXT NOT NULL,           -- 子任务内容
  completed BOOLEAN DEFAULT false, -- 完成状态
  priority INTEGER DEFAULT 2,      -- 优先级
  sort_order INTEGER DEFAULT 0,    -- 排序顺序
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**索引**:
- `idx_subtasks_todo_id` - 外键索引（快速查询某任务的子任务）
- `idx_subtasks_completed` - 完成状态索引
- `idx_subtasks_sort_order` - 排序索引

**外键约束**:
- `ON DELETE CASCADE` - 删除主任务时自动删除所有子任务

---

## 🔌 API 接口

### 主任务 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/todos` | 获取任务列表 |
| POST | `/api/todos` | 创建任务 |
| PUT | `/api/todos/:id` | 更新任务 |
| DELETE | `/api/todos/:id` | 删除任务 |
| POST | `/api/todos/batch` | 批量操作 |
| GET | `/api/todos/stats` | 获取统计 |

### 子任务 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/subtasks?todo_id=1` | 获取子任务列表 |
| POST | `/api/subtasks` | 创建子任务 |
| PUT | `/api/subtasks/:id` | 更新子任务 |
| DELETE | `/api/subtasks/:id` | 删除子任务 |
| POST | `/api/subtasks/batch` | 批量操作子任务 |

---

## 💡 使用示例

### 创建主任务

```javascript
POST /api/todos
{
  "content": "完成项目",
  "priority": 1,
  "due_date": "2026-12-31",
  "note": "重要项目"
}
```

### 创建子任务

```javascript
POST /api/subtasks
{
  "todo_id": 1,
  "content": "需求分析",
  "priority": 2
}
```

### 获取任务及子任务

```javascript
// 1. 获取主任务
GET /api/todos/1

// 2. 获取子任务列表
GET /api/subtasks?todo_id=1

// 响应
{
  "success": true,
  "data": [
    {
      "id": 1,
      "todo_id": 1,
      "content": "需求分析",
      "completed": false,
      "priority": 2
    },
    {
      "id": 2,
      "todo_id": 1,
      "content": "设计数据库",
      "completed": true,
      "priority": 2
    }
  ]
}
```

### 更新子任务

```javascript
PUT /api/subtasks/1
{
  "completed": true
}
```

### 删除子任务

```javascript
DELETE /api/subtasks/1
```

---

## 🎯 优势对比

### 优化前 (单表自关联)

```
❌ 数据结构混乱
❌ 需要递归查询
❌ parent_id 可能为 NULL
❌ 删除主任务需要手动删除子任务
❌ 查询性能差
```

### 优化后 (双表关联)

```
✅ 结构清晰，职责分明
✅ 直接查询，无需递归
✅ 外键约束保证数据完整性
✅ 级联删除，自动清理
✅ 索引优化，查询高效
```

---

## 📊 数据关系

```
┌─────────────┐         ┌──────────────┐
│   todos     │         │  subtasks    │
├─────────────┤         ├──────────────┤
│ id (PK)     │◄────────│ todo_id (FK) │
│ content     │    1:N  │ id (PK)      │
│ completed   │         │ content      │
│ priority    │         │ completed    │
│ due_date    │         │ priority     │
│ note        │         │ sort_order   │
│ tags        │         │ ...          │
│ category    │         │              │
│ ...         │         │              │
└─────────────┘         └──────────────┘
```

---

## 🚀 Model 层结构

```
src/model/
├── database.js      # 数据库初始化和表创建
├── todo.js          # 主任务 CRUD 操作
├── subtask.js       # 子任务 CRUD 操作
└── index.js         # 统一导出
```

---

## 📝 注意事项

1. **级联删除**: 删除主任务会自动删除所有子任务
2. **事务支持**: 批量操作建议使用事务
3. **数据验证**: API 层需要验证 `todo_id` 是否存在
4. **排序**: 使用 `sort_order` 字段控制子任务显示顺序
5. **性能**: 为 `todo_id` 添加索引提高查询速度

---

*文档更新时间：2026-03-12*
