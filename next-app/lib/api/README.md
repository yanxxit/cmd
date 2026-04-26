# API 模块使用指南

## 📋 概述

为了统一管理和维护所有的 API 接口，我们将所有请求方法提取到了 `/lib/api` 目录中。这样可以：

- ✅ **统一管理** - 所有 API 接口集中在一个地方维护
- ✅ **类型安全** - 完整的 TypeScript 类型定义
- ✅ **代码复用** - 避免重复的请求代码
- ✅ **易于测试** - 独立的 API 方法便于单元测试
- ✅ **自动前缀** - 自动添加 `/api` 前缀，适配代理配置

---

## 📁 目录结构

```
lib/api/
├── index.ts              # 统一导出文件
├── test-case.ts          # 测试案例管理 API
└── README.md             # 使用指南（本文档）
```

---

## 🚀 快速开始

### 1. 导入 API 模块

```typescript
// 方式 1: 导入所有方法
import { testCaseApi } from '@/lib/api';

// 方式 2: 导入单个方法
import { getTestCases, createTestCase } from '@/lib/api';

// 方式 3: 使用命名空间
import * as TestCaseAPI from '@/lib/api/test-case';
```

---

### 2. 使用示例

#### 获取测试案例列表

```typescript
import { testCaseApi } from '@/lib/api';

// 在组件中使用
const { data, loading } = useRequest(() => 
  testCaseApi.getTestCases({
    page: 1,
    limit: 20,
    apiName: '/api/users',
  })
);

// 直接在函数中使用
const testCases = await testCaseApi.getTestCases({ page: 1, limit: 20 });
```

#### 创建测试案例

```typescript
import { testCaseApi } from '@/lib/api';

try {
  const result = await testCaseApi.createTestCase({
    apiName: '/api/users',
    title: '查询用户列表 - 正常场景',
    requestParams: { page: 1, size: 20 },
    responseData: { code: 200, data: [] },
    tags: ['冒烟测试', '回归测试'],
  });
  
  message.success('创建成功');
} catch (error) {
  message.error(error.message);
}
```

#### 更新测试案例

```typescript
import { testCaseApi } from '@/lib/api';

await testCaseApi.updateTestCase('case-id', {
  title: '更新后的标题',
  remark: '补充说明',
});
```

#### 删除测试案例

```typescript
import { testCaseApi } from '@/lib/api';

await testCaseApi.deleteTestCase('case-id');
message.success('删除成功');
```

#### 批量删除

```typescript
import { testCaseApi } from '@/lib/api';

await testCaseApi.batchDeleteTestCases(['id1', 'id2', 'id3']);
message.success('批量删除成功');
```

#### 获取辅助数据

```typescript
import { testCaseApi } from '@/lib/api';

// 获取接口名列表（用于筛选下拉框）
const apiNames = await testCaseApi.getApiNames();

// 获取标签列表（用于筛选下拉框）
const tags = await testCaseApi.getTags();

// 获取统计信息
const stats = await testCaseApi.getTestCasesStats();
```

---

## 📊 API 方法列表

### 测试案例管理 (test-case.ts)

#### CRUD 操作

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `getTestCases(params)` | 获取测试案例列表 | GetTestCasesParams | GetTestCasesResponse |
| `getTestCaseById(id)` | 获取单个案例详情 | string | TestCase |
| `createTestCase(data)` | 创建新案例 | CreateTestCaseBody | TestCase |
| `updateTestCase(id, data)` | 更新案例 | string, UpdateTestCaseBody | TestCase |
| `deleteTestCase(id)` | 删除案例 | string | void |

#### 批量操作

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `batchDeleteTestCases(ids)` | 批量删除案例 | string[] | void |

#### 辅助查询

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| `getApiNames()` | 获取接口名列表 | 无 | string[] |
| `getTags()` | 获取标签列表 | 无 | string[] |
| `getTestCasesStats()` | 获取统计信息 | 无 | Stats |

---

## 🔧 类型定义

### GetTestCasesParams

```typescript
interface GetTestCasesParams {
  apiName?: string;        // 接口名筛选
  title?: string;          // 标题筛选
  search?: string;         // 关键词搜索
  tags?: string[];         // 标签过滤
  page?: number;           // 页码
  limit?: number;          // 每页数量
  sort?: string;           // 排序字段
  order?: 'asc' | 'desc';  // 排序方向
}
```

