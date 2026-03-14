# PGLite 数据导出工具使用文档

> 📅 创建时间：2026-03-13  
> 📋 技术栈：Vue 3 + PGLite + XLSX

---

## 🎯 功能概述

基于 PGLite 数据库的数据导出工具，支持：
- ✅ SQL 查询（仅 SELECT）
- ✅ CSV 导出
- ✅ SQL 导出（CREATE + INSERT）
- ✅ Excel 导出（.xlsx）
- ✅ 数据库表浏览
- ✅ 表结构查看

---

## 📁 文件结构

```
public/pglite-export/
└── index.html          # PGLite 导出工具页面

src/http-server/
└── pglite-export-api.js # PGLite 导出 API
```

---

## 🚀 快速开始

### 访问页面

```bash
# 启动服务
x-static

# 访问页面
http://127.0.0.1:3000/pglite-export/
```

---

## 📊 功能说明

### 1. SQL 查询

**支持操作：**
- ✅ SELECT 查询
- ✅ JOIN 查询
- ✅ 聚合函数
- ✅ 子查询
- ✅ WHERE 条件过滤

**限制：**
- ❌ DROP/DELETE/TRUNCATE 等危险操作
- ❌ ALTER/CREATE 等结构修改
- ❌ COPY 等文件操作

**示例查询：**
```sql
-- 查询所有任务
SELECT * FROM todos;

-- 带条件查询
SELECT * FROM todos WHERE completed = false;

-- 聚合查询
SELECT status, COUNT(*) as count FROM todos GROUP BY status;

-- 连接查询
SELECT t.*, s.content as subtask_content
FROM todos t
LEFT JOIN subtasks s ON t.id = s.todo_id;
```

### 2. CSV 导出

**导出格式：**
- UTF-8 编码（带 BOM）
- 逗号分隔
- 自动处理特殊字符

**示例输出：**
```csv
id,content,completed,priority
1,任务 1,false,2
2,任务 2,true,1
```

### 3. SQL 导出

**导出内容：**
- CREATE TABLE 语句
- INSERT INTO 语句

**示例输出：**
```sql
-- 导出数据
-- 时间：2026-03-13T12:00:00.000Z

CREATE TABLE IF NOT EXISTS exported_data (
  id TEXT,
  content TEXT,
  completed TEXT,
  priority TEXT
);

INSERT INTO exported_data (id, content, completed, priority) VALUES 
('1', '任务 1', 'false', '2');
INSERT INTO exported_data (id, content, completed, priority) VALUES 
('2', '任务 2', 'true', '1');
```

### 4. Excel 导出

**导出格式：**
- .xlsx 格式
- 自动列宽
- 工作表名称：Data

---

## 🎨 界面布局

```
┌─────────────────────────────────────────────┐
│  🗄️ PGLite 数据导出工具                     │
│  SQL 查询 · CSV 导出 · SQL 导出 · Excel 导出  │
├─────────────────────────────────────────────┤
│  📝 SQL 查询                                 │
│  [文本框：SELECT * FROM todos LIMIT 100]    │
│  [▶️ 执行] [📋 加载表] [🗑️ 清空]            │
├─────────────────────────────────────────────┤
│  📊 数据库表                                 │
│  [📄 todos] [📄 subtasks] [📄 users]        │
├─────────────────────────────────────────────┤
│  📈 查询结果 (100 行)                        │
│  [📄 CSV] [💾 SQL] [📊 Excel]               │
│  [📊 表格] [JSON] [CSV]                     │
│  ┌─────┬─────────┬───────────┐             │
│  │ id  │ content │ completed │             │
│  ├─────┼─────────┼───────────┤             │
│  │ 1   │ 任务 1   │ false     │             │
│  └─────┴─────────┴───────────┘             │
└─────────────────────────────────────────────┘
```

---

## 🔧 API 接口

### POST /api/pglite/query

执行 SQL 查询

**请求：**
```json
{
  "sql": "SELECT * FROM todos LIMIT 100"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "rows": [
      [1, "任务 1", false, 2],
      [2, "任务 2", true, 1]
    ],
    "fields": [
      {"name": "id", "dataTypeID": 23},
      {"name": "content", "dataTypeID": 25},
      {"name": "completed", "dataTypeID": 16},
      {"name": "priority", "dataTypeID": 23}
    ],
    "rowCount": 2
  }
}
```

### GET /api/pglite/tables

获取所有表结构

**响应：**
```json
{
  "success": true,
  "data": [
    {"table_name": "todos", "table_schema": "public"},
    {"table_name": "subtasks", "table_schema": "public"}
  ]
}
```

### GET /api/pglite/table/:tableName

获取表结构详情

**响应：**
```json
{
  "success": true,
  "data": {
    "tableName": "todos",
    "columns": [
      {"column_name": "id", "data_type": "integer", "is_nullable": "NO"},
      {"column_name": "content", "data_type": "text", "is_nullable": "NO"}
    ],
    "indexes": [
      {"indexname": "todos_pkey", "indexdef": "..."}
    ]
  }
}
```

---

## 💻 使用示例

### 1. 查询待处理任务

```sql
SELECT id, content, priority, created_at
FROM todos
WHERE completed = false
ORDER BY priority ASC, created_at DESC;
```

### 2. 导出为 CSV

1. 执行查询
2. 点击"📄 导出 CSV"按钮
3. 下载 `export_时间戳.csv` 文件

### 3. 导出为 SQL

1. 执行查询
2. 点击"💾 导出 SQL"按钮
3. 下载 `export_时间戳.sql` 文件

### 4. 导出为 Excel

1. 执行查询
2. 点击"📊 导出 Excel"按钮
3. 下载 `export_时间戳.xlsx` 文件

---

## 🔒 安全限制

**禁止的操作：**
- DROP - 删除表
- DELETE FROM - 删除数据
- TRUNCATE - 清空表
- ALTER - 修改表结构
- CREATE - 创建新表
- GRANT/REVOKE - 权限管理
- COPY - 文件复制

**原因：** 仅用于数据导出，防止意外数据丢失

---

## 🐛 常见问题

### 1. 查询失败

**原因：** SQL 语法错误

**解决：** 检查 SQL 语句，确保符合 PostgreSQL 语法

### 2. 导出失败

**原因：** 没有查询结果

**解决：** 先执行查询，确保有结果后再导出

### 3. 中文乱码

**原因：** CSV 文件编码问题

**解决：** 使用 Excel 打开时选择 UTF-8 编码

---

## 📚 相关资源

- [PGLite 文档](https://pglite.dev/)
- [Vue 3 文档](https://vuejs.org/)
- [XLSX 文档](https://sheetjs.com/)

---

## 📝 更新日志

### v1.0.0 (2026-03-13)
- ✅ 初始版本发布
- ✅ SQL 查询功能
- ✅ CSV 导出
- ✅ SQL 导出
- ✅ Excel 导出
- ✅ 表结构浏览

---

*本文档基于 v1.0.0 版本编写，如有更新请参考最新代码。*
