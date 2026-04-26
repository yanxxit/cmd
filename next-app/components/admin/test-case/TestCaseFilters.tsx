import React from 'react';
import { Form, Input, Select, Button, Space, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';

interface FilterValues {
  search?: string;
  apiName?: string;
  tags?: string[];
}

interface TestCaseFiltersProps {
  onSearch: (values: FilterValues) => void;
  loading?: boolean;
}

export const TestCaseFilters: React.FC<TestCaseFiltersProps> = ({ onSearch, loading }) => {
  const [form] = Form.useForm<FilterValues>();

  // Fetch API names for dropdown
  const { data: apiNames = [] } = useRequest(async () => {
    const res = await fetch('/api/test-cases/api-names');
    const json = await res.json();
    return json.data || [];
  });

  // Fetch tags for dropdown
  const { data: tags = [] } = useRequest(async () => {
    const res = await fetch('/api/test-cases/tags');
    const json = await res.json();
    return json.data || [];
  });

  const handleFinish = (values: FilterValues) => {
    onSearch(values);
  };

  const handleReset = () => {
    form.resetFields();
    onSearch({});
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      style={{ marginBottom: 24, padding: 24, background: '#fafafa', borderRadius: 8 }}
    >
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="search" label="关键字搜索">
            <Input placeholder="输入接口名或标题模糊匹配" allowClear />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="apiName" label="接口名">
            <Select
              placeholder="选择接口名"
              allowClear
              options={apiNames.map((name: string) => ({ label: name, value: name }))}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="tags" label="标签">
            <Select
              mode="multiple"
              placeholder="选择标签过滤"
              allowClear
              options={tags.map((tag: string) => ({ label: tag, value: tag }))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={24} style={{ textAlign: 'right' }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
              搜索
            </Button>
          </Space>
        </Col>
      </Row>
    </Form>
  );
};
