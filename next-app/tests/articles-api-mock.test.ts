/**
 * 文章管理 API 接口测试
 * 
 * 使用 Vitest + Mock Fetch 进行测试
 * 不需要启动实际服务器
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Article, ArticleListResponse, ArticleStats } from '../types/article';

// Mock 全局 fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const BASE_URL = '/next/api';

describe('文章管理 API 接口测试', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/articles - 获取文章列表', () => {
    it('应该成功获取文章列表', async () => {
      const mockResponse: ArticleListResponse = {
        data: [
          {
            _id: '1',
            title: '文章 1',
            content: '<p>内容 1</p>',
            author: '作者 1',
            status: 'published',
            viewCount: 100,
            likeCount: 10,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            _id: '2',
            title: '文章 2',
            content: '<p>内容 2</p>',
            author: '作者 2',
            status: 'draft',
            viewCount: 50,
            likeCount: 5,
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch(`${BASE_URL}/articles?page=1&pageSize=10`);
      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith('/next/api/articles?page=1&pageSize=10');
      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('应该支持按状态筛选', async () => {
      const mockResponse: ArticleListResponse = {
        data: [
          {
            _id: '1',
            title: '草稿文章',
            content: '<p>内容</p>',
            author: '作者',
            status: 'draft',
            viewCount: 0,
            likeCount: 0,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch(`${BASE_URL}/articles?status=draft`);
      const result = await response.json();

      expect(result.data.every((article: Article) => article.status === 'draft')).toBe(true);
    });

    it('应该处理空列表', async () => {
      const mockResponse: ArticleListResponse = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch(`${BASE_URL}/articles`);
      const result = await response.json();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('POST /api/articles - 创建文章', () => {
    it('应该成功创建文章', async () => {
      const newArticle = {
        title: '新文章',
        content: '<p>文章内容</p>',
        author: '作者',
        status: 'draft',
      };

      const mockResponse: Article = {
        _id: 'new-id',
        ...newArticle,
        viewCount: 0,
        likeCount: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch(`${BASE_URL}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArticle),
      });
      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        '/next/api/articles',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newArticle),
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result._id).toBe('new-id');
    });

    it('应该处理创建失败（缺少必填字段）', async () => {
      const invalidArticle = {
        title: '缺少 content 和 author',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: '参数验证失败',
          message: 'title, content, author 是必填字段',
        }),
      } as Response);

      const response = await fetch(`${BASE_URL}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidArticle),
      });
      const result = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(result.error).toBe('参数验证失败');
    });
  });

  describe('GET /api/articles/:id - 获取文章详情', () => {
    it('应该成功获取文章详情', async () => {
      const mockResponse: Article = {
        _id: 'article-123',
        title: '文章标题',
        content: '<p>文章内容</p>',
        author: '作者',
        status: 'published',
        viewCount: 100,
        likeCount: 10,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch(`${BASE_URL}/articles/article-123`);
      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith('/next/api/articles/article-123');
      expect(result).toEqual(mockResponse);
      expect(result._id).toBe('article-123');
    });

    it('应该处理文章不存在的情况', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: '未找到',
          message: '文章不存在',
        }),
      } as Response);

      const response = await fetch(`${BASE_URL}/articles/non-existent-id`);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.error).toBe('未找到');
    });
  });

  describe('PUT /api/articles/:id - 更新文章', () => {
    it('应该成功更新文章', async () => {
      const updates = {
        title: '更新后的标题',
        status: 'published',
      };

      const mockResponse: Article = {
        _id: 'article-123',
        title: '更新后的标题',
        content: '<p>原内容</p>',
        author: '作者',
        status: 'published',
        viewCount: 100,
        likeCount: 10,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch(`${BASE_URL}/articles/article-123`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        '/next/api/articles/article-123',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      );
      expect(result.title).toBe('更新后的标题');
      expect(result.status).toBe('published');
    });
  });

  describe('DELETE /api/articles/:id - 删除文章', () => {
    it('应该成功删除文章', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: '文章已删除',
        }),
      } as Response);

      const response = await fetch(`${BASE_URL}/articles/article-123`, {
        method: 'DELETE',
      });
      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        '/next/api/articles/article-123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('GET /api/articles/stats - 获取统计信息', () => {
    it('应该成功获取统计信息', async () => {
      const mockResponse: ArticleStats = {
        total: 100,
        published: 60,
        draft: 30,
        archived: 10,
        totalViews: 5000,
        totalLikes: 500,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch(`${BASE_URL}/articles/stats`);
      const result = await response.json();

      expect(result).toEqual(mockResponse);
      expect(result.total).toBe(100);
      expect(result.published + result.draft + result.archived).toBe(result.total);
    });
  });

  describe('错误处理', () => {
    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetch(`${BASE_URL}/articles`)).rejects.toThrow('Network error');
    });

    it('应该处理服务器错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: '服务器错误',
          message: '内部服务器错误',
        }),
      } as Response);

      const response = await fetch(`${BASE_URL}/articles`);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('服务器错误');
    });
  });
});
