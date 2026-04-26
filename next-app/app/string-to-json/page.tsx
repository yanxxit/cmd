'use client';

import React, { useState } from 'react';
import { Layout, Typography, Input, Button, Row, Col, Card, App } from 'antd';
import { ArrowRightOutlined, CopyOutlined, ClearOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { JsonEditor } from '../../components/common/JsonEditor';
import Link from 'next/link';
import { parseEscapedJson, stringifyAndEscapeJson } from './utils';

const { Title, Text } = Typography;
const { Header, Content } = Layout;
const { TextArea } = Input;

export default function StringToJsonWrapper() {
  return (
    <App>
      <StringToJson />
    </App>
  );
}

function StringToJson() {
  const [inputStr, setInputStr] = useState('');
  const [outputJson, setOutputJson] = useState('');
  const { message } = App.useApp();

  const handleParse = () => {
    if (!inputStr.trim()) {
      message.warning('请输入要转换的字符串');
      return;
    }

    try {
      const result = parseEscapedJson(inputStr);
      setOutputJson(JSON.stringify(result, null, 2));
      message.success('解析成功');
    } catch (error: any) {
      message.error(`解析失败: ${error.message || '非法的 JSON 字符串'}`);
    }
  };

  const handleStringify = () => {
    if (!outputJson.trim()) {
      message.warning('请先在右侧输入 JSON');
      return;
    }
    try {
      const escapedStr = stringifyAndEscapeJson(outputJson);
      setInputStr(escapedStr);
      message.success('转换为转义字符串成功');
    } catch (error: any) {
      message.error(`转换失败: 右侧非合法的 JSON`);
    }
  }

  const handleClear = () => {
    setInputStr('');
    setOutputJson('');
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
          <Title level={4} style={{ margin: 0 }}>🔤 String to JSON 转换器</Title>
        </div>
      </Header>
      
      <Content style={{ padding: '24px', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            将带有转义字符的 JSON 字符串（如日志中提取的文本）转换为格式化的 JSON 对象。支持多层嵌套转义解析，也可将 JSON 压缩转义为字符串。
          </Text>
        </div>

        <Row gutter={16}>
          <Col span={11}>
            <Card 
              title="原始转义字符串 (String)" 
              size="small" 
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="text" icon={<ClearOutlined />} onClick={() => setInputStr('')}>
                    清空
                  </Button>
                  <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(inputStr)}>
                    复制
                  </Button>
                </div>
              }
              styles={{ body: { padding: 0 } }}
            >
              <TextArea
                value={inputStr}
                onChange={(e) => setInputStr(e.target.value)}
                placeholder="粘贴带有转义符的 JSON 字符串，例如：\n&quot;{\\\&quot;name\\\&quot;: \\\&quot;John\\\&quot;}&quot;"
                style={{ height: 'calc(100vh - 250px)', border: 'none', borderRadius: '0 0 8px 8px', resize: 'none', padding: 16 }}
              />
            </Card>
          </Col>
          
          <Col span={2} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <Button 
              type="primary" 
              shape="circle" 
              icon={<ArrowRightOutlined />} 
              size="large"
              onClick={handleParse}
              title="解析为 JSON"
              style={{ width: 64, height: 64, fontSize: 24 }}
            />
            <Button 
              shape="circle" 
              icon={<ArrowLeftOutlined />} 
              size="large"
              onClick={handleStringify}
              title="压缩并转义为字符串"
              style={{ width: 48, height: 48, fontSize: 20 }}
            />
          </Col>

          <Col span={11}>
            <Card 
              title="格式化结果 (JSON)" 
              size="small"
              extra={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button type="text" icon={<ClearOutlined />} onClick={() => setOutputJson('')}>
                    清空
                  </Button>
                  <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(outputJson)}>
                    复制
                  </Button>
                </div>
              }
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
                <JsonEditor
                  value={outputJson}
                  onChange={setOutputJson}
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
