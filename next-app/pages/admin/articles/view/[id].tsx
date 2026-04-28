/**
 * 文章详情页面 - 独立展示页面
 *
 * 功能：
 * - 纯文章详情展示，无管理后台布局
 * - 杂志级排版质量
 * - 沉浸式阅读体验
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
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EyeOutlined,
  LikeOutlined,
  UserOutlined,
  TagOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Article } from '../../../../types/article';
import { request } from '../../../../lib/request';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 设置 dayjs 使用中文
dayjs.locale('zh-cn');

const { Title, Paragraph, Text } = Typography;

/**
 * 状态配置
 */
const statusConfig = {
  draft: { color: 'default', text: '草稿', bg: '#f5f5f5' },
  published: { color: 'success', text: '已发布', bg: '#f6ffed' },
  archived: { color: 'warning', text: '已归档', bg: '#fffbe6' },
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '40px 60px',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <Spin size="large" tip={<span style={{ fontSize: '14px', color: '#667eea' }}>加载文章中...</span>} />
        </div>
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
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh',
      }}>
        <Card
          bordered={false}
          style={{
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          <Alert
            message={error || '文章不存在'}
            description="抱歉，无法加载这篇文章，请返回重试"
            type="error"
            showIcon
            closable
            style={{ borderRadius: '8px' }}
            action={
              <Button
                type="primary"
                onClick={handleBack}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                }}
              >
                返回列表
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e3e7ec 100%)',
      minHeight: '100vh',
      padding: '0',
    }}>
      {/* 顶部装饰条 */}
      <div style={{
        height: '4px',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        width: '100%',
      }} />

      {/* 顶部导航栏 */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '24px 24px 0',
      }}>
        <Button
          onClick={handleBack}
          icon={<ArrowLeftOutlined />}
          size="large"
          style={{
            background: 'white',
            border: 'none',
            boxShadow: '0 2px 12px rgba(102,126,234,0.15)',
            borderRadius: '12px',
            padding: '0 24px',
            height: '44px',
            fontWeight: 500,
            color: '#667eea',
          }}
        >
          返回列表
        </Button>
      </div>

      {/* 文章主卡片 */}
      <div style={{
        maxWidth: '1000px',
        margin: '24px auto 40px',
        padding: '0 24px',
      }}>
        <Card
          bordered={false}
          style={{
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
          bodyStyle={{ padding: '0' }}
        >
          {/* 顶部渐变背景 */}
          <div style={{
            height: '120px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
          }}>
            {/* 装饰性圆形 */}
            <div style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              top: '-100px',
              right: '-50px',
            }} />
            <div style={{
              position: 'absolute',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              bottom: '-50px',
              left: '100px',
            }} />
          </div>

          <div style={{ padding: '48px 56px' }}>
            {/* 状态标签 */}
            <div style={{ marginBottom: '20px' }}>
              <Tag
                color={statusConfig[article.status].color}
                style={{
                  fontSize: '13px',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: statusConfig[article.status].bg,
                  fontWeight: 500,
                }}
              >
                {statusConfig[article.status].text}
              </Tag>
            </div>

            {/* 文章标题 */}
            <Title
              level={1}
              style={{
                marginTop: 0,
                marginBottom: '20px',
                fontSize: '40px',
                fontWeight: 800,
                color: '#1a1a1a',
                lineHeight: 1.2,
                letterSpacing: '-0.5px',
              }}
            >
              {article.title}
            </Title>

            {/* 文章摘要 */}
            {article.summary && (
              <Paragraph
                style={{
                  fontSize: '18px',
                  lineHeight: 1.8,
                  color: '#666',
                  marginBottom: '40px',
                  fontWeight: 300,
                }}
              >
                {article.summary}
              </Paragraph>
            )}

            {/* 分隔线 */}
            <Divider style={{ margin: '0 0 32px', borderColor: '#f0f0f0' }} />

            {/* 文章元信息 */}
            <Card
              type="inner"
              style={{
                marginBottom: '40px',
                background: 'linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%)',
                borderRadius: '16px',
                border: '1px solid #f0f0f0',
              }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} md={8}>
                  <Space>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                    }}>
                      <UserOutlined />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>作者</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>{article.author}</div>
                    </div>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Space>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                    }}>
                      <TagOutlined />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>分类</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>{article.category || '未分类'}</div>
                    </div>
                  </Space>
                </Col>
                <Col xs={24} sm={24} md={8}>
                  <Space>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                    }}>
                      <ClockCircleOutlined />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>发布时间</div>
                      <div style={{ fontSize: '15px', fontWeight: 500, color: '#333' }}>
                        {dayjs(article.createdAt).format('YYYY.MM.DD')}
                      </div>
                    </div>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Space>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                    }}>
                      <EyeOutlined />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>阅读</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>{article.viewCount}</div>
                    </div>
                  </Space>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Space>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                    }}>
                      <LikeOutlined />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>点赞</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>{article.likeCount}</div>
                    </div>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* 标签 */}
            {article.tags && article.tags.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <div style={{
                  fontSize: '14px',
                  color: '#999',
                  marginBottom: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                }}>
                  TAGS
                </div>
                <Space size={8} wrap>
                  {article.tags.map((tag) => (
                    <Tag
                      key={tag}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        border: '1px solid #667eea',
                        color: '#667eea',
                        background: 'rgba(102,126,234,0.05)',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      #{tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* 封面图 */}
            {article.coverImage && (
              <div style={{
                marginBottom: '40px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}>
                <img
                  src={article.coverImage}
                  alt="封面图"
                  style={{
                    width: '100%',
                    height: '400px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            )}

            {/* 文章内容 */}
            <div
              className="article-content"
              style={{
                fontSize: '17px',
                lineHeight: 1.9,
                color: '#2c2c2c',
                fontWeight: 400,
              }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* 更新时间 */}
            <Divider style={{ margin: '48px 0 24px', borderColor: '#f0f0f0' }} />
            <div style={{
              textAlign: 'center',
              color: '#999',
              fontSize: '13px',
              padding: '20px 0',
            }}>
              <Space>
                <ClockCircleOutlined style={{ fontSize: '14px' }} />
                <span>最后更新：{dayjs(article.updatedAt).format('YYYY 年 MM 月 DD 日 HH:mm:ss')}</span>
              </Space>
            </div>
          </div>
        </Card>

        {/* 底部装饰 */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          color: '#999',
          fontSize: '13px',
        }}>
          <div style={{
            width: '40px',
            height: '3px',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            margin: '0 auto 16px',
            borderRadius: '2px',
          }} />
          <div>— 完 —</div>
        </div>
      </div>
    </div>
  );
}
