# Next.js JSON Diff Tool - 快速开始指南

## 📦 项目结构

```
next-app/
├── components/
│   └── json-diff/         # JSON 对比模块
│       ├── index.ts       # 统一导出
│       ├── HighlightEditor.tsx
│       ├── useJsonDiff.ts
│       ├── utils.ts
│       ├── logic.ts
│       ├── types.ts
│       ├── constants.ts
│       └── styles.ts
├── hooks/                 # 全局 Hooks
│   ├── index.ts
│   ├── useLocalStorage.ts
│   └── useTheme.ts
├── lib/                   # 工具库
│   ├── index.ts
│   ├── utils.ts
│   └── constants.ts
├── types/                 # 全局类型
│   └── index.ts
├── pages/                 # 页面
│   └── json-diff-v3.tsx
└── public/                # 静态资源
```

## 🚀 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 构建并复制
pnpm buildcp

# 代码检查
pnpm lint
pnpm lint:fix

# 格式化代码
pnpm format
pnpm format:check

# 类型检查
pnpm type-check

# 清理构建文件
pnpm clean
```

## 📝 开发规范要点

### 1. 组件开发

```typescript
'use client';

import React, { useMemo, useCallback } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

// 使用 memo 优化子组件
const Child = React.memo(({ data }: ChildProps) => {
  return <div>{data}</div>;
});

// 主组件
export const MyComponent: React.FC<Props> = ({ value, onChange }) => {
  // 缓存计算
  const styles = useMemo(() => createStyles(), []);
  const processedData = useMemo(() => process(value), [value]);
  
  // 缓存回调
  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);
  
  return <div style={styles.container}>...</div>;
};
```

### 2. 自定义 Hooks

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
    // ...
  };
};
```

### 3. 导入顺序

```typescript
// 1. React
import React from 'react';

// 2. 第三方库
import { Button } from 'antd';

// 3. 内部模块
import { useJsonDiff } from '@/components/json-diff';

// 4. 相对路径
import { utils } from './utils';
```

### 4. TypeScript 类型

```typescript
// 使用 interface 定义对象类型
interface User {
  id: string;
  name: string;
}

// 使用 type 定义联合类型
type Status = 'success' | 'error' | 'loading';

// 明确函数返回类型
const getUser = (id: string): Promise<User> => { };
```

## 🎨 代码格式化

项目使用 Prettier 自动格式化代码，配置如下：

- 行宽：100 字符
- 缩进：2 空格
- 引号：单引号
- 分号：有
- 尾随逗号：有

VS Code 用户请安装 Prettier 插件，并启用「保存时格式化」。

## ✅ Git 提交规范

```bash
# 格式：<type>(<scope>): <subject>

# 示例
git commit -m "feat(json-diff): 添加文件上传功能"
git commit -m "fix(editor): 修复粘贴内容重复问题"
git commit -m "perf(editor): 优化渲染性能"
git commit -m "refactor(styles): 提取公共样式"
git commit -m "docs: 更新开发规范文档"
```

### Type 类型

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 代码格式 |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试 |
| chore | 构建/工具 |

## 🔧 VS Code 推荐插件

1. ESLint
2. Prettier
3. TypeScript Hero
4. Auto Rename Tag
5. Path Intellisense

## 📊 性能优化清单

- [ ] 使用 `React.memo` 避免不必要的重渲染
- [ ] 使用 `useMemo` 缓存计算结果
- [ ] 使用 `useCallback` 缓存回调函数
- [ ] 列表渲染添加 `key`
- [ ] 动态导入大型组件
- [ ] 图片使用 `next/image`
- [ ] 大数据使用虚拟列表

## 🐛 常见问题

### 粘贴内容重复

确保在 `handlePaste` 中设置 `isPasting` 标志，并在 `handleInput` 中检查：

```typescript
const [isPasting, setIsPasting] = useState(false);

const handlePaste = useCallback((e) => {
  e.preventDefault();
  setIsPasting(true);
  // ... 处理粘贴
  setTimeout(() => setIsPasting(false), 0);
}, []);

const handleInput = useCallback((e) => {
  if (isPasting) return;  // 跳过粘贴时的输入事件
  onChange(e.currentTarget.innerText);
}, [isPasting, onChange]);
```

### 样式重新计算

使用 `useMemo` 缓存样式对象：

```typescript
const styles = useMemo(() => createStyles(darkMode), [darkMode]);
```

## 📚 相关文档

- [开发规范完整文档](./DEVELOPMENT_GUIDELINES.md)
- [Next.js 官方文档](https://nextjs.org/docs)
- [React 官方文档](https://react.dev)
- [Ant Design 文档](https://ant.design)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)

## 📞 技术支持

如有问题，请查看：
1. [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md) - 完整开发规范
2. [README.md](./README.md) - 项目说明
3. 项目代码注释
