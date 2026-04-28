# API 文档使用指南

## 📚 概述

本项目已配置完整的 API 文档生成系统，基于 **OpenAPI 3.0 (Swagger)** 规范，遵循 Vercel React Best Practices 的 `bundle-analyzable-paths` 和 `server-serialization` 规则，通过静态分析自动生成文档。

## 🚀 快速开始

### 1. 生成 API 文档

```bash
pnpm generate-api-docs
```

这个命令会：
- 扫描 `pages/api/` 目录下所有 API 文件
- 自动提取接口信息和 TypeScript 类型定义
- 生成 `swagger-output.json` 文件
- 输出统计信息

### 2. 查看 API 文档

启动开发服务器：
```bash
pnpm dev
```

访问：
```
http://localhost:3030/next/api-docs
```

您将看到一个完整的 Swagger UI 界面，包含：
- 所有 API 接口的列表
- 每个接口的请求方法、路径、参数
- 请求和响应的 Schema 定义
- 在线测试功能

## 📁 文件结构

```
next-app/
├── pages/
│   ├── api/
│   │   ├── dashboard-stats.ts    # 控制台统计 API
│   │   └── mock-orders.ts        # 模拟订单 API
│   └── api-docs.tsx              # API 文档页面
├── scripts/
│   └── generate-api-docs.js      # 文档生成脚本
├── swagger-output.json           # 生成的 Swagger 规范文件
└── README-API.md                 # 本文档
```

## 📊 已生成的 API 接口

### Dashboard（控制台）

#### GET `/api/dashboard-stats`
获取控制台统计数据

**响应示例：**
```json
{
  "totalOrders": 1128,
  "totalSales": 128936.00,
  "activeUsers": 8932,
  "conversionRate": 23.8,
  "pendingOrders": 12,
  "processingOrders": 35,
  "deliveredOrders": 45,
  "cancelledOrders": 3,
  "orderGrowth": 12.5,
  "salesTarget": 200000,
  "userGrowth": 256,
  "targetConversion": 30
}
```

### Orders（订单）

#### GET `/api/mock-orders`
获取模拟订单列表

**查询参数：**
- `count` (可选): 返回的订单数量，默认 150，范围 1-1000

**响应示例：**
```json
[
  {
    "id": "uuid-string",
    "orderNo": "ORD12345678",
    "customerName": "张三",
    "customerPhone": "13800138000",
    "totalAmount": 1299.00,
    "status": "delivered",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "shippingAddress": "北京市朝阳区 xxx 街道"
  }
]
```

## 🔧 自定义和扩展

### 添加新的 API 接口

1. 在 `pages/api/` 目录下创建新的 `.ts` 文件
2. 导出接口响应的 TypeScript 类型定义
3. 运行 `pnpm generate-api-docs` 重新生成文档

### 自定义文档生成逻辑

编辑 `scripts/generate-api-docs.js`：

```javascript
// 添加新的 API 处理逻辑
if (fileName === 'your-api-name') {
  operation = {
    summary: '您的 API 描述',
    description: '详细说明',
    tags: ['YourTag'],
    // ... 其他配置
  };
  
  // 添加 Schema 定义
  swaggerSpec.components.schemas.YourSchema = {
    type: 'object',
    properties: {
      // 定义属性
    },
  };
}
```

### 添加更多标签

在 `swaggerSpec` 配置中添加：

```javascript
tags: [
  { name: 'Dashboard', description: '控制台相关接口' },
  { name: 'Orders', description: '订单管理相关接口' },
  { name: 'Users', description: '用户管理相关接口' },  // 新增
]
```

## 🎯 Vercel 最佳实践

本项目遵循以下 Vercel React Best Practices：

### ✅ bundle-analyzable-paths
- 使用静态分析生成文档，避免运行时开销
- 所有 API 路径都是静态可分析的
- 不会将文档生成逻辑打包到客户端

### ✅ server-serialization
- API 响应数据最小化，只返回必要字段
- TypeScript 类型定义与服务端保持一致
- 避免序列化不必要的元数据

### ✅ async-api-routes
- API Routes 中提前启动 Promise
- 使用并行请求获取数据
- 延迟 await 直到必要时

## 🛠️ 高级功能

### 自动化集成

在 CI/CD 流程中自动更新文档：

```yaml
# .github/workflows/api-docs.yml
name: Generate API Docs
on:
  push:
    paths:
      - 'pages/api/**'
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: pnpm install
      - run: pnpm generate-api-docs
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: 'docs: auto-generate API docs'
          file_pattern: 'swagger-output.json'
```

### 导出为 PDF/HTML

使用 Swagger CLI 工具：

```bash
pnpm add -g swagger-cli
swagger-cli bundle swagger-output.json -o api-docs.html
```

### 与 Postman 集成

1. 打开 Postman
2. 导入 `swagger-output.json`
3. 自动生成 API 集合

## 📝 注意事项

1. **生产环境部署**：
   - 确保 `swagger-output.json` 被包含在构建产物中
   - 或者在构建时运行 `generate-api-docs` 脚本

2. **安全性**：
   - 生产环境建议添加身份验证
   - 敏感接口不要包含在公开文档中

3. **版本控制**：
   - 建议将 `swagger-output.json` 提交到 Git
   - 或者每次构建时重新生成

## 🔗 相关资源

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [next-swagger-doc](https://github.com/colinhacks/next-swagger-doc)
- [Vercel Best Practices](https://vercel.com/docs)

## 💡 问题排查

### 文档页面显示空白
- 检查 `swagger-output.json` 是否存在
- 确认开发服务器已启动
- 查看浏览器控制台是否有错误

### API 接口未出现在文档中
- 确认文件位于 `pages/api/` 目录
- 文件名不能以 `_` 开头
- 重新运行 `pnpm generate-api-docs`

### TypeScript 类型未正确提取
- 确保导出了类型定义
- 检查脚本中的类型映射逻辑
- 手动在脚本中添加 Schema 定义

---

**最后更新**: 2024-01-15
**版本**: v1.0.0
