/**
 * 文章管理 API 单元测试
 * 
 * 使用 Vitest 测试框架
 * 测试文章管理相关的所有 API 接口
 * 包括：创建、查询、更新、删除、统计等功能
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  getArticleStats,
  closeDatabase,
} from '../lib/db/articles';
import type { Article, CreateArticleRequest } from '../types/article';

/**
 * 测试数据工厂
 */
function createTestArticle(overrides?: Partial<CreateArticleRequest>): CreateArticleRequest {
  return {
    title: `测试文章-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    content: '<p>这是测试文章内容</p>',
    author: '测试作者',
    status: 'draft',
    ...overrides,
  };
}

describe('文章管理 API', () => {
  // 存储测试创建的文章 ID
  let testArticleId: string;

  beforeAll(async () => {
    // 测试前的初始化工作
    console.log('🧪 开始文章管理 API 测试...');
  });

  afterAll(async () => {
    // 测试后清理数据库连接
    await closeDatabase();
    console.log('✅ 文章管理 API 测试完成');
  });

  describe('createArticle - 创建文章', () => {
    it('应该成功创建一篇新文章', async () => {
      const articleData = createTestArticle();
      const article = await createArticle(articleData);

      expect(article).toBeDefined();
      expect(article._id).toBeDefined();
      expect(article.title).toBe(articleData.title);
      expect(article.content).toBe(articleData.content);
      expect(article.author).toBe(articleData.author);
      expect(article.status).toBe('draft');
      expect(article.viewCount).toBe(0);
      expect(article.likeCount).toBe(0);
      expect(article.createdAt).toBeDefined();
      expect(article.updatedAt).toBeDefined();

      // 保存 ID 供后续测试使用
      testArticleId = article._id!;
    });

    it('应该成功创建一篇已发布的文章', async () => {
      const articleData = createTestArticle({
        title: '已发布文章',
        status: 'published',
        category: '技术',
        tags: ['JavaScript', 'TypeScript'],
      });

      const article = await createArticle(articleData);

      expect(article.status).toBe('published');
      expect(article.category).toBe('技术');
      expect(article.tags).toEqual(['JavaScript', 'TypeScript']);
      expect(article.publishedAt).not.toBeDefined();
    });

    it('应该成功创建带摘要和封面的文章', async () => {
      const articleData = createTestArticle({
        title: '带封面的文章',
        summary: '这是文章摘要',
        coverImage: '/images/cover.jpg',
      });

      const article = await createArticle(articleData);

      expect(article.summary).toBe('这是文章摘要');
      expect(article.coverImage).toBe('/images/cover.jpg');
    });
  });

  describe('getArticles - 获取文章列表', () => {
    it('应该成功获取文章列表（默认分页）', async () => {
      const result = await getArticles({}, 1, 10);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('应该支持按状态筛选', async () => {
      const result = await getArticles({ status: 'draft' }, 1, 10);

      expect(result.data).toBeDefined();
      result.data.forEach((article: Article) => {
        expect(article.status).toBe('draft');
      });
    });

    it('应该支持按分类筛选', async () => {
      const result = await getArticles({ category: '技术' }, 1, 10);

      result.data.forEach((article: Article) => {
        expect(article.category).toBe('技术');
      });
    });

    it('应该支持关键词搜索', async () => {
      const result = await getArticles({ keyword: '测试' }, 1, 10);

      expect(result.data).toBeDefined();
      result.data.forEach((article: Article) => {
        const matchTitle = article.title.includes('测试');
        const matchSummary = article.summary?.includes('测试');
        expect(matchTitle || matchSummary).toBe(true);
      });
    });

    it('应该支持分页', async () => {
      const result1 = await getArticles({}, 1, 5);
      const result2 = await getArticles({}, 2, 5);

      expect(result1.page).toBe(1);
      expect(result2.page).toBe(2);
      expect(result1.pageSize).toBe(5);
      expect(result2.pageSize).toBe(5);
    });
  });

  describe('getArticleById - 获取单篇文章', () => {
    it('应该成功获取文章详情', async () => {
      const articleData = createTestArticle({
        title: '测试详情文章',
      });
      const created = await createArticle(articleData);

      const article = await getArticleById(created._id!);

      expect(article).toBeDefined();
      expect(article?._id).toBe(created._id);
      expect(article?.title).toBe('测试详情文章');
    });

    it('获取不存在的文章应该返回 null', async () => {
      const article = await getArticleById('non-existent-id');
      expect(article).toBeNull();
    });
  });

  describe('updateArticle - 更新文章', () => {
    it('应该成功更新文章标题', async () => {
      const articleData = createTestArticle({
        title: '原始标题',
      });
      const created = await createArticle(articleData);

      const updated = await updateArticle(created._id!, {
        title: '更新后的标题',
      });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('更新后的标题');
      expect(updated?.updatedAt).not.toBe(created.updatedAt);
    });

    it('应该成功更新文章状态', async () => {
      const articleData = createTestArticle({
        status: 'draft',
      });
      const created = await createArticle(articleData);

      const updated = await updateArticle(created._id!, {
        status: 'published',
      });

      expect(updated?.status).toBe('published');
    });

    it('应该成功更新多个字段', async () => {
      const articleData = createTestArticle();
      const created = await createArticle(articleData);

      const updated = await updateArticle(created._id!, {
        title: '新标题',
        category: '新技术',
        tags: ['React', 'Vue'],
        viewCount: 100,
        likeCount: 50,
      });

      expect(updated?.title).toBe('新标题');
      expect(updated?.category).toBe('新技术');
      expect(updated?.tags).toEqual(['React', 'Vue']);
      expect(updated?.viewCount).toBe(100);
      expect(updated?.likeCount).toBe(50);
    });

    it('更新不存在的文章应该返回 null', async () => {
      const updated = await updateArticle('non-existent-id', {
        title: '新标题',
      });
      expect(updated).toBeNull();
    });
  });

  describe('deleteArticle - 删除文章', () => {
    it('应该成功删除文章', async () => {
      const articleData = createTestArticle({
        title: '待删除的文章',
      });
      const created = await createArticle(articleData);

      await deleteArticle(created._id!);

      const article = await getArticleById(created._id!);
      expect(article).toBeNull();
    });
  });

  describe('getArticleStats - 获取统计信息', () => {
    it('应该成功获取统计信息', async () => {
      const stats = await getArticleStats();

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.published).toBeGreaterThanOrEqual(0);
      expect(stats.draft).toBeGreaterThanOrEqual(0);
      expect(stats.archived).toBeGreaterThanOrEqual(0);
      expect(stats.totalViews).toBeGreaterThanOrEqual(0);
      expect(stats.totalLikes).toBeGreaterThanOrEqual(0);
    });

    it('统计总数应该等于各状态之和', async () => {
      const stats = await getArticleStats();
      const sum = stats.published + stats.draft + stats.archived;
      expect(stats.total).toBe(sum);
    });
  });

  describe('集成测试 - 完整流程', () => {
    it('应该完成创建 - 查询 - 更新 - 删除的完整流程', async () => {
      const articleData = createTestArticle({
        title: '完整流程测试',
        content: '<p>测试内容</p>',
        status: 'draft',
      });
      const created = await createArticle(articleData);
      expect(created._id).toBeDefined();

      const article = await getArticleById(created._id!);
      expect(article).toBeDefined();
      expect(article?.title).toBe('完整流程测试');

      const updated = await updateArticle(created._id!, {
        status: 'published',
        title: '完整流程测试 - 已发布',
      });
      expect(updated?.status).toBe('published');

      const verified = await getArticleById(created._id!);
      expect(verified?.status).toBe('published');
      expect(verified?.title).toBe('完整流程测试 - 已发布');

      await deleteArticle(created._id!);
      const deleted = await getArticleById(created._id!);
      expect(deleted).toBeNull();
    });
  });

  describe('边界测试', () => {
    it('应该处理很长的标题', async () => {
      const longTitle = 'a'.repeat(200);
      const articleData = createTestArticle({
        title: longTitle,
      });
      const article = await createArticle(articleData);
      expect(article.title.length).toBe(200);
    });

    it('应该处理 HTML 内容', async () => {
      const htmlContent = `
        <h1>标题</h1>
        <p>这是段落</p>
        <ul>
          <li>列表项 1</li>
          <li>列表项 2</li>
        </ul>
        <img src="/test.jpg" alt="测试图片" />
      `;
      const articleData = createTestArticle({
        content: htmlContent,
      });
      const article = await createArticle(articleData);
      expect(article.content).toContain('<h1>');
      expect(article.content).toContain('<ul>');
    });

    it('应该处理特殊字符', async () => {
      const specialTitle = '测试 & 特殊 < 字符 > " 引号 \' 单引号';
      const articleData = createTestArticle({
        title: specialTitle,
      });
      const article = await createArticle(articleData);
      expect(article.title).toBe(specialTitle);
    });
  });
});
