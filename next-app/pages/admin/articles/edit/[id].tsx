/**
 * 文章编辑页面
 * 
 * 功能：
 * - 新建文章
 * - 编辑文章
 * - 富文本编辑器
 * - 封面图上传
 * - 发布设置
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  message,
  Typography,
  Divider,
  Upload,
  Image,
  Spin,
  Alert,
  Row,
  Col,
} from 'antd';
import {
  SaveOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { AdminLayout } from '../../../../components/admin/layout/AdminLayout';
import { Article, CreateArticleRequest, UpdateArticleRequest } from '../../../../types/article';
import { request } from '../../../../lib/request';
import { useRouter } from 'next/router';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * 文章状态选项
 */
const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' },
];

/**
 * 文章编辑页面组件
 */
export default function ArticleEdit() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';
  
  // 表单状态
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  
  // 封面图状态
  const [coverImage, setCoverImage] = useState<string | undefined>();

  /**
   * 加载文章详情（编辑模式）
   */
  useEffect(() => {
    if (!isNew && id && typeof id === 'string') {
      loadArticle(id);
    }
  }, [id, isNew]);

  /**
   * 加载文章详情
   */
  const loadArticle = async (articleId: string) => {
    setLoading(true);
    setError(null);
    try {
      // 使用查询参数方式调用 API，避免 Turbopack 动态路由问题
      const data = await request(`/articles/detail`, { params: { id: articleId } });
      setArticle(data);
      form.setFieldsValue(data);
      setCoverImage(data.coverImage);
    } catch (err: any) {
      console.error('❌ 加载文章失败:', err);
      setError('加载文章失败');
      message.error('加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 保存文章
   */
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const payload: CreateArticleRequest | UpdateArticleRequest = {
        ...values,
        coverImage,
      };

      let result;
      if (isNew) {
        // 新建文章
        result = await request('/articles', {
          method: 'POST',
          body: payload,
        });
        message.success('文章创建成功');
      } else {
        // 更新文章 - 使用查询参数方式调用 API
        result = await request(`/articles/manage`, {
          method: 'PUT',
          params: { id },
          body: payload,
        });
        message.success('文章更新成功');
      }

      // 跳转到列表页
      setTimeout(() => {
        router.push('/admin/articles');
      }, 500);
    } catch (err: any) {
      console.error('❌ 保存失败:', err);
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  /**
   * 返回上一页
   */
  const handleBack = () => {
    router.back();
  };

  /**
   * 封面图上传处理
   */
  const handleCoverUpload = (file: File) => {
    // 这里只是简单处理，实际应该上传到服务器
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverImage(e.target?.result as string);
      message.success('封面图上传成功');
    };
    reader.readAsDataURL(file);
    return false; // 阻止自动上传
  };

  /**
   * 加载状态
   */
  if (loading) {
    return (
      <AdminLayout title={isNew ? '新建文章' : '编辑文章'}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          <Spin size="large" tip="加载文章中..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isNew ? '新建文章' : '编辑文章'}>
      <Card bordered={false}>
        {/* 返回按钮 */}
        <Space style={{ marginBottom: 16 }}>
          <Button onClick={handleBack} icon={<ArrowLeftOutlined />}>
            返回
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {isNew ? '新建文章' : '编辑文章'}
          </Title>
        </Space>

        {/* 错误提示 */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 表单 */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            status: 'draft',
            viewCount: 0,
            likeCount: 0,
          }}
        >
          {/* 基本信息 */}
          <Divider orientation="left">基本信息</Divider>
          
          <Form.Item
            label="文章标题"
            name="title"
            rules={[
              { required: true, message: '请输入文章标题' },
              { min: 1, max: 200, message: '标题长度必须在 1-200 个字符之间' },
            ]}
          >
            <Input placeholder="请输入文章标题" size="large" />
          </Form.Item>

          <Form.Item
            label="作者"
            name="author"
            rules={[{ required: true, message: '请输入作者' }]}
          >
            <Input placeholder="请输入作者" size="large" />
          </Form.Item>

          <Form.Item
            label="文章摘要"
            name="summary"
            rules={[{ max: 500, message: '摘要不能超过 500 个字符' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入文章摘要（可选）"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item label="封面图片" name="coverImage">
            <Space direction="vertical">
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleCoverUpload}
              >
                <Button icon={<UploadOutlined />}>上传封面图</Button>
              </Upload>
              {coverImage && (
                <Image
                  src={coverImage}
                  alt="封面图"
                  style={{ maxWidth: '300px', maxHeight: '200px' }}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                />
              )}
            </Space>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="分类" name="category">
                <Select placeholder="请选择分类" allowClear>
                  <Option value="技术">技术</Option>
                  <Option value="产品">产品</Option>
                  <Option value="设计">设计</Option>
                  <Option value="管理">管理</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="状态" name="status">
                <Select placeholder="请选择状态">
                  {statusOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 文章内容 */}
          <Divider orientation="left">文章内容</Divider>
          
          <Form.Item
            label="文章内容"
            name="content"
            rules={[{ required: true, message: '请输入文章内容' }]}
          >
            <TextArea
              rows={20}
              placeholder="请输入文章内容（支持 HTML 格式）"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          {/* 发布设置 */}
          <Divider orientation="left">发布设置</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="阅读量" name="viewCount">
                <Input type="number" placeholder="0" disabled={isNew} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="点赞数" name="likeCount">
                <Input type="number" placeholder="0" disabled={isNew} />
              </Form.Item>
            </Col>
          </Row>

          {/* 提交按钮 */}
          <Form.Item>
            <Space size="large">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
                loading={saving}
              >
                {isNew ? '创建文章' : '保存文章'}
              </Button>
              <Button onClick={handleBack} size="large">
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </AdminLayout>
  );
}
