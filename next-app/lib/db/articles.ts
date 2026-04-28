/**
 * 文章数据库操作封装
 * 基于 @yanit/jsondb 实现文章的 CRUD 操作
 */

import { Database } from '@yanit/jsondb';
import {
  Article,
  ArticleFilters,
  ArticleListResponse,
  ArticleStats,
  CreateArticleRequest,
  UpdateArticleRequest,
} from '../../types/article';

let dbInstance: Database | null = null;

/**
 * 初始化数据库
 * 使用单例模式，避免重复创建数据库实例
 * 
 * @returns Database 实例
 */
async function getDatabase(): Promise<Database> {
  if (!dbInstance) {
    const isDev = process.env.NODE_ENV === 'development';
    const dbPath = process.env.ARTICLES_DB_PATH || './data/articles';
    
    dbInstance = new Database(dbPath, {
      debug: isDev,           // 开发环境启用 Debug 模式
      jsonb: !isDev,          // 生产环境使用 JSONB 节省空间
    });
    
    await dbInstance.open();
    
    // 创建索引（如果不存在）
    const articles = dbInstance.collection('articles');
    await articles.createIndex({ status: 1 });
    await articles.createIndex({ createdAt: -1 });
    await articles.createIndex({ category: 1, status: 1 });
    await articles.createIndex({ author: 1, status: 1 });
  }
  
  return dbInstance;
}

/**
 * 获取文章集合
 * 
 * @returns 文章集合
 */
async function getArticlesCollection() {
  const db = await getDatabase();
  return db.collection<Article>('articles');
}

/**
 * 创建文章
 * 
 * @param article - 文章数据（不包含自动生成的字段）
 * @returns 创建后的文章
 */
export async function createArticle(article: CreateArticleRequest): Promise<Article> {
  const collection = await getArticlesCollection();
  const now = new Date().toISOString();
  
  const newArticle: Article = {
    ...article,
    status: article.status || 'draft',
    viewCount: 0,
    likeCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  
  const result = await collection.insertOne(newArticle);
  return result;
}

/**
 * 获取文章列表（使用 MongoDB 风格查询）
 * 
 * @param filters - 筛选条件
 * @param page - 页码（默认 1）
 * @param pageSize - 每页数量（默认 10）
 * @returns 文章列表响应
 */
export async function getArticles(
  filters: ArticleFilters,
  page = 1,
  pageSize = 10
): Promise<ArticleListResponse> {
  const collection = await getArticlesCollection();
  
  // 构建查询条件
  const query: any = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.author) {
    query.author = filters.author;
  }
  
  if (filters.tag) {
    query.tags = { $in: [filters.tag] };
  }
  
  if (filters.keyword) {
    query.$or = [
      { title: { $regex: filters.keyword, $options: 'i' } },
      { summary: { $regex: filters.keyword, $options: 'i' } }
    ];
  }
  
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = filters.startDate;
    if (filters.endDate) query.createdAt.$lte = filters.endDate;
  }
  
  // 计算总数
  const total = await collection.countDocuments(query);
  
  // 查询数据
  const articles = await collection.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();
  
  return {
    data: articles,
    total,
    page,
    pageSize,
  };
}

/**
 * 获取文章列表（使用 SQL 查询）
 * 
 * @param filters - 筛选条件
 * @param page - 页码（默认 1）
 * @param pageSize - 每页数量（默认 10）
 * @returns 文章列表响应
 */
