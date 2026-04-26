'use client';

import React, { useState } from 'react';
import { Layout, Typography, Button, Row, Col, Card, App } from 'antd';
import { ArrowRightOutlined, CopyOutlined, ClearOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { JsonEditor } from '../../components/common/JsonEditor';
import { YamlEditor } from '../../components/common/YamlEditor';
import Link from 'next/link';
import yaml from 'js-yaml';

const { Title, Text } = Typography;
const { Header, Content } = Layout;

export default function JsonToYamlWrapper() {
  return (
    <App>
      <JsonToYaml />
    </App>
  );
}

function JsonToYaml() {
  const [inputJson, setInputJson] = useState('');
  const [outputYaml, setOutputYaml] = useState('');
  const { message } = App.useApp();

  const handleJsonToYaml = () => {
    if (!inputJson.trim()) {
      message.warning('请输入要转换的 JSON');
      return;
    }

    try {
      const parsed = JSON.parse(inputJson);
      const yamlStr = yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1, // 不自动换行
        noRefs: true,  // 禁用别名
      });
      setOutputYaml(yamlStr);
      message.success('JSON 转 YAML 成功');
    } catch (error: any) {
      message.error(`解析 JSON 失败: ${error.message}`);
    }
  };

  const handleYamlToJson = () => {
    if (!outputYaml.trim()) {
      message.warning('请先在右侧输入 YAML');
      return;
    }
    
    try {
      const parsed = yaml.load(outputYaml);
      if (typeof parsed === 'object' && parsed !== null) {
        setInputJson(JSON.stringify(parsed, null, 2));
        message.success('YAML 转 JSON 成功');
      } else {
        throw new Error('无效的 YAML 结构');
      }
    } catch (error: any) {
      message.error(`解析 YAML 失败: ${error.message}`);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) {
      message.warning('没有可复制的内容');
      return;
    }
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/">
            <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0 }}>返回</Button>
          </Link>
          <Title level={4} style={{ margin: 0 }}>🔄 JSON / YAML 转换器</Title>
        </div>
      </Header>
      
      <Content style={{ padding: '24px', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            支持 JSON 和 YAML 格式的互转。左侧为 JSON 代码，右侧为 YAML 代码，点击中间的按钮即可完成格式转换。
          </Text>
        </div>

        <Row gutter={16}>
          <Col span={11}>
            <Card 
              title="JSON 数据" 
              size="small" 
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="text" icon={<ClearOutlined />} onClick={() => setInputJson('')}>
                    清空
                  </Button>
                  <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(inputJson)}>
                    复制
                  </Button>
                </div>
              }
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
                <JsonEditor
                  value={inputJson}
                  onChange={setInputJson}
                  height="100%"
                  readOnly={false}
                />
              </div>
            </Card>
          </Col>
          
          <Col span={2} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <Button 
              type="primary" 
              shape="circle" 
              icon={<ArrowRightOutlined />} 
              size="large"
              onClick={handleJsonToYaml}
              title="JSON 转 YAML"
              style={{ width: 64, height: 64, fontSize: 24 }}
            />
            <Button 
              shape="circle" 
              icon={<ArrowLeftOutlined />} 
              size="large"
              onClick={handleYamlToJson}
              title="YAML 转 JSON"
              style={{ width: 48, height: 48, fontSize: 20 }}
            />
          </Col>

          <Col span={11}>
            <Card 
              title="YAML 数据" 
              size="small"
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="text" icon={<ClearOutlined />} onClick={() => setOutputYaml('')}>
                    清空
                  </Button>
                  <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(outputYaml)}>
                    复制
                  </Button>
                </div>
              }
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
                <YamlEditor
                  value={outputYaml}
                  onChange={setOutputYaml}
                  height="100%"
                  readOnly={false}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
