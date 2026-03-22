# 快速参考指南

**项目版本**: 2.0.0  
**最后更新**: 2026-03-22

---

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev
# 访问 http://localhost:3030

# 生产构建
pnpm build

# 代码检查
pnpm lint
pnpm type-check
```

---

## 📦 核心依赖

```json
{
  "next": "16.2.1",
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "antd": "^5.29.3",
  "typescript": "^5.8.3"
}
```

---

## 🎯 常用命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm dev -p 8080      # 指定端口

# 构建
pnpm build            # 生产构建
pnpm buildcp          # 构建并复制

# 检查
pnpm lint             # ESLint 检查
pnpm lint:fix         # 自动修复
pnpm type-check       # TypeScript 检查
pnpm format           # Prettier 格式化

# 清理
pnpm clean            # 清理构建文件
pnpm reinstall        # 重新安装依赖
```

---

## 📝 代码模板

### React 19 组件

```typescript
'use client';

import { App, Button } from 'antd';
import { useState } from 'react';

interface Props {
  title: string;
}

export function MyComponent({ title }: Props) {
  const { message } = App.useApp();
  const [count, setCount] = useState(0);

  const handleClick = () => {
    message.success('点击了按钮');
  };

  return (
    <div>
      <h1>{title}</h1>
      <p>计数：{count}</p>
      <Button onClick={handleClick}>点击</Button>
    </div>
  );
}
```

### 自定义 Hook

```typescript
import { useState, useCallback } from 'react';

export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(c => c - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initial);
  }, [initial]);

  return { count, increment, decrement, reset };
}
```

### Ant Design Provider

```typescript
// components/AntdProvider.tsx
"use client";

import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider, App } from "antd";
import " @ant-design/v5-patch-for-react-19";

export default function AntdProvider({ children, darkMode = false }) {
  return (
    <StyleProvider layer>
      <ConfigProvider
        theme={{
          cssVar: true,
          hashed: false,
          algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </StyleProvider>
  );
}
```

---

## 🔧 配置文件

### next.config.mjs

```javascript
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] },
    "types": []
  }
}
```

---

## 🎨 代码规范要点

### 导入顺序

```typescript
// 1. React
import { useState } from 'react';

// 2. 第三方库
import { Button } from 'antd';
import { App } from 'antd';

// 3. 内部模块
import { useJsonDiff } from '@/hooks';
import { utils } from '@/lib';

// 4. 相对路径
import { Child } from './Child';
```

### 类型定义

```typescript
// ✅ 使用 interface
interface User {
  id: string;
  name: string;
}

// ✅ 明确返回类型
const getUser = (id: string): User => {
  return { id, name: 'User' };
};
```

### 组件定义

```typescript
// ✅ 推荐
export function MyComponent({ name }: Props) {
  return <div>{name}</div>;
}

// 或者
export const MyComponent: React.FC<Props> = ({ name }) => {
  return <div>{name}</div>;
};
```

---

## 🐛 常见问题

### 1. Ant Design message 警告

```typescript
// ❌ 错误
import { message } from 'antd';
message.success('操作成功');

// ✅ 正确
import { App } from 'antd';
const { message } = App.useApp();
message.success('操作成功');
```

### 2. React 19 不需要导入 React

```typescript
// ❌ 过时
import React from 'react';

// ✅ React 19
import { useState } from 'react';
```

### 3. TypeScript any 类型

```typescript
// ❌ 避免使用
const data: any = {};

// ✅ 使用 unknown 或具体类型
const data: unknown = {};
const data: Record<string, any> = {};
```

---

## 📚 文档索引

| 文档 | 说明 |
|------|------|
| [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md) | 完整开发规范 |
| [UPGRADE_TO_NEXTJS16.md](./UPGRADE_TO_NEXTJS16.md) | Next.js 16 升级指南 |
| [ANTD_REACT19_FIX.md](./ANTD_REACT19_FIX.md) | Ant Design 修复指南 |
| [PROJECT_CHECK_REPORT.md](./PROJECT_CHECK_REPORT.md) | 项目检查报告 |
| [QUICK_START.md](./QUICK_START.md) | 快速开始 |

---

## 🔗 有用链接

- [Next.js 16 文档](https://nextjs.org/docs/16)
- [React 19 文档](https://react.dev)
- [Ant Design 5.x](https://ant.design)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)

---

**最后更新**: 2026-03-22  
**项目版本**: 2.0.0
