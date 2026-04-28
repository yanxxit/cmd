/**
 * 文章统计 API
 * 
 * GET - 获取文章统计信息（各状态文章数量、总阅读量、总点赞数等）
 * 
 * @route /next/api/articles/stats
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getArticleStats } from '../../../lib/db/articles';
import { ArticleStats } from '../../../types/article';

/**
 * API 错误响应类型
 */
interface ApiErrorResponse {
  error: string;
  message: string;
}

/**
 * GET 请求处理
 * 获取文章统计信息
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ArticleStats | ApiErrorResponse>
) {
  try {
    const stats = await getArticleStats();
    res.status(200).json(stats);
  } catch (error: any) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      error: '服务器错误',
      message: error.message || '获取统计信息失败',
    });
  }
}

/**
 * 主处理函数
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ArticleStats | ApiErrorResponse>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      await handleGet(req, res);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({
        error: '方法不允许',
        message: `不支持的 HTTP 方法：${method}`,
      });
  }
}
