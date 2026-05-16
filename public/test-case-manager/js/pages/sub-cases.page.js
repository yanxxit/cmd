// 子案例页面模块：管理某个测试案例下的子案例列表与 CRUD
const { createElement: h, useState, useEffect } = React;
const {
  Table, Button, Input, Space, Modal, Form, Tag,
  message, Popconfirm, Typography, Empty, Tooltip,
} = antd;
const { Text } = Typography;
const [{ api }, { contentToText, tryParseJSON }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
  import(window.getModuleUrl('./js/format.js')),
]);

function getCaseId() {
  return new URLSearchParams(window.location.search).get('caseId');
}

function line(label, value, style) {
  return h(
    'p',
    style ? { style } : null,
    h(Text, { type: 'secondary' }, label),
    value
  );
}

function renderViewContent(record) {
  return h(
    'div',
    { style: { marginTop: 16 } },
    line('备注：', record.remark || '-'),
    line('创建时间：', dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss'), { marginTop: 12 }),
    line('更新时间：', dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm:ss')),
    h(
      'div',
      { style: { marginTop: 12 } },
      h(Text, { type: 'secondary' }, '内容：'),
      h(
        'pre',
        {
          style: {
            background: '#fafafa',
            padding: 12,
            borderRadius: 4,
            maxHeight: 360,
            overflow: 'auto',
            fontSize: 12,
            marginTop: 8,
          },
        },
        contentToText(record.content)
      )
    )
  );
}

function SubCasesApp() {
  const caseId = getCaseId();

  const [parentCase, setParentCase] = useState(null);
  const [subCases, setSubCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    form.resetFields();
  };

  const openCreateModal = () => {
    setEditing(null);
    form.resetFields();
    setShowModal(true);
  };

  const loadParent = async () => {
    if (!caseId) return;
    try {
      const data = await api.get(`/api/test-cases/${caseId}`);
      setParentCase(data);
    } catch (error) {
      message.error('加载父案例失败：' + error.message);
    }
  };

  const loadSubCases = async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/test-cases/${caseId}/sub-cases`);
      setSubCases(data || []);
    } catch (error) {
      message.error('加载子案例失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!caseId) return;
    loadParent();
    loadSubCases();
  }, [caseId]);

  const handleSave = async (values) => {
    try {
      const payload = {
        ...values,
        content: tryParseJSON(values.content),
      };

      if (editing) {
        await api.put(`/api/test-cases/${caseId}/sub-cases/${editing._id}`, payload);
        message.success('子案例已更新');
      } else {
        await api.post(`/api/test-cases/${caseId}/sub-cases`, payload);
        message.success('子案例已创建');
      }

      closeModal();
      loadSubCases();
    } catch (error) {
      message.error('保存失败：' + error.message);
    }
  };

  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      title: record.title,
      remark: record.remark,
      content: contentToText(record.content),
    });
    setShowModal(true);
  };

  const handleView = (record) => {
    Modal.info({
      title: `查看子案例：${record.title}`,
      width: 700,
      content: renderViewContent(record),
    });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/test-cases/${caseId}/sub-cases/${id}`);
      message.success('已删除');
      loadSubCases();
    } catch (error) {
      message.error('删除失败：' + error.message);
    }
  };

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, idx) => idx + 1,
    },
    {
      title: '子标题',
      dataIndex: 'title',
      key: 'title',
      width: 220,
      render: (text, record) => h(
        'a',
        { onClick: () => handleView(record), style: { color: '#1890ff' } },
        text
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content) => {
        const text = contentToText(content);
        return h(
          Tooltip,
          { title: text, placement: 'topLeft' },
          h('span', { style: { color: '#595959' } }, text || '-')
        );
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => h(
        Space,
        null,
        h(Button, { type: 'link', size: 'small', onClick: () => handleView(record) }, '查看'),
        h(Button, { type: 'link', size: 'small', onClick: () => handleEdit(record) }, '编辑'),
        h(
          Popconfirm,
          {
            title: '确定要删除此子案例？',
            okText: '确定',
            cancelText: '取消',
            onConfirm: () => handleDelete(record._id),
          },
          h(Button, { type: 'link', size: 'small', danger: true }, '删除')
        )
      ),
    },
  ];

  if (!caseId) {
    return h(
      'div',
      { style: { padding: 60 } },
      h(Empty, { description: '缺少 caseId 参数，无法加载子案例' })
    );
  }

  const headerMeta = parentCase
    ? `父案例：${parentCase.title} · 共 ${subCases.length} 个子案例`
    : '加载中...';

  return h(
    'div',
    null,
    h(
      'div',
      { className: 'page-header' },
      h(
        'div',
        null,
        h(
          'div',
          { className: 'title' },
          '子案例管理',
          parentCase
            ? h(Tag, { color: 'blue', style: { marginLeft: 12 } }, parentCase.apiName)
            : null
        ),
        h('div', { className: 'meta' }, headerMeta)
      ),
      h(
        Space,
        null,
        h(Button, { onClick: () => window.close() }, '关闭'),
        h(Button, { type: 'primary', onClick: openCreateModal }, '新增子案例')
      )
    ),
    h(
      'div',
      { className: 'content' },
      h(Table, {
        columns,
        dataSource: subCases,
        loading,
        rowKey: '_id',
        pagination: { pageSize: 20, showSizeChanger: true },
        locale: { emptyText: h(Empty, { description: '暂无子案例' }) },
      })
    ),
    h(
      Modal,
      {
        title: editing ? '编辑子案例' : '新增子案例',
        open: showModal,
        onCancel: closeModal,
        onOk: () => form.submit(),
        width: 720,
        destroyOnClose: true,
      },
      h(
        Form,
        { form, layout: 'vertical', onFinish: handleSave },
        h(
          Form.Item,
          {
            name: 'title',
            label: '子标题',
            rules: [{ required: true, message: '请输入子标题' }],
          },
          h(Input, { placeholder: '例如：边界值场景 - 用户名为空' })
        ),
        h(
          Form.Item,
          {
            name: 'content',
            label: '内容',
            tooltip: '可粘贴 JSON 字符串，自动识别为 JSON 对象',
          },
          h(Input.TextArea, {
            className: 'json-editor',
            autoSize: { minRows: 6, maxRows: 16 },
            placeholder: '{"input": "...", "expected": "..."}',
          })
        ),
        h(
          Form.Item,
          { name: 'remark', label: '备注' },
          h(Input.TextArea, {
            autoSize: { minRows: 2, maxRows: 6 },
            placeholder: '补充说明...',
          })
        )
      )
    )
  );
}

export default SubCasesApp;
