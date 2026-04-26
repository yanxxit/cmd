# 前端 API 请求与代理配置规范

为了保证项目的可维护性、环境的一致性以及减少由于跨域或前缀不一致导致的问题，本项目对于 API 请求进行了一系列的统一规范与封装。后续所有接口相关的开发均需遵守此规范。

## 1. 代理配置与环境变量 (next.config.mjs)

在开发环境下（`NODE_ENV === 'development'`），所有的 API 请求通过 Next.js 的 `rewrites` 规则代理到真实的后端服务。

### 配置说明
由于项目在 `next.config.mjs` 中设置了统一的基础路径 `basePath: '/next'`，这意味着 Next.js 开发服务器暴露出来的所有路由（包含页面和 API 代理）都会默认带有 `/next` 前缀。

```javascript
// next.config.mjs
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  basePath: '/next',
  async rewrites() {
    if (isDev) {
      return [
        {
          // 匹配浏览器发起的 /next/api/* 请求
          source: '/api/:path*',
          // 转发到本地后端的 3000 端口
          destination: 'http://localhost:3000/api/:path*',
        },
      ];
    }
    return [];
  },
};
```

## 2. 基础请求封装 (lib/request.ts)

所有业务层对后端的请求 **严禁** 直接使用原生的 `fetch` 或第三方库，必须统一引入 `lib/request.ts` 中封装的 `request` 方法。

### 核心功能
1. **自动前缀补全**：
   在开发模式下，由于 `basePath` 的存在，请求拦截器会自动判断并为请求的 URL 加上 `/next/api` 前缀，以命中 Next.js 的代理规则。
2. **查询参数（Query Params）序列化**：
   支持在 `options.params` 传入对象，方法内部会自动将其转换为 URL 的 Query 字符串（支持数组格式）。
3. **全局错误拦截与提示**：
   集成了 `antd` 的 `message.error` 进行全局报错。如果响应体中不是有效的 JSON 格式（如 404 返回了 HTML），会主动抛出 `Invalid response content-type` 异常避免解析崩溃。

### 示例用法
```typescript
import { request } from '@/lib/request';

// GET 请求带查询参数
const data = await request('/test-cases', {
  params: { page: 1, limit: 10 }
});

// POST 请求
const res = await request('/test-cases', {
  method: 'POST',
  body: JSON.stringify(payload)
});
```

## 3. 业务 API 模块化管理 (lib/api/*.ts)

为了实现接口的复用和类型安全，所有的 API 调用必须按照业务模块在 `lib/api/` 目录下进行集中管理与导出。

### 规范要求
1. **统一目录与文件命名**：每个业务实体建立一个独立的文件（如 `test-case.ts`、`user.ts`）。
2. **明确类型定义**：
   - 必须定义请求参数（Params / Body）的 Interface。
   - 必须定义响应结果（Response）的 Interface。
3. **函数式导出**：每个接口暴露为一个独立的 `async function`。
4. **统一导出 (index.ts)**：在 `lib/api/index.ts` 中统一归集并导出所有业务模块，方便页面层按需引入。

### 业务模块代码示例 (lib/api/test-case.ts)
```typescript
import { request } from '../request';
import type { TestCase } from '../../types/test-case';

// 1. 类型定义
interface GetTestCasesParams {
  page?: number;
  limit?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
}

// 2. 接口函数定义
export async function getTestCases(params: GetTestCasesParams) {
  // 注意：URL 路径前缀建议以 '/api' 开头，也可直接写 '/test-cases'，
  // 底层 request 方法会自动抹平并修正环境前缀。
  return request<ApiResponse<TestCase[]>>('/api/test-cases', { params });
}

// 3. 默认导出模块对象
export default {
  getTestCases,
};
```

### 页面层调用方式
```typescript
import { useRequest } from 'ahooks';
import { testCaseApi } from '@/lib/api';

export default function Page() {
  const { data, loading } = useRequest(() => testCaseApi.getTestCases({ page: 1 }));
  
  // ...
}
```

## 4. 总结与注意事项
- **不要硬编码域名或前缀**：业务层在调用 `request` 时，只需关注 `/api/xxx` 或 `/xxx` 这一级路由即可，无需判断 `isDev`，底层 `request.ts` 会全权接管。
- **捕获异常**：底层虽然做了全局 `message.error`，但在业务层（如 `useRequest` 的 `onError` 或 `try-catch` 中）仍需对特殊逻辑（如重置状态、关闭弹窗等）进行处理。