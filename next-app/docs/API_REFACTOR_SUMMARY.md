# API 模块重构总结

## 📋 重构概述

**重构时间**: 2026-04-26  
**重构目标**: 将分散在页面中的 API 请求代码提取到统一的 API 模块中

---

## ✅ 完成的工作

### 1. 创建 API 模块结构

**新增文件**:
- [`lib/api/index.ts`](file:///Users/bytedance/github/cmd/next-app/lib/api/index.ts) - 统一导出
- [`lib/api/test-case.ts`](file:///Users/bytedance/github/cmd/next-app/lib/api/test-case.ts) - 测试案例 API
- [`lib/api/README.md`](file:///Users/bytedance/github/cmd/next-app/lib/api/README.md) - 使用文档

**目录结构**:
```
lib/api/
├── index.ts              # 统一导出所有 API 模块
├── test-case.ts          # 测试案例管理 API
└── README.md             # 使用指南
```

---

### 2. 封装的 API 方法

#### CRUD 操作（5 个方法）

```typescript
// 获取测试案例列表（支持分页、搜索、过滤）
getTestCases(params: GetTestCasesParams): Promise<GetTestCasesResponse>

// 获取单个案例详情
getTestCaseById(id: string): Promise<ApiResponse<TestCase>>

// 创建新案例
createTestCase(data: CreateTestCaseBody): Promise<ApiResponse<TestCase>>

// 更新案例
updateTestCase(id: string, data: UpdateTestCaseBody): Promise<ApiResponse<TestCase>>

// 删除案例
deleteTestCase(id: string): Promise<ApiResponse<void>>
```

#### 批量操作（1 个方法）

```typescript
// 批量删除案例
batchDeleteTestCases(ids: string[]): Promise<ApiResponse<void>>
```

#### 辅助查询（3 个方法）

```typescript
// 获取接口名列表（用于筛选下拉框）
getApiNames(): Promise<ApiResponse<string[]>>

// 获取标签列表（用于筛选下拉框）
getTags(): Promise<ApiResponse<string[]>>

// 获取统计信息
getTestCasesStats(): Promise<ApiResponse<Stats>>
```

---

### 3. 更新的文件

#### 页面文件

**文件**: [`pages/admin/test-cases/index.tsx`](file:///Users/bytedance/github/cmd/next-app/pages/admin/test-cases/index.tsx)

**修改内容**:
```diff
- import { request } from '../../../components/common/request';
+ import { testCaseApi } from '../../../lib/api';

- return request('/api/test-cases', { params });
+ return testCaseApi.getTestCases(params);

- await request(`/api/test-cases/${id}`, { method: 'DELETE' });
+ await testCaseApi.deleteTestCase(id);

- await request('/api/test-cases/batch', { ... });
+ await testCaseApi.batchDeleteTestCases(selectedRowKeys as string[]);
```

---

#### 表单组件

**文件**: [`components/admin/test-case/TestCaseModal.tsx`](file:///Users/bytedance/github/cmd/next-app/components/admin/test-case/TestCaseModal.tsx)

**修改内容**:
```diff
- import { request } from '../../../components/common/request';
+ import { testCaseApi } from '../../../lib/api';

- const response = await fetch(url, { ... });
- const data = await response.json();
+ if (mode === 'edit' && initialData?._id) {
+   await testCaseApi.updateTestCase(initialData._id, payload);
+ } else {
+   await testCaseApi.createTestCase(payload);
+ }
```

---

## 📊 代码对比

### 重构前

**页面代码**（`pages/admin/test-cases/index.tsx`）:
```typescript
// 直接在页面中编写请求逻辑
const { data, loading, refresh } = useRequest(
  () => {
    const params = { ...filters, page, limit };
    return request('/api/test-cases', { params });
  }
);

const handleDelete = async (id: string) => {
  await request(`/api/test-cases/${id}`, { method: 'DELETE' });
};

const handleBatchDelete = async () => {
  await request('/api/test-cases/batch', {
    method: 'POST',
    body: JSON.stringify({ operation: 'delete', ids }),
  });
};
```

**表单组件**（`TestCaseModal.tsx`）:
```typescript
// 直接使用 fetch
const response = await fetch(url, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const data = await response.json();
if (!response.ok) {
  throw new Error(data.error || '保存失败');
}
```

---

### 重构后

**页面代码**:
```typescript
// 使用统一的 API 方法
const { data, loading, refresh } = useRequest(
  () => testCaseApi.getTestCases({ ...filters, page, limit })
);

const handleDelete = async (id: string) => {
  await testCaseApi.deleteTestCase(id);
};

const handleBatchDelete = async () => {
  await testCaseApi.batchDeleteTestCases(selectedRowKeys as string[]);
};
```

**表单组件**:
```typescript
// 使用封装好的 API 方法
if (mode === 'edit') {
  await testCaseApi.updateTestCase(initialData._id, payload);
} else {
  await testCaseApi.createTestCase(payload);
}
```

---

## 🎯 重构优势

### 1. 代码精简

| 文件 | 重构前 | 重构后 | 减少 |
|------|--------|--------|------|
| `pages/admin/test-cases/index.tsx` | ~106 行 | ~100 行 | ~6 行 |
| `TestCaseModal.tsx` | ~108 行 | ~102 行 | ~6 行 |
| **总计** | ~214 行 | ~202 行 | **~12 行** |

**减少的代码都是重复的请求逻辑** ✅

---

### 2. 可维护性提升

**重构前**:
- ❌ API 请求分散在各个页面和组件中
- ❌ 修改 API 路径需要修改多个文件
- ❌ 难以统一添加日志、错误处理等

**重构后**:
- ✅ 所有 API 请求集中在 `lib/api/test-case.ts`
- ✅ 修改 API 路径只需修改一个文件
- ✅ 可以在统一位置添加拦截器、日志等

---

### 3. 类型安全

**重构前**:
```typescript
// 类型需要手动推断或重复定义
const response = await request('/api/test-cases');
// response 的类型是什么？
```

**重构后**:
```typescript
// 完整的类型定义和智能提示
const response = await testCaseApi.getTestCases(params);
// response: GetTestCasesResponse
// response.data: TestCase[]
// response.pagination: { total, page, limit, pages }
```

---

### 4. 易于测试

**重构前**:
- ❌ 请求逻辑嵌入在页面组件中
- ❌ 难以单独测试 API 调用
- ❌ 需要 mock 整个组件

**重构后**:
- ✅ API 方法独立存在
- ✅ 可以直接编写单元测试
- ✅ 易于 mock 和 stub

**示例测试**:
```typescript
import { testCaseApi } from '@/lib/api';

describe('Test Case API', () => {
  it('should get test cases', async () => {
    const result = await testCaseApi.getTestCases({ page: 1, limit: 20 });
    expect(result.data).toHaveLength(20);
    expect(result.pagination.total).toBeGreaterThan(0);
  });
});
```

---

### 5. 代码复用

**重构前**:
- ❌ 每个页面都要写一遍相同的请求逻辑
- ❌ 代码重复，容易出错

**重构后**:
- ✅ API 方法可以在多个页面复用
- ✅ 一次编写，多处使用

**复用示例**:
```typescript
// 在列表页面使用
const { data } = useRequest(() => testCaseApi.getTestCases(params));

// 在统计卡片中使用
const stats = await testCaseApi.getTestCasesStats();

// 在导出功能中使用
const allCases = await testCaseApi.getTestCases({ limit: 1000 });
```

---

## 📝 使用方法

### 基础使用

```typescript
import { testCaseApi } from '@/lib/api';

// 获取列表
const cases = await testCaseApi.getTestCases({ page: 1, limit: 20 });

// 创建案例
await testCaseApi.createTestCase({
  apiName: '/api/users',
  title: '测试案例',
});

// 更新案例
await testCaseApi.updateTestCase('id', { title: '新标题' });

// 删除案例
await testCaseApi.deleteTestCase('id');
```

### 在 ahooks 中使用

```typescript
import { useRequest } from 'ahooks';
import { testCaseApi } from '@/lib/api';

const TestCasesPage = () => {
  const { data, loading, refresh } = useRequest(
    () => testCaseApi.getTestCases({ page: 1, limit: 20 }),
    { refreshDeps: [] }
  );

  return <div>...</div>;
};
```

---

## 🔗 相关文档

- [API 模块使用指南](./lib/api/README.md) - 详细的 API 文档
- [测试案例管理页面](./pages/admin/test-cases/index.tsx) - 使用示例
- [测试案例表单组件](./components/admin/test-case/TestCaseModal.tsx) - 使用示例

---

## 🎉 总结

### 重构成果

| 项目 | 成果 |
|------|------|
| **新增文件** | 3 个（index.ts, test-case.ts, README.md） |
| **封装方法** | 9 个（5 个 CRUD + 1 个批量 + 3 个辅助） |
| **修改文件** | 2 个（页面 + 表单组件） |
| **代码减少** | ~12 行重复代码 |
| **类型定义** | 完整的 TypeScript 类型 |
| **文档** | 详细的使用指南 |

### 长期收益

1. **维护成本降低** - API 变更只需修改一个文件
2. **开发效率提升** - 调用 API 更简单快捷
3. **代码质量提高** - 类型安全，易于测试
4. **团队协作优化** - 统一的 API 规范

---

**重构状态**: ✅ 完成  
**影响范围**: 测试案例管理模块  
**向后兼容**: ✅ 是  
**建议推广**: 其他模块也可以按此模式重构
