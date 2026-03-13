# Mock API 平台使用文档

> 📅 创建时间：2026-03-13  
> 📋 日常开发常见接口场景 · 使用 @faker-js/faker 生成逼真数据

---

## 🎯 功能概述

提供日常开发中常见的业务接口场景，使用 **@faker-js/faker** 生成逼真的 Mock 数据，方便前端开发和测试：
- ✅ 用户管理（列表/详情/CRUD/筛选/排序）
- ✅ 文章管理（列表/详情）
- ✅ 商品管理（列表/详情）
- ✅ 订单管理（列表/详情）
- ✅ 评论管理
- ✅ 通知管理
- ✅ 仪表盘统计
- ✅ 全局搜索
- ✅ 选项数据
- ✅ 前端测试界面

**数据生成库：** [@faker-js/faker](https://fakerjs.dev/) v10.x

---

## 📁 文件结构

```
public/mock/
└── index.html              # 前端测试页面

src/http-server/
└── mock-api.js             # Mock API 路由
```

---

## 🎨 用户接口场景

### 1. 用户列表分页查询

**接口：** `GET /api/mock/users`

**查询参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| pageSize | number | 10 | 每页数量 |
| keyword | string | - | 关键词（搜索用户名/邮箱） |
| status | string | - | 状态：active/inactive/locked |
| gender | string | - | 性别：male/female |
| role | string | - | 角色：admin/user/guest |
| department | string | - | 部门 |
| minAge | number | - | 最小年龄 |
| maxAge | number | - | 最大年龄 |
| sort | string | id:desc | 排序：字段：asc/desc |

**请求示例：**
```bash
# 基础查询
curl "http://127.0.0.1:3000/api/mock/users?page=1&pageSize=10"

# 带筛选条件
curl "http://127.0.0.1:3000/api/mock/users?page=1&pageSize=10&status=active&gender=male&role=admin"

# 带关键词搜索
curl "http://127.0.0.1:3000/api/mock/users?keyword=admin"

# 带排序
curl "http://127.0.0.1:3000/api/mock/users?sort=createdAt:desc"

# 复杂筛选
curl "http://127.0.0.1:3000/api/mock/users?page=1&pageSize=20&department=技术部&minAge=25&maxAge=35&sort=age:asc"
```

**响应示例：**
```json
{
  "success": true,
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "user123",
        "email": "user@example.com",
        "phone": "13800138000",
        "avatar": "https://via.placeholder.com/100x100",
        "gender": "male",
        "age": 28,
        "address": "北京市朝阳区",
        "department": "技术部",
        "role": "user",
        "status": "active",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z",
        "lastLoginAt": "2026-01-02T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10,
      "hasMore": true
    }
  },
  "timestamp": 1234567890
}
```

### 2. 用户详情

**接口：** `GET /api/mock/users/:id`

**请求示例：**
```bash
curl "http://127.0.0.1:3000/api/mock/users/1"
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "avatar": "...",
    "gender": "male",
    "age": 28,
    "department": "技术部",
    "role": "user",
    "status": "active",
    "createdAt": "...",
    "recentOrders": [...],
    "recentComments": [...],
    "stats": {
      "totalOrders": 5,
      "totalComments": 10,
      "totalLikes": 100
    }
  }
}
```

### 3. 创建用户

**接口：** `POST /api/mock/users`

**请求体：**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "phone": "13800138000",
  "gender": "male",
  "department": "技术部",
  "role": "user"
}
```

**请求示例：**
```bash
curl -X POST "http://127.0.0.1:3000/api/mock/users" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com"}'
```

### 4. 更新用户

**接口：** `PUT /api/mock/users/:id`

**请求体：**
```json
{
  "username": "updated",
  "email": "updated@example.com",
  "status": "active"
}
```

**请求示例：**
```bash
curl -X PUT "http://127.0.0.1:3000/api/mock/users/1" \
  -H "Content-Type: application/json" \
  -d '{"status":"inactive"}'
