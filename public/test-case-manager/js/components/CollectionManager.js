// 集合管理组件 ESM descriptor
const { useState, useEffect } = React;
const {
  Button, Input, Select, Modal, Form, message, Tag, Popconfirm,
  Card, Row, Col, Tooltip,
} = antd;
const { Option } = Select;

function CollectionManager() {
  const api = window.__APP__.api;
  const { ICON_OPTIONS, ICON_EMOJI_MAP, renderIcon: renderIconFn } = window.__APP__.icons;
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingCollection, setViewingCollection] = useState(null);
  const [form] = Form.useForm();

  const iconOptions = ICON_OPTIONS;
  const renderIcon = renderIconFn;

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/test-case-collections/all');
      setCollections(data || []);
    } catch (err) {
      message.error('加载集合列表失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await api.put(`/api/test-case-collections/${editing._id}`, values);
        message.success('集合已更新');
      } else {
        await api.post('/api/test-case-collections', values);
        message.success('集合创建成功');
      }
      setShowModal(false);
      setEditing(null);
      form.resetFields();
      loadCollections();
    } catch (err) {
      message.error('操作失败：' + err.message);
    }
  };

  const handleEdit = (collection) => {
    setEditing(collection);
    form.setFieldsValue({
      name: collection.name,
      description: collection.description,
      icon: collection.icon || 'FolderOpenOutlined',
    });
    setShowModal(true);
  };

  const handleDelete = async (collection) => {
    try {
      await api.delete(`/api/test-case-collections/${collection._id}`);
      message.success('集合已删除');
      loadCollections();
    } catch (err) {
      message.error('删除失败：' + err.message);
    }
  };

  if (viewingCollection) {
    const TestCaseList = window.__APP__.components.TestCaseList;
    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button onClick={() => setViewingCollection(null)}>← 返回集合列表</Button>
          <span style={{ fontSize: 28 }}>{renderIcon(viewingCollection.icon)}</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{viewingCollection.name}</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              {viewingCollection.description || '暂无描述'}
            </div>
          </div>
        </div>
        <TestCaseList collectionId={viewingCollection._id} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>测试案例集合</h2>
          <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
            共 {collections.length} 个集合
          </div>
        </div>
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ icon: 'FolderOpenOutlined' });
            setShowModal(true);
          }}
        >新建集合</Button>
      </div>

      <Row gutter={[16, 16]}>
        {collections.map((collection) => {
          const isDefault = collection.name === '默认集合';
          return (
            <Col xs={24} sm={12} md={8} lg={6} key={collection._id}>
              <Card
                hoverable loading={loading}
                onClick={() => setViewingCollection(collection)}
                style={{ height: '100%' }}
                actions={[
                  <Button
                    type="link" size="small"
                    onClick={(e) => { e.stopPropagation(); setViewingCollection(collection); }}
                  >查看</Button>,
                  <Button
                    type="link" size="small"
                    onClick={(e) => { e.stopPropagation(); handleEdit(collection); }}
                  >编辑</Button>,
                  isDefault ? (
                    <Tooltip title="默认集合不可删除">
                      <Button type="link" size="small" disabled>删除</Button>
                    </Tooltip>
                  ) : (
                    <Popconfirm
                      title="确定删除此集合？"
                      description="该集合下的案例不会被删除，可在「全部案例」中找回"
                      okText="确定" cancelText="取消"
                      onConfirm={(e) => { e?.stopPropagation?.(); handleDelete(collection); }}
                      onCancel={(e) => e?.stopPropagation?.()}
                    >
                      <Button
                        type="link" size="small" danger
                        onClick={(e) => e.stopPropagation()}
                      >删除</Button>
                    </Popconfirm>
                  ),
                ]}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    fontSize: 36, width: 56, height: 56,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#f0f5ff', borderRadius: 8, flexShrink: 0,
                  }}>
                    {renderIcon(collection.icon)}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontSize: 16, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {collection.name}
                      </span>
                      {isDefault && <Tag color="blue" style={{ marginLeft: 0 }}>默认</Tag>}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 2 }}>
                      {collection.caseCount || 0} 个案例
                    </div>
                  </div>
                </div>
                <div style={{
                  color: '#595959', fontSize: 12,
                  minHeight: 36, maxHeight: 36,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {collection.description || '暂无描述'}
                </div>
                <div style={{ color: '#bfbfbf', fontSize: 11, marginTop: 8 }}>
                  创建于 {dayjs(collection.createdAt).format('YYYY-MM-DD')}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal
        title={editing ? '编辑集合' : '新建集合'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        destroyOnClose width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name" label="集合名称"
            rules={[{ required: true, message: '请输入集合名称' }]}
          >
            <Input
              placeholder="例如：用户中心 API 测试"
              disabled={editing && editing.name === '默认集合'}
            />
          </Form.Item>
          <Form.Item name="description" label="集合描述">
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="描述这个集合的用途..."
            />
          </Form.Item>
          <Form.Item name="icon" label="图标" initialValue="FolderOpenOutlined">
            <Select>
              {iconOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default {
  type: 'component',
  name: 'CollectionManager',
  component: CollectionManager,
};
