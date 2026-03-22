# Next.js 16 + React 19 项目开发规范

**版本**: 2.0.0  
**最后更新**: 2026-03-22  
**适用项目**: cmd/next-app

---

## 📋 目录

1. [技术栈](#技术栈)
2. [项目结构](#项目结构)
3. [环境配置](#环境配置)
4. [代码规范](#代码规范)
5. [组件开发](#组件开发)
6. [Ant Design 使用规范](#ant-design-使用规范)
7. [状态管理](#状态管理)
8. [性能优化](#性能优化)
9. [测试规范](#测试规范)
10. [Git 提交规范](#git-提交规范)

---

## 技术栈

### 核心框架

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Next.js** | 16.2.1 | React 框架 | 默认 Turbopack |
| **React** | 19.2.4 | UI 库 | 最新稳定版 |
| **TypeScript** | 5.8.3 | 类型系统 | 严格模式 |
| **Ant Design** | 5.29.3 | UI 组件库 | 配合 React 19 补丁 |

### 兼容包

```json
{
  "@ant-design/cssinjs": "^1.24.0",
  "@ant-design/v5-patch-for-react-19": "^1.0.3"
}
```

### 环境要求

```json
{
  "node": ">=20.0.0",
  "pnpm": ">=10.0.0"
}
```

---

## 项目结构

```
next-app/
├── app/                      # App Router
│   ├── layout.tsx           # 根布局（包含 AntdProvider）
│   ├── page.tsx             # 首页
│   └── globals.css          # 全局样式
├── components/              # 可复用组件
│   ├── AntdProvider.tsx     # Ant Design Provider
│   └── json-diff/           # JSON 对比模块
│       ├── index.ts         # 统一导出
│       ├── HighlightEditor.tsx
│       ├── useJsonDiff.ts
│       ├── utils.ts
│       ├── logic.ts
│       ├── types.ts
│       ├── constants.ts
│       └── styles.ts
├── hooks/                   # 全局 Hooks
│   ├── index.ts
│   ├── useLocalStorage.ts
│   └── useTheme.ts
├── lib/                     # 工具库
│   ├── index.ts
│   ├── utils.ts
│   └── constants.ts
├── pages/                   # Pages Router（兼容）
│   └── json-diff-v3.tsx
├── public/                  # 静态资源
├── scripts/                 # 脚本工具
│   ├── verify-upgrade.sh
│   └── check-compatibility.sh
├── types/                   # 全局类型
│   └── index.ts
└── package.json
```

---

## 环境配置

### 1. 安装依赖

```bash
pnpm install
```

### 2. 开发模式

```bash
pnpm dev
# 访问 http://localhost:3030
```

### 3. 生产构建

```bash
pnpm build
pnpm start
```

### 4. 代码检查

```bash
# ESLint
pnpm lint
pnpm lint:fix

# TypeScript
pnpm type-check

# Prettier
pnpm format
pnpm format:check
```

---

## 代码规范

### TypeScript 规范

#### 1. 使用 interface 定义对象类型

```typescript
// ✅ 推荐
interface UserProps {
  id: string;
  name: string;
  age?: number;
}

// ❌ 不推荐
type UserProps = {
  id: string;
  name: string;
  age?: number;
};
```

#### 2. 明确函数返回类型

```typescript
// ✅ 推荐
const getUser = (id: string): Promise<User> => {
  return api.get(`/users/${id}`);
};

// ❌ 不推荐（复杂函数）
const getUser = (id: string) => {
  return api.get(`/users/${id}`);
};
```

#### 3. 使用严格模式

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### React 19 规范

#### 1. 不需要导入 React

```typescript
// ✅ React 19 - 不需要导入 React
import { useState } from 'react';

export function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

// ❌ React 18 - 已过时
import React from 'react';
```

#### 2. 使用函数组件

```typescript
// ✅ 推荐
export function MyComponent({ name, age }: Props) {
  return <div>{name}: {age}</div>;
}

// 或者
export const MyComponent: React.FC<Props> = ({ name, age }) => {
  return <div>{name}: {age}</div>;
};
```

#### 3. Props 解构

```typescript
// ✅ 推荐
export function UserCard({ name, age, email }: UserProps) {
  return <div>{name}</div>;
}

// ❌ 不推荐
export function UserCard(props: UserProps) {
  return <div>{props.name}</div>;
}
```

---

## 组件开发

### 1. 组件文件结构

```typescript
'use client';

// 1. 导入
import React, { useMemo, useCallback } from 'react';
import { App, Button } from 'antd';
import { useJsonDiff } from '@/hooks';

// 2. 类型定义
interface Props {
  title: string;
  count?: number;
}

// 3. 子组件（使用 memo 优化）
const ChildComponent = React.memo(({ data }: ChildProps) => {
  return <div>{data}</div>;
});
ChildComponent.displayName = 'ChildComponent';

// 4. 主组件
export const MyComponent: React.FC<Props> = ({ title, count = 0 }) => {
  // 4.1 Hooks 调用顺序
  const { message } = App.useApp();
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState('');
  
  // 4.2 缓存计算
  const computedValue = useMemo(() => {
    return title.trim();
  }, [title]);
  
  // 4.3 缓存回调
  const handleClick = useCallback(() => {
    message.success('clicked');
  }, [message]);
  
  // 4.4 副作用
  useEffect(() => {
    console.log('mounted');
  }, []);
  
  // 5. 渲染
  return (
    <div>
      <button onClick={handleClick}>{computedValue}: {count}</button>
    </div>
  );
};
```

### 2. 组件优化原则

```typescript
// ✅ 使用 React.memo 避免不必要的重渲染
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// ✅ 使用 useMemo 缓存昂贵计算
const result = useMemo(() => {
  return heavyComputation(data);
}, [data]);

// ✅ 使用 useCallback 缓存事件处理
const handleClick = useCallback(() => {
  // 处理逻辑
}, [dependencies]);

// ✅ 列表渲染添加 key
{items.map(item => (
  <ListItem key={item.id} data={item} />
))}
```

---

## Ant Design 使用规范

### 1. 使用 App.useApp() Hook

```typescript
// ✅ 推荐
import { App } from 'antd';

export default function MyComponent() {
  const { message, notification, modal } = App.useApp();
  
  const handleClick = () => {
    message.success('操作成功');
  };
  
  return <button onClick={handleClick}>点击</button>;
}

// ❌ 不推荐（静态方法）
import { message } from 'antd';
message.success('操作成功');
```

### 2. AntdProvider 配置

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

### 3. 在根布局中使用

```typescript
// app/layout.tsx
import AntdProvider from '@/components/AntdProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdProvider>
          {children}
        </AntdProvider>
      </body>
    </html>
  );
}
```

---

## 状态管理

### 1. 使用 useState

```typescript
const [count, setCount] = useState(0);
```

### 2. 使用 useReducer（复杂状态）

```typescript
const reducer = (state, action) => {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    default:
      return state;
  }
};

const [state, dispatch] = useReducer(reducer, { count: 0 });
```

### 3. 自定义 Hooks

```typescript
// hooks/useJsonDiff.ts
export const useJsonDiff = (options: UseJsonDiffOptions = {}) => {
  const { initialFilterSame = false } = options;
  
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  
  const handleCompare = useCallback(() => {
    // 对比逻辑
  }, [leftJson, rightJson]);
  
  return {
    leftJson,
    rightJson,
    handleCompare,
  };
};
```

---

## 性能优化

### 1. 代码分割

```typescript
// 动态导入
const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { 
    loading: () => <Spinner />,
    ssr: false 
  }
);
```

### 2. 图片优化

```typescript
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="描述"
  width={800}
  height={600}
  priority  // 首屏图片
  quality={75}
/>
```

### 3. 防抖节流

```typescript
// lib/utils.ts
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

---

## Git 提交规范

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | feat(json-diff): 添加文件上传 |
| fix | 修复 bug | fix(editor): 修复粘贴重复 |
| docs | 文档更新 | docs: 更新开发规范 |
| style | 代码格式 | style: 格式化代码 |
| refactor | 重构 | refactor: 优化组件结构 |
| perf | 性能优化 | perf: 提升渲染性能 |
| test | 测试 | test: 添加单元测试 |
| chore | 构建/工具 | chore: 更新依赖 |

### 示例

```bash
# ✅ 推荐
git commit -m "feat(json-diff): 添加文件上传功能"
git commit -m "fix(editor): 修复粘贴内容重复问题"
git commit -m "perf(editor): 使用 useMemo 优化渲染性能"

# ❌ 不推荐
git commit -m "更新代码"
git commit -m "修复 bug"
```

---

## 验证脚本

### 升级验证

```bash
bash scripts/verify-upgrade.sh
```

### 兼容性检查

```bash
bash scripts/check-compatibility.sh
```

---

## 参考文档

- [UPGRADE_TO_NEXTJS16.md](./UPGRADE_TO_NEXTJS16.md) - Next.js 16 升级指南
- [ANTD_REACT19_FIX.md](./ANTD_REACT19_FIX.md) - Ant Design React 19 兼容性修复
- [PACKAGE_COMPATIBILITY.md](./PACKAGE_COMPATIBILITY.md) - 包兼容性报告
- [QUICK_START.md](./QUICK_START.md) - 快速开始指南

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 2.0.0 | 2026-03-22 | Next.js 16 + React 19 升级 |
| 1.0.0 | 2026-03-22 | 初始版本 |
