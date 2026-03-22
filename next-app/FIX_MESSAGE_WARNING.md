# Ant Design Message 警告修复指南

## 问题描述

在 React 19 + Next.js 16 项目中，使用 antd 的静态 `message` 方法会出现以下警告：

```
[antd: message] Static function can not consume context like dynamic theme. 
Please use 'App' component instead.
```

## 原因分析

Ant Design 5.x 推荐使用 `App` 组件的 `useApp` hook 来访问 `message` 等静态方法，
这样可以支持动态主题和其他上下文相关的功能。

## 修复方案

### 修复前

```tsx
import { message } from 'antd';

export default function MyComponent() {
  const handleClick = () => {
    message.success('操作成功');
  };
  
  return <button onClick={handleClick}>点击</button>;
}
```

### 修复后

```tsx
import { App } from 'antd';

export default function MyComponent() {
  const { message } = App.useApp();
  
  const handleClick = () => {
    message.success('操作成功');
  };
  
  return <button onClick={handleClick}>点击</button>;
}
```

## 完整示例

### pages/json-diff-v3.tsx 修复

```tsx
'use client';

import { useState } from 'react';
import { App, Button } from 'antd';  // 导入 App

export default function JsonDiffV3Page() {
  const { message } = App.useApp();  // 使用 hook 获取 message
  
  const handleCompare = () => {
    if (!leftJson.trim() && !rightJson.trim()) {
      message.warning('请输入 JSON 数据');  // 直接使用
      return;
    }
    
    try {
      // ... 对比逻辑
      message.success('对比完成');
    } catch (e: any) {
      message.error(`JSON 格式错误：${e.message}`);
    }
  };
  
  return (
    // ... JSX
  );
}
```

## 所有需要修复的位置

在 `pages/json-diff-v3.tsx` 中：

| 行号 | 原代码 | 修复后 |
|------|--------|--------|
| 104 | `message.warning(...)` | ✅ 已修复 |
| 137 | `message.success(...)` | ✅ 已修复 |
| 139 | `message.info(...)` | ✅ 已修复 |
| 142 | `message.error(...)` | ✅ 已修复 |
| 160 | `message.success(...)` | ✅ 已修复 |
| 173 | `message.success(...)` | ✅ 已修复 |
| 190 | `message.success(...)` | ✅ 已修复 |
| 208 | `message.success(...)` | ✅ 已修复 |
| 210 | `message.error(...)` | ✅ 已修复 |
| ... | ... | ✅ 已修复 |

## 其他 antd 静态方法

同样的修复方式适用于其他 antd 静态方法：

### notification

```tsx
// 修复前
import { notification } from 'antd';
notification.success({ message: '通知' });

// 修复后
import { App } from 'antd';
const { notification } = App.useApp();
notification.success({ message: '通知' });
```

### modal

```tsx
// 修复前
import { modal } from 'antd';
modal.confirm({ title: '确认' });

// 修复后
import { App } from 'antd';
const { modal } = App.useApp();
modal.confirm({ title: '确认' });
```

## 注意事项

### 1. 必须在组件内部使用

`App.useApp()` 必须在函数组件内部使用：

```tsx
// ❌ 错误：在组件外部使用
const { message } = App.useApp();
export default function MyComponent() { }

// ✅ 正确：在组件内部使用
export default function MyComponent() {
  const { message } = App.useApp();
}
```

### 2. 自定义 Hook 中的使用

在自定义 Hook 中也可以使用：

```tsx
import { App } from 'antd';

export function useMessage() {
  const { message } = App.useApp();
  return message;
}
```

### 3. 嵌套组件

如果组件嵌套较深，确保最外层有 `App` 组件：

```tsx
// app/layout.tsx 或根组件
import { App } from 'antd';

export default function RootLayout({ children }) {
  return (
    <App>
      {children}
    </App>
  );
}
```

## Next.js App Router 配置

如果使用 Next.js App Router，需要在根布局中添加 `App` 组件：

```tsx
// app/layout.tsx
import { App } from 'antd';

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <App>{children}</App>
      </body>
    </html>
  );
}
```

## 验证修复

修复后，控制台不应该再出现以下警告：

```
[antd: message] Static function can not consume context like dynamic theme.
```

## 参考资源

- [Ant Design App 组件文档](https://ant.design/components/app)
- [Ant Design 5.x 升级指南](https://ant.design/docs/react/migration-v5)
- [React 19 升级指南](./UPGRADE_TO_NEXTJS16.md)
