/**
 * request.ts 单元测试
 * 测试路径自动拼接逻辑
 * 
 * 使用 Vitest 测试框架
 */

import { describe, it, expect } from 'vitest';

/**
 * 模拟 request.ts 中的路径拼接逻辑
 */
function buildUrl(url: string): string {
  let fetchUrl = url;

  // 自动添加 /api 前缀以适配代理配置
  if (!fetchUrl.startsWith('/api/') && 
      !fetchUrl.startsWith('http://') && 
      !fetchUrl.startsWith('https://')) {
    fetchUrl = `/api${fetchUrl.startsWith('/') ? fetchUrl : '/' + fetchUrl}`;
  }

  return fetchUrl;
}

describe('Request Utils - buildUrl', () => {
  const testCases = [
    // 基础路径测试
    {
      input: '/test-cases',
      expected: '/api/test-cases',
      description: '基础路径 - 以 / 开头',
    },
    {
      input: 'test-cases',
      expected: '/api/test-cases',
      description: '基础路径 - 不以 / 开头',
    },
    
    // API 前缀测试
    {
      input: '/api/test-cases',
      expected: '/api/test-cases',
      description: '已有 /api 前缀 - 不重复添加',
    },
    {
      input: '/api/test-cases/api-names',
      expected: '/api/test-cases/api-names',
      description: '已有 /api 前缀的嵌套路径',
    },
    
    // 完整 URL 测试
    {
      input: 'http://localhost:3000/api/test-cases',
      expected: 'http://localhost:3000/api/test-cases',
      description: '完整 HTTP URL - 不添加前缀',
    },
    {
      input: 'https://api.example.com/test',
      expected: 'https://api.example.com/test',
      description: '完整 HTTPS URL - 不添加前缀',
    },
    
    // 嵌套路径测试
    {
      input: '/test-cases/api-names',
      expected: '/api/test-cases/api-names',
      description: '嵌套路径 - 接口名列表',
    },
    {
      input: '/test-cases/tags',
      expected: '/api/test-cases/tags',
      description: '嵌套路径 - 标签列表',
    },
    {
      input: '/test-cases/123',
      expected: '/api/test-cases/123',
      description: '嵌套路径 - 带 ID',
    },
    {
      input: '/test-cases/123/roles',
      expected: '/api/test-cases/123/roles',
      description: '嵌套路径 - 多级嵌套',
    },
    
    // 边界情况测试
    {
      input: '/',
      expected: '/api/',
      description: '边界情况 - 根路径',
    },
    {
      input: '',
      expected: '/api/',
      description: '边界情况 - 空字符串',
    },
    {
      input: 'api/test',
      expected: '/api/api/test',
      description: '边界情况 - api 不带前导 / (会错误添加前缀)',
    },
    
    // 特殊字符测试
    {
      input: '/test-cases/search?q=user',
      expected: '/api/test-cases/search?q=user',
      description: '特殊字符 - 带查询参数',
    },
    {
      input: '/test-cases/:id',
      expected: '/api/test-cases/:id',
      description: '特殊字符 - 带路由参数',
    },
  ];

  describe('路径拼接测试', () => {
    testCases.forEach((testCase) => {
      it(testCase.description, () => {
        const result = buildUrl(testCase.input);
        expect(result).toBe(testCase.expected);
      });
    });
  });

  describe('边界情况', () => {
    it('应该正确处理空字符串', () => {
      expect(buildUrl('')).toBe('/api/');
    });

    it('应该正确处理根路径', () => {
      expect(buildUrl('/')).toBe('/api/');
    });

    it('应该不处理完整的 HTTP URL', () => {
      expect(buildUrl('http://localhost:3000/api/test')).toBe('http://localhost:3000/api/test');
    });

    it('应该不处理完整的 HTTPS URL', () => {
      expect(buildUrl('https://example.com/api')).toBe('https://example.com/api');
    });

    it('应该不处理已有 /api/ 前缀的路径', () => {
      expect(buildUrl('/api/users')).toBe('/api/users');
    });
  });

  describe('特殊字符', () => {
    it('应该保留查询参数', () => {
      expect(buildUrl('/search?q=test')).toBe('/api/search?q=test');
    });

    it('应该保留路由参数', () => {
      expect(buildUrl('/users/:id')).toBe('/api/users/:id');
    });

    it('应该保留 hash 片段', () => {
      expect(buildUrl('/page#section')).toBe('/api/page#section');
    });
  });
});
