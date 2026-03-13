# 登录系统开发文档

> 📅 创建时间：2026-03-13  
> 📋 技术栈：Pico CSS + 原生 JavaScript + Express

---

## 🎯 功能概述

基于 Pico CSS 实现的 TODO 管理系统登录入口，支持：
- ✅ 用户名密码登录
- ✅ 记住我功能
- ✅ Token 认证
- ✅ 主题切换（明/暗）
- ✅ 响应式设计

---

## 📁 文件结构

```
public/login/
└── index.html          # 登录页面

src/http-server/
└── auth-api.js         # 认证 API 路由
```

---

## 🔧 技术栈

| 技术 | 版本 | 来源 | 说明 |
|------|------|------|------|
| Pico CSS | 2.1.1 | /libs/@picocss/pico | 轻量级 CSS 框架 |
| Express | - | 本地 | 后端框架 |
| Crypto | - | Node.js 内置 | 密码哈希/令牌生成 |

---

## 🎨 页面特性

### 1. 响应式设计
- 移动端优先
- 自适应桌面/平板/手机
- 最小宽度 320px

### 2. 主题切换
- 默认浅色主题
- 支持深色主题
- 本地存储主题偏好

### 3. 表单验证
- 必填字段验证
- 实时反馈
- 错误提示

### 4. 用户体验
- 加载动画
- 成功/错误消息
- 自动跳转

---

## 🔐 认证流程

```
用户输入 → 表单验证 → API 请求 → 令牌存储 → 页面跳转
                                    ↓
                                Token 验证 → 受保护资源
```

---

## 📡 API 接口

### POST /api/auth/login

用户登录

**请求参数：**
```json
{
  "username": "admin",
  "password": "admin123",
  "remember": true
}
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "token": "633bdfd7f762858a7b89d14e88bccbd9...",
    "expiresAt": 1773496942573,
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "avatar": "👨‍💼",
      "role": "admin"
    }
  }
}
```

**失败响应：**
```json
{
  "success": false,
  "error": "用户名或密码错误"
}
```

### POST /api/auth/logout

用户登出

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "message": "登出成功"
}
```

### GET /api/auth/me

获取当前用户信息

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "avatar": "👨‍💼",
    "role": "admin"
  }
}
```

### POST /api/auth/refresh

刷新令牌

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "token": "new_token_here",
    "expiresAt": 1773496942573
  }
}
```

---

## 👤 测试账户

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 拥有全部权限 |
| user | user123 | 普通用户 | 基础权限 |

---

## 💻 使用示例

### 前端登录

```javascript
async function handleLogin(event) {
  event.preventDefault();
  
  const form = event.target;
  const username = form.username.value;
  const password = form.password.value;
  const remember = form.remember.checked;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, remember })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // 保存 token
      if (remember) {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.data.user));
      } else {
        sessionStorage.setItem('auth_token', data.data.token);
        sessionStorage.setItem('auth_user', JSON.stringify(data.data.user));
      }
      
      // 跳转
      window.location.href = '/todo-v7/';
    } else {
      showMessage(data.error, 'error');
    }
  } catch (error) {
    showMessage('网络错误', 'error');
  }
}
```

### 受保护资源访问

```javascript
async function fetchProtectedResource() {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch('/api/todos', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}
```

---

## 🔒 安全特性

### 1. 密码哈希
```javascript
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}
```

### 2. 令牌生成
```javascript
function generateToken(userId) {
  return crypto.randomBytes(32).toString('hex');
}
```

### 3. 令牌过期
- 记住我：30 天
- 不记住：24 小时

### 4. 令牌验证
```javascript
const tokenData = tokens.get(token);
if (!tokenData || tokenData.expiresAt < Date.now()) {
  // 令牌无效或已过期
}
```

---

## 🎨 自定义样式

### 主题颜色

```css
:root {
  --primary-color: #667eea;
  --primary-hover: #764ba2;
}
```

### 渐变背景

```css
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 登录按钮

```css
.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.3s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}
```

---

## 📱 访问地址

| 页面 | 地址 |
|------|------|
| 登录页 | http://127.0.0.1:3000/login/ |
| 登录 API | http://127.0.0.1:3000/api/auth/login |
| 登出 API | http://127.0.0.1:3000/api/auth/logout |
| 用户信息 | http://127.0.0.1:3000/api/auth/me |

---

## 🐛 常见问题

### 1. 登录成功但不跳转

**原因：** Token 保存失败或 redirect 参数错误

**解决：** 检查 localStorage 权限和 redirect URL

### 2. 令牌验证失败

**原因：** 令牌过期或未携带 Authorization 头

**解决：** 刷新令牌或重新登录

### 3. 主题切换不生效

**原因：** localStorage 被禁用或清除

**解决：** 检查浏览器设置

---

## 📚 扩展建议

### 1. 添加注册功能
```html
<a href="/register">注册账户</a>
```

### 2. 添加密码重置
```javascript
async function resetPassword(email) {
  // 发送重置邮件
}
```

### 3. 添加双因素认证
```javascript
// TOTP 验证
```

### 4. 添加社交登录
```javascript
// 微信/GitHub/Google OAuth
```

---

## 🔗 相关文档

- [Pico CSS 文档](https://picocss.com/)
- [Express 认证指南](https://expressjs.com/)
- [JWT 规范](https://jwt.io/)

---

*本文档基于 v1 版本编写，如有更新请参考最新代码。*