```

### 5. 删除用户

**接口：** `DELETE /api/mock/users/:id`

**请求示例：**
```bash
curl -X DELETE "http://127.0.0.1:3000/api/mock/users/1"
```

### 6. 批量删除用户

**接口：** `POST /api/mock/users/batch-delete`

**请求体：**
```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

**请求示例：**
```bash
curl -X POST "http://127.0.0.1:3000/api/mock/users/batch-delete" \
  -H "Content-Type: application/json" \
  -d '{"ids":[1,2,3]}'
```

### 7. 更新用户状态

**接口：** `PUT /api/mock/users/:id/status`

**请求体：**
```json
{
  "status": "locked"
}
```

**请求示例：**
```bash
curl -X PUT "http://127.0.0.1:3000/api/mock/users/1/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"locked"}'
```

### 8. 用户统计

**接口：** `GET /api/mock/users/stats`

**请求示例：**
```bash
curl "http://127.0.0.1:3000/api/mock/users/stats"
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "active": 60,
    "inactive": 30,
    "locked": 10,
    "byGender": {
      "male": 50,
      "female": 50
    },
    "byRole": {
      "admin": 10,
      "user": 80,
      "guest": 10
    },
    "byDepartment": {
      "技术部": 30,
      "产品部": 20,
      "设计部": 15,
      "市场部": 15,
      "运营部": 10,
      "人事部": 5,
      "财务部": 5
    }
  }
}
```

### 9. 用户订单列表

**接口：** `GET /api/mock/users/:id/orders`

**请求示例：**
```bash
curl "http://127.0.0.1:3000/api/mock/users/1/orders?page=1&pageSize=10&status=paid"
```

---

## 📝 其他业务接口

### 文章接口

```bash
# 文章列表
GET /api/mock/articles?page=1&pageSize=10&category=技术&status=published

# 文章详情
GET /api/mock/articles/1
```

### 商品接口

```bash
# 商品列表（支持价格筛选）
GET /api/mock/products?page=1&pageSize=10&category=数码&minPrice=100&maxPrice=1000

# 商品详情
GET /api/mock/products/1
```

### 订单接口

```bash
# 订单列表（支持日期范围）
GET /api/mock/orders?page=1&pageSize=10&status=paid&startDate=2026-01-01&endDate=2026-12-31

# 订单详情
GET /api/mock/orders/ORD000001
```

### 评论接口

```bash
# 评论列表
GET /api/mock/comments?page=1&pageSize=10&targetType=article&targetId=1

# 待审核评论
GET /api/mock/comments?status=pending
```

### 通知接口

```bash
# 通知列表
GET /api/mock/notifications?page=1&pageSize=20&type=order

# 未读通知数
GET /api/mock/notifications/unread-count?userId=1

# 标记已读
PUT /api/mock/notifications/1/read

# 全部已读
PUT /api/mock/notifications/read-all
```

### 仪表盘接口

```bash
# 统计数据
GET /api/mock/dashboard/stats

# 图表数据
GET /api/mock/dashboard/chart-data?type=users&days=7
```

### 通用接口

```bash
# 全局搜索
GET /api/mock/search?keyword=测试&type=all

# 选项数据（用于下拉框）
GET /api/mock/options
```

---

## 💻 前端测试界面

### 访问方式

```bash
# 启动服务
x-static

# 访问前端界面
http://127.0.0.1:3000/mock/
```

### 功能特性

**选项卡导航：**
- 👤 用户
- 📝 文章
- 🛒 商品
- 📦 订单
- 💬 评论
- 📊 仪表盘

**API 列表：**
- 按类别查看可用 API
- 点击自动填充请求配置

**请求配置：**
- 页码/每页数量
- 关键词搜索
- 状态/性别/角色筛选
- 部门筛选
- 排序方式

**数据预览：**
- 表格展示用户数据
- 分页导航
- 响应结果 JSON 格式化

**主题切换：**
- 明/暗主题
- 本地存储偏好

---

## 🔧 使用场景

### 1. 前端开发阶段

```javascript
// Vue 组件中调用
async fetchUsers() {
  const res = await axios.get('/api/mock/users', {
    params: { page: 1, pageSize: 10, status: 'active' }
  });
  this.users = res.data.data.list;
  this.pagination = res.data.data.pagination;
}
```