### CreateTestCaseBody

```typescript
interface CreateTestCaseBody {
  apiName: string;           // 接口名称（必填）
  title: string;             // 案例标题（必填）
  requestParams?: object;    // 请求参数
  responseData?: object;     // 返回数据
  remark?: string;           // 备注
  tags?: string[];           // 标签
  requestTime?: string;      // 请求时间
}
```

### GetTestCasesResponse

```typescript
interface GetTestCasesResponse {
  success: boolean;
  data: TestCase[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
```

---

## 💡 最佳实践

### 1. 在页面组件中使用

```typescript
import { useRequest } from 'ahooks';
import { testCaseApi } from '@/lib/api';

export default function TestCasesPage() {
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

  const { data, loading, refresh } = useRequest(
    () => testCaseApi.getTestCases({
      ...filters,
      page: pagination.current,
      limit: pagination.pageSize,
    }),
    { refreshDeps: [filters, pagination] }
  );

  return (
    <div>
      {/* 使用 data.data 访问测试案例列表 */}
      {/* 使用 data.pagination 访问分页信息 */}
    </div>
  );
}
```

### 2. 在事件处理中使用

```typescript
const handleDelete = async (id: string) => {
  try {
    await testCaseApi.deleteTestCase(id);
    message.success('删除成功');
    refresh(); // 刷新列表
  } catch (error) {
    // 错误已经在 API 方法中统一处理
  }
};
```

### 3. 在表单提交中使用

```typescript
const handleSubmit = async (values: any) => {
  try {
    if (mode === 'edit') {
      await testCaseApi.updateTestCase(recordId, values);
    } else {
      await testCaseApi.createTestCase(values);
    }
    message.success('保存成功');
    onSuccess();
  } catch (error) {
    // 错误已经在 API 方法中统一处理
  }
};
```

---

## 🔗 相关文件

### 核心文件

- [`lib/api/index.ts`](./index.ts) - 统一导出文件
- [`lib/api/test-case.ts`](./test-case.ts) - 测试案例 API 实现
- [`lib/request.ts`](../request.ts) - 底层请求封装

### 使用示例

- [`pages/admin/test-cases/index.tsx`](../../pages/admin/test-cases/index.tsx) - 主页面
- [`components/admin/test-case/TestCaseModal.tsx`](../../components/admin/test-case/TestCaseModal.tsx) - 表单弹窗

---

## 🎯 扩展新模块

如果需要添加其他模块（如用户管理、订单管理等），可以按照以下结构：

### 1. 创建新文件

```typescript
// lib/api/user.ts
import { request } from '../request';

export interface User {
  id: string;
  name: string;
  email: string;
}

export async function getUsers(params: { page: number; limit: number }) {
  return request<{ data: User[] }>('/users', { params });
}

export async function getUserById(id: string) {
  return request<User>(`/users/${id}`);
}

export default {
  getUsers,
  getUserById,
};
```

### 2. 在 index.ts 中导出

```typescript
// lib/api/index.ts
export * from './test-case';
export * from './user'; // 新增

export { testCaseApi } from './test-case';
export { userApi } from './user'; // 新增
```

### 3. 在页面中使用

```typescript
import { userApi } from '@/lib/api';

const { data } = useRequest(() => userApi.getUsers({ page: 1, limit: 20 }));
```

---

## 📝 注意事项

1. **自动添加 `/api` 前缀**
   - 所有请求路径不需要手动添加 `/api`
   - `request.ts` 会自动处理前缀

2. **错误处理**
   - 所有 API 方法都统一处理了错误
   - 会自动弹出 message 提示

3. **类型安全**
   - 所有方法都有完整的 TypeScript 类型
   - IDE 会提供智能提示

4. **参数验证**
   - 必填字段在调用时需要提供
   - 建议在 API 层做额外的验证

---

## 🎉 总结

通过将 API 方法集中管理，我们实现了：

- ✅ **代码更简洁** - 页面中不再需要编写重复的请求代码
- ✅ **维护更方便** - 所有 API 接口在一个地方维护
- ✅ **类型更安全** - 完整的类型定义和智能提示
- ✅ **测试更容易** - 独立的 API 方法便于单元测试
- ✅ **复用性更高** - 可以在多个页面和组件中复用

---

**文档版本**: v1.0  
**创建时间**: 2026-04-26  
**维护者**: Development Team
