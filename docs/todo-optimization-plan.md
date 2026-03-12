# TODO 工具优化方案

## 概述
本文档记录了 TODO 应用的 3 个主要优化方向及其实现方案。

---

## 优化 1：任务分类/标签功能 ✅

### 目标
- 支持为任务添加多个标签（tags）
- 支持任务分类（category）
- 按标签/分类筛选任务

### 数据库变更
```sql
-- 新增字段
ALTER TABLE todos ADD COLUMN tags TEXT DEFAULT '';
ALTER TABLE todos ADD COLUMN category TEXT DEFAULT '';
```

### 后端实现
**文件**: `src/model/todo.js`
- `createTodo()` - 支持 `tags` (数组) 和 `category` (字符串) 参数
- `updateTodo()` - 支持更新 `tags` 和 `category`
- `rowToObject()` - 将 tags 字符串转换为数组

**API 端点**: `/api/todos`
```javascript
// 创建任务
POST /api/todos
{
  "content": "完成任务",
  "tags": ["工作", "紧急"],
  "category": "工作"
}

// 按标签筛选
GET /api/todos?tags=工作，紧急

// 按分类筛选
GET /api/todos?category=工作
```

### 前端实现
**UI 组件**:
1. 标签输入框（逗号分隔）
2. 分类下拉选择框
3. 标签显示（彩色标签样式）
4. 按标签/分类筛选按钮

**样式**:
```css
.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  margin-right: 4px;
}
.tag-work { background: #e3f2fd; color: #1565c0; }
.tag-personal { background: #e8f5e9; color: #2e7d32; }
.tag-urgent { background: #ffebee; color: #c62828; }
```

### 实现状态
- [x] 数据库字段添加
- [x] Model 层更新
- [ ] API 筛选参数支持
- [ ] 前端 UI 添加
- [ ] 标签颜色自动分配

---

## 优化 2：数据统计面板 📊

### 目标
- 可视化展示任务完成情况
- 按时间统计（日/周/月）
- 按分类/标签统计
- 完成率趋势图

### 统计维度

#### 1. 基础统计
- 总任务数
- 已完成/未完成数
- 今日完成数
- 逾期任务数

#### 2. 分类统计
- 各分类任务数量
- 各分类完成率

#### 3. 时间趋势
- 近 7 天完成任务数
- 近 30 天完成率

### API 设计
```javascript
// 获取统计数据
GET /api/todos/stats

// 响应示例
{
  "success": true,
  "data": {
    "total": 50,
    "completed": 35,
    "pending": 15,
    "overdue": 3,
    "todayCompleted": 5,
    "completionRate": 70,
    "byCategory": {
      "工作": { "total": 30, "completed": 20 },
      "个人": { "total": 20, "completed": 15 }
    },
    "last7Days": [
      { "date": "2026-03-05", "completed": 3 },
      { "date": "2026-03-06", "completed": 5 },
      ...
    ]
  }
}
```

### 前端实现
**统计卡片**:
```
┌────────────────────────────────────────┐
│  📊 任务统计                            │
├────────────────────────────────────────┤
│  总任务：50    已完成：35    完成率：70% │
│  未完成：15    已逾期：3     今日：5    │
├────────────────────────────────────────┤
│  按分类统计：                           │
│  工作 ████████░░ 30 (20/30)            │
│  个人 ██████░░░░ 20 (15/20)            │
├────────────────────────────────────────┤
│  近 7 天趋势：                           │
│  [图表区域]                             │
└────────────────────────────────────────┘
```

### 实现状态
- [ ] 统计 API 实现
- [ ] 统计面板 UI
- [ ] 图表库集成（Chart.js 或轻量级）
- [ ] 数据可视化

---

## 优化 3：数据导出/导入功能 💾

### 目标
- 支持导出数据为 JSON/CSV
- 支持从 JSON 导入数据
- 支持批量导出/导入
- 数据备份和恢复

### API 设计
```javascript
// 导出数据
GET /api/todos/export?format=json
GET /api/todos/export?format=csv

// 导入数据
POST /api/todos/import
Content-Type: multipart/form-data
{
  "file": <uploaded_file>
}
```

### 导出格式

#### JSON 格式
```json
{
  "version": "1.0",
  "exportedAt": "2026-03-10T12:00:00Z",
  "todos": [
    {
      "id": 1,
      "content": "任务内容",
      "completed": false,
      "priority": 2,
      "tags": ["工作", "紧急"],
      "category": "工作",
      "due_date": "2026-03-15",
      "note": "备注",
      "created_at": "2026-03-10T10:00:00Z"
    }
  ]
}
```

#### CSV 格式
```csv
id,content,completed,priority,tags,category,due_date,created_at
1,任务内容,false,2,"工作，紧急",工作，2026-03-15,2026-03-10T10:00:00Z
```

### 前端实现
**导出功能**:
- 导出按钮（工具栏）
- 格式选择（JSON/CSV）
- 自动下载文件

**导入功能**:
- 导入按钮
- 文件选择对话框
- 导入预览
- 冲突处理（跳过/覆盖/合并）

**UI 设计**:
```
┌─────────────────────────────────┐
│  📥 导入/导出                    │
├─────────────────────────────────┤
│  [导出 JSON]  [导出 CSV]        │
│                                 │
│  --- 或导入数据 ---             │
│  [选择文件] [开始导入]          │
│                                 │
│  ⚠️ 导入将覆盖现有数据          │
└─────────────────────────────────┘
```

### 实现状态
- [ ] 导出 API 实现
- [ ] 导入 API 实现
- [ ] 前端导出功能
- [ ] 前端导入功能
- [ ] 数据验证
- [ ] 冲突处理逻辑

---

## 实施计划

### 第一阶段：任务分类/标签（已完成 50%）
1. ✅ 数据库结构更新
2. ✅ Model 层更新
3. ⏳ API 筛选支持
4. ⏳ 前端 UI
5. ⏳ 测试

### 第二阶段：数据统计面板
1. 统计 API 开发
2. 统计面板 UI
3. 图表集成
4. 测试

### 第三阶段：数据导出/导入
1. 导出功能开发
2. 导入功能开发
3. 数据验证
4. 测试

---

## 技术选型

### 图表库（统计面板）
- **Chart.js** - 功能全面，但体积较大（60KB）
- **ApexCharts** - 现代化，交互好
- **轻量级方案** - 使用 CSS 进度条 + 简单折线图

推荐：**ApexCharts** 或 轻量级 CSS 方案

### CSV 处理
- 原生实现（简单场景）
- **PapaParse** - 专业 CSV 解析库（15KB）

推荐：**原生实现**（TODO 数据结构简单）

---

## 快速开始（开发环境）

```bash
# 清除旧数据库（应用新字段）
rm -rf .pgdata

# 启动服务
x-static

# 访问 TODO 应用
http://127.0.0.1:3000/todo/
```

---

## 更新日志

### v1.2.0 (计划中)
- ✨ 新增任务标签功能
- ✨ 新增任务分类功能
- ✨ 按标签/分类筛选

### v1.3.0 (计划中)
- ✨ 新增数据统计面板
- ✨ 可视化任务完成情况
- ✨ 完成率趋势图

### v1.4.0 (计划中)
- ✨ 支持数据导出（JSON/CSV）
- ✨ 支持数据导入
- ✨ 数据备份功能
