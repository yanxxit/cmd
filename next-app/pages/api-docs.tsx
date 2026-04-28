'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { Spin } from 'antd';

export default function ApiPage() {
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    // 动态加载 Swagger 规范文件
    // 注意：由于 next.config.ts 配置了 basePath: '/next'，需要手动添加前缀
    fetch('/next/swagger-output.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('✅ API 文档加载成功:', data);
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Failed to load API spec:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="加载 API 文档中..." />
      </div>
    );
  }

  if (!spec) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>API 文档加载失败</h1>
        <p>请确保已运行 pnpm generate-api-docs 生成文档</p>
      </div>
    );
  }

  return <SwaggerUI spec={spec} />;
}
