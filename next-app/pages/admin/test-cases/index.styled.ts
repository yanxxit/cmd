import styled from 'styled-components';
import { Card, Alert, Typography } from 'antd';

const { Title } = Typography;

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
 * 标签组
 */
export const TagGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

/**
 * 标签项
 */
export const TagItem = styled.span`
  margin: 0;
`;

/**
 * 接口名称链接
 */
export const ApiLink = styled.a`
  color: #1890ff;
  cursor: pointer;
  transition: color 0.3s;
  
  &:hover {
    color: #40a9ff;
  }
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
 * 错误提示
 */
export const ErrorAlert = styled(Alert)`
  margin-bottom: 16px;
`;

/**
 * 加载状态容器
 */
export const LoadingContainer = styled.div`
  text-align: center;
  padding: 60px 0;
`;
