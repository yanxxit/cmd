/**
 * 文章详情页面 - 精致编辑设计
 *
 * 设计理念：
 * - 内容为主，精致为辅
 * - 温暖的阅读体验
 * - 专业的排版质量
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Divider,
  Spin,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { Article } from '../../../../types/article';
import { request } from '../../../../lib/request';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 设置 dayjs 使用中文
dayjs.locale('zh-cn');

const { Title, Paragraph } = Typography;

/**
 * 状态配置
 */
const statusConfig = {
  draft: { color: 'default', text: '草稿' },
  published: { color: 'success', text: '已发布' },
  archived: { color: 'warning', text: '已归档' },
};

/**
 * 文章详情页面组件
 */
export default function ArticleView() {
  const router = useRouter();
  const { id } = router.query;

  // 状态管理
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载文章详情
   */
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadArticle(id);
    }
  }, [id]);

  /**
   * 加载文章详情
   */
  const loadArticle = async (articleId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await request(`/articles/detail`, { params: { id: articleId } });
      setArticle(data);
    } catch (err: any) {
      console.error('❌ 加载文章详情失败:', err);
      setError('加载文章详情失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 返回列表页
   */
  const handleBack = () => {
    router.push('/admin/articles');
  };

  /**
   * 加载状态
   */
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  /**
   * 错误状态
   */
  if (error || !article) {
    return (
      <div style={{
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '100vh',
      }}>
        <Alert
          message={error || '文章不存在'}
          type="error"
          showIcon
          action={
            <Button onClick={handleBack}>返回列表</Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{
      background: '#fafafa',
      minHeight: '100vh',
    }}>
      {/* 文章主体 */}
      <div style={{
        maxWidth: '840px',
        margin: '0 auto 60px',
        padding: '24px',
      }}>
        {/* 文章卡片 */}
        <Card
          bordered={false}
          style={{
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {/* 标题 */}
          <Title
            level={2}
            style={{
              marginTop: 0,
              marginBottom: '12px',
              fontSize: '32px',
              fontWeight: 600,
              color: '#1f1f1f',
              lineHeight: 1.4,
            }}
          >
            {article.title}
          </Title>

          {/* 状态标签 */}
          <div style={{ marginBottom: '16px' }}>
            <Tag
              color={statusConfig[article.status].color}
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              {statusConfig[article.status].text}
            </Tag>
            <Tag
              color="blue"
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '4px',
                marginLeft: '8px',
              }}
            >
              规划
            </Tag>
            <Tag
              color="green"
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '4px',
                marginLeft: '8px',
              }}
            >
              学习
            </Tag>
          </div>

          {/* 摘要 */}
          {article.summary && (
            <Paragraph
              style={{
                fontSize: '15px',
                lineHeight: 1.7,
                color: '#666',
                marginBottom: '24px',
              }}
            >
              {article.summary}
            </Paragraph>
          )}

          {/* 元数据 */}
          <div style={{
            marginBottom: '24px',
            padding: '12px 16px',
            background: '#fafafa',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#666',
          }}>
            <Space size={16} wrap>
              <span>作者：<strong>{article.author}</strong></span>
              <span style={{ color: '#d9d9d9' }}>|</span>
              <span>{dayjs(article.createdAt).format('YYYY 年 MM 月 DD 日')}</span>
              {article.category && (
                <>
                  <span style={{ color: '#d9d9d9' }}>|</span>
                  <span>{article.category}</span>
                </>
              )}
              <span style={{ color: '#d9d9d9' }}>|</span>
              <span>{article.viewCount} 次阅读</span>
            </Space>
          </div>

          {/* 封面图 */}
          {article.coverImage && (
            <div style={{ marginBottom: '32px' }}>
              <img
                src={article.coverImage}
                alt="封面图"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  display: 'block',
                }}
              />
            </div>
          )}

          {/* 文章内容 */}
          <div
            className="article-content"
            style={{
              fontSize: '16px',
              lineHeight: 1.8,
              color: '#262626',
            }}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <style jsx global>{`
            .article-content {
              /* 标题样式 */
              h1, h2, h3, h4, h5, h6 {
                margin-top: 32px;
                margin-bottom: 16px;
                font-weight: 600;
                line-height: 1.4;
                color: #1f1f1f;
              }

              h1 {
                font-size: 32px;
                padding-bottom: 12px;
                border-bottom: 2px solid #f0f0f0;
              }

              h2 {
                font-size: 24px;
                padding-bottom: 8px;
                border-bottom: 1px solid #f0f0f0;
              }

              h3 {
                font-size: 20px;
              }

              h4 {
                font-size: 18px;
              }

              h5 {
                font-size: 16px;
              }

              h6 {
                font-size: 14px;
                color: #666;
              }

              /* 段落样式 */
              p {
                margin: 16px 0;
                text-align: justify;
                word-spacing: 2px;
              }

              /* 链接样式 */
              a {
                color: #1677ff;
                text-decoration: none;
                border-bottom: 1px solid transparent;
                transition: border-color 0.2s;
              }

              a:hover {
                border-bottom-color: #1677ff;
              }

              /* 代码块样式 */
              pre {
                margin: 16px 0;
                padding: 16px;
                background: #f5f5f5;
                border-radius: 8px;
                overflow-x: auto;
                font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
                font-size: 14px;
                line-height: 1.6;
                border: 1px solid #e8e8e8;
              }

              code {
                font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
                background: #f5f5f5;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.9em;
                color: #e83e8c;
              }

              pre code {
                background: transparent;
                padding: 0;
                color: inherit;
              }

              /* 引用块样式 */
              blockquote {
                margin: 16px 0;
                padding: 12px 16px;
                border-left: 4px solid #1677ff;
                background: #f5f5f5;
                border-radius: 0 4px 4px 0;
                color: #666;
                font-style: italic;
              }

              blockquote p {
                margin: 8px 0;
              }

              /* 列表样式 */
              ul, ol {
                margin: 16px 0;
                padding-left: 24px;
              }

              li {
                margin: 8px 0;
                line-height: 1.8;
              }

              ul li {
                list-style-type: disc;
              }

              ol li {
                list-style-type: decimal;
              }

              /* 表格样式 */
              table {
                width: 100%;
                margin: 16px 0;
                border-collapse: collapse;
                border-radius: 8px;
                overflow: hidden;
              }

              th, td {
                padding: 12px 16px;
                text-align: left;
                border-bottom: 1px solid #e8e8e8;
              }

              th {
                background: #fafafa;
                font-weight: 600;
                color: #1f1f1f;
              }

              tr:hover {
                background: #fafafa;
              }

              /* 图片样式 */
              img {
                max-width: 100%;
                height: auto;
                margin: 16px 0;
                border-radius: 8px;
                display: block;
              }

              /* 分隔线样式 */
              hr {
                margin: 32px 0;
                border: none;
                border-top: 2px solid #f0f0f0;
              }

              /* 强调文本 */
              strong {
                font-weight: 600;
                color: #1f1f1f;
              }

              em {
                font-style: italic;
                color: #666;
              }

              /* 删除线 */
              del {
                color: #999;
                text-decoration: line-through;
              }

              /* 高亮 */
              mark {
                background: #fffbe6;
                padding: 2px 4px;
                border-radius: 2px;
              }
            }
          `}</style>

          {/* 更新时间 */}
          <Divider style={{ margin: '40px 0 24px' }} />
          <div style={{
            textAlign: 'center',
            color: '#999',
            fontSize: '13px',
          }}>
            最后更新：{dayjs(article.updatedAt).format('YYYY 年 MM 月 DD 日 HH:mm:ss')}
          </div>
        </Card>
      </div>
    </div>
  );
}
