import styled from 'styled-components';
import { Card, Alert, Typography, Tag } from 'antd';

const { Title, Text } = Typography;

/**
 * 页面头部
 */
export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

/**
 * 页面标题
 */
export const PageTitle = styled(Title)`
  margin: 0;
`;

/**
 * 批量操作按钮组
 */
export const BatchActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

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
 * 金额文本
 */
export const AmountText = styled(Text)`
  color: #f5222d;
  font-weight: 600;
  font-size: 18px;
`;

/**
 * 状态标签容器
 */
export const StatusTagContainer = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

/**
 * 状态标签
 */
export const StatusTag = styled(Tag)`
  display: flex;
  align-items: center;
  gap: 4px;
`;

/**
 * 操作列按钮组
 */
export const ActionSpace = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

/**
 * Modal 标题容器
 */
export const ModalTitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/**
 * Modal 标题图标
 */
export const ModalTitleIcon = styled.span`
  color: #1890ff;
`;

/**
 * 表单容器
 */
export const FormContainer = styled.div`
  margin-top: 16px;
`;

/**
 * 空状态
 */
export const EmptyState = styled.div`
  padding: 32px 0;
  text-align: center;
`;

/**
 * 空状态描述
 */
export const EmptyDescription = styled.div`
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
`;

/**
 * 加载状态容器
 */
export const LoadingContainer = styled.div`
  text-align: center;
  padding: 60px 0;
`;
