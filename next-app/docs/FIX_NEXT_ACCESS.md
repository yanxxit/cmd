# 修复 `/next` 访问问题

## 🐛 问题描述

用户反馈访问 `http://localhost:3000/next` 无效，无法访问 Next.js 构建的页面。

## 🔍 问题分析

### 问题 1: 静态资源路径配置错误

**原始配置**：
```javascript
// static.js
const nextDir = path.join(ROOT_DIR, 'next-app/_next');
app.use('/next', express.static(nextDir));
```

**问题**：
- `next-app/_next` 目录不存在
- 实际构建产物在 `public/page/_next` 目录

### 问题 2: 缺少页面路由配置

**问题**：
- 只配置了静态资源服务
- 没有配置 HTML 页面的路由规则
- Next.js 导出的是静态 HTML 文件，需要显式配置路由

## ✅ 解决方案

### 1. 修复静态资源路径

**文件**: `/Users/bytedance/github/cmd/src/http-server/static.js`

**修改**：
```javascript
// 挂载 Next.js 静态资源
const nextDir = path.join(ROOT_DIR, 'public/page/_next');
app.use('/next/_next', express.static(nextDir));  // ✅ 修改路径
```

**说明**：
- 将静态资源目录改为 `public/page/_next`
- 路由改为 `/next/_next`，因为 HTML 中的资源路径是 `/next/_next/static/...`

### 2. 添加页面路由规则

**新增代码**：
```javascript
// Next.js 页面路由（处理 SPA 路由）
const nextPagesDir = path.join(ROOT_DIR, 'public/page');

// 控制台页面
app.get('/next/admin', (req, res) => {
  res.sendFile(path.join(nextPagesDir, 'admin.html'));
});

// 测试案例管理页面
app.get('/next/admin/test-cases', (req, res) => {
  res.sendFile(path.join(nextPagesDir, 'admin', 'test-cases.html'));
});
```

**说明**：
- 为每个 Next.js 页面添加路由规则
- 使用 `res.sendFile()` 直接返回 HTML 文件

### 3. 重新构建项目

```bash
cd next-app
pnpm buildcp  # 构建并复制到 public/page/
```

### 4. 重启后端服务

```bash
# 停止现有服务
kill <pid>

# 重新启动
node bin/dev.js -p 3000 -o
```

## 🧪 验证结果

### 测试命令

```bash
# 测试控制台页面
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/next/admin
# 返回：200 ✅

# 测试测试案例管理页面
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/next/admin/test-cases
# 返回：200 ✅
```

### 访问地址

- **控制台**: http://localhost:3000/next/admin
- **测试案例管理**: http://localhost:3000/next/admin/test-cases

## 📝 完整配置

### static.js 配置

```javascript
// 挂载 Next.js 静态资源
const nextDir = path.join(ROOT_DIR, 'public/page/_next');
app.use('/next/_next', express.static(nextDir));

// Next.js 页面路由（处理 SPA 路由）
const nextPagesDir = path.join(ROOT_DIR, 'public/page');
app.get('/next/admin', (req, res) => {
  res.sendFile(path.join(nextPagesDir, 'admin.html'));
});
app.get('/next/admin/test-cases', (req, res) => {
  res.sendFile(path.join(nextPagesDir, 'admin', 'test-cases.html'));
});
```

### next.config.mjs 配置

```javascript
const nextConfig = {
  output: isDev ? undefined : 'export',
  distDir: 'dist',
  reactStrictMode: true,
  basePath: '/next',  // ✅ 关键配置
  images: {
    unoptimized: true,
  },
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
  },
};
```

## 🎯 工作流程

### 开发环境

```bash
# 1. 启动 Next.js 开发服务器
cd next-app
pnpm dev

# 2. 访问（带 basePath）
http://localhost:3030/next/admin/test-cases
```

### 生产环境

```bash
# 1. 构建项目
cd next-app
pnpm buildcp

# 2. 启动后端服务
cd ..
node bin/dev.js -p 3000 -o

# 3. 访问
http://localhost:3000/next/admin/test-cases
```

## 📁 文件结构

### 构建后

```
/Users/bytedance/github/cmd/
├── next-app/
│   ├── dist/                    # 构建输出
│   │   └── _next/               # Next.js 运行时
│   └── ...
├── public/
│   └── page/
│       ├── _next/               # 静态资源（通过 /next/_next 访问）
│       ├── admin.html           # 控制台页面
│       └── admin/
│           └── test-cases.html  # 测试案例页面
└── src/
    └── http-server/
        └── static.js            # 路由配置
```

## 💡 关键点

1. **basePath 配置**: Next.js 必须配置 `basePath: '/next'`
2. **静态资源路径**: 必须指向实际的文件目录 `public/page/_next`
3. **页面路由**: 需要为每个 HTML 页面添加路由规则
4. **资源前缀**: HTML 中的资源路径会自动添加 basePath 前缀

## 🔗 相关文档

- [basePath 配置说明](./BASE_PATH_CONFIG.md)
- [开发环境搭建指南](./TEST_CASE_SETUP.md)
- [实现总结](./IMPLEMENTATION_SUMMARY.md)

---

**修复时间**: 2026-04-26  
**修复状态**: ✅ 完成  
**影响范围**: `/next/*` 所有页面
