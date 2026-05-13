# 测试案例记录系统 - 需求规格说明书

## 1. 项目概述

### 1.1 项目背景
基于现有的测试案例管理系统（Vue 3 + Tailwind CSS + Alpine.js）进行重构升级，采用 React + Ant Design v5 技术栈，提供更专业的企业级 UI 界面和更完善的功能。

### 1.2 技术栈
- **前端框架**: React 18 + Ant Design v5
- **后端存储**: @yanit/jsondb（轻量级 JSON 数据库）
- **构建工具**: 原生 ES6 模块（无需构建）
- **样式方案**: Ant Design 组件库 + 自定义主题

### 1.3 项目目标
1. 实现测试案例的全生命周期管理（创建、查询、编辑、删除）
2. 支持测试案例集合管理（分组管理）
3. 提供强大的搜索和筛选功能
4. 支持 JSON 格式的请求/响应数据管理
5. 提供统计分析和数据可视化

---

## 2. 功能需求

### 2.1 测试案例集合管理

#### 2.1.1 功能描述
支持创建和管理多个测试案例集合，每个集合包含多个测试案例。

#### 2.1.2 数据结构
```javascript
{
  _id: "string",           // 自动生成
  name: "string",          // 集合名称（必填）
  description: "string",   // 集合描述（可选）
  createdAt: "string",     // ISO 8601 时间戳
  updatedAt: "string",     // ISO 8601 时间戳
  caseCount: "number"      // 案例数量（自动计算）
}
```

#### 2.1.3 功能点
- ✅ 创建测试案例集合
- ✅ 编辑集合信息
- ✅ 删除集合（可选：同时删除集合下所有案例）
- ✅ 查看集合列表和详情
- ✅ 统计每个集合的案例数量

---

### 2.2 测试案例管理

#### 2.2.1 功能描述
管理具体的测试案例，包括接口信息、请求参数、返回数据等。

#### 2.2.2 数据结构
```javascript
{
  _id: "string",              // 自动生成
  collectionId: "string",     // 所属集合 ID
  apiName: "string",          // 接口名称/云函数名称（必填）
  title: "string",            // 案例标题/简称（必填）
  tags: ["string"],           // 标签数组
  requestParams: {},          // 请求参数（JSON 格式）
  responseData: {},           // 返回数据（JSON 格式）
  remark: "string",           // 备注说明（文本格式）
  requestTime: "string",      // 请求时间（可选）
  createdAt: "string",        // 创建时间
  updatedAt: "string"         // 更新时间
}
```

#### 2.2.3 功能点
- ✅ 创建测试案例（支持默认案例模板）
- ✅ 编辑案例详情
- ✅ 删除案例（支持批量删除）
- ✅ 查看案例列表（分页）
- ✅ 查看案例详情
- ✅ 搜索案例（接口名、标题、标签）
- ✅ 筛选案例（按集合、接口名、标签）
- ✅ 复制案例数据
- ✅ String 转 JSON 功能

---

### 2.3 搜索与筛选

#### 2.3.1 功能描述
提供多维度、实时的搜索和筛选功能。

#### 2.3.2 搜索维度
- 🔍 **关键词搜索**: 接口名、标题模糊匹配
- 🏷️ **标签过滤**: 单个或多个标签
- 📦 **集合过滤**: 按测试案例集合筛选
- 🔌 **接口名分组**: 按接口名分组查看

#### 2.3.3 排序选项
- 创建时间（最新/最旧）
- 更新时间（最新/最旧）
- 接口名称（字母序）

---

### 2.4 统计分析

#### 2.4.1 功能描述
提供数据可视化和统计分析功能。

#### 2.4.2 统计维度
- 📊 **总览**: 案例总数、集合数、标签数
- 📈 **按集合统计**: 每个集合的案例数量
- 🏷️ **按标签统计**: 每个标签的使用频次
- 🔌 **按接口统计**: 每个接口的案例分布
- 📅 **趋势分析**: 近期创建/更新的案例

---

## 3. 非功能需求

### 3.1 性能要求
- 列表加载时间 < 500ms
- 搜索响应时间 < 300ms
- 支持至少 1000+ 案例的流畅操作

### 3.2 用户体验
- 响应式设计，支持多种屏幕尺寸
- 友好的错误提示和操作反馈
- 支持快捷键操作（ESC 关闭弹窗、Enter 保存等）
- 加载状态和骨架屏

### 3.3 数据持久化
- 使用 @yanit/jsondb 本地存储
- 自动备份和恢复机制
- 数据导出功能（JSON 格式）

---

## 4. 界面设计

### 4.1 整体布局
```
┌─────────────────────────────────────────────┐
│  Header (导航栏、全局操作)                    │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │     Main Content Area            │
│ (集合列  │     - 统计卡片                   │
│  表)     │     - 搜索筛选区                 │
│          │     - 案例列表表格               │
│          │     - 分页器                     │
└──────────┴──────────────────────────────────┘
```

### 4.2 核心页面

#### 4.2.1 案例列表页
- 顶部统计卡片（4 个）
- 搜索筛选区域
- 数据表格（支持行点击查看详情）
- 批量操作工具栏
- 分页器

#### 4.2.2 案例详情页
- 基本信息展示
- JSON 数据格式化显示
- 标签和备注
- 时间信息
- 快速编辑入口

#### 4.2.3 创建/编辑弹窗
- 表单验证
- 分区域展示（基本信息、请求参数、返回数据、备注标签）
- String 转 JSON 工具
- 标签管理
- 实时预览

#### 4.2.4 集合管理页
- 集合列表（卡片式布局）
- 集合详情（包含案例列表）
- 集合创建/编辑表单

---

## 5. API 设计

### 5.1 RESTful API 规范

