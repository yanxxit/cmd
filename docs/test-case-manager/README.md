# 测试案例记录系统

一个基于 React + Ant Design v5 和 @yanit/jsondb 的测试案例管理工具。

## 🚀 快速开始

### 访问方式
启动服务器后，访问：`http://127.0.0.1:8080/test-case-manager/`

### 启动命令
```bash
npx x-dev -p 8080
```

## ✨ 功能特性

### 1. 测试案例集合管理
- ✅ 创建多个测试案例集合
- ✅ 默认集合自动创建
- ✅ 集合间案例隔离
- ✅ 集合案例数量统计

### 2. 测试案例管理
- ✅ 创建、编辑、删除测试案例
- ✅ 支持 JSON 格式的请求参数和返回数据
- ✅ 标签管理
- ✅ 备注说明
- ✅ 请求时间记录

### 3. 搜索与筛选
- 🔍 关键词搜索（接口名、标题）
- 🏷️ 按标签筛选
- 🔌 按接口名分组
- 📦 按集合筛选

### 4. 统计分析
- 📊 总案例数
- 📁 集合数
- 🔌 接口数
- 🏷️ 标签数

## 📋 数据结构

### 测试案例集合
```json
{
  "_id": "uuid",
  "name": "集合名称",
  "description": "集合描述",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  "caseCount": 0
}
```

### 测试案例
```json
{
  "_id": "uuid",
  "collectionId": "uuid",
  "apiName": "/api/example",
  "title": "示例案例",
  "tags": ["示例", "模板"],
  "requestParams": {},
  "responseData": {},
  "remark": "备注说明",
  "requestTime": "ISO8601",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

## 🛠️ 技术栈

- **前端**: React 18 + Ant Design v5
- **后端**: Node.js + Express
- **数据库**: @yanit/jsondb（轻量级 JSON 数据库）
- **构建**: 原生 ES6 模块（无需构建）

## 📖 使用指南

### 创建测试集合
1. 点击左侧菜单的"集合管理"
2. 点击"新建集合"按钮
3. 输入集合名称和描述
4. 点击确定

### 创建测试案例
1. 在左侧集合列表选择要添加案例的集合
2. 点击"新建案例"按钮
3. 填写基本信息：
   - 接口名称（如：/api/users）
   - 案例标题（如：查询用户列表 - 正常场景）
4. 填写请求参数（支持 JSON 字符串）
5. 填写返回数据（支持 JSON 字符串）
6. 添加标签和备注
7. 点击确定

### 搜索案例
- 在搜索框输入关键词（接口名或标题）
- 使用筛选器选择接口名、标签
- 在不同集合间切换查看

### 编辑案例
1. 在案例列表中找到要编辑的案例
2. 点击"编辑"按钮
3. 修改案例信息
4. 点击确定保存

### 删除案例
1. 在案例列表中找到要删除的案例
2. 点击"删除"按钮
3. 确认删除

## 📊 API 接口

### 测试案例集合
```
GET    /api/test-case-collections          # 获取集合列表
POST   /api/test-case-collections          # 创建集合
GET    /api/test-case-collections/:id      # 获取集合详情
PUT    /api/test-case-collections/:id      # 更新集合
DELETE /api/test-case-collections/:id      # 删除集合
GET    /api/test-case-collections/stats    # 统计信息
```

### 测试案例
```
GET    /api/test-cases                     # 获取案例列表
POST   /api/test-cases                     # 创建案例
GET    /api/test-cases/:id                 # 获取案例详情
PUT    /api/test-cases/:id                 # 更新案例
DELETE /api/test-cases/:id                 # 删除案例
GET    /api/test-cases/stats               # 统计信息
GET    /api/test-cases/api-names           # 接口名列表
GET    /api/test-cases/tags                # 标签列表
```

## 💾 数据存储

数据存储在 `/.jsondb/` 目录下：
- `test-case-manager/` - 测试案例数据
- `test-case-collection/` - 测试集合数据

所有数据均为本地存储，不会上传到云端。

## 🎯 最佳实践

### 1. 集合命名建议
- 按项目分：`项目 A 测试 `、` 项目 B 测试`
- 按模块分：`用户模块 `、` 订单模块 `、` 支付模块`
- 按环境分：`开发环境 `、` 测试环境 `、` 生产环境`

### 2. 案例命名建议
- 格式：`[功能] - [场景]`
- 示例：
  - `用户管理 - 创建用户 - 正常场景`
  - `用户管理 - 创建用户 - 重复用户名`
  - `订单查询 - 按 ID 查询 - 订单不存在`

### 3. 标签使用建议
- 按测试类型：`功能测试 `、` 性能测试 `、` 边界测试`
- 按优先级：`P0 `、` P1`、` P2`
- 按状态：`已通过 `、` 待执行 `、` 已失败`

### 4. JSON 数据管理
- 请求参数和返回数据支持 JSON 字符串粘贴
- 建议使用格式化工具格式化 JSON
- 保持 JSON 数据结构清晰

## 🔧 开发说明

### 项目结构
```
public/test-case-manager/
├── index.html              # 主页面（React + Babel）
└── css/
    └── style.css          # 自定义样式

src/http-server/
├── test-case-api.js         # 测试案例 API
└── test-case-collection-api.js  # 集合 API

src/model/jsondb/
├── TestCase.js              # 案例 Model
└── TestCaseCollection.js    # 集合 Model
```

### 添加新功能
1. 在 Model 层添加数据操作方法
2. 在 API 层添加路由处理
3. 在前端添加 React 组件
4. 测试功能完整性

## ❓ 常见问题

### Q: 数据会丢失吗？
A: 数据存储在本地 `.jsondb` 目录，除非手动删除，否则不会丢失。

### Q: 支持导出案例吗？
A: 当前版本不支持，后续会添加导出功能。

### Q: 可以批量操作吗？
A: 当前版本支持批量删除，其他批量操作后续添加。

### Q: 如何备份数据？
A: 直接复制 `/.jsondb/` 目录即可备份所有数据。

## 📝 更新日志

### v1.0.0 (2026-05-13)
- ✅ 初始版本发布
- ✅ 测试案例集合管理
- ✅ 测试案例 CRUD
- ✅ 搜索筛选功能
- ✅ 统计面板
- ✅ React + Ant Design UI

## 📄 许可证

ISC

## 👨‍💻 作者

yanxxit

## 🙏 致谢

感谢使用本工具，如有问题请提交 Issue。
