# 测试案例管理系统 - Next.js 实现

## 🎯 项目概述

这是一个基于 Next.js + React + Ant Design 5.x 构建的测试案例管理系统前端应用。

## ✨ 技术栈

- **框架**: Next.js 16.2.1 (Pages Router)
- **UI 库**: Ant Design 5.29.3
- **语言**: TypeScript 5.8.3
- **状态管理**: ahooks 3.9.6
- **HTTP 客户端**: Fetch API + ahooks useRequest
- **样式**: Tailwind CSS 4.2.2
- **图标**: @ant-design/icons 6.1.0
- **JSON 编辑器**: @uiw/react-codemirror 4.25.8

## 🚀 快速开始

### 方式 1: 自动启动（推荐）

使用一键启动脚本同时启动后端和前端：

```bash
cd /Users/bytedance/github/cmd/next-app
./scripts/start-dev.sh
```

### 方式 2: 手动启动

**步骤 1: 启动后端 API**

```bash
cd /Users/bytedance/github/cmd
node bin/dev.js -p 3000 -o
```

**步骤 2: 启动前端 Next.js**

```bash
cd /Users/bytedance/github/cmd/next-app
pnpm dev
```

### 访问应用

- **前端页面**: http://localhost:3030/admin/test-cases
- **后端 API**: http://localhost:3000/api/test-cases

## 📦 功能特性

✅ **案例管理**
- 创建、编辑、删除测试案例
- 批量删除操作
- 案例详情查看

✅ **搜索和过滤**
- 关键词搜索（接口名、标题）
- 接口名分组筛选
- 标签过滤
- 组合搜索

✅ **数据展示**
- 表格列表展示
- 分页功能
- 统计卡片（总数、接口数、标签数）

✅ **JSON 处理**
- JSON 编辑器（基于 CodeMirror）
- 字符串转 JSON 格式化
- JSON 复制功能

✅ **用户体验**
- 响应式布局
- 加载状态提示
- 错误处理和提示
- 表单验证

## 🏗️ 项目结构

```
next-app/
├── pages/
│   ├── admin/
│   │   ├── index.tsx              # 仪表盘
│   │   └── test-cases/
│   │       └── index.tsx          # 测试案例管理页面
│   ├── _app.tsx                   # App 入口
│   └── login.tsx                  # 登录页面
├── components/
│   ├── admin/
│   │   ├── layout/                # 后台布局组件
│   │   │   ├── AdminLayout.tsx
│   │   │   └── index.ts
│   │   └── test-case/             # 测试案例组件
│   │       ├── TestCaseTable.tsx
│   │       ├── TestCaseFilters.tsx
│   │       ├── TestCaseModal.tsx
│   │       └── TestCaseDetailModal.tsx
│   └── common/                    # 通用组件
│       ├── JsonEditor.tsx
│       └── request.ts
├── types/
│   └── test-case.ts               # TypeScript 类型定义
├── docs/
│   └── TEST_CASE_SETUP.md         # 开发环境搭建指南
└── scripts/
    └── start-dev.sh               # 快速启动脚本
```

## 🔧 配置说明

### 代理配置

开发环境下，通过 Next.js Rewrites 将 `/api/*` 请求代理到后端：

```javascript
// next.config.mjs
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

### 数据持久化

- **数据库**: @yanit/jsondb
- **存储位置**: `/Users/bytedance/github/cmd/.jsondb/test-case-manager`
- **数据格式**: JSON（支持 JSONB 模式）

## 📊 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/test-cases` | 获取案例列表 |
| GET | `/api/test-cases/:id` | 获取案例详情 |
| POST | `/api/test-cases` | 创建案例 |
| PUT | `/api/test-cases/:id` | 更新案例 |
| DELETE | `/api/test-cases/:id` | 删除案例 |
| POST | `/api/test-cases/batch` | 批量操作 |
| GET | `/api/test-cases/stats` | 获取统计信息 |
| GET | `/api/test-cases/api-names` | 获取接口名列表 |
| GET | `/api/test-cases/tags` | 获取标签列表 |

详细 API 文档请参考：[测试案例管理系统 - 迁移需求文档](../../.trae/documents/测试案例管理系统 - 迁移需求文档.md)

## 🧪 测试数据

系统已预置 33 条测试数据：
- 用户管理：10 条
- 订单管理：10 条
- 商品管理：8 条
- 权限管理：5 条

如需重新生成测试数据：
```bash
cd /Users/bytedance/github/cmd
node scripts/generate-test-data.js
```

## 📖 开发指南

### 开发工作流

1. 启动后端和前端服务
2. 访问 http://localhost:3030/admin/test-cases
3. 前端修改自动热重载
4. 后端修改需要重启服务

### 代码规范

```bash
# 类型检查
pnpm type-check

# ESLint 检查
pnpm lint:check

# Prettier 格式化
pnpm format

# 运行测试（待实现）
pnpm test
```

### 构建部署

```bash
# 生产构建
pnpm build

# 启动生产服务
pnpm start
```

生产环境部署需要配置反向代理（Nginx）或使用 Docker。

## 🐛 常见问题

详细的问题排查指南请参考：[开发环境搭建指南](./docs/TEST_CASE_SETUP.md)

### 快速排查

1. **代理不工作**: 检查后端是否启动在 3000 端口
2. **跨域错误**: 确保访问 localhost:3030 而不是 localhost:3000
3. **数据库错误**: 检查 `.jsondb/test-case-manager` 目录权限

## 🔗 相关链接

- [开发环境搭建指南](./docs/TEST_CASE_SETUP.md)
- [需求文档](../../.trae/documents/测试案例管理系统 - 迁移需求文档.md)
- [API 实现](../../src/http-server/test-case-api.js)
- [Model 层](../../src/model/jsondb/TestCase.js)
- [Next.js 官方文档](https://nextjs.org/docs)
- [Ant Design 官方文档](https://ant.design/)

## 📝 注意事项

1. **端口要求**: 确保端口 3000 和 3030 未被占用
2. **数据备份**: 定期备份 `.jsondb` 目录
3. **热重载**: 前端支持热重载，后端需要手动重启
4. **生产部署**: 构建后需要配置反向代理

## 📄 License

MIT

---

**项目版本**: v1.0  
**创建时间**: 2026-04-26  
**维护者**: Development Team
