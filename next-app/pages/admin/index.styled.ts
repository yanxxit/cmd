import styled from 'styled-components';
import { Card, Alert, Typography, Avatar } from 'antd';

const { Title, Text } = Typography;

/**
 * 刷新按钮容器
 */
export const RefreshButtonContainer = styled.div`
  margin-bottom: 16px;
  text-align: right;
`;

/**
 * 加载状态容器
 */
export const LoadingContainer = styled.div`
  text-align: center;
  padding: 60px 0;
`;

/**
 * 统计行
 */
export const StatisticsRow = styled.div`
  margin-bottom: 24px;
`;

/**
 * 统计卡片
 */
export const StatCard = styled(Card)`
  border-radius: 8px;
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

/**
 * 统计数值
 */
export const StatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
`;

/**
 * 统计描述
 */
export const StatDescription = styled(Text)`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 8px;
`;

/**
 * 进度条容器
 */
export const ProgressContainer = styled.div`
  margin-top: 16px;
`;

/**
 * 卡片标题
 */
export const CardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/**
 * 卡片标题图标
 */
export const CardTitleIcon = styled.span`
  color: #1890ff;
`;

/**
 * 内容卡片
 */
export const ContentCard = styled(Card)`
  border-radius: 8px;
  margin-bottom: 24px;
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

/**
 * 待办卡片
 */
export const TodoCard = styled(Card)`
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

/**
 * 待办头像
 */
export const TodoAvatar = styled(Avatar)`
  margin-bottom: 8px;
`;

/**
 * 待办数量
 */
export const TodoCount = styled(Text)`
  font-size: 24px;
  font-weight: 600;
  display: block;
`;

/**
 * 待办标签
 */
export const TodoLabel = styled(Text)`
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
`;

/**
 * 错误提示
 */
export const ErrorAlert = styled(Alert)`
  margin-bottom: 24px;
`;

/**
 * 时间线项
 */
export const TimelineItem = styled.div`
  font-size: 14px;
`;

/**
 * 时间线时间
 */
export const TimelineTime = styled.div`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
`;
