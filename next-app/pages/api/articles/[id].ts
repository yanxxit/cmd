/**
 * 单篇文章 API
 * 
 * GET    - 获取单篇文章详情
 * PUT    - 更新文章信息
 * DELETE - 删除文章
 * 
 * @route /next/api/articles/[id]
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getArticleById,
  updateArticle,
  deleteArticle,
  incrementViewCount,
} from '../../../lib/db/articles';
import { Article, UpdateArticleRequest } from '../../../types/article';

/**
 * API 错误响应类型
 */
interface ApiErrorResponse {
  error: string;
  message: string;
}

/**
 * GET 请求处理
 * 获取单篇文章详情
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<Article | ApiErrorResponse>
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: '参数错误',
        message: '文章 ID 不能为空',
      });
    }

    const article = await getArticleById(id);

    if (!article) {
      return res.status(404).json({
        error: '未找到',
        message: '文章不存在',
      });
    }

    // 增加阅读量（可选，根据需求决定是否每次查看都增加）
    // await incrementViewCount(id);

    res.status(200).json(article);
  } catch (error: any) {
    console.error('获取文章详情失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: error.message || '获取文章详情失败',
    });
  }
}

/**
 * PUT 请求处理
 * 更新文章信息
 */
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<Article | ApiErrorResponse>
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: '参数错误',
        message: '文章 ID 不能为空',
      });
    }

    const updates: UpdateArticleRequest = req.body;

    // 验证更新内容
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: '参数验证失败',
        message: '至少需要一个更新字段',
      });
    }

    // 验证状态
    if (updates.status && !['draft', 'published', 'archived'].includes(updates.status)) {
      return res.status(400).json({
        error: '参数验证失败',
        message: 'status 必须是 draft, published 或 archived',
      });
    }

    // 验证标题长度
    if (updates.title !== undefined && (updates.title.length < 1 || updates.title.length > 200)) {
      return res.status(400).json({
        error: '参数验证失败',
        message: '标题长度必须在 1-200 个字符之间',
      });
    }

    // 更新文章
    const updated = await updateArticle(id, updates);

    if (!updated) {
      return res.status(404).json({
        error: '未找到',
        message: '文章不存在',
      });
    }

    res.status(200).json(updated);
  } catch (error: any) {
    console.error('更新文章失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: error.message || '更新文章失败',
    });
  }
}

/**
 * DELETE 请求处理
 * 删除文章
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; message?: string } | ApiErrorResponse>
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: '参数错误',
        message: '文章 ID 不能为空',
      });
    }

    // 检查文章是否存在
    const article = await getArticleById(id);
    if (!article) {
      return res.status(404).json({
        error: '未找到',
        message: '文章不存在',
      });
    }

    // 删除文章
    await deleteArticle(id);

    res.status(200).json({
      success: true,
      message: '文章已删除',
    });
  } catch (error: any) {
    console.error('删除文章失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: error.message || '删除文章失败',
    });
  }
}

/**
 * 主处理函数
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Article | { success: boolean; message?: string } | ApiErrorResponse>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      await handleGet(req, res);
      break;
    case 'PUT':
      await handlePut(req, res);
      break;
    case 'DELETE':
      await handleDelete(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).json({
        error: '方法不允许',
        message: `不支持的 HTTP 方法：${method}`,
      });
  }
}
