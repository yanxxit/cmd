import React from 'react';
import { Modal, Descriptions, Tag, Button, Space, message, Typography } from 'antd';
import { CopyOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { JsonEditor } from '../../common/JsonEditor';
import type { TestCase } from '../../../types/test-case';

const { Paragraph } = Typography;

interface TestCaseDetailModalProps {
  open: boolean;
  data: TestCase | null;
  onCancel: () => void;
  onEdit: () => void;
}

export const TestCaseDetailModal: React.FC<TestCaseDetailModalProps> = ({
  open,
  data,
  onCancel,
  onEdit,
}) => {
  if (!data) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('复制成功');
    });
  };

  return (
    <Modal
      title="案例详情"
      open={open}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="edit" type="primary" icon={<EditOutlined />} onClick={onEdit}>
          编辑
        </Button>,
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
      ]}
    >
      <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="接口名称" span={2}>
          <Space>
            <Tag color="blue">{data.apiName}</Tag>
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(data.apiName)}
            />
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="案例标题" span={2}>
          <Space>
            {data.title}
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(data.title)}
            />
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {data.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {data.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="标签" span={2}>
          {data.tags?.map((tag) => (
            <Tag color="cyan" key={tag}>
              {tag}
            </Tag>
          ))}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong>请求参数:</strong>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(JSON.stringify(data.requestParams || {}, null, 2))}
          >
            复制 JSON
          </Button>
        </div>
        <JsonEditor
          value={JSON.stringify(data.requestParams || {}, null, 2)}
          readOnly
          height="auto"
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong>返回数据:</strong>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(JSON.stringify(data.responseData || {}, null, 2))}
          >
            复制 JSON
          </Button>
        </div>
        <JsonEditor
          value={JSON.stringify(data.responseData || {}, null, 2)}
          readOnly
          height="auto"
        />
      </div>

      {data.remark && (
        <div>
          <strong>备注说明:</strong>
          <Paragraph style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
            {data.remark}
          </Paragraph>
        </div>
      )}
    </Modal>
  );
};
