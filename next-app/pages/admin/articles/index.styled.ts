import styled from 'styled-components';
import { Card, Alert, Empty, Typography } from 'antd';

const { Text } = Typography;

/**
 * 筛选区域卡片
 */
export const FilterCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
`;

/**
 * 表格区域卡片
 */
export const TableCard = styled(Card)`
  border-radius: 8px;
`;

/**
 * 错误提示
 */
export const ErrorAlert = styled(Alert)`
  margin-bottom: 16px;
`;

/**
 * 标题列容器
 */
export const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/**
 * 标题文本
 */
export const TitleText = styled.div`
  font-weight: 500;
  color: #1890ff;
  margin-bottom: 4px;
`;

/**
 * 摘要文本
 */
export const SummaryText = styled(Text)`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
`;

/**
 * 帮助图标
 */
export const HelpIcon = styled.span`
  margin-left: 4px;
  color: #999;
  cursor: help;
`;

/**
 * 新建文章按钮容器
 */
export const CreateButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
`;

/**
 * 空状态容器
 */
export const EmptyState = styled(Empty)`
  padding: 32px 0;
`;

/**
 * 空状态描述
 */
export const EmptyDescription = styled.span`
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
`;

/**
 * 操作列按钮组
 */
export const ActionSpace = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;
