# MSW + Faker 现代 API Mock 方案

> 📅 创建时间：2026-03-13  
> 📋 技术栈：MSW 1.3.5 + Faker 5.5.3 + Vue 3  
> ✅ CDN 已验证可用（jsDelivr）

---

## 🎯 什么是 MSW？

**Mock Service Worker (MSW)** 是一个无侵入的 API Mock 库，可以在浏览器层面拦截请求。

### 与传统 Mock 方案对比

| 特性 | MSW | 传统 Mock |
|------|-----|----------|
| 拦截层面 | Service Worker（浏览器层） | 应用层 |
| 代码侵入 | 无需修改业务代码 | 需要配置 axios 拦截器等 |
| 环境一致 | 开发/测试/生产环境一致 | 需要多套配置 |
| 真实网络 | 支持真实请求和 Mock 混合 | 通常全部 Mock |
| 调试体验 | 可在 Network 面板查看 | 难以调试 |

---

## 📁 文件结构

```
public/msw-demo/
└── index.html          # MSW 演示页面
```

---

## 🚀 快速开始

### 访问演示页面

```bash
# 启动服务
x-static

# 访问演示页面
http://127.0.0.1:3000/msw-demo/
```

### CDN 说明（已验证可用）

所有依赖均使用 **jsDelivr** CDN，以下版本已验证可访问：

```html
<!-- MSW 1.3.5 (jsDelivr - ✅ 已验证) -->
<script src="https://cdn.jsdelivr.net/npm/msw@1.3.5/lib/iife/index.js"></script>

<!-- Faker 5.5.3 (jsDelivr - ✅ 已验证) -->
<script src="https://cdn.jsdelivr.net/npm/faker@5.5.3/dist/faker.min.js"></script>

<!-- Vue 3 (staticfile.org - ✅ 已验证) -->
<script src="https://cdn.staticfile.org/vue/3.4.21/vue.global.prod.js"></script>
```

**CDN 验证状态：**
| 库 | 版本 | CDN | 状态 | 响应时间 |
|---|------|-----|------|----------|
| MSW | 1.3.5 | jsDelivr | ✅ 可用 | ~1.7s |
| Faker | 5.5.3 | jsDelivr | ✅ 可用 | ~5.2s |
| Vue 3 | 3.4.21 | staticfile | ✅ 可用 | ~0.3s |

**备选 CDN：**
- **jsDelivr**: `https://cdn.jsdelivr.net/npm/`
- **BootCDN**: `https://cdn.bootcdn.net/ajax/libs/`
- **75CDN**: `https://lib.baomitu.com/`
- **staticfile**: `https://cdn.staticfile.org/`

### 使用步骤

1. **点击"启动服务"** - 初始化 Service Worker
2. **点击测试按钮** - 发送各种 API 请求
3. **查看请求日志** - 观察拦截的请求和响应
4. **查看生成数据** - Faker 生成的逼真数据

---

## 📡 可用端点

### 用户相关

```javascript
// 获取用户列表（分页）
GET /api/users?page=1&pageSize=10

// 获取用户详情
GET /api/users/:id

// 创建用户
POST /api/users
Body: { username, email, phone }

// 更新用户
PUT /api/users/:id
Body: { username, email, ... }

// 删除用户
DELETE /api/users/:id
```

### 商品相关

```javascript
// 获取商品列表
GET /api/products?page=1&pageSize=10
```

### 订单相关

```javascript
// 获取订单列表
GET /api/orders?page=1&pageSize=10
```

### 统计相关

```javascript
// 获取统计数据
GET /api/stats
```

---

## 💻 核心代码

### 1. 引入 MSW 和 Faker

```html
<!-- MSW 1.3.5 -->
<script src="https://cdn.jsdelivr.net/npm/msw@1.3.5/lib/iife/index.js"></script>

<!-- Faker 5.5.3 -->
<script src="https://cdn.jsdelivr.net/npm/faker@5.5.3/dist/faker.min.js"></script>
```

### 2. 定义 Handlers