### 2. 列表页面测试

```javascript
// 测试分页
const pages = [1, 2, 3];
for (const page of pages) {
  const res = await axios.get(`/api/mock/users?page=${page}&pageSize=20`);
  console.log(`Page ${page}:`, res.data.data.list.length);
}

// 测试筛选
const filters = [
  { status: 'active' },
  { gender: 'male' },
  { role: 'admin' },
  { department: '技术部' }
];
for (const filter of filters) {
  const res = await axios.get('/api/mock/users', { params: filter });
  console.log(filter, res.data.data.list);
}
```

### 3. 详情页面测试

```javascript
// 获取用户详情（包含关联数据）
const user = await axios.get('/api/mock/users/1');
console.log('用户信息:', user.data.data);
console.log('最近订单:', user.data.data.recentOrders);
console.log('最近评论:', user.data.data.recentComments);
console.log('统计数据:', user.data.data.stats);
```

### 4. 表单提交测试

```javascript
// 创建用户
const newUser = await axios.post('/api/mock/users', {
  username: 'test',
  email: 'test@example.com',
  department: '技术部'
});

// 更新用户
await axios.put('/api/mock/users/1', {
  status: 'inactive'
});

// 批量删除
await axios.post('/api/mock/users/batch-delete', {
  ids: [1, 2, 3]
});
```

### 5. 仪表盘测试

```javascript
// 获取统计数据
const stats = await axios.get('/api/mock/dashboard/stats');
console.log('用户统计:', stats.data.data.users);
console.log('订单统计:', stats.data.data.orders);

// 获取图表数据
const chartData = await axios.get('/api/mock/dashboard/chart-data?days=30');
console.log('30 天数据:', chartData.data.data);
```

---

## 📊 Mock 数据说明

### 数据生成库

使用 **@faker-js/faker** v10.x 生成逼真的测试数据：

```javascript
import { faker } from '@faker-js/faker';

// 配置（v10 自动检测 locale）
// faker.locale = 'zh_CN'; // v10 不再需要

// 生成人名
faker.person.firstName()  // "John"
faker.person.lastName()   // "Smith"
faker.person.fullName()   // "John Smith"

// 生成邮箱
faker.internet.email()    // "john.smith@example.com"

// 生成电话
faker.phone.number()      // "555-0123"

// 生成地址
faker.location.city()     // "New York"
faker.location.streetAddress()  // "123 Main St"

// 生成公司
faker.company.name()      // "Tech Corp"

// 生成图片（v10 新 API）
faker.image.avatar()      // GitHub 头像
faker.image.url({ width: 400, height: 200 })  // 随机图片

// 生成文本
faker.lorem.sentence()
faker.lorem.paragraph()

// 生成日期
faker.date.past({ years: 2 })
faker.date.recent()

// 生成数字
faker.number.int({ min: 18, max: 60 })
faker.number.float({ min: 1, max: 5 })

// 生成布尔值
faker.datatype.boolean({ probability: 0.7 })

// 随机选择
faker.helpers.arrayElement(['a', 'b', 'c'])
faker.helpers.weightedArrayElement([
  { weight: 70, value: 'active' },
  { weight: 30, value: 'inactive' }
])

// 生成生物信息
faker.person.bio()        // "underpants lover 😆"

// 生成网址
faker.internet.url()      // "https://example.com"
faker.internet.userName() // "john_smith"
```

**注意：** faker v10 有一些 API 变更：
- `faker.internet.userName()` → `faker.internet.username()` (小写)
- `faker.image.avatarGitHub()` → `faker.image.avatar()`
- `faker.image.urlLoremFlickr()` → `faker.image.url()`
- `faker.location.fullAddress()` → 使用 `streetAddress() + city() + state() + zipCode()` 组合

### 用户数据（100 条）

