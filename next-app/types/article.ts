/**
 * 文章接口定义
 * 用于文章管理模块的数据类型定义
 */

/**
 * 文章状态枚举
 * - draft: 草稿
 * - published: 已发布
 * - archived: 已归档
 */
export type ArticleStatus = 'draft' | 'published' | 'archived';

/**
 * 文章接口
 * 描述一篇文章的完整数据结构
 */
export interface Article {
  _id?: string;                  // 文档 ID（@yanit/jsondb 自动生成，可选）
  id?: string;                   // 文章 ID（UUID，兼容旧系统，可选）
  title: string;                 // 文章标题
  content: string;               // 文章内容（HTML 格式）
  summary?: string;              // 文章摘要
  coverImage?: string;           // 封面图片 URL
  author: string;                // 作者
  category?: string;             // 分类
  tags?: string[];               // 标签数组
  status: ArticleStatus;         // 状态
  viewCount: number;             // 阅读量
  likeCount: number;             // 点赞数
  createdAt: string;             // 创建时间（ISO 字符串）
  updatedAt: string;             // 更新时间（ISO 字符串）
  publishedAt?: string;          // 发布时间（ISO 字符串）
}

/**
 * 文章筛选条件接口
 * 用于文章列表查询时的过滤条件
 */
export interface ArticleFilters {
  keyword?: string;              // 关键词搜索（标题/摘要）
  status?: ArticleStatus;        // 状态筛选
  category?: string;             // 分类筛选
  tag?: string;                  // 标签筛选
  author?: string;               // 作者筛选
  startDate?: string;            // 开始日期（ISO 字符串）
  endDate?: string;              // 结束日期（ISO 字符串）
}

/**
 * 文章列表响应接口
 * 用于分页返回文章列表数据
 */
export interface ArticleListResponse {
  data: Article[];               // 文章列表
  total: number;                 // 总数
  page: number;                  // 当前页码
  pageSize: number;              // 每页数量
}

/**
 * 文章统计信息接口
 * 用于返回各状态的文章数量统计
 */
export interface ArticleStats {
  total: number;                 // 总文章数
  published: number;             // 已发布文章数
  draft: number;                 // 草稿文章数
  archived: number;              // 已归档文章数
  totalViews: number;            // 总阅读量
  totalLikes: number;            // 总点赞数
}

/**
 * 文章创建请求接口
 * 创建文章时需要的字段（不包含自动生成的字段）
 */
export interface CreateArticleRequest {
  title: string;                 // 文章标题
  content: string;               // 文章内容
  summary?: string;              // 文章摘要（可选）
  coverImage?: string;           // 封面图片 URL（可选）
  author: string;                // 作者
  category?: string;             // 分类（可选）
  tags?: string[];               // 标签数组（可选）
  status?: ArticleStatus;        // 状态（可选，默认为 draft）
}

/**
 * 文章更新请求接口
 * 更新文章时所有字段都是可选的
 */
export interface UpdateArticleRequest {
  title?: string;                // 文章标题
  content?: string;              // 文章内容
  summary?: string;              // 文章摘要
  coverImage?: string;           // 封面图片 URL
  author?: string;               // 作者
  category?: string;             // 分类
  tags?: string[];               // 标签数组
  status?: ArticleStatus;        // 状态
  viewCount?: number;            // 阅读量
  likeCount?: number;            // 点赞数
}

/**
 * 文章删除响应接口
 */
export interface DeleteArticleResponse {
  success: boolean;              // 是否删除成功
  message?: string;              // 消息
}

/**
 * API 错误响应接口
 */
export interface ApiErrorResponse {
  error: string;                 // 错误类型
  message: string;               // 错误消息
}
