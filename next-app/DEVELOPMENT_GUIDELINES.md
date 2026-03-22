# Next.js 项目开发规范文档

> 本文档规定了 Next.js 项目的开发规范，所有团队成员必须遵守。

**版本**: 1.0.0  
**最后更新**: 2026-03-22  
**适用项目**: cmd/next-app

---

## 📋 目录

1. [项目结构](#项目结构)
2. [技术栈](#技术栈)
3. [代码规范](#代码规范)
4. [组件开发规范](#组件开发规范)
5. [状态管理规范](#状态管理规范)
6. [API 调用规范](#api 调用规范)
7. [样式规范](#样式规范)
8. [性能优化](#性能优化)
9. [测试规范](#测试规范)
10. [Git 提交规范](#git 提交规范)
11. [部署规范](#部署规范)

---

## 项目结构

### 推荐目录结构

```
next-app/
├── app/                      # App Router (推荐)
│   ├── (routes)/            # 路由组
│   ├── api/                 # API 路由
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 首页
├── components/              # 可复用组件
│   ├── ui/                  # 基础 UI 组件
│   ├── features/            # 功能组件
│   └── layouts/             # 布局组件
├── hooks/                   # 自定义 Hooks
├── lib/                     # 工具库
│   ├── utils.ts             # 通用工具函数
│   └── constants.ts         # 常量定义
├── types/                   # TypeScript 类型定义
├── public/                  # 静态资源
├── styles/                  # 样式文件
└── tests/                   # 测试文件
```

### 当前项目结构优化

```
next-app/
├── components/
│   └── json-diff/          # JSON 对比功能模块
│       ├── index.ts        # 统一导出
│       ├── HighlightEditor.tsx  # 编辑器组件
│       ├── useJsonDiff.ts  # 自定义 Hook
│       ├── utils.ts        # 工具函数
│       ├── logic.ts        # 核心逻辑
│       ├── types.ts        # 类型定义
│       ├── constants.ts    # 常量配置
│       └── styles.ts       # 样式定义
├── pages/                  # Pages Router (当前使用)
│   └── json-diff-v3.tsx    # JSON 对比页面
├── hooks/                  # 全局 Hooks (新建)
├── lib/                    # 工具库 (新建)
└── types/                  # 全局类型 (新建)
```

---

## 技术栈

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14.2.28 | React 框架 |
| React | 18.3.1 | UI 库 |
| TypeScript | 5.x | 类型系统 |
| Ant Design | 5.29.3 | UI 组件库 |
| @ant-design/icons | 5.3.7 | 图标库 |

### 构建工具

- **包管理器**: pnpm (推荐) / npm
- **编译器**: Turbopack (开发模式)
- **打包**: Webpack (生产模式)

### 环境要求

```json
{
  "node": ">=18.0.0",
  "pnpm": ">=10.0.0"
}
```

---

## 代码规范

### TypeScript 规范

#### 1. 类型定义优先使用 interface

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

// ❌ 不推荐
const getUser = (id: string) => {
  return api.get(`/users/${id}`);
};
```

#### 3. 使用严格模式

```typescript
// tsconfig.json
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

### React 规范

#### 1. 组件定义

```typescript
// ✅ 推荐：使用 FC 类型
interface Props {
  title: string;
  count?: number;
}

export const MyComponent: React.FC<Props> = ({ title, count = 0 }) => {
  return <div>{title}: {count}</div>;
};

// 或者使用函数组件（更简洁）
export function MyComponent({ title, count = 0 }: Props) {
  return <div>{title}: {count}</div>;
}
```

#### 2. Props 解构

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

#### 3. 使用 useMemo 和 useCallback 优化

```typescript
// ✅ 推荐：缓存计算结果
const filteredList = useMemo(
  () => list.filter(item => item.active),
  [list]
);

// ✅ 推荐：缓存回调函数
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);

// ❌ 不推荐：每次渲染都创建新对象
const style = { color: 'red' };
const handleClick = () => console.log('clicked');
```

#### 4. 自定义 Hooks 命名

```typescript
// ✅ 推荐
export const useJsonDiff = () => { };
export const useLocalStorage = () => { };

// ❌ 不推荐
export const jsonDiffHook = () => { };
export const localStorageHook = () => { };
```

---

## 组件开发规范

### 1. 组件文件结构

```typescript
'use client';  // 客户端组件

// 1. 导入
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from 'antd';
import { useJsonDiff } from './hooks';
import { styles } from './styles';

// 2. 类型定义
interface Props {
  value: string;
  onChange: (value: string) => void;
}

// 3. 子组件（使用 memo 优化）
const ChildComponent = React.memo(({ data }: ChildProps) => {
  return <div>{data}</div>;
});
ChildComponent.displayName = 'ChildComponent';

// 4. 主组件
export const MyComponent: React.FC<Props> = ({ value, onChange }) => {
  // 4.1 Hooks 调用顺序
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState('');
  
  // 4.2 缓存计算
  const computedValue = useMemo(() => {
    return value.trim();
  }, [value]);
  
  // 4.3 缓存回调
  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);
  
  // 4.4 副作用
  useEffect(() => {
    console.log('mounted');
  }, []);
  
  // 5. 渲染
  return (
    <div style={styles.container}>
      <input value={value} onChange={handleChange} />
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

### 3. 受控组件与非受控组件

```typescript
// ✅ 受控组件（推荐）
function ControlledInput({ value, onChange }) {
  return <input value={value} onChange={onChange} />;
}

// ✅ 非受控组件（使用 ref）
function UncontrolledInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSubmit = () => {
    console.log(inputRef.current?.value);
  };
  return <input ref={inputRef} />;
}
```

---

## 状态管理规范

### 1. 状态提升原则

```typescript
// ✅ 推荐：状态提升到共同父组件
function Parent() {
  const [value, setValue] = useState('');
  return (
    <>
      <Child1 value={value} onChange={setValue} />
      <Child2 value={value} />
    </>
  );
}

// ❌ 不推荐：状态分散在多个子组件
```

### 2. 自定义 Hook 封装

```typescript
// hooks/useJsonDiff.ts
export const useJsonDiff = (options: UseJsonDiffOptions = {}) => {
  const { initialFilterSame = false, maxHistory = 10 } = options;
  
  // 状态
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  
  // 操作
  const handleCompare = useCallback(() => {
    // 对比逻辑
  }, [leftJson, rightJson]);
  
  return {
    leftJson,
    rightJson,
    diffResult,
    handleCompare,
    // ...
  };
};
```

### 3. LocalStorage 持久化

```typescript
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

---

## API 调用规范

### 1. 统一 API 封装

```typescript
// lib/api.ts
class ApiClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async get<T>(url: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`);
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  }
  
  async post<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  }
}

export const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL || '');
```

### 2. 错误处理

```typescript
// ✅ 推荐：统一错误处理
async function fetchData() {
  try {
    const data = await api.get('/data');
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('API Error:', error.message);
      message.error('加载失败');
    }
    throw error;
  }
}
```

---

## 样式规范

### 1. 样式组织

```typescript
// styles.ts
const createStyles = (darkMode: boolean = false) => ({
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    height: 56,
    background: darkMode ? '#1a1a2e' : '#fff',
  },
  // ...
});

export default createStyles;
```

### 2. 使用方式

```typescript
// ✅ 推荐：使用 useMemo 缓存样式
const styles = useMemo(() => createStyles(darkMode), [darkMode]);

return <div style={styles.container}>...</div>;
```

### 3. 响应式设计

```typescript
// 使用 CSS 媒体查询
const styles = {
  container: {
    width: '100%',
    '@media (max-width: 768px)': {
      padding: '10px',
    },
  },
};
```

---

## 性能优化

### 1. 代码分割

```typescript
// ✅ 动态导入
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
// ✅ 使用 Next.js Image 组件
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

### 3. 虚拟列表

```typescript
// 大数据列表使用虚拟滚动
import { VirtualList } from 'antd';

<VirtualList
  data={largeData}
  height={600}
  itemHeight={50}
  renderItem={(item) => <ListItem data={item} />}
/>
```

### 4. 防抖节流

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

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
```

---

## 测试规范

### 1. 单元测试

```typescript
// tests/utils.test.ts
import { describe, it, expect } from 'vitest';
import { smartFormat } from '@/lib/utils';

describe('smartFormat', () => {
  it('should format valid JSON', () => {
    const input = '{"name":"test"}';
    const expected = '{\n  "name": "test"\n}';
    expect(smartFormat(input)).toBe(expected);
  });
  
  it('should return original for invalid JSON', () => {
    const input = 'invalid';
    expect(smartFormat(input)).toBe(input);
  });
});
```

### 2. 组件测试

```typescript
// tests/HighlightEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { HighlightEditor } from '@/components/json-diff';

describe('HighlightEditor', () => {
  it('should render placeholder', () => {
    render(
      <HighlightEditor
        value=""
        onChange={() => {}}
        diffPaths={new Map()}
        placeholder="请输入..."
      />
    );
    expect(screen.getByText('请输入...')).toBeInTheDocument();
  });
});
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

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 bug |
| docs | 文档更新 |
| style | 代码格式（不影响代码运行） |
| refactor | 重构（既不是新增功能也不是修改 bug） |
| perf | 性能优化 |
| test | 测试相关 |
| chore | 构建过程或辅助工具变动 |
| ci | CI/CD 配置 |
| revert | 回滚提交 |

### 示例

```bash
# ✅ 推荐
feat(json-diff): 添加文件上传功能
fix(editor): 修复粘贴内容重复问题
perf(editor): 使用 useMemo 优化渲染性能
refactor(styles): 提取公共样式到独立文件
docs: 更新开发规范文档

# ❌ 不推荐
更新代码
修复 bug
添加功能
```

### Git 工作流

```bash
# 1. 创建功能分支
git checkout -b feature/json-diff-upload

# 2. 提交代码
git add .
git commit -m "feat(json-diff): 添加文件上传功能"

# 3. 推送分支
git push origin feature/json-diff-upload

# 4. 创建 Pull Request
# 5. 代码审查
# 6. 合并到主分支
```

---

## 部署规范

### 1. 构建命令

```bash
# 开发环境
pnpm dev

# 生产构建
pnpm build

# 构建并复制
pnpm buildcp

# 代码检查
pnpm lint
```

### 2. 环境变量

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 3. 输出配置

```typescript
// next.config.ts
const nextConfig = {
  output: 'export',  // 静态导出
  distDir: 'dist',   // 输出目录
  images: {
    unoptimized: true,  // 静态导出时需要
  },
};
```

---

## 附录

### 推荐 VS Code 插件

- ESLint
- Prettier
- TypeScript Hero
- Tailwind CSS IntelliSense
- Auto Rename Tag

### 推荐扩展配置

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0.0 | 2026-03-22 | 初始版本 |