```javascript
const { http, response, setupWorker } = MSW;
const faker = window.faker;

// 生成用户数据（Faker v5 API）
const generateUser = (id) => ({
  id,
  username: faker.internet.userName(),
  email: faker.internet.email(),
  phone: faker.phone.phoneNumber(),
  avatar: faker.image.avatar(),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  address: faker.address.city() + ', ' + faker.address.streetAddress(),
  company: faker.company.companyName(),
  bio: faker.lorem.sentence(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString()
});

// 定义 handlers
const handlers = [
  // GET /api/users
  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 10;
    
    const users = Array.from({ length: pageSize }, (_, i) => 
      generateUser((page - 1) * pageSize + i + 1)
    );

    return response.json({
      success: true,
      data: {
        list: users,
        pagination: { page, pageSize, total: 100, totalPages: Math.ceil(100 / pageSize) }
      },
      timestamp: Date.now()
    });
  }),

  // GET /api/users/:id
  http.get('/api/users/:id', ({ params }) => {
    const id = parseInt(params.id);
    if (id < 1 || id > 100) {
      return response.json({
        success: false,
        error: '用户不存在',
        code: 404
      }, { status: 404 });
    }
    return response.json({
      success: true,
      data: generateUser(id),
      timestamp: Date.now()
    });
  }),

  // POST /api/users
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    const newUser = {
      id: faker.datatype.number({ min: 101, max: 999 }),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return response.json({
      success: true,
      data: newUser,
      message: '创建成功',
      timestamp: Date.now()
    }, { status: 201 });
  })
];
```

### 3. 启动 Worker

```javascript
// 启动 Service Worker
const worker = setupWorker(...handlers);
await worker.start({
  onUnhandledRequest: 'bypass',  // 未处理的请求绕过
  serviceWorker: {
    url: '/msw-demo/mockServiceWorker.js'
  }
});

// 监听请求
worker.events.on('request:start', ({ request }) => {
  console.log('请求开始:', request.method, request.url);
});

worker.events.on('response:mocked', async ({ request, response }) => {
  const data = await response.json();
  console.log('响应数据:', data);
});
```

### 4. 发送请求

```javascript
// 使用原生 fetch
const res = await fetch('/api/users?page=1&pageSize=10');
const data = await res.json();
console.log(data);

// 或使用 axios
const res = await axios.get('/api/users', {
  params: { page: 1, pageSize: 10 }
});
console.log(res.data);
```

---

## 🎨 Faker 数据生成（v5.5.3 API）

### 常用 API

```javascript
const faker = window.faker;

// 人员信息（v5 API）
faker.name.firstName()        // 名
faker.name.lastName()         // 姓
faker.name.findName()         // 全名

// 网络信息
faker.internet.userName()     // 用户名
faker.internet.email()        // 邮箱
faker.internet.url()          // 网址

// 联系方式
faker.phone.phoneNumber()     // 电话（注意 v5 是 phoneNumber 不是 number）

// 地址
faker.address.city()          // 城市
faker.address.streetAddress() // 街道地址
faker.address.country()       // 国家

// 公司
faker.company.companyName()   // 公司名（注意 v5 是 companyName）

// 商品
faker.commerce.productName()  // 商品名
faker.commerce.productDescription() // 描述
faker.commerce.price(min, max) // 价格

// 图片
faker.image.avatar()          // 头像
faker.image.imageUrl(w, h, c) // 随机图片

// 数字
faker.datatype.number({ min: 1, max: 100 })  // 整数
faker.datatype.float({ min: 1, max: 5 })     // 浮点数

// 日期
faker.date.past()             // 过去日期
faker.date.recent()           // 最近日期
faker.date.future()           // 未来日期

// 随机选择
faker.helpers.randomize(['a', 'b', 'c'])  // 随机选择一个
```

### 生成示例数据

```javascript
// 生成用户（Faker v5 API）
const user = {
  id: faker.datatype.number({ min: 1, max: 100 }),
  username: faker.internet.userName(),
  email: faker.internet.email(),
  phone: faker.phone.phoneNumber(),
  avatar: faker.image.avatar(),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  address: faker.address.city() + ', ' + faker.address.streetAddress(),
  company: faker.company.companyName(),
  bio: faker.lorem.sentence(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString()
};

// 生成商品
const product = {
  id: faker.datatype.number({ min: 1, max: 1000 }),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  price: parseFloat(faker.commerce.price(10, 1000)),
  category: faker.helpers.randomize(['数码', '家电', '服装', '食品', '图书']),
  brand: faker.helpers.randomize(['Apple', '华为', '小米', 'OPPO', 'vivo']),
  stock: faker.datatype.number({ min: 0, max: 1000 }),
  rating: parseFloat(faker.datatype.float({ min: 1, max: 5, precision: 0.1 })),
  image: faker.image.imageUrl(400, 400, 'product'),
  createdAt: faker.date.past().toISOString()
};

// 生成订单
const order = {
  id: 'ORD' + String(faker.datatype.number({ min: 1, max: 999999 })).padStart(6, '0'),
  userId: faker.datatype.number({ min: 1, max: 100 }),
  userName: faker.name.findName(),
  products: Array.from({ length: faker.datatype.number({ min: 1, max: 5 }) }, () => ({
    name: faker.commerce.productName(),
    price: parseFloat(faker.commerce.price(10, 500)),
    quantity: faker.datatype.number({ min: 1, max: 10 })
  })),
  totalAmount: parseFloat(faker.commerce.price(100, 5000)),
  status: faker.helpers.randomize(['pending', 'paid', 'shipped', 'completed']),
  createdAt: faker.date.past().toISOString()
};
```

