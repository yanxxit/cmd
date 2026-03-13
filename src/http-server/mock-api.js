/**
 * Mock API 平台
 * 使用 @faker-js/faker 生成逼真数据
 * 日常开发常见接口场景
 */

import express from 'express';
import { faker } from '@faker-js/faker';

const router = express.Router();

// 配置 faker 使用中文
faker.locale = 'zh_CN';

// ==================== 模拟数据生成 ====================

// 模拟用户数据（100 条）
const users = [];
for (let i = 0; i < 100; i++) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  users.push({
    id: i + 1,
    username: faker.internet.username({ firstName, lastName }),
    email: faker.internet.email({ firstName, lastName }),
    phone: faker.phone.number('1##-####-####'),
    avatar: faker.image.avatarGitHub(),
    gender: faker.helpers.arrayElement(['male', 'female']),
    age: faker.number.int({ min: 18, max: 60 }),
    address: faker.location.city() + faker.location.street(),
    department: faker.helpers.arrayElement(['技术部', '产品部', '设计部', '市场部', '运营部', '人事部', '财务部']),
    role: faker.helpers.weightedArrayElement([
      { weight: 10, value: 'admin' },
      { weight: 80, value: 'user' },
      { weight: 10, value: 'guest' }
    ]),
    status: faker.helpers.weightedArrayElement([
      { weight: 60, value: 'active' },
      { weight: 30, value: 'inactive' },
      { weight: 10, value: 'locked' }
    ]),
    bio: faker.person.bio(),
    website: faker.internet.url(),
    company: faker.company.name(),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    lastLoginAt: faker.date.recent().toISOString()
  });
}

// 模拟文章数据（50 条）
const articles = [];
for (let i = 0; i < 50; i++) {
  articles.push({
    id: i + 1,
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    summary: faker.lorem.paragraph({ min: 1, max: 2 }),
    content: faker.lorem.paragraphs({ min: 3, max: 10 }),
    author: {
      id: faker.number.int({ min: 1, max: 100 }),
      name: faker.person.fullName(),
      avatar: faker.image.avatar()
    },
    category: faker.helpers.arrayElement(['技术', '产品', '设计', '市场', '运营']),
    tags: faker.lorem.words({ min: 2, max: 5 }).split(' '),
    cover: faker.image.url({ width: 400, height: 200, category: 'technology' }),
    views: faker.number.int({ min: 0, max: 10000 }),
    likes: faker.number.int({ min: 0, max: 1000 }),
    comments: faker.number.int({ min: 0, max: 500 }),
    status: faker.helpers.weightedArrayElement([
      { weight: 70, value: 'published' },
      { weight: 20, value: 'draft' },
      { weight: 10, value: 'archived' }
    ]),
    publishedAt: faker.date.past({ years: 1 }).toISOString(),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent().toISOString()
  });
}

// 模拟商品数据（60 条）
const products = [];
const productTypes = ['手机', '电脑', '平板', '手表', '耳机', '音箱', '相机', '显示器'];
const brands = ['Apple', '华为', '小米', 'OPPO', 'vivo', '三星', '索尼', '联想'];
for (let i = 0; i < 60; i++) {
  const productName = faker.commerce.productName();
  products.push({
    id: i + 1,
    name: productName + faker.helpers.arrayElement(productTypes),
    description: faker.commerce.productDescription(),
    category: faker.helpers.arrayElement(['数码', '家电', '服装', '食品', '图书']),
    brand: faker.helpers.arrayElement(brands),
    price: parseFloat(faker.commerce.price({ min: 99, max: 9999, dec: 2 })),
    originalPrice: parseFloat(faker.commerce.price({ min: 199, max: 12999, dec: 2 })),
    stock: faker.number.int({ min: 0, max: 1000 }),
    sales: faker.number.int({ min: 0, max: 10000 }),
    images: [
      faker.image.url({ width: 400, height: 400, category: 'product' }),
      faker.image.url({ width: 400, height: 400, category: 'technology' })
    ],
    cover: faker.image.url({ width: 400, height: 400, category: 'product' }),
    rating: parseFloat(faker.number.float({ min: 1, max: 5, fractionDigits: 1 })),
    reviewCount: faker.number.int({ min: 0, max: 5000 }),
    status: faker.helpers.weightedArrayElement([
      { weight: 70, value: 'onsale' },
      { weight: 20, value: 'offsale' },
      { weight: 10, value: 'outofstock' }
    ]),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent().toISOString()
  });
}