export async function getArticlesSQL(
  filters: ArticleFilters,
  page = 1,
  pageSize = 10
): Promise<ArticleListResponse> {
  const collection = await getArticlesCollection();
  
  // 构建 WHERE 条件
  const conditions: string[] = [];
  const params: any[] = [];
  
  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  
  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  
  if (filters.author) {
    conditions.push('author = ?');
    params.push(filters.author);
  }
  
  if (filters.keyword) {
    conditions.push('(title LIKE ? OR summary LIKE ?)');
    const keyword = `%${filters.keyword}%`;
    params.push(keyword, keyword);
  }
  
  if (filters.startDate) {
    conditions.push('createdAt >= ?');
    params.push(filters.startDate);
  }
  
  if (filters.endDate) {
    conditions.push('createdAt <= ?');
    params.push(filters.endDate);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // 查询总数
  const countQuery = `SELECT COUNT(*) as total FROM articles ${whereClause}`;
  const countResult = await collection.sql(countQuery, params);
  const total = countResult.data[0]?.total || 0;
  
  // 查询数据
  const dataQuery = `
    SELECT * FROM articles
    ${whereClause}
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...params, pageSize, (page - 1) * pageSize];
  const result = await collection.sql(dataQuery, dataParams);
  
  return {
    data: result.data,
    total,
    page,
    pageSize,
  };
}

/**
 * 根据 ID 获取文章
 * 
 * @param id - 文章 ID
 * @returns 文章，不存在则返回 null
 */
export async function getArticleById(id: string): Promise<Article | null> {
  const collection = await getArticlesCollection();
  
  try {
    const article = await collection.findOne({ _id: id });
    return article || null;
  } catch (error) {
    console.error('获取文章失败:', error);
    return null;
  }
}

/**
 * 更新文章
 * 
 * @param id - 文章 ID
 * @param updates - 更新内容
 * @returns 更新后的文章，不存在则返回 null
 */
export async function updateArticle(
  id: string,
  updates: UpdateArticleRequest
): Promise<Article | null> {
  const collection = await getArticlesCollection();
  
  // 检查文章是否存在
  const existingArticle = await getArticleById(id);
  if (!existingArticle) {
    return null;
  }
  
  // 更新文章
  await collection.updateOne(
    { _id: id },
    { 
      $set: {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    }
  );
  
  return getArticleById(id);
}

/**
 * 删除文章
 * 
 * @param id - 文章 ID
 */
export async function deleteArticle(id: string): Promise<void> {
  const collection = await getArticlesCollection();
  await collection.deleteOne({ _id: id });
}

/**
 * 批量删除文章
 * 
 * @param ids - 文章 ID 数组
 */
export async function deleteArticles(ids: string[]): Promise<void> {
  const collection = await getArticlesCollection();
  await collection.deleteMany({ _id: { $in: ids } });
}

/**
 * 统计文章数量
 * 
 * @param filters - 筛选条件（可选）
 * @returns 文章数量
 */
export async function countArticles(filters?: ArticleFilters): Promise<number> {
  const collection = await getArticlesCollection();
  
  if (!filters) {
    return collection.countDocuments();
  }
  
  const query: any = {};
  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;
  if (filters.author) query.author = filters.author;
  
  return collection.countDocuments(query);
}

/**
 * 获取统计信息（使用聚合）
 * 
 * @returns 文章统计信息
 */
export async function getArticleStats(): Promise<ArticleStats> {
  const collection = await getArticlesCollection();
  
  // 按状态分组统计
  const statsByStatus = await collection.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalLikes: { $sum: '$likeCount' }
      }
    }
  ]);
  
  // 计算总数
  const totalStats = await collection.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalLikes: { $sum: '$likeCount' }
      }
    }
  ]);
  
  // 初始化统计对象
  const stats: ArticleStats = {
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    totalViews: 0,
    totalLikes: 0,
  };
  
  // 填充总数
  if (totalStats.length > 0) {
    stats.total = totalStats[0].total;
    stats.totalViews = totalStats[0].totalViews;
    stats.totalLikes = totalStats[0].totalLikes;
  }
  
  // 填充各状态统计
  statsByStatus.forEach((stat: any) => {
    if (stat._id === 'published') {
      stats.published = stat.count;
    } else if (stat._id === 'draft') {
      stats.draft = stat.count;
    } else if (stat._id === 'archived') {
      stats.archived = stat.count;
    }
  });
  
  return stats;
}

/**
 * 增加文章阅读量
 * 
 * @param id - 文章 ID
 * @returns 更新后的文章
 */
export async function incrementViewCount(id: string): Promise<Article | null> {
  const collection = await getArticlesCollection();
  
  await collection.updateOne(
    { _id: id },
    { $inc: { viewCount: 1 } }
  );
  
  return getArticleById(id);
}

/**
 * 增加文章点赞数
 * 
 * @param id - 文章 ID
 * @returns 更新后的文章
 */
export async function incrementLikeCount(id: string): Promise<Article | null> {
  const collection = await getArticlesCollection();
  
  await collection.updateOne(
    { _id: id },
    { $inc: { likeCount: 1 } }
  );
  
  return getArticleById(id);
}

/**
 * 关闭数据库连接
 * 在应用关闭时调用
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
