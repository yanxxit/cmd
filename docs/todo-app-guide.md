# TODO List 应用使用指南

## 📋 概述

基于 PGLite 的本地 TODO List 应用，数据存储在服务器端。

**技术栈**:
- 前端：原生 HTML + CSS + JavaScript
- 后端：Express + PGLite (嵌入式 PostgreSQL)
- 存储：服务器本地文件系统

---

## 🚀 快速开始

### 启动服务

```bash
x-static  # 或 xtools static
```

### 访问应用

访问地址：http://127.0.0.1:3000/todo/

---

## 📊 API 接口

### 获取 TODO 列表
```
GET /api/todos?filter=all&sort=created_desc&search=keyword
```

### 创建 TODO
```
POST /api/todos
Body: { "content": "任务内容", "priority": 2, "due_date": "2026-03-15", "note": "备注" }
```

### 更新 TODO
```
PUT /api/todos/:id
Body: { "completed": true, "priority": 1 }
```

### 删除 TODO
```
DELETE /api/todos/:id
```

### 批量操作
```
POST /api/todos/batch
Body: { "ids": [1, 2, 3], "action": "complete" }
```

### 获取统计
```
GET /api/todos/stats
```

---

## ✨ 功能特性

### 1. 任务管理
- ✅ 添加任务
- ✅ 编辑任务
- ✅ 删除任务
- ✅ 标记完成/未完成

### 2. 任务属性
- 📝 任务内容
- 🔴🟡🟢 优先级（高/中/低）
- 📅 截止日期
- 📝 备注信息

### 3. 筛选和排序
- **筛选**: 全部 / 未完成 / 已完成
- **排序**:
  - 按创建时间升序/降序
  - 按优先级升序/降序
  - 按截止日期升序

### 4. 搜索功能
- 🔍 实时搜索任务内容
- 支持模糊匹配

### 5. 批量操作
- ✅ 多选任务
- ✅ 批量完成
- ✅ 批量删除

### 6. 统计信息
- 📊 总任务数
- 📊 未完成数
- 📊 已完成数

---

## 🎯 使用技巧

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Enter` | 添加任务 / 确认操作 |
| `Esc` | 关闭对话框 / 取消选择 |

### 添加任务

1. 在输入框中输入任务内容
2. 按 `Enter` 键或点击"添加"按钮
3. 默认优先级为"中"，无截止日期

### 编辑任务

1. 鼠标悬停在任务上
2. 点击 ✏️ 编辑按钮
3. 修改任务信息
4. 点击"保存"

### 删除任务

**单个删除**:
1. 鼠标悬停在任务上
2. 点击 🗑️ 删除按钮
3. 确认删除

**批量删除**:
1. 勾选多个任务
2. 点击底部"删除"按钮
3. 确认删除

### 设置优先级

- 🔴 **高**: 紧急且重要的任务
- 🟡 **中**: 普通任务（默认）
- 🟢 **低**: 可以延后的任务

### 设置截止日期

- 点击日期选择器
- 选择截止日期
- 逾期任务会显示为红色

---

## 💾 数据存储

### 存储位置

数据存储在服务器文件系统中：
- 数据库路径：`.pgdata/todo`
- 表名：`todos`

### 数据结构

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

### 数据持久化

- ✅ 刷新页面数据不丢失
- ✅ 关闭浏览器数据不丢失
- ✅ 多设备共享数据（同一服务器）
- ⚠️ 服务器重启数据保留
- ⚠️ 清除服务器数据会删除所有任务

---

## 🎨 UI 说明

### 任务列表

```
┌─────────────────────────────────────────────────┐
│ ☐ 完成任务内容                                   │
│   🔴 高  📅 2026-03-15  📝 有备注  ⏰ 创建时间    │
│                                      [✏️] [🗑️]  │
└─────────────────────────────────────────────────┘
```

### 状态说明

- **未完成**: 复选框未勾选
- **已完成**: 复选框勾选，内容带删除线
- **逾期**: 截止日期显示为红色

---

## 🔧 高级用法

### 导出数据（未来功能）

```javascript
// 在控制台执行
const data = await db.exec('SELECT * FROM todos');
console.log(JSON.stringify(data.rows, null, 2));
```

### 导入数据（未来功能）

```javascript
// 在控制台执行
const todos = [...]; // JSON 数据
for (const todo of todos) {
  await db.exec(
    'INSERT INTO todos (content, priority, due_date, note) VALUES ($1, $2, $3, $4)',
    [todo.content, todo.priority, todo.due_date, todo.note]
  );
}
```

---

## ⚠️ 注意事项

1. **浏览器兼容性**
   - 需要支持 IndexedDB 的现代浏览器
   - 推荐：Chrome 90+, Firefox 88+, Safari 14+

2. **数据备份**
   - 定期导出重要数据
   - 清除浏览器缓存会删除数据

3. **性能建议**
   - 建议任务数 < 1000
   - 定期清理已完成任务

4. **隐私安全**
   - 数据仅存储在本地
   - 不会上传到服务器
   - 多设备不共享数据

---

## 🐛 故障排除

### 问题 1: 无法加载数据

**症状**: 页面显示"加载中..."

**解决**:
1. 打开浏览器控制台（F12）
2. 查看错误信息
3. 刷新页面重试

### 问题 2: 数据丢失

**症状**: 任务列表为空

**解决**:
1. 检查是否清除了浏览器数据
2. 检查是否在正确的浏览器
3. 无法恢复，需重新添加

### 问题 3: 无法添加任务

**症状**: 点击添加无反应

**解决**:
1. 检查任务内容是否为空
2. 查看控制台错误信息
3. 刷新页面重试

---

## 📝 更新日志

### v1.0.0 (2026-03-10)
- ✅ 初始版本发布
- ✅ 任务增删改查
- ✅ 筛选和排序
- ✅ 搜索功能
- ✅ 批量操作
- ✅ 优先级管理
- ✅ 截止日期管理

---

## 📞 技术支持

如有问题，请查看浏览器控制台错误信息，或联系开发者。
