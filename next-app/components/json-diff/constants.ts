/**
 * JSON 差异高亮样式配置
 */
export const HIGHLIGHT_STYLES = {
  deleted: {
    background: 'linear-gradient(135deg, rgba(255, 77, 79, 0.12) 0%, rgba(255, 77, 79, 0.06) 100%)',
    border: '1px solid rgba(255, 77, 79, 0.2)',
    borderRadius: '2px',
    color: '#c0392b',
  },
  added: {
    background: 'linear-gradient(135deg, rgba(82, 196, 26, 0.12) 0%, rgba(82, 196, 26, 0.06) 100%)',
    border: '1px solid rgba(82, 196, 26, 0.2)',
    borderRadius: '2px',
    color: '#27ae60',
  },
  modified: {
    background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.12) 0%, rgba(24, 144, 255, 0.06) 100%)',
    border: '1px solid rgba(24, 144, 255, 0.2)',
    borderRadius: '2px',
    color: '#2980b9',
  },
};

/**
 * 示例数据
 */
export const EXAMPLES = {
  userInfo: {
    name: '用户信息',
    description: '基本的用户数据对比',
    left: {
      id: 1001,
      name: '张三',
      age: 28,
      email: 'zhangsan@example.com',
      address: { city: '北京', district: '朝阳区' },
      tags: ['前端', 'JavaScript', 'Vue'],
      isActive: true,
    },
    right: {
      id: 1001,
      name: '张三',
      age: 30,
      email: 'zhangsan@example.com',
      address: { city: '上海', district: '浦东新区' },
      tags: ['前端', 'JavaScript', 'React'],
      isActive: true,
    },
  },
  productData: {
    name: '商品数据',
    description: '商品信息对比',
    left: {
      products: [
        { id: 'p001', name: '智能手机', price: 4999, inventory: 100, specs: { brand: '小米', model: 'Mi 11' } },
      ],
    },
    right: {
      products: [
        { id: 'p001', name: '智能手机', price: 5299, inventory: 85, specs: { brand: '小米', model: 'Mi 11 Pro' } },
      ],
    },
  },
  apiResponse: {
    name: 'API 响应',
    description: 'API 返回数据对比',
    left: {
      status: 'success',
      code: 200,
      data: { users: [{ id: 1, name: '李明', role: 'admin' }], pagination: { total: 25, page: 1 } },
    },
    right: {
      status: 'success',
      code: 200,
      data: { users: [{ id: 1, name: '李明', role: 'admin' }], pagination: { total: 28, page: 1 } },
    },
  },
  complexData: {
    name: '复杂配置',
    description: '复杂嵌套数据对比',
    left: {
      settings: {
        theme: 'light',
        language: 'zh-CN',
        notifications: { email: true, push: true, sms: false },
        security: { twoFactorAuth: true, passwordExpiry: 90 },
      },
      users: [
        { id: 1, name: 'Admin', permissions: ['read', 'write', 'delete'] },
        { id: 2, name: 'User', permissions: ['read'] },
      ],
    },
    right: {
      settings: {
        theme: 'dark',
        language: 'zh-CN',
        notifications: { email: true, push: false, sms: true },
        security: { twoFactorAuth: true, passwordExpiry: 60 },
      },
      users: [
        { id: 1, name: 'Admin', permissions: ['read', 'write', 'delete', 'admin'] },
        { id: 2, name: 'User', permissions: ['read', 'write'] },
        { id: 3, name: 'Guest', permissions: ['read'] },
      ],
    },
  },
  configData: {
    name: '系统配置',
    description: '系统配置文件对比',
    left: {
      database: { host: 'localhost', port: 3306, user: 'root' },
      cache: { enabled: true, ttl: 3600 },
      features: { newUI: false, beta: false },
    },
    right: {
      database: { host: 'prod-db.example.com', port: 3306, user: 'prod' },
      cache: { enabled: true, ttl: 7200 },
      features: { newUI: true, beta: true },
    },
  },
};