#### 5.1.1 测试案例集合
```
GET    /api/test-case-collections          # 获取集合列表
POST   /api/test-case-collections          # 创建集合
GET    /api/test-case-collections/:id      # 获取集合详情
PUT    /api/test-case-collections/:id      # 更新集合
DELETE /api/test-case-collections/:id      # 删除集合
GET    /api/test-case-collections/:id/cases # 获取集合下的案例
```

#### 5.1.2 测试案例
```
GET    /api/test-cases                     # 获取案例列表
POST   /api/test-cases                     # 创建案例
GET    /api/test-cases/:id                 # 获取案例详情
PUT    /api/test-cases/:id                 # 更新案例
DELETE /api/test-cases/:id                 # 删除案例
POST   /api/test-cases/batch               # 批量操作
GET    /api/test-cases/stats               # 统计信息
GET    /api/test-cases/api-names           # 接口名列表
GET    /api/test-cases/tags                # 标签列表
```

### 5.2 响应格式
```javascript
// 成功响应
{
  "success": true,
  "data": {},
  "message": "操作成功"
}

// 失败响应
{
  "success": false,
  "error": "错误信息",
  "code": "错误码"
}

// 分页响应
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

## 6. 数据模型设计

### 6.1 JSONDB 集合定义

#### 6.1.1 collections 集合
存储测试案例集合信息
```javascript
{
  _id: "uuid",
  name: "string",
  description: "string",
  createdAt: "ISO8601",
  updatedAt: "ISO8601"
}
```

#### 6.1.2 testCases 集合
存储测试案例信息
```javascript
{
  _id: "uuid",
  collectionId: "uuid",
  apiName: "string",
  title: "string",
  tags: ["string"],
  requestParams: "JSONB",
  responseData: "JSONB",
  remark: "string",
  requestTime: "ISO8601",
  createdAt: "ISO8601",
  updatedAt: "ISO8601"
}
```

### 6.2 索引设计
- testCases.collectionId: 加速集合查询
- testCases.apiName: 加速接口名筛选
- testCases.tags: 加速标签查询
- testCases.createdAt: 加速时间排序

---

## 7. 默认数据

### 7.1 默认测试案例集合
```javascript
{
  name: "默认集合",
  description: "系统自动创建的默认测试案例集合"
}
```

### 7.2 默认测试案例模板
```javascript
{
  apiName: "/api/example",
  title: "示例案例",
  tags: ["示例", "模板"],
  requestParams: {
    "key": "value"
  },
  responseData: {
    "code": 200,
    "data": {}
  },
  remark: "这是一个默认的案例模板，可以删除或修改"
}
```

---

## 8. 扩展功能（可选）

### 8.1 数据导入导出
- 导出案例为 JSON 文件
- 从 JSON 文件导入案例
- 批量导出/导入

### 8.2 案例复制
- 一键复制案例
- 跨集合复制

### 8.3 历史记录
- 记录案例修改历史
- 支持版本回滚

### 8.4 API 测试
- 直接发送 HTTP 请求
- 实时验证返回数据

---

## 9. 技术实现要点

### 9.1 前端实现
- 使用 React Hooks 进行状态管理
- Ant Design 组件库
- 自定义 Hook 封装通用逻辑
- 响应式布局

### 9.2 后端实现
- Express 中间件架构
- @yanit/jsondb 数据持久化
- 统一的错误处理
- 请求验证和 sanitize

### 9.3 性能优化
- 虚拟滚动（大数据量时）
- 防抖搜索
- 缓存常用查询
- 懒加载组件

---

## 10. 验收标准

### 10.1 功能验收
- [ ] 所有 CRUD 操作正常工作
- [ ] 搜索筛选功能准确
- [ ] 统计分析数据正确
- [ ] 集合管理功能完整

### 10.2 性能验收
- [ ] 页面加载时间 < 1s
- [ ] 操作响应时间 < 300ms
- [ ] 支持 1000+ 案例流畅操作

### 10.3 质量验收
- [ ] 无控制台错误
- [ ] 所有交互有明确反馈
- [ ] 错误处理完善
- [ ] 代码符合规范

---

## 11. 项目结构

```
public/test-case-manager/
├── index.html              # 主页面
├── css/
│   └── style.css          # 自定义样式
└── js/
    ├── app.js             # 应用入口
    ├── components/
    │   ├── CollectionList.js    # 集合列表
    │   ├── TestCaseList.js      # 案例列表
    │   ├── TestCaseForm.js      # 案例表单
    │   ├── TestCaseDetail.js    # 案例详情
    │   └── StatsPanel.js        # 统计面板
    ├── hooks/
    │   ├── useTestCase.js       # 案例 Hook
    │   └── useCollection.js     # 集合 Hook
    └── utils/
        └── api.js               # API 封装

src/http-server/
├── test-case-api.js         # 测试案例 API
└── test-case-collection-api.js  # 集合 API

src/model/jsondb/
├── TestCase.js              # 案例 Model
└── TestCaseCollection.js    # 集合 Model
```

---

## 12. 开发计划

### Phase 1: 基础框架（1-2 天）
- 搭建项目结构
- 实现后端 API
- 实现基础 UI 组件

### Phase 2: 核心功能（2-3 天）
- 案例管理 CRUD
- 集合管理 CRUD
- 搜索筛选功能

### Phase 3: 增强功能（1-2 天）
- 统计分析
- 批量操作
- 数据导入导出

### Phase 4: 优化测试（1 天）
- 性能优化
- 用户体验优化
- 测试验收

---

## 13. 参考资料

- [@yanit/jsondb 文档](https://github.com/yanxxit/jsondb)
- [Ant Design v5 文档](https://ant.design/)
- [React 官方文档](https://react.dev/)
- 现有测试案例管理系统代码
