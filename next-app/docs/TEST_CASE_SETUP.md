# 测试案例管理系统 - 开发环境搭建指南

## 📋 概述

本文档说明如何在开发环境中运行测试案例管理系统的 Next.js 前端和后端 API。

## 🏗️ 架构说明

本项目采用**前后端分离**架构，通过 Next.js 的 Rewrites 代理功能实现开发环境的无缝联调：

```
┌─────────────────┐
│   Next.js App   │  Port: 3030
│   (Frontend)    │
└────────┬────────┘
         │
         │ /api/* 请求代理
         ↓
┌─────────────────┐
│  Express Server │  Port: 3000
│   (Backend API) │
└─────────────────┘
```

## 🚀 快速启动

### 前提条件

确保已安装以下依赖：
- Node.js >= 20.0.0
- pnpm >= 10.0.0

### 步骤 1: 启动后端 API 服务

在项目根目录 (`/Users/bytedance/github/cmd`) 启动后端服务：

```bash
# 方式 1: 使用现有启动脚本
node bin/dev.js -p 3000 -o

# 方式 2: 如果上面的命令已运行，检查端口 3000 是否被占用
# 如果已占用，无需重复启动
```

**验证后端启动成功**：
- 访问：http://localhost:3000/api/test-cases
- 应该返回：`{"success":true,"data":[],"pagination":{...}}`

### 步骤 2: 启动 Next.js 前端

在 next-app 目录 (`/Users/bytedance/github/cmd/next-app`) 启动前端服务：

```bash
cd next-app
pnpm dev
```

**验证前端启动成功**：
- 访问：http://localhost:3030/admin/test-cases
- 应该能看到测试案例管理页面

## 🔧 配置说明

### Next.js 代理配置

位置：`next-app/next.config.mjs`

```javascript
async rewrites() {
  if (isDev) {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  }
  return [];
}
```

**说明**：
- 开发环境下，所有 `/api/*` 请求都会代理到 `http://localhost:3000/api/*`
- 生产环境构建后，需要部署到同一域名下或使用 CORS

### 前端请求配置

位置：`next-app/components/common/request.ts`

前端使用相对路径请求 API：
```typescript
const response = await fetch('/api/test-cases', { ... })
```

通过代理配置，浏览器会认为请求是同源（localhost:3030），避免跨域问题。

## 📁 项目结构

### 后端 API（Express）

```
/Users/bytedance/github/cmd/
├── src/
│   ├── http-server/
│   │   ├── test-case-api.js      # API 路由
│   │   └── static.js             # 主服务入口
│   └── model/jsondb/
│       └── TestCase.js           # 数据模型层
└── .jsondb/
    └── test-case-manager/        # 数据库文件
```

### 前端 Next.js

```
/Users/bytedance/github/cmd/next-app/
├── pages/
│   └── admin/
│       └── test-cases/
│           └── index.tsx         # 测试案例管理页面
├── components/
│   └── admin/
│       └── test-case/            # 测试案例组件
│           ├── TestCaseTable.tsx
│           ├── TestCaseFilters.tsx
│           ├── TestCaseModal.tsx
│           └── TestCaseDetailModal.tsx
├── types/
│   └── test-case.ts              # TypeScript 类型定义
└── components/common/
    └── request.ts                # 请求封装
```

## 🐛 常见问题

### 1. 代理不工作

**症状**：前端请求返回 404 或网络错误

**检查**：
1. 确认后端服务已启动（端口 3000）
2. 确认 `next.config.mjs` 配置正确
3. 重启 Next.js 开发服务器

**调试**：
```bash
# 检查端口 3000 是否被占用
lsof -i :3000

# 检查代理配置是否生效
curl http://localhost:3030/api/test-cases
# 应该返回后端 API 的数据
```

### 2. 跨域错误

**症状**：浏览器控制台显示 CORS 错误

**原因**：直接访问了后端 API 端口（3000）而不是通过代理

**解决**：
- 前端页面必须访问：http://localhost:3030/admin/test-cases
- 不要直接访问：http://localhost:3000/admin/test-cases

### 3. 数据库初始化失败

**症状**：API 返回 "数据库初始化失败"

**检查**：
1. 确认 `.jsondb/test-case-manager` 目录存在
2. 确认有读写权限
3. 检查后端日志

**解决**：
```bash
# 创建数据库目录
mkdir -p .jsondb/test-case-manager

# 检查权限
chmod -R 755 .jsondb
```

### 4. 数据不显示

**症状**：列表页面显示空白或无数据

**检查**：
1. 打开浏览器开发者工具
2. 查看 Network 标签
3. 检查 `/api/test-cases` 请求是否成功

**调试**：
```bash
# 直接调用 API 验证
curl http://localhost:3000/api/test-cases

# 查看返回数据格式
# 应该返回：{"success":true,"data":[...],"pagination":{...}}
```

## 🧪 测试数据

系统已预置 33 条测试数据，覆盖以下场景：
- 用户管理（10 条）
- 订单管理（10 条）
- 商品管理（8 条）
- 权限管理（5 条）

**生成测试数据**（如果需要重新生成）：
```bash
cd /Users/bytedance/github/cmd
node scripts/generate-test-data.js
```

## 📊 API 接口文档

完整 API 文档请参考：
- `/Users/bytedance/github/cmd/.trae/documents/测试案例管理系统 - 迁移需求文档.md`

**主要接口**：
- `GET /api/test-cases` - 获取案例列表
- `GET /api/test-cases/:id` - 获取案例详情
- `POST /api/test-cases` - 创建案例
- `PUT /api/test-cases/:id` - 更新案例
- `DELETE /api/test-cases/:id` - 删除案例
- `POST /api/test-cases/batch` - 批量操作

## 🎯 开发工作流

1. **启动后端**：`node bin/dev.js -p 3000 -o`
2. **启动前端**：`cd next-app && pnpm dev`
3. **访问页面**：http://localhost:3030/admin/test-cases
4. **开发调试**：
   - 前端修改：自动热重载
   - 后端修改：需要重启服务
5. **查看日志**：
   - 前端：浏览器 Console + Next.js 终端
   - 后端：Express 终端

## 📝 注意事项

1. **端口占用**：
   - 确保端口 3000 和 3030 未被占用
   - 如需修改端口，同步更新代理配置

2. **数据持久化**：
   - 数据存储在 `.jsondb/test-case-manager`
   - 删除该目录会清空所有数据

3. **热重载**：
   - 前端支持热重载
   - 后端修改需要手动重启

4. **生产部署**：
   - 生产环境需要构建：`pnpm build`
   - 构建后需要配置反向代理（Nginx）
   - 或者使用 Docker 部署

## 🔗 相关文档

- [需求文档](../../.trae/documents/测试案例管理系统 - 迁移需求文档.md)
- [API 实现](../../src/http-server/test-case-api.js)
- [Model 层](../../src/model/jsondb/TestCase.js)

---

**文档版本**: v1.0  
**更新时间**: 2026-04-26  
**维护者**: Development Team