// 模拟订单数据（80 条）
const orders = [];
for (let i = 0; i < 80; i++) {
  const productCount = faker.number.int({ min: 1, max: 5 });
  const products = [];
  for (let j = 0; j < productCount; j++) {
    products.push({
      id: faker.number.int({ min: 1, max: 1000 }),
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 1000, dec: 2 })),
      quantity: faker.number.int({ min: 1, max: 10 }),
      image: faker.image.url({ width: 100, height: 100, category: 'product' })
    });
  }
  const totalAmount = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  
  orders.push({
    id: 'ORD' + String(i + 1).padStart(6, '0'),
    orderNo: 'ORD' + Date.now() + String(i).padStart(4, '0'),
    userId: faker.number.int({ min: 1, max: 100 }),
    userName: faker.person.fullName(),
    userAvatar: faker.image.avatar(),
    products,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    payAmount: parseFloat((totalAmount * faker.number.float({ min: 0.8, max: 1, fractionDigits: 2 })).toFixed(2)),
    discountAmount: parseFloat((totalAmount * faker.number.float({ min: 0, max: 0.2, fractionDigits: 2 })).toFixed(2)),
    status: faker.helpers.weightedArrayElement([
      { weight: 10, value: 'pending' },
      { weight: 25, value: 'paid' },
      { weight: 25, value: 'shipped' },
      { weight: 30, value: 'completed' },
      { weight: 5, value: 'cancelled' },
      { weight: 5, value: 'refunded' }
    ]),
    paymentMethod: faker.helpers.arrayElement(['alipay', 'wechat', 'card', 'cod']),
    shippingAddress: faker.location.streetAddress() + ', ' + faker.location.city() + ', ' + faker.location.state() + ', ' + faker.location.zipCode(),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    paidAt: faker.date.recent().toISOString(),
    shippedAt: faker.date.recent().toISOString(),
    completedAt: faker.date.recent().toISOString()
  });
}

// 模拟评论数据（200 条）
const comments = [];
for (let i = 0; i < 200; i++) {
  comments.push({
    id: i + 1,
    userId: faker.number.int({ min: 1, max: 100 }),
    userName: faker.person.fullName(),
    userAvatar: faker.image.avatar(),
    content: faker.lorem.paragraph({ min: 1, max: 3 }),
    rating: faker.number.int({ min: 1, max: 5 }),
    images: faker.helpers.maybe(() => [
      faker.image.url({ width: 200, height: 200 }),
      faker.image.url({ width: 200, height: 200 })
    ], { probability: 0.5 }) || [],
    targetType: faker.helpers.arrayElement(['article', 'product', 'order']),
    targetId: faker.number.int({ min: 1, max: 100 }),
    likes: faker.number.int({ min: 0, max: 500 }),
    replies: faker.number.int({ min: 0, max: 50 }),
    status: faker.helpers.weightedArrayElement([
      { weight: 70, value: 'approved' },
      { weight: 20, value: 'pending' },
      { weight: 10, value: 'rejected' }
    ]),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent().toISOString()
  });
}

// 模拟通知数据（50 条）
const notifications = [];
for (let i = 0; i < 50; i++) {
  notifications.push({
    id: i + 1,
    userId: faker.number.int({ min: 1, max: 100 }),
    type: faker.helpers.arrayElement(['system', 'order', 'message', 'comment', 'like']),
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    content: faker.lorem.paragraph({ min: 1, max: 2 }),
    isRead: faker.datatype.boolean({ probability: 0.7 }),
    link: faker.internet.url() + '/detail/' + faker.number.int({ min: 1, max: 1000 }),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    readAt: faker.datatype.boolean({ probability: 0.7 }) ? faker.date.recent().toISOString() : null
  });
}