使用 faker 生成：
- **用户名**: `faker.internet.userName()`
- **邮箱**: `faker.internet.email()`
- **电话**: `faker.phone.number('1##-####-####')`
- **头像**: `faker.image.avatarGitHub()`
- **姓名**: `faker.person.firstName()` + `faker.person.lastName()`
- **地址**: `faker.location.city()` + `faker.location.street()`
- **部门**: 随机选择（技术部/产品部/设计部等）
- **角色**: 加权随机（admin 10% / user 80% / guest 10%）
- **状态**: 加权随机（active 60% / inactive 30% / locked 10%）
- **年龄**: `faker.number.int({ min: 18, max: 60 })`
- **创建时间**: `faker.date.past({ years: 2 })`

### 文章数据（50 条）

使用 faker 生成：
- **标题**: `faker.lorem.sentence({ min: 3, max: 8 })`
- **摘要**: `faker.lorem.paragraph()`
- **内容**: `faker.lorem.paragraphs()`
- **作者**: `faker.person.fullName()`
- **分类**: 随机选择（技术/产品/设计/市场/运营）
- **标签**: `faker.lorem.words()`
- **封面图**: `faker.image.urlLoremFlickr({ category: 'technology' })`
- **浏览量**: `faker.number.int({ min: 0, max: 10000 })`
- **状态**: 加权随机（published 70% / draft 20% / archived 10%）

### 商品数据（60 条）

使用 faker 生成：
- **名称**: `faker.commerce.productName()` + 产品类型
- **描述**: `faker.commerce.productDescription()`
- **价格**: `faker.commerce.price({ min: 99, max: 9999 })`
- **分类**: 随机选择（数码/家电/服装/食品/图书）
- **品牌**: 知名品牌（Apple/华为/小米等）
- **图片**: `faker.image.urlLoremFlickr({ category: 'product' })`
- **评分**: `faker.number.float({ min: 1, max: 5 })`
- **状态**: 加权随机（onsale 70% / offsale 20% / outofstock 10%）

### 订单数据（80 条）

使用 faker 生成：
- **订单号**: `ORD` + 时间戳 + 序号
- **用户**: 随机用户 ID 和姓名
- **商品**: 随机 1-5 个商品
- **价格**: `faker.commerce.price()`
- **状态**: 加权随机（pending/paid/shipped/completed/cancelled/refunded）
- **支付方式**: 随机选择（alipay/wechat/card/cod）
- **地址**: `faker.location.fullAddress()`
- **时间**: `faker.date.past()` / `faker.date.recent()`

### 评论数据（200 条）

使用 faker 生成：
- **内容**: `faker.lorem.paragraph()`
- **评分**: `faker.number.int({ min: 1, max: 5 })`
- **图片**: 50% 概率生成 `faker.image.urlLoremFlickr()`
- **类型**: 随机选择（article/product/order）
- **状态**: 加权随机（approved 70% / pending 20% / rejected 10%）

### 通知数据（50 条）

使用 faker 生成：
- **标题**: `faker.lorem.sentence()`
- **内容**: `faker.lorem.paragraph()`
- **类型**: 随机选择（system/order/message/comment/like）
- **已读**: 70% 概率已读 `faker.datatype.boolean({ probability: 0.7 })`
- **链接**: `faker.internet.url()`

---

## 🐛 常见问题

### 1. 数据不更新

**原因：** Mock 数据在服务器启动时生成

**解决：** 重启服务器刷新数据

### 2. 筛选条件无效

**原因：** 参数名称错误或值不匹配

**解决：** 检查 API 文档，确保参数正确

### 3. 分页数据为空

**原因：** 页码超出范围

**解决：** 检查 total 和 totalPages，确保页码有效

---

## 🔗 相关资源

- [HTTP 测试平台](/httpbin/) - HTTP 请求测试
- [TODO 应用](/todo-v7/) - 实际业务示例
- [日历管理](/calendar/) - 日历组件示例

---

## 📝 更新日志

### v1.0.0 (2026-03-13)
- ✅ 初始版本发布
- ✅ 用户管理接口（CRUD/筛选/排序）
- ✅ 文章/商品/订单接口
- ✅ 评论/通知接口
- ✅ 仪表盘统计
- ✅ 全局搜索
- ✅ 前端测试界面

---

*本文档基于 v1 版本编写，如有更新请参考最新代码。*
