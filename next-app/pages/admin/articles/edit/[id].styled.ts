import styled from 'styled-components';
import { Card, Alert, Typography, Button } from 'antd';

const { Title, Text } = Typography;

/**
 * 页面头部
 */
export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

/**
 * 返回按钮
 */
export const BackButton = styled(Button)`
  margin-right: 16px;
`;

/**
 * 页面标题
 */
export const PageTitle = styled(Title)`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
`;

/**
 * 表单卡片
 */
export const FormCard = styled(Card)`
  border-radius: 8px;
  margin-bottom: 24px;
`;

/**
 * 表单容器
 */
export const FormContainer = styled.div`
  margin-top: 24px;
`;

/**
 * 表单分区标题
 */
export const FormSectionTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
`;

/**
 * 封面图上传
 */
export const CoverUpload = styled.div`
  width: 100%;
`;

/**
 * 封面图预览
 */
export const CoverPreview = styled.div`
  width: 100%;
  max-width: 600px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

/**
 * 编辑器容器
 */
export const EditorContainer = styled.div`
  min-height: 400px;
`;

/**
 * 按钮组
 */
export const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
`;

/**
 * 保存按钮
 */
export const SaveButton = styled(Button)`
  padding: 8px 32px;
  font-size: 16px;
`;

/**
 * 取消按钮
 */
export const CancelButton = styled(Button)`
  padding: 8px 32px;
  font-size: 16px;
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

/**
 * 必填标记
 */
export const RequiredMark = styled.span`
  color: #ff4d4f;
  margin-right: 4px;
`;

/**
 * 输入提示
 */
export const InputHint = styled(Text)`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
`;

/**
 * 字符计数
 */
export const CharCount = styled(Text)`
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
`;
