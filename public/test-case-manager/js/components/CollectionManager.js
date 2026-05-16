// 集合管理组件模块
const { createElement: h, useState, useEffect } = React;
const {
  Button, Input, Select, Modal, Form, message, Tag, Popconfirm,
  Card, Row, Col, Tooltip,
} = antd;
const { Option } = Select;
const [{ api }, { ICON_OPTIONS, renderIcon }, { default: TestCaseList }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
  import(window.getModuleUrl('./js/icons.js')),
  import(window.getModuleUrl('./js/components/TestCaseList.js')),
]);

function stopEvent(event, handler) {
  event?.stopPropagation?.();
  if (typeof handler === 'function') handler();
}

function CollectionManager() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingCollection, setViewingCollection] = useState(null);
  const [form] = Form.useForm();

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

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    form.resetFields();
  };

  const openCreateModal = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ icon: 'FolderOpenOutlined' });
    setShowModal(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await api.put(`/api/test-case-collections/${editing._id}`, values);
        message.success('集合已更新');
      } else {
        await api.post('/api/test-case-collections', values);
        message.success('集合创建成功');
      }
      closeModal();
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
    return h(
      'div',
      null,
      h(
        'div',
        { style: { marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 } },
        h(Button, { onClick: () => setViewingCollection(null) }, '← 返回集合列表'),
        h('span', { style: { fontSize: 28 } }, renderIcon(viewingCollection.icon)),
        h(
          'div',
          null,
          h('div', { style: { fontSize: 18, fontWeight: 600 } }, viewingCollection.name),
          h(
            'div',
            { style: { color: '#8c8c8c', fontSize: 12 } },
            viewingCollection.description || '暂无描述'
          )
        )
      ),
      h(TestCaseList, { collectionId: viewingCollection._id })
    );
  }

  return h(
    'div',
    null,
    h(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        },
      },
      h(
        'div',
        null,
        h('h2', { style: { margin: 0 } }, '测试案例集合'),
        h(
          'div',
          { style: { color: '#8c8c8c', fontSize: 12, marginTop: 4 } },
          `共 ${collections.length} 个集合`
        )
      ),
      h(Button, { type: 'primary', onClick: openCreateModal }, '新建集合')
    ),
    h(
      Row,
      { gutter: [16, 16] },
      ...collections.map((collection) => {
        const isDefault = collection.name === '默认集合';
        const actions = [
          h(
            Button,
            {
              type: 'link',
              size: 'small',
              onClick: (e) => stopEvent(e, () => setViewingCollection(collection)),
            },
            '查看'
          ),
          h(
            Button,
            {
              type: 'link',
              size: 'small',
              onClick: (e) => stopEvent(e, () => handleEdit(collection)),
            },
            '编辑'
          ),
          isDefault
            ? h(
                Tooltip,
                { title: '默认集合不可删除' },
                h(Button, { type: 'link', size: 'small', disabled: true }, '删除')
              )
            : h(
                Popconfirm,
                {
                  title: '确定删除此集合？',
                  description: '该集合下的案例不会被删除，可在「全部案例」中找回',
                  okText: '确定',
                  cancelText: '取消',
                  onConfirm: (e) => stopEvent(e, () => handleDelete(collection)),
                  onCancel: (e) => e?.stopPropagation?.(),
                },
                h(
                  Button,
                  {
                    type: 'link',
                    size: 'small',
                    danger: true,
                    onClick: (e) => e.stopPropagation(),
                  },
                  '删除'
                )
              ),
        ];

        return h(
          Col,
          { xs: 24, sm: 12, md: 8, lg: 6, key: collection._id },
          h(
            Card,
            {
              hoverable: true,
              loading,
              onClick: () => setViewingCollection(collection),
              style: { height: '100%' },
              actions,
            },
            h(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } },
              h(
                'div',
                {
                  style: {
                    fontSize: 36,
                    width: 56,
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f0f5ff',
                    borderRadius: 8,
                    flexShrink: 0,
                  },
                },
                renderIcon(collection.icon)
              ),
              h(
                'div',
                { style: { flex: 1, overflow: 'hidden' } },
                h(
                  'div',
                  {
                    style: {
                      fontSize: 16,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    },
                  },
                  h(
                    'span',
                    { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                    collection.name
                  ),
                  isDefault ? h(Tag, { color: 'blue', style: { marginLeft: 0 } }, '默认') : null
                ),
                h(
                  'div',
                  { style: { color: '#8c8c8c', fontSize: 12, marginTop: 2 } },
                  `${collection.caseCount || 0} 个案例`
                )
              )
            ),
            h(
              'div',
              {
                style: {
                  color: '#595959',
                  fontSize: 12,
                  minHeight: 36,
                  maxHeight: 36,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                },
              },
              collection.description || '暂无描述'
            ),
            h(
              'div',
              { style: { color: '#bfbfbf', fontSize: 11, marginTop: 8 } },
              `创建于 ${dayjs(collection.createdAt).format('YYYY-MM-DD')}`
            )
          )
        );
      })
    ),
    h(
      Modal,
      {
        title: editing ? '编辑集合' : '新建集合',
        open: showModal,
        onCancel: closeModal,
        onOk: () => form.submit(),
        destroyOnClose: true,
        width: 520,
      },
      h(
        Form,
        { form, layout: 'vertical', onFinish: handleSubmit },
        h(
          Form.Item,
          {
            name: 'name',
            label: '集合名称',
            rules: [{ required: true, message: '请输入集合名称' }],
          },
          h(Input, {
            placeholder: '例如：用户中心 API 测试',
            disabled: editing && editing.name === '默认集合',
          })
        ),
        h(
          Form.Item,
          { name: 'description', label: '集合描述' },
          h(Input.TextArea, {
            autoSize: { minRows: 3, maxRows: 6 },
            placeholder: '描述这个集合的用途...',
          })
        ),
        h(
          Form.Item,
          { name: 'icon', label: '图标', initialValue: 'FolderOpenOutlined' },
          h(
            Select,
            null,
            ...ICON_OPTIONS.map((opt) => h(Option, { key: opt.value, value: opt.value }, opt.label))
          )
        )
      )
    )
  );
}

export default CollectionManager;
