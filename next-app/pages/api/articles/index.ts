/**
 * 文章列表 API
 * 
 * GET  - 获取文章列表（支持分页、筛选、排序）
 * POST - 创建新文章
 * 
 * @route /next/api/articles
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getArticles,
  createArticle,
} from '../../../lib/db/articles';
import { Article, ArticleFilters, ArticleListResponse, CreateArticleRequest } from '../../../types/article';

/**
 * API 错误响应类型
 */
interface ApiErrorResponse {
  error: string;
  message: string;
}

/**
 * GET 请求处理
 * 获取文章列表，支持分页、筛选、排序
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ArticleListResponse | ApiErrorResponse>
) {
  try {
    // 解析查询参数
    const {
      page = '1',
      pageSize = '10',
      keyword,
      status,
      category,
      tag,
      author,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = req.query;

    // 构建筛选条件
    const filters: ArticleFilters = {
      keyword: keyword as string,
      status: status as Article['status'],
      category: category as string,
      tag: tag as string,
      author: author as string,
      startDate: startDate as string,
      endDate: endDate as string,
    };

    // 获取文章列表
    const result = await getArticles(
      filters,
      parseInt(page as string),
      parseInt(pageSize as string)
    );

    res.status(200).json(result);
  } catch (error: any) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: error.message || '获取文章列表失败',
    });
  }
}

/**
 * POST 请求处理
 * 创建新文章
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<Article | ApiErrorResponse>
) {
  try {
    const article: CreateArticleRequest = req.body;

    // 验证必填字段
    if (!article.title || !article.content || !article.author) {
      return res.status(400).json({
        error: '参数验证失败',
        message: 'title, content, author 是必填字段',
      });
    }

    // 验证标题长度
    if (article.title.length < 1 || article.title.length > 200) {
      return res.status(400).json({
        error: '参数验证失败',
        message: '标题长度必须在 1-200 个字符之间',
      });
    }

    // 验证内容长度
    if (article.content.length < 1) {
      return res.status(400).json({
        error: '参数验证失败',
        message: '内容不能为空',
      });
    }

    // 验证状态
    if (article.status && !['draft', 'published', 'archived'].includes(article.status)) {
      return res.status(400).json({
        error: '参数验证失败',
        message: 'status 必须是 draft, published 或 archived',
      });
    }

    // 创建文章
    const created = await createArticle(article);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('创建文章失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: error.message || '创建文章失败',
    });
  }
}

/**
 * 主处理函数
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ArticleListResponse | Article | ApiErrorResponse>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      await handleGet(req, res);
      break;
    case 'POST':
      await handlePost(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({
        error: '方法不允许',
        message: `不支持的 HTTP 方法：${method}`,
      });
  }
}
