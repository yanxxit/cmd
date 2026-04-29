import styled from 'styled-components';
import { Card, Alert, Typography, Button } from 'antd';

const { Title, Text } = Typography;

/**
 * 文章容器
 */
export const ArticleContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
`;

/**
 * 文章卡片
 */
export const ArticleCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

/**
 * 文章头部
 */
export const ArticleHeader = styled.div`
  padding: 32px 32px 24px;
  border-bottom: 1px solid #f0f0f0;
`;

/**
 * 文章标题
 */
export const ArticleTitle = styled(Title)`
  font-size: 32px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 16px;
  line-height: 1.4;
`;

/**
 * 文章元数据
 */
export const ArticleMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
`;

/**
 * 元数据项
 */
export const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

/**
 * 元数据图标
 */
export const MetaIcon = styled.span`
  color: rgba(0, 0, 0, 0.45);
`;

/**
 * 文章正文
 */
export const ArticleContent = styled.div`
  padding: 32px;
  font-size: 16px;
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.85);
`;

/**
 * 封面图容器
 */
export const CoverContainer = styled.div`
  width: 100%;
  overflow: hidden;
  margin-bottom: 24px;
`;

/**
 * 封面图
 */
export const CoverImage = styled.img`
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 12px 12px 0 0;
`;

/**
 * 文章底部
 */
export const ArticleFooter = styled.div`
  padding: 24px 32px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
`;

/**
 * 返回按钮
 */
export const BackButton = styled(Button)`
  padding: 8px 24px;
  font-size: 14px;
`;

/**
 * 加载状态容器
 */
export const LoadingContainer = styled.div`
  text-align: center;
  padding: 100px 0;
`;

/**
 * 错误提示
 */
export const ErrorAlert = styled(Alert)`
  margin-bottom: 24px;
`;

/**
 * 代码块
 */
export const CodeBlock = styled.pre`
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  overflow-x: auto;
  margin: 16px 0;
`;

/**
 * 引用块
 */
export const Blockquote = styled.blockquote`
  border-left: 4px solid #1890ff;
  padding-left: 16px;
  margin: 16px 0;
  color: rgba(0, 0, 0, 0.65);
  font-style: italic;
`;

/**
 * 内容标题
 */
export const ContentHeading = styled.h2`
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
`;

/**
 * 内容列表
 */
export const ContentList = styled.ul`
  margin: 16px 0;
  padding-left: 24px;
`;

/**
 * 标签容器
 */
export const TagContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
`;
