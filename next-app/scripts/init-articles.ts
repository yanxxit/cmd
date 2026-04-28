/**
 * 文章数据库初始化脚本
 * 创建一些测试数据用于开发和测试
 */

import { Database } from '@yanit/jsondb';

async function initArticles() {
  const db = new Database('./data/articles', {
    debug: true,
    jsonb: false, // 使用 JSON 格式
  });
  
  await db.open();
  
  const articles = db.collection('articles');
  
  // 创建索引
  await articles.createIndex({ status: 1 });
  await articles.createIndex({ createdAt: -1 });
  await articles.createIndex({ category: 1, status: 1 });
  await articles.createIndex({ author: 1, status: 1 });
  
  // 创建测试数据
  const testArticles = [
    {
      title: 'Next.js 16 新特性解析',
      content: '<p>Next.js 16 带来了许多令人兴奋的新特性，包括 React 19 的完整支持、Turbopack 的优化等。</p><h2>React 19 支持</h2><p>Next.js 16 完全支持 React 19 的所有新特性...</p>',
      author: '张三',
      status: 'published',
      category: '技术',
      tags: ['Next.js', 'React', 'TypeScript'],
      summary: '深入解析 Next.js 16 的核心新特性',
      viewCount: 128,
      likeCount: 23,
    },
    {
      title: 'TypeScript 高级技巧',
      content: '<p>本文介绍 TypeScript 开发中的一些高级技巧和最佳实践。</p><h2>泛型的应用</h2><p>泛型是 TypeScript 中最强大的特性之一...</p>',
      author: '李四',
      status: 'published',
      category: '技术',
      tags: ['TypeScript', '编程'],
      summary: '掌握 TypeScript 泛型、条件类型等高级特性',
      viewCount: 256,
      likeCount: 45,
    },
    {
      title: 'React Hooks 实战指南',
      content: '<p>通过实际案例学习 React Hooks 的使用方法和最佳实践。</p>',
      author: '王五',
      status: 'published',
      category: '技术',
      tags: ['React', 'Hooks'],
      viewCount: 189,
      likeCount: 32,
    },
    {
      title: 'Ant Design v5 使用心得',
      content: '<p>分享使用 Ant Design v5 开发后台管理系统的心得体会。</p>',
      author: '赵六',
      status: 'draft',
      category: '设计',
      tags: ['Ant Design', 'UI'],
      summary: 'Ant Design v5 的改进和使用技巧',
      viewCount: 0,
      likeCount: 0,
    },
    {
      title: 'Node.js 性能优化实践',
      content: '<p>探讨 Node.js 应用性能优化的各种方法和工具。</p><h2>内存管理</h2><p>合理的内存管理是性能优化的关键...</p>',
      author: '钱七',
      status: 'published',
      category: '技术',
      tags: ['Node.js', '性能优化'],
      viewCount: 312,
      likeCount: 58,
    },
    {
      title: '我的 2026 年技术规划',
      content: '<p>记录我对 2026 年技术学习和发展的规划。</p>',
      author: '孙八',
      status: 'draft',
      category: '其他',
      tags: ['规划', '学习'],
      viewCount: 0,
      likeCount: 0,
    },
  ];
  
  // 插入测试数据
  for (const article of testArticles) {
    await articles.insertOne({
      ...article,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  await db.close();
  
  console.log('✅ 文章数据库初始化完成，创建了', testArticles.length, '条测试数据');
}

// 执行初始化
initArticles().catch(console.error);
