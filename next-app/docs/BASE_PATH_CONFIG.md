# Next.js 构建配置说明

## 📋 basePath 配置

### 配置目的

为了支持通过 `/next` 前缀访问 Next.js 构建产物，在 `next.config.mjs` 中添加了 `basePath: '/next'` 配置。

### 配置位置

**文件**: `/Users/bytedance/github/cmd/next-app/next.config.mjs`

```javascript
const nextConfig = {
  output: isDev ? undefined : 'export',
  distDir: 'dist',
  reactStrictMode: true,
  basePath: '/next',  // ✅ 添加此行
  images: {
    unoptimized: true,
  },
  // ... 其他配置
};
```

---

## 🏗️ 架构说明

### 静态资源配置

**文件**: `/Users/bytedance/github/cmd/src/http-server/static.js`

```javascript
// 挂载 Next.js 静态资源
const nextDir = path.join(ROOT_DIR, 'public/page/_next');
app.use('/next', express.static(nextDir));
```

**说明**：
- 将 `/next` 路径映射到 `public/page/_next` 目录
- Next.js 构建后的静态资源会输出到该目录
- 通过 `http://localhost:3000/next/...` 访问

---

## 🚀 构建和部署

### 1. 构建项目

```bash
cd /Users/bytedance/github/cmd/next-app
pnpm build
```

**构建产物**：
- 输出目录：`dist/`
- 自动复制到：`../public/page/`（通过 `buildcp` 脚本）

### 2. 启动后端服务

```bash
cd /Users/bytedance/github/cmd
node bin/dev.js -p 3000 -o
```

### 3. 访问应用

**开发环境**（代理模式）：
- Next.js 开发服务器：http://localhost:3030/next/admin/test-cases
- 后端 API 代理：http://localhost:3000/api/test-cases

**生产环境**（静态文件）：
- 通过 Express 服务：http://localhost:3000/next/admin/test-cases

---

## 📁 目录结构

### 构建后

```
/Users/bytedance/github/cmd/
├── next-app/
│   ├── dist/                    # 构建输出目录
│   │   ├── _next/               # Next.js 运行时和资源
│   │   ├── next/                # 包含 basePath 的页面
│   │   │   └── admin/
│   │   │       └── test-cases/
│   │   │           └── index.html
│   │   └── ...
│   └── ...
└── public/
    └── page/
        └── _next/               # 静态资源（通过 /next 访问）
            ├── static/
            │   ├── css/
            │   ├── js/
            │   └── media/
            └── ...
```

---

## 🔧 配置说明

### basePath 的作用

1. **URL 前缀**：所有页面和资源的 URL 都会添加 `/next` 前缀
2. **资源路径**：自动为 `_next/static/...` 等资源添加 basePath
3. **路由匹配**：Next.js 会自动处理带 basePath 的路由

### 示例对比

**无 basePath**：
```
页面 URL: http://localhost:3000/admin/test-cases
资源 URL: http://localhost:3000/_next/static/css/app.css
```

**有 basePath (`/next`)**：
```
页面 URL: http://localhost:3000/next/admin/test-cases
资源 URL: http://localhost:3000/next/_next/static/css/app.css
```

---

## 📝 注意事项

### 1. 开发环境

开发环境下（`next dev`），`basePath` 同样生效：

```bash
# 访问开发服务器时需要添加 /next 前缀
http://localhost:3030/next/admin/test-cases
```

### 2. 代理配置

开发环境下的代理配置不受 basePath 影响：

```javascript
// next.config.mjs
async rewrites() {
  return [
    {
      source: '/api/:path*',  // ✅ 仍然匹配 /api/*
      destination: 'http://localhost:3000/api/:path*',
    },
  ];
}
```

### 3. 静态资源配置

确保 Express 静态资源路径正确：

```javascript
// static.js
app.use('/next', express.static(path.join(ROOT_DIR, 'public/page/_next')));
```

### 4. 构建脚本

使用 `buildcp` 脚本自动复制构建产物：

```bash
pnpm buildcp
# 等同于：next build && cp -r dist/* ../public/page/
```

---

## 🐛 常见问题

### 问题 1: 404 错误

**症状**: 访问页面返回 404

**检查**:
1. 确认 URL 包含 `/next` 前缀
2. 确认构建产物已复制到 `public/page/` 目录
3. 确认 Express 静态资源配置正确

**解决**:
```bash
# 重新构建
pnpm buildcp

# 重启后端服务
node bin/dev.js -p 3000 -o
```

### 问题 2: 资源加载失败

**症状**: 页面能访问，但 CSS/JS 加载失败

**检查**:
1. 打开浏览器开发者工具
2. 查看 Network 标签
3. 检查资源路径是否正确（应包含 `/next`）

**解决**:
- 清除浏览器缓存
- 重新构建项目
- 检查 basePath 配置

### 问题 3: 开发环境不工作

**症状**: 开发环境下访问失败

**检查**:
1. 确认访问 http://localhost:3030/next/...
2. 确认 next.config.mjs 配置正确
3. 重启 Next.js 开发服务器

**解决**:
```bash
cd next-app
pnpm dev
```

---

## 🔗 相关配置

### next.config.mjs 完整配置

```javascript
/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  output: isDev ? undefined : 'export',
  distDir: 'dist',
  reactStrictMode: true,
  basePath: '/next',  // ✅ basePath 配置
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

export default nextConfig;
```

### package.json 脚本

```json
{
  "scripts": {
    "dev": "next dev -p 3030",
    "build": "next build",
    "buildcp": "next build && cp -r dist/* ../public/page/",
    "start": "next start -p 3030"
  }
}
```

---

## 📖 参考文档

- [Next.js basePath 官方文档](https://nextjs.org/docs/api-reference/next.config.js/basepath)
- [Next.js Static Exports](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)
- [Express 静态文件服务](https://expressjs.com/en/starter/static-files.html)

---

**文档版本**: v1.0  
**创建时间**: 2026-04-26  
**更新内容**: 添加 basePath 配置说明  
**维护者**: Development Team
