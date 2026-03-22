# React 18 升级指南

## 版本变更说明

本项目已从 React 19 降级到 React 18，以确保更好的稳定性和兼容性。

### 依赖版本

```json
{
  "next": "14.2.28",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "@ant-design/icons": "^5.3.7",
  "antd": "^5.29.3"
}
```

### 主要变更

#### 1. Next.js 配置

**next.config.mjs** (不再是 .ts)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  reactStrictMode: false,
};

export default nextConfig;
```

#### 2. 字体配置

使用 `Inter` 字体替代 `Geist`：

```typescript
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

#### 3. ESLint 配置

启用 React 18 规则：

```javascript
{
  rules: {
    "react/react-in-jsx-scope": "error",  // React 18 需要显式导入
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  }
}
```

#### 4. TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "jsx": "preserve",
    "types": []
  }
}
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 代码检查
pnpm lint
pnpm lint:fix

# 格式化
pnpm format
```

## 注意事项

### 1. React 严格模式

React 18 的严格模式会在开发环境下双重渲染组件，可能导致性能问题。本项目已关闭：

```javascript
// next.config.mjs
reactStrictMode: false,
```

### 2. 图标库版本

`@ant-design/icons` 5.6.x 版本存在 ESM 模块问题，使用 5.3.7 版本：

```bash
pnpm add @ant-design/icons@5.3.7 -w
```

### 3. 配置文件格式

Next.js 14 不支持 `next.config.ts`，必须使用 `.mjs` 或 `.js`：

```bash
mv next.config.ts next.config.mjs
```

### 4. 清理缓存

遇到构建问题时，清理缓存：

```bash
rm -rf node_modules dist .next pnpm-lock.yaml
pnpm store prune
pnpm install
```

## React 18 新特性

### 1. 自动批处理

React 18 会自动批处理多个状态更新：

```typescript
// React 17
setState(a);
setState(b); // 触发两次渲染

// React 18
setState(a);
setState(b); // 只触发一次渲染（自动批处理）
```

### 2. useTransition

```typescript
import { useTransition } from 'react';

const [isPending, startTransition] = useTransition();

startTransition(() => {
  // 非紧急更新
  setSearchQuery(input);
});
```

### 3. useDeferredValue

```typescript
import { useDeferredValue } from 'react';

const deferredValue = useDeferredValue(value);
```

### 4. Suspense

```typescript
<Suspense fallback={<Loading />}>
  <Component />
</Suspense>
```

## 兼容性说明

### 支持的浏览器

- Chrome/Edge (最新版)
- Firefox (最新版)
- Safari (最新版)

### Node.js 版本

最低要求：Node.js 18.0.0

### pnpm 版本

推荐：pnpm 10.0.0+

## 故障排除

### 问题：构建时出现模块未找到错误

```bash
# 清理并重新安装
rm -rf node_modules .next dist
pnpm store prune
pnpm install
```

### 问题：图标不显示

```bash
# 重新安装图标库
pnpm add @ant-design/icons@5.3.7 -w
```

### 问题：TypeScript 类型错误

```bash
# 清理类型缓存
rm -rf node_modules/.cache
pnpm type-check
```

## 参考资源

- [React 18 官方文档](https://react.dev)
- [Next.js 14 文档](https://nextjs.org/docs/14)
- [Ant Design 5.x 文档](https://ant.design)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
