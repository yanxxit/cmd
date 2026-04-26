import { request } from '../request';
import type { TestCase } from '../../types/test-case';

/**
 * 测试案例管理 API 模块
 * 提供测试案例相关的统一接口调用方法
 */

// ============ 类型定义 ============

/** 获取测试案例列表的参数 */
interface GetTestCasesParams {
  apiName?: string;
  title?: string;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/** 获取测试案例列表的响应 */
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

/** 创建/更新测试案例的请求体 */
interface CreateTestCaseBody {
  apiName: string;
  title: string;
  requestParams?: object;
  responseData?: object;
  remark?: string;
  tags?: string[];
  requestTime?: string;
}

interface UpdateTestCaseBody extends Partial<CreateTestCaseBody> {}

/** 批量操作的请求体 */
interface BatchOperationBody {
  operation: 'delete';
  ids: string[];
}

/** API 响应基础类型 */
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// ============ 测试案例 CRUD 接口 ============

/**
 * 获取测试案例列表
 * @param params - 查询参数
 * @returns 测试案例列表和分页信息
 */
export async function getTestCases(params: GetTestCasesParams): Promise<GetTestCasesResponse> {
  return request<GetTestCasesResponse>('/api/test-cases', { params });
}

/**
 * 获取单个测试案例详情
 * @param id - 测试案例 ID
 * @returns 测试案例详情
 */
export async function getTestCaseById(id: string): Promise<ApiResponse<TestCase>> {
  return request<ApiResponse<TestCase>>(`/api/test-cases/${id}`);
}

/**
 * 创建新的测试案例
 * @param data - 测试案例数据
 * @returns 创建的测试案例
 */
export async function createTestCase(data: CreateTestCaseBody): Promise<ApiResponse<TestCase>> {
  return request<ApiResponse<TestCase>>('/api/test-cases', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 更新测试案例
 * @param id - 测试案例 ID
 * @param data - 更新的数据
 * @returns 更新后的测试案例
 */
export async function updateTestCase(
  id: string,
  data: UpdateTestCaseBody
): Promise<ApiResponse<TestCase>> {
  return request<ApiResponse<TestCase>>(`/api/test-cases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 删除测试案例
 * @param id - 测试案例 ID
 * @returns 删除结果
 */
export async function deleteTestCase(id: string): Promise<ApiResponse<void>> {
  return request<ApiResponse<void>>(`/api/test-cases/${id}`, {
    method: 'DELETE',
  });
}

// ============ 批量操作接口 ============

/**
 * 批量删除测试案例
 * @param ids - 测试案例 ID 数组
 * @returns 批量操作结果
 */
export async function batchDeleteTestCases(ids: string[]): Promise<ApiResponse<void>> {
  return request<ApiResponse<void>>('/api/test-cases/batch', {
    method: 'POST',
    body: JSON.stringify({
      operation: 'delete',
      ids,
    }),
  });
}

// ============ 辅助查询接口 ============

/**
 * 获取所有接口名列表（用于筛选下拉框）
 * @returns 接口名数组
 */
export async function getApiNames(): Promise<ApiResponse<string[]>> {
  return request<ApiResponse<string[]>>('/api/test-cases/api-names');
}

/**
 * 获取所有标签列表（用于筛选下拉框）
 * @returns 标签数组
 */
export async function getTags(): Promise<ApiResponse<string[]>> {
  return request<ApiResponse<string[]>>('/api/test-cases/tags');
}

/**
 * 获取统计信息
 * @returns 统计数据
 */
export async function getTestCasesStats(): Promise<ApiResponse<{
  total: number;
  byApiName: Record<string, number>;
  byTags: Record<string, number>;
  recentCases: TestCase[];
}>> {
  return request<ApiResponse<{
    total: number;
    byApiName: Record<string, number>;
    byTags: Record<string, number>;
    recentCases: TestCase[];
  }>>('/api/test-cases/stats');
}

// ============ 导出所有方法 ============

export default {
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  batchDeleteTestCases,
  getApiNames,
  getTags,
  getTestCasesStats,
};