// ==================== 响应辅助函数 ====================

function success(data, message = 'success') {
  return {
    success: true,
    code: 200,
    message,
    data,
    timestamp: Date.now()
  };
}

function error(message = 'error', code = 400) {
  return {
    success: false,
    code,
    message,
    data: null,
    timestamp: Date.now()
  };
}

function paginate(data, page, pageSize) {
  const total = data.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const list = data.slice(start, end);
  
  return {
    list,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: end < total
    }
  };
}

function filterAndSort(data, filters, sort) {
  let result = [...data];
  
  if (filters) {
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        if (key === 'keyword') {
          result = result.filter(item => 
            JSON.stringify(item).toLowerCase().includes(filters[key].toLowerCase())
          );
        } else if (['status', 'gender', 'role', 'department', 'category'].includes(key)) {
          result = result.filter(item => item[key] === filters[key]);
        } else if (['minPrice', 'minAge'].includes(key)) {
          const field = key.replace('min', '');
          const fieldLower = field.charAt(0).toLowerCase() + field.slice(1);
          result = result.filter(item => item[fieldLower] >= parseFloat(filters[key]));
        } else if (['maxPrice', 'maxAge'].includes(key)) {
          const field = key.replace('max', '');
          const fieldLower = field.charAt(0).toLowerCase() + field.slice(1);
          result = result.filter(item => item[fieldLower] <= parseFloat(filters[key]));
        } else if (key === 'startDate') {
          result = result.filter(item => new Date(item.createdAt) >= new Date(filters[key]));
        } else if (key === 'endDate') {
          result = result.filter(item => new Date(item.createdAt) <= new Date(filters[key]));
        }
      }
    });
  }
  
  if (sort) {
    const [field, order = 'asc'] = sort.split(':');
    result.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  return result;
}

// ==================== 用户相关接口 ====================

/**
 * GET /api/mock/users
 * 用户列表分页查询
 */
router.get('/users', (req, res) => {
  const { page = 1, pageSize = 10, keyword, status, gender, role, department, minAge, maxAge, sort = 'id:desc' } = req.query;
  const filters = { keyword, status, gender, role, department, minAge, maxAge };
  const filteredData = filterAndSort(users, filters, sort);
  const result = paginate(filteredData, page, pageSize);
  res.json(success(result));
});

/**
 * GET /api/mock/users/:id
 * 用户详情
 */
router.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.json(error('用户不存在', 404));
  
  const userOrders = orders.filter(o => o.userId === user.id).slice(0, 5);
  const userComments = comments.filter(c => c.userId === user.id).slice(0, 5);
  
  res.json(success({
    ...user,
    recentOrders: userOrders,
    recentComments: userComments,
    stats: {
      totalOrders: orders.filter(o => o.userId === user.id).length,
      totalComments: comments.filter(c => c.userId === user.id).length,
      totalLikes: comments.filter(c => c.userId === user.id).reduce((sum, c) => sum + c.likes, 0)
    }
  }));
});

/**
 * POST /api/mock/users
 * 创建用户
 */
router.post('/users', (req, res) => {
  const { username, email, phone, gender, department, role, bio } = req.body;
  if (!username || !email) return res.json(error('用户名和邮箱必填', 400));
  
  const newUser = {
    id: users.length + 1,
    username,
    email,
    phone: phone || faker.phone.number(),
    avatar: faker.image.avatarGitHub(),
    gender: gender || faker.helpers.arrayElement(['male', 'female']),
    age: faker.number.int({ min: 18, max: 60 }),
    address: faker.location.city() + faker.location.street(),
    department: department || '技术部',
    role: role || 'user',
    status: 'active',
    bio: bio || faker.lorem.sentence(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: null
  };
  
  users.unshift(newUser);
  res.json(success(newUser, '创建成功'));
});

/**
 * PUT /api/mock/users/:id
 * 更新用户
 */
router.put('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.json(error('用户不存在', 404));
  
  const { username, email, phone, gender, department, role, status, bio } = req.body;
  users[userIndex] = {
    ...users[userIndex],
    username: username || users[userIndex].username,
    email: email || users[userIndex].email,
    phone: phone || users[userIndex].phone,
    gender: gender || users[userIndex].gender,
    department: department || users[userIndex].department,
    role: role || users[userIndex].role,
    status: status || users[userIndex].status,
    bio: bio || users[userIndex].bio,
    updatedAt: new Date().toISOString()
  };
  
  res.json(success(users[userIndex], '更新成功'));
});

