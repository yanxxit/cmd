/**
 * 文章更新/删除 API（不使用动态路由）
 * 通过查询参数传递文章 ID
 * 
 * PUT    - 更新文章信息
 * DELETE - 删除文章
 * 
 * @route /next/api/articles/manage?id=xxx
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getArticleById,
  updateArticle,
  deleteArticle,
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
 * 处理更新文章
 */
async function handleUpdate(
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

    const updated = await updateArticle(id, updates);
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
 * 处理删除文章
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean } | ApiErrorResponse>
) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: '参数错误',
        message: '文章 ID 不能为空',
      });
    }

    await deleteArticle(id);
    res.status(200).json({ success: true });
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
  res: NextApiResponse
) {
  if (req.method === 'PUT') {
    return handleUpdate(req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res);
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).json({
      error: '方法不允许',
      message: `不支持 ${req.method} 方法`,
    });
  }
}
