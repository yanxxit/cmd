/**
 * 文章详情 API（不使用动态路由）
 * 通过查询参数传递文章 ID
 * 
 * GET    - 获取单篇文章详情
 * 
 * @route /next/api/articles/detail?id=xxx
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getArticleById,
  incrementViewCount,
} from '../../../lib/db/articles';
import { Article } from '../../../types/article';

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
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Article | ApiErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: '方法不允许',
      message: '只支持 GET 请求',
    });
  }

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

    // 增加阅读量
    await incrementViewCount(id);

    res.status(200).json(article);
  } catch (error: any) {
    console.error('获取文章详情失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: error.message || '获取文章详情失败',
    });
  }
}