/**
 * DELETE /api/mock/users/:id
 * 删除用户
 */
router.delete('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.json(error('用户不存在', 404));
  users.splice(userIndex, 1);
  res.json(success(null, '删除成功'));
});

/**
 * POST /api/mock/users/batch-delete
 * 批量删除用户
 */
router.post('/users/batch-delete', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.json(error('请选择要删除的用户', 400));
  }
  let count = 0;
  ids.forEach(id => {
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index !== -1) { users.splice(index, 1); count++; }
  });
  res.json(success({ count }, `已删除 ${count} 个用户`));
});

/**
 * PUT /api/mock/users/:id/status
 * 更新用户状态
 */
router.put('/users/:id/status', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  if (!user) return res.json(error('用户不存在', 404));
  const { status } = req.body;
  if (!['active', 'inactive', 'locked'].includes(status)) {
    return res.json(error('无效的状态值', 400));
  }
  user.status = status;
  user.updatedAt = new Date().toISOString();
  res.json(success(user, '状态更新成功'));
});

/**
 * GET /api/mock/users/stats
 * 用户统计
 */
router.get('/users/stats', (req, res) => {
  res.json(success({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    locked: users.filter(u => u.status === 'locked').length,
    byGender: {
      male: users.filter(u => u.gender === 'male').length,
      female: users.filter(u => u.gender === 'female').length
    },
    byRole: {
      admin: users.filter(u => u.role === 'admin').length,
      user: users.filter(u => u.role === 'user').length,
      guest: users.filter(u => u.role === 'guest').length
    },
    byDepartment: {}
  }));
});

// ==================== 文章相关接口 ====================

router.get('/articles', (req, res) => {
  const { page = 1, pageSize = 10, keyword, category, status, sort = 'createdAt:desc' } = req.query;
  const filters = { keyword, category, status };
  const filteredData = filterAndSort(articles, filters, sort);
  res.json(success(paginate(filteredData, page, pageSize)));
});

router.get('/articles/:id', (req, res) => {
  const article = articles.find(a => a.id === parseInt(req.params.id));
  if (!article) return res.json(error('文章不存在', 404));
  article.views++;
  const relatedArticles = articles.filter(a => a.category === article.category && a.id !== article.id).slice(0, 4);
  res.json(success({ ...article, relatedArticles }));
});

// ==================== 商品相关接口 ====================

router.get('/products', (req, res) => {
  const { page = 1, pageSize = 10, keyword, category, brand, minPrice, maxPrice, sort = 'sales:desc' } = req.query;
  const filters = { keyword, category, brand, minPrice, maxPrice };
  const filteredData = filterAndSort(products, filters, sort);
  res.json(success(paginate(filteredData, page, pageSize)));
});

router.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.json(error('商品不存在', 404));
  res.json(success(product));
});

// ==================== 订单相关接口 ====================

router.get('/orders', (req, res) => {
  const { page = 1, pageSize = 10, keyword, status, paymentMethod, startDate, endDate, sort = 'createdAt:desc' } = req.query;
  const filters = { keyword, status, paymentMethod, startDate, endDate };
  const filteredData = filterAndSort(orders, filters, sort);
  res.json(success(paginate(filteredData, page, pageSize)));
});

router.get('/orders/:id', (req, res) => {
  const order = orders.find(o => o.orderNo === req.params.id || o.id === parseInt(req.params.id));
  if (!order) return res.json(error('订单不存在', 404));
  res.json(success(order));
});

// ==================== 评论相关接口 ====================

