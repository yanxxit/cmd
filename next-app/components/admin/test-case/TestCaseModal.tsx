import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, message } from 'antd';
import { JsonEditor } from '../../common/JsonEditor';
import type { TestCase } from '../../../types/test-case';

interface TestCaseModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: TestCase | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export const TestCaseModal: React.FC<TestCaseModalProps> = ({
  open,
  mode,
  initialData,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        form.setFieldsValue({
          ...initialData,
          requestParams: initialData.requestParams ? JSON.stringify(initialData.requestParams, null, 2) : '',
          responseData: initialData.responseData ? JSON.stringify(initialData.responseData, null, 2) : '',
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, mode, initialData, form]);

  const handleFormatJson = (fieldName: string) => {
    try {
      const val = form.getFieldValue(fieldName);
      if (val) {
        const parsed = JSON.parse(val);
        form.setFieldValue(fieldName, JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      message.error('JSON 格式错误，无法格式化');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // Parse JSON strings back to objects
      let reqObj = {};
      let resObj = {};

      if (values.requestParams) {
        try {
          reqObj = JSON.parse(values.requestParams);
        } catch (e) {
          message.error('请求参数 JSON 格式错误');
          return;
        }
      }

      if (values.responseData) {
        try {
          resObj = JSON.parse(values.responseData);
        } catch (e) {
          message.error('返回数据 JSON 格式错误');
          return;
        }
      }

      const payload = {
        ...values,
        requestParams: reqObj,
        responseData: resObj,
      };

      setLoading(true);
      const url = mode === 'edit' ? `/api/test-cases/${initialData?._id}` : '/api/test-cases';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '保存失败');
      }

      message.success(mode === 'create' ? '创建成功' : '更新成功');
      onSuccess();
    } catch (error: any) {
      if (error.name === 'ValidationError') return;
      message.error(error.message || '保存时发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={mode === 'create' ? '新建测试案例' : '编辑测试案例'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={800}
      maskClosable={false}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="apiName"
            label="接口名称"
            rules={[{ required: true, message: '请输入接口名称' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="如：/api/users" />
          </Form.Item>

          <Form.Item
            name="title"
            label="案例标题"
            rules={[{ required: true, message: '请输入案例标题' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="如：查询用户列表 - 正常场景" />
          </Form.Item>
        </div>

        <Form.Item name="tags" label="标签">
          <Select mode="tags" placeholder="输入并回车添加标签" />
        </Form.Item>

        <Form.Item label={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>请求参数 (JSON)</span>
            <Button type="link" size="small" onClick={() => handleFormatJson('requestParams')}>
              格式化
            </Button>
          </div>
        } name="requestParams">
          <JsonEditor height="160px" />
        </Form.Item>

        <Form.Item label={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>返回数据 (JSON)</span>
            <Button type="link" size="small" onClick={() => handleFormatJson('responseData')}>
              格式化
            </Button>
          </div>
        } name="responseData">
          <JsonEditor height="160px" />
        </Form.Item>

        <Form.Item name="remark" label="备注说明">
          <Input.TextArea rows={3} placeholder="输入备注信息..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};
