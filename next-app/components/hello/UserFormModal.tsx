import { Modal, Form, Input, Button } from 'antd';
import type { FormInstance, FormProps } from 'antd';
import { User, UserFormValues } from './types';

interface UserFormModalProps {
  open: boolean;
  editingUser: User | null;
  form: FormInstance<UserFormValues>;
  onCancel: () => void;
  onFinish: FormProps<UserFormValues>['onFinish'];
}

export default function UserFormModal({
  open,
  editingUser,
  form,
  onCancel,
  onFinish,
}: UserFormModalProps) {
  return (
    <Modal
      title={editingUser ? '编辑用户' : '新增用户'}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose={false}
      afterClose={() => form.resetFields()}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ status: 'active' }}
      >
        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入姓名' }]}
        >
          <Input placeholder="请输入姓名" />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' }
          ]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item
          name="age"
          label="年龄"
          rules={[
            { required: true, message: '请输入年龄' },
            { type: 'number', min: 1, max: 150, message: '年龄必须在 1-150 之间' }
          ]}
        >
          <Input type="number" placeholder="请输入年龄" min={1} max={150} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            取消
          </Button>
          <Button type="primary" htmlType="submit">
            {editingUser ? '更新' : '创建'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