router.get('/comments', (req, res) => {
  const { page = 1, pageSize = 10, targetType, targetId, status } = req.query;
  let filteredData = comments;
  if (targetType) filteredData = filteredData.filter(c => c.targetType === targetType);
  if (targetId) filteredData = filteredData.filter(c => c.targetId === parseInt(targetId));
  if (status) filteredData = filteredData.filter(c => c.status === status);
  res.json(success(paginate(filteredData, page, pageSize)));
});

// ==================== 通知相关接口 ====================

router.get('/notifications', (req, res) => {
  const { page = 1, pageSize = 20, type, isRead } = req.query;
  let filteredData = notifications;
  if (type) filteredData = filteredData.filter(n => n.type === type);
  if (isRead !== undefined) filteredData = filteredData.filter(n => n.isRead === (isRead === 'true'));
  res.json(success(paginate(filteredData, page, pageSize)));
});

router.put('/notifications/:id/read', (req, res) => {
  const notification = notifications.find(n => n.id === parseInt(req.params.id));
  if (!notification) return res.json(error('通知不存在', 404));
  notification.isRead = true;
  notification.readAt = new Date().toISOString();
  res.json(success(notification, '标记成功'));
});

router.put('/notifications/read-all', (req, res) => {
  const { userId } = req.body;
  let count = 0;
  notifications.forEach(n => {
    if (n.userId === userId && !n.isRead) {
      n.isRead = true;
      n.readAt = new Date().toISOString();
      count++;
    }
  });
  res.json(success({ count }, `已标记 ${count} 条通知`));
});

router.get('/notifications/unread-count', (req, res) => {
  const { userId } = req.query;
  const count = notifications.filter(n => n.userId === userId && !n.isRead).length;
  res.json(success({ count }));
});

// ==================== 仪表盘统计接口 ====================

router.get('/dashboard/stats', (req, res) => {
  res.json(success({
    users: {
      total: users.length,
      today: faker.number.int({ min: 1, max: 50 }),
      week: faker.number.int({ min: 50, max: 300 }),
      month: faker.number.int({ min: 200, max: 1000 })
    },
    orders: {
      total: orders.length,
      today: faker.number.int({ min: 1, max: 20 }),
      amount: {
        today: parseFloat(faker.commerce.price({ min: 1000, max: 50000 })),
        week: parseFloat(faker.commerce.price({ min: 10000, max: 200000 })),
        month: parseFloat(faker.commerce.price({ min: 50000, max: 1000000 }))
      }
    },
    products: {
      total: products.length,
      onsale: products.filter(p => p.status === 'onsale').length,
      outofstock: products.filter(p => p.status === 'outofstock').length
    },
    articles: {
      total: articles.length,
      published: articles.filter(a => a.status === 'published').length,
      views: {
        today: faker.number.int({ min: 1000, max: 10000 }),
        week: faker.number.int({ min: 5000, max: 50000 }),
        month: faker.number.int({ min: 20000, max: 200000 })
      }
    },
    comments: {
      total: comments.length,
      pending: comments.filter(c => c.status === 'pending').length,
      today: faker.number.int({ min: 5, max: 50 })
    }
  }));
});

router.get('/dashboard/chart-data', (req, res) => {
  const { type = 'users', days = 7 } = req.query;
  const dates = [], data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dates.push(dateStr);
    data.push({
      date: dateStr,
      value: faker.number.int({ min: 10, max: 500 }),
      count: faker.number.int({ min: 5, max: 100 })
    });
  }
  res.json(success({ dates, data }));
});

// ==================== 通用接口 ====================

router.get('/search', (req, res) => {
  const { keyword, type = 'all' } = req.query;
  if (!keyword) return res.json(error('请输入搜索关键词', 400));
  
  const results = { users: [], articles: [], products: [], orders: [] };
  const lowerKeyword = keyword.toLowerCase();
  
  if (type === 'all' || type === 'users') {
    results.users = users.filter(u => 
      u.username.toLowerCase().includes(lowerKeyword) || 
      u.email.toLowerCase().includes(lowerKeyword) ||
      u.address.toLowerCase().includes(lowerKeyword)
    ).slice(0, 5);
  }
  if (type === 'all' || type === 'articles') {
    results.articles = articles.filter(a => 
      a.title.toLowerCase().includes(lowerKeyword) ||
      a.summary.toLowerCase().includes(lowerKeyword)
    ).slice(0, 5);
  }
  if (type === 'all' || type === 'products') {
    results.products = products.filter(p => 
      p.name.toLowerCase().includes(lowerKeyword) ||
      p.description.toLowerCase().includes(lowerKeyword)
    ).slice(0, 5);
  }
  if (type === 'all' || type === 'orders') {
    results.orders = orders.filter(o => 
      o.orderNo.toLowerCase().includes(lowerKeyword) ||
      o.userName.toLowerCase().includes(lowerKeyword)
    ).slice(0, 5);
  }
  
  res.json(success(results));
});

