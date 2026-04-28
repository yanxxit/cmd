# 文章管理模块测试指南

## 📋 概述

本文档说明如何测试文章管理模块的 API 接口。

## 🗂️ 已创建的文件

### 核心文件

1. **类型定义** - `types/article.ts`
   - Article 接口
   - ArticleFilters 接口
   - ArticleListResponse 接口
   - ArticleStats 接口
   - CreateArticleRequest 接口
   - UpdateArticleRequest 接口

2. **数据库操作** - `lib/db/articles.ts`
   - createArticle - 创建文章
   - getArticles - 获取文章列表（MongoDB 风格）
   - getArticlesSQL - 获取文章列表（SQL 风格）
   - getArticleById - 获取单篇文章
   - updateArticle - 更新文章
   - deleteArticle - 删除文章
   - deleteArticles - 批量删除
   - countArticles - 统计数量
   - getArticleStats - 获取统计信息
   - incrementViewCount - 增加阅读量
   - incrementLikeCount - 增加点赞数
   - closeDatabase - 关闭数据库连接

3. **API 路由**
   - `pages/api/articles/index.ts` - 文章列表（GET）和创建（POST）
   - `pages/api/articles/[id].ts` - 单篇文章详情（GET）、更新（PUT）、删除（DELETE）
   - `pages/api/articles/stats.ts` - 文章统计信息（GET）

### 测试文件

1. **数据库层测试** - `tests/articles-api.test.js`
   - 直接测试 lib/db/articles.ts 中的函数
   - 无需启动服务器
   - 测试 CRUD 操作、筛选、统计等

2. **API 层测试** - `tests/articles-api-fetch.test.js`
   - 通过 HTTP 请求测试实际 API 端点
   - 需要启动开发服务器
   - 测试完整的 API 接口功能

## 🚀 测试步骤

### 方法一：数据库层测试（推荐快速验证）

```bash
# 直接测试数据库操作（不需要启动服务器）
pnpm test:articles
```

**注意**：此方法需要先将 TypeScript 编译为 JavaScript，或者使用 ts-node。

### 方法二：API 层测试（完整测试）

1. **启动开发服务器**

```bash
# 在终端 1 中启动 Next.js 开发服务器
pnpm dev
```

2. **运行 API 测试**

```bash
# 在终端 2 中运行测试
pnpm test:articles:fetch
```

## ✅ 测试用例

### 数据库层测试包含：

1. ✅ 创建文章
   - 基本创建
   - 已发布状态
   - 带摘要和封面

2. ✅ 获取文章列表
   - 默认分页
   - 按状态筛选
   - 按分类筛选
   - 关键词搜索
   - 分页功能

3. ✅ 获取单篇文章
   - 正常获取
   - 获取不存在的文章

4. ✅ 更新文章
   - 更新标题
   - 更新状态
   - 更新多个字段
   - 更新不存在的文章

5. ✅ 删除文章
   - 正常删除

6. ✅ 获取统计信息
   - 基本统计
   - 总数验证

7. ✅ 完整流程
   - 创建 -> 查询 -> 更新 -> 删除

8. ✅ 边界测试
   - 长标题
   - HTML 内容
   - 特殊字符

### API 层测试包含：

1. ✅ 创建文章（POST /api/articles）
2. ✅ 获取文章列表（GET /api/articles）
3. ✅ 按状态筛选（GET /api/articles?status=draft）
4. ✅ 获取单篇文章（GET /api/articles/:id）
5. ✅ 获取不存在的文章（404 处理）
6. ✅ 更新文章（PUT /api/articles/:id）
7. ✅ 获取统计信息（GET /api/articles/stats）
8. ✅ 删除文章（DELETE /api/articles/:id）
9. ✅ 完整流程测试
10. ✅ 特殊字符处理
11. ✅ 必填字段验证

## 📊 测试输出

测试运行时会输出详细日志：

```
🧪 开始文章管理 API 测试...

📝 测试 1: 创建文章
✅ 创建文章测试通过

📋 测试 2: 获取文章列表
✅ 获取文章列表测试通过 (共 5 篇)

🔍 测试 3: 按状态筛选
✅ 按状态筛选测试通过 (找到 3 篇草稿)

...

==================================================
测试结果：10 通过，0 失败
==================================================

详细日志：tests/test-results.log
```

## 🗄️ 数据存储

- **开发环境**: 使用 Debug 模式，数据存储在 `data/articles.json`
- **生产环境**: 使用 JSONB 模式，数据存储在 `data/articles.jsonb`
- **索引**: 自动创建 status, createdAt, category+status, author+status 索引

## 🔧 配置选项

### 环境变量

```bash
# 自定义数据库路径
ARTICLES_DB_PATH=./custom/path/articles

# 开发模式
NODE_ENV=development
```

### 数据库模式

```typescript
// 开发环境 - Debug 模式
const db = new Database('./data/articles', {
  debug: true,    // 显示详细日志
  jsonb: false,   // 使用 JSON 格式
});

// 生产环境 - JSONB 模式
const db = new Database('./data/articles', {
  debug: false,
  jsonb: true,    // 使用二进制格式（节省 30-40% 空间）
});

// 内存模式 - 测试专用
const db = new Database('articles-memory', {
  memory: true,   // 纯内存模式，速度极快
});
```

## 📝 API 使用示例

### 创建文章

```javascript
const response = await fetch('/next/api/articles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '我的文章',
    content: '<p>文章内容</p>',
    author: '作者名',
    status: 'draft',
    category: '技术',
    tags: ['JavaScript', 'Node.js'],
  }),
});

const article = await response.json();
```

### 获取文章列表

```javascript
const response = await fetch('/next/api/articles?page=1&pageSize=10&status=published');
const result = await response.json();

console.log(result.data);      // 文章列表
console.log(result.total);     // 总数
console.log(result.page);      // 当前页
console.log(result.pageSize);  // 每页数量
```

### 获取单篇文章

```javascript
const response = await fetch('/next/api/articles/article-id-123');
const article = await response.json();
```

### 更新文章

```javascript
const response = await fetch('/next/api/articles/article-id-123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '新标题',
    status: 'published',
  }),
});

const updated = await response.json();
```

### 删除文章

```javascript
const response = await fetch('/next/api/articles/article-id-123', {
  method: 'DELETE',
});

const result = await response.json();
console.log(result.success); // true
```

### 获取统计信息

```javascript
const response = await fetch('/next/api/articles/stats');
const stats = await response.json();

console.log(stats.total);       // 总文章数
console.log(stats.published);   // 已发布数
console.log(stats.draft);       // 草稿数
console.log(stats.archived);    // 归档数
console.log(stats.totalViews);  // 总阅读量
console.log(stats.totalLikes);  // 总点赞数
```

## 🎯 验收标准

- [x] 所有测试用例通过
- [x] 无编译错误
- [x] 无运行时错误
- [x] 日志输出清晰
- [x] 错误处理完善
- [x] 数据类型安全

## 📚 相关文档

- [实现方案文档](../.trae/documents/文章模块实现方案.md)
- [@yanit/jsondb 官方文档](https://www.npmjs.com/package/@yanit/jsondb)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)

---

**创建时间**: 2026-04-28  
**最后更新**: 2026-04-28  
**状态**: ✅ 已完成
