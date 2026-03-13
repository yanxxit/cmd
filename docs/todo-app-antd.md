# TODO List 应用 - Ant Design 版本

## 📋 概述

基于 **Ant Design** 组件库重构的 TODO List 应用，使用 React + CDN 方式实现。

**技术栈**:
- **前端框架**: React 18
- **UI 组件库**: Ant Design 5.12
- **日期处理**: Day.js
- **JSX 解析**: Babel Standalone
- **后端 API**: Express + PGLite

---

## ✨ 功能特性

### 核心功能
- ✅ 添加/编辑/删除任务
- ✅ 任务完成状态切换
- ✅ 任务优先级（高/中/低）
- ✅ 截止日期设置
- ✅ 任务备注
- ✅ 任务搜索
- ✅ 筛选（全部/未完成/已完成）
- ✅ 排序（时间/优先级/截止日期）

### 子任务功能
- ✅ 为主任务添加子任务
- ✅ 折叠/展开子任务列表
- ✅ 子任务独立完成状态
- ✅ 显示子任务数量

### UI 特性
- ✅ Ant Design 专业 UI
- ✅ 响应式布局
- ✅ 统计面板
- ✅ 优雅的动画效果
- ✅ 空状态提示
- ✅ Toast 消息提示

---

## 🎨 设计亮点

### 1. 专业的 UI 设计
- 使用 Ant Design 5.12 组件库
- 统一的视觉语言
- 专业的交互体验

### 2. 折叠面板展示
- 主任务使用折叠面板（Collapse）
- 展开查看子任务
- 清晰的任务层级关系

### 3. 统计面板
- 头部显示任务统计
- 总计/未完成/已完成
- 实时数据更新

### 4. 优先级标签
- 🔴 高优先级（红色）
- 🟡 中优先级（橙色）
- 🟢 低优先级（绿色）

### 5. 逾期提醒
- 截止日期标签
- 逾期任务红色高亮

---

## 🚀 使用方式

### 访问地址
```
http://127.0.0.1:3000/todo/
```

### 启动服务
```bash
x-static  # 或 xtools static
```

---

## 📖 操作指南

### 添加任务
1. 在顶部输入框输入任务内容
2. 选择优先级（可选）
3. 按 Enter 或点击"添加"按钮

### 添加子任务
1. 找到主任务
2. 点击"➕"按钮
3. 输入子任务内容
4. 点击"添加"

### 编辑任务
1. 点击任务的"✏️"编辑按钮
2. 修改任务信息
3. 点击"保存"

### 删除任务
1. 点击任务的"🗑️"删除按钮
2. 确认删除

### 切换完成状态
- 点击任务前的复选框
- 或在折叠面板标题上点击复选框

### 查看子任务
- 点击主任务展开折叠面板
- 查看子任务列表

### 搜索任务
- 在搜索框输入关键词
- 实时搜索匹配的任务

### 筛选任务
- 选择"全部"/"未完成"/"已完成"

### 排序任务
- 选择排序方式：
  - 创建时间升序/降序
  - 优先级升序/降序
  - 截止日期升序

---

## 🎯 API 接口

### 获取任务列表
```
GET /api/todos?filter=all&sort=created_desc&search=&parent_id=null
```

### 创建任务
```
POST /api/todos
Body: { "content": "任务内容", "priority": 2, "due_date": "2026-12-31", "note": "备注", "parent_id": null }
```

### 更新任务
```
PUT /api/todos/:id
Body: { "content": "新内容", "completed": true, "priority": 1 }
```

### 删除任务
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

## 📦 CDN 资源

### React
```html
<script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
```

### Babel
```html
<script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7/babel.min.js"></script>
```

### Ant Design
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/antd@5.12.0/dist/reset.css">
<script src="https://cdn.jsdelivr.net/npm/antd@5.12.0/dist/antd.min.js"></script>
```

### Day.js
```html
<script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dayjs@1/locale/zh-cn.js"></script>
```

---

## 🎨 样式定制

### 主题色
- 主色：`#1890ff` (蓝色)
- 成功色：`#52c41a` (绿色)
- 警告色：`#faad14` (橙色)
- 错误色：`#ff4d4f` (红色)

### 自定义 CSS
在 `style.css` 中可以定制：
- 布局样式
- 卡片样式
- 任务项样式
- 响应式布局

---

## 🔧 开发调试

### 查看控制台
打开浏览器开发者工具（F12）查看：
- React 组件树
- 网络请求
- 错误信息

### API 测试
```bash
# 获取任务列表
curl http://127.0.0.1:3000/api/todos

# 创建任务
curl -X POST http://127.0.0.1:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"content":"测试任务","priority":2}'
```

---

## 📊 数据结构

### 任务对象
```javascript
{
  id: 1,
  content: "任务内容",
  completed: false,
  priority: 2,
  due_date: "2026-12-31",
  note: "备注信息",
  parent_id: null,
  tags: "[]",
  category: "",
  created_at: "2026-03-12T10:00:00Z",
  updated_at: "2026-03-12T10:00:00Z"
}
```

---

## ⚠️ 注意事项

1. **CDN 依赖**: 需要访问 cdn.jsdelivr.net
2. **浏览器要求**: 需要现代浏览器支持 ES6
3. **数据持久化**: 数据存储在服务器端 `.pgdata/todo/`
4. **子任务层级**: 当前支持一级子任务

---

## 🎯 后续优化

- [ ] 任务分类/标签
- [ ] 多级子任务
- [ ] 任务拖拽排序
- [ ] 数据导出/导入
- [ ] 深色模式
- [ ] 任务提醒
- [ ] 重复任务

---

*文档更新时间：2026-03-12*