router.get('/options', (req, res) => {
  res.json(success({
    genders: [{ label: '男', value: 'male' }, { label: '女', value: 'female' }],
    userStatuses: [{ label: '正常', value: 'active' }, { label: '禁用', value: 'inactive' }, { label: '锁定', value: 'locked' }],
    userRoles: [{ label: '管理员', value: 'admin' }, { label: '普通用户', value: 'user' }, { label: '访客', value: 'guest' }],
    departments: ['技术部', '产品部', '设计部', '市场部', '运营部', '人事部', '财务部'],
    orderStatuses: [
      { label: '待支付', value: 'pending' },
      { label: '已支付', value: 'paid' },
      { label: '已发货', value: 'shipped' },
      { label: '已完成', value: 'completed' },
      { label: '已取消', value: 'cancelled' },
      { label: '已退款', value: 'refunded' }
    ],
    paymentMethods: [
      { label: '支付宝', value: 'alipay' },
      { label: '微信', value: 'wechat' },
      { label: '银行卡', value: 'card' },
      { label: '货到付款', value: 'cod' }
    ],
    articleStatuses: [
      { label: '草稿', value: 'draft' },
      { label: '已发布', value: 'published' },
      { label: '已归档', value: 'archived' }
    ],
    productStatuses: [
      { label: '在售', value: 'onsale' },
      { label: '下架', value: 'offsale' },
      { label: '缺货', value: 'outofstock' }
    ]
  }));
});

// API 文档
router.get('/', (req, res) => {
  res.json(success({
    name: 'Mock API Platform (Faker)',
    description: '日常开发常见接口场景 - 使用 @faker-js/faker 生成逼真数据',
    version: '2.0.0',
    fakerVersion: '10.x',
    endpoints: {
      users: {
        'GET /api/mock/users': '用户列表（分页/筛选/排序）',
        'GET /api/mock/users/:id': '用户详情',
        'POST /api/mock/users': '创建用户',
        'PUT /api/mock/users/:id': '更新用户',
        'DELETE /api/mock/users/:id': '删除用户',
        'POST /api/mock/users/batch-delete': '批量删除用户',
        'PUT /api/mock/users/:id/status': '更新用户状态',
        'GET /api/mock/users/stats': '用户统计'
      },
      articles: {
        'GET /api/mock/articles': '文章列表',
        'GET /api/mock/articles/:id': '文章详情'
      },
      products: {
        'GET /api/mock/products': '商品列表',
        'GET /api/mock/products/:id': '商品详情'
      },
      orders: {
        'GET /api/mock/orders': '订单列表',
        'GET /api/mock/orders/:id': '订单详情'
      },
      comments: {
        'GET /api/mock/comments': '评论列表'
      },
      notifications: {
        'GET /api/mock/notifications': '通知列表',
        'PUT /api/mock/notifications/:id/read': '标记已读',
        'GET /api/mock/notifications/unread-count': '未读数'
      },
      dashboard: {
        'GET /api/mock/dashboard/stats': '仪表盘统计',
        'GET /api/mock/dashboard/chart-data': '图表数据'
      },
      common: {
        'GET /api/mock/search': '全局搜索',
        'GET /api/mock/options': '选项数据'
      }
    },
    webUI: '/mock/',
    dataStats: {
      users: users.length,
      articles: articles.length,
      products: products.length,
      orders: orders.length,
      comments: comments.length,
      notifications: notifications.length
    }
  }));
});

export default router;