---

## 🔧 高级用法

### 1. 延迟响应

```javascript
http.get('/api/users', async ({ request }) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return response.json({
    success: true,
    data: generateUsers()
  });
});
```

### 2. 错误处理

```javascript
http.get('/api/users/:id', ({ params, cookies }) => {
  const id = parseInt(params.id);
  
  // 模拟未授权
  if (!cookies.token) {
    return response.json({
      success: false,
      error: '未授权',
      code: 401
    }, { status: 401 });
  }
  
  // 模拟未找到
  if (id < 1 || id > 100) {
    return response.json({
      success: false,
      error: '用户不存在',
      code: 404
    }, { status: 404 });
  }
  
  return response.json({
    success: true,
    data: generateUser(id)
  });
});
```

### 3. 请求验证

```javascript
http.post('/api/users', async ({ request }) => {
  const body = await request.json();
  
  // 验证必填字段
  if (!body.username || !body.email) {
    return response.json({
      success: false,
      error: '用户名和邮箱必填',
      code: 400
    }, { status: 400 });
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return response.json({
      success: false,
      error: '邮箱格式不正确',
      code: 400
    }, { status: 400 });
  }
  
  return response.json({
    success: true,
    data: { id: 1, ...body },
    message: '创建成功'
  }, { status: 201 });
});
```

### 4. 动态数据

```javascript
// 内存存储
let users = Array.from({ length: 100 }, (_, i) => generateUser(i + 1));

http.get('/api/users', ({ request }) => {
  return response.json({
    success: true,
    data: { list: users, total: users.length }
  });
});

http.post('/api/users', async ({ request }) => {
  const body = await request.json();
  const newUser = { id: users.length + 1, ...body };
  users.push(newUser);
  
  return response.json({
    success: true,
    data: newUser,
    message: '创建成功'
  }, { status: 201 });
});
```

---

## 🐛 常见问题

### 1. CDN 无法访问

**问题：** jsDelivr 或其他 CDN 无法访问

**解决：**
1. 验证 CDN 可用性：`curl -I https://cdn.jsdelivr.net/npm/msw@1.3.5/lib/iife/index.js`
2. 尝试其他 CDN：BootCDN、75CDN、staticfile
3. 使用本地依赖：`npm install msw faker` 并通过 `/libs/` 访问

### 2. Service Worker 注册失败

**原因：** HTTPS 要求或路径错误

**解决：**
- 本地开发使用 `localhost` 或 `127.0.0.1`
- 确保 `mockServiceWorker.js` 路径正确

### 3. 请求未被拦截

**原因：** Handler 未注册或路径不匹配

**解决：**
```javascript
// 确保在发送请求前启动 worker
await worker.start();

// 检查路径是否匹配
http.get('/api/users', handler)  // 匹配 /api/users
http.get('/api/users/:id', handler)  // 匹配 /api/users/1
```

### 4. CORS 错误

**原因：** Service Worker 作用域问题

**解决：**
```javascript
await worker.start({
  onUnhandledRequest: 'bypass'  // 未处理的请求绕过
});
```

---

## 📚 相关资源

- [MSW 官方文档](https://mswjs.io/)
- [Faker v5 文档](https://fakerjs.dev/guide/)
- [MSW GitHub](https://github.com/mswjs/msw)
- [Faker GitHub](https://github.com/faker-js/faker)
- [jsDelivr CDN](https://www.jsdelivr.com/)

---

## 📝 更新日志

### v1.1.0 (2026-03-13)
- ✅ CDN 验证：MSW 1.3.5 ✅
- ✅ CDN 验证：Faker 5.5.3 ✅
- ✅ 更新 Faker API 为 v5 语法
- ✅ 添加 CDN 验证状态表格

### v1.0.0 (2026-03-13)
- ✅ 初始版本发布
- ✅ MSW 集成
- ✅ Faker 数据生成
- ✅ 用户/商品/订单 Mock
- ✅ 请求日志展示
- ✅ 可视化测试界面

---

*本文档基于 v1.1.0 版本编写，CDN 版本已验证可用。*
