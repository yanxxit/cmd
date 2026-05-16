const { createElement: h, useEffect, useState } = React;
const {
  Button, Card, Col, Drawer, Form, Input, Modal, Popconfirm, Row, Select, Space,
  Table, Tag, message,
} = antd;
const { Search, TextArea } = Input;
const [{ api }, { default: RichTextEditor }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
  import(window.getModuleUrl('./js/components/RichTextEditor.js')),
]);

function renderArticleStat(title, value, color, bg) {
  return h(
    Card,
    { bordered: false, className: 'info-card', bodyStyle: { padding: 18 } },
    h(
      Space,
      { direction: 'vertical', size: 2 },
      h('div', { style: { color: 'var(--tcm-text-secondary)', fontSize: 12 } }, title),
      h('div', { style: { fontSize: 26, fontWeight: 700, color } }, value),
      h('div', { style: { width: 48, height: 4, borderRadius: 999, background: bg } })
    )
  );
}

function ArticleManager({ currentAdmin }) {
  const [form] = Form.useForm();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [shortLinks, setShortLinks] = useState([]);

  const canManage = Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes('articles.manage');

  const buildArticleReadUrl = (article, preview = false) => {
    const url = new URL('./article-view.html', window.location.href);
    url.searchParams.set('id', article._id);
    if (preview) {
      url.searchParams.set('preview', '1');
    }
    return `${url.pathname}${url.search}`;
  };

  const getShortLinkForArticle = (articleId) => shortLinks.find((item) => item.resourceId === articleId);

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (keyword) query.set('keyword', keyword);
      if (statusFilter) query.set('status', statusFilter);
      if (categoryFilter) query.set('category', categoryFilter);
      const [list, nextStats, nextCategories, nextShortLinks] = await Promise.all([
        api.get(`/api/admin-articles?${query.toString()}`),
        api.get('/api/admin-articles/stats'),
        api.get('/api/admin-articles/categories'),
        api.get('/api/admin-short-links?type=article'),
      ]);
      setItems(list || []);
      setStats(nextStats || {});
      setCategories(nextCategories || []);
      setShortLinks(nextShortLinks || []);
    } catch (error) {
      message.error('加载文章数据失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [keyword, statusFilter, categoryFilter]);

  const openCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      author: currentAdmin?.displayName || currentAdmin?.username || '',
      status: 'draft',
      tags: [],
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      title: item.title,
      summary: item.summary,
      content: item.content,
      author: item.author,
      category: item.category,
      coverImage: item.coverImage,
      status: item.status,
      tags: item.tags || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        tags: values.tags || [],
      };
      if (editingItem) {
        await api.put(`/api/admin-articles/${editingItem._id}`, payload);
        message.success('文章已更新');
      } else {
        await api.post('/api/admin-articles', payload);
        message.success('文章已创建');
      }
      setShowModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      message.error('保存文章失败：' + error.message);
    }
  };

  const handleDelete = async (item) => {
    try {
      await api.delete(`/api/admin-articles/${item._id}`);
      message.success('文章已删除');
      loadData();
    } catch (error) {
      message.error('删除文章失败：' + error.message);
    }
  };

  const handleSimulateRead = async (item) => {
    try {
      const updated = await api.post(`/api/admin-articles/${item._id}/read`, {});
      message.success(`已为《${updated.title}》增加一次阅读量`);
      if (previewItem && previewItem._id === updated._id) {
        setPreviewItem(updated);
      }
      loadData();
    } catch (error) {
      message.error('更新阅读量失败：' + error.message);
    }
  };

  const handleOpenReadingPage = (article) => {
    const url = buildArticleReadUrl(article, article.status !== 'published');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEnsureShortLink = async (article) => {
    if (article.status !== 'published') {
      message.warning('只有已发布文章才适合生成公开短链接');
      return;
    }
    try {
      const shortLink = await api.post('/api/admin-short-links', {
        type: 'article',
        resourceId: article._id,
        title: article.title,
        targetUrl: buildArticleReadUrl(article, false),
      });
      setShortLinks((prev) => {
        const exists = prev.some((item) => item._id === shortLink._id);
        return exists ? prev.map((item) => (item._id === shortLink._id ? shortLink : item)) : [shortLink, ...prev];
      });
      const shortUrl = `${window.location.origin}/s/${shortLink.code}`;
      try {
        await navigator.clipboard.writeText(shortUrl);
        message.success('短链接已生成并复制到剪贴板');
      } catch (error) {
        message.success(`短链接已生成：${shortUrl}`);
      }
    } catch (error) {
      message.error('生成短链接失败：' + error.message);
    }
  };

  const columns = [
    {
      title: '文章标题',
      dataIndex: 'title',
      key: 'title',
      render: (_, record) => h(
        Space,
        { direction: 'vertical', size: 0 },
        h('span', { style: { fontWeight: 600 } }, record.title),
        h('span', { style: { color: 'var(--tcm-text-secondary)', fontSize: 12 } }, record.summary || '暂无摘要')
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (value) => h(Tag, { color: 'blue' }, value || '未分类'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => {
        const colorMap = { draft: 'default', published: 'success', archived: 'warning' };
        const labelMap = { draft: '草稿', published: '已发布', archived: '已归档' };
        return h(Tag, { color: colorMap[value] || 'default' }, labelMap[value] || value);
      },
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
    },
    {
      title: '阅读量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
      render: (value) => h(Tag, { color: 'geekblue' }, value || 0),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 360,
      render: (_, record) => h(
        Space,
        null,
        h(Button, { type: 'link', size: 'small', onClick: () => setPreviewItem(record) }, '预览'),
        h(Button, { type: 'link', size: 'small', onClick: () => handleOpenReadingPage(record) }, '独立阅读'),
        h(Button, { type: 'link', size: 'small', disabled: !canManage, onClick: () => handleEnsureShortLink(record) }, '短链'),
        h(Button, { type: 'link', size: 'small', onClick: () => handleSimulateRead(record) }, '模拟阅读'),
        h(Button, { type: 'link', size: 'small', disabled: !canManage, onClick: () => openEdit(record) }, '编辑'),
        h(
          Popconfirm,
          {
            title: '确定删除该文章吗？',
            okText: '确定',
            cancelText: '取消',
            disabled: !canManage,
            onConfirm: () => handleDelete(record),
          },
          h(Button, { type: 'link', size: 'small', danger: true, disabled: !canManage }, '删除')
        )
      ),
    },
  ];

  return h(
    React.Fragment,
    null,
    h(
      Row,
      { gutter: [16, 16], style: { marginBottom: 16 } },
      h(Col, { xs: 24, md: 12, lg: 6 }, renderArticleStat('文章总数', stats.total || 0, '#1677ff', 'rgba(22,119,255,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderArticleStat('已发布', stats.published || 0, '#52c41a', 'rgba(82,196,26,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderArticleStat('草稿', stats.draft || 0, '#722ed1', 'rgba(114,46,209,0.18)')),
      h(Col, { xs: 24, md: 12, lg: 6 }, renderArticleStat('总阅读量', stats.totalViews || 0, '#fa8c16', 'rgba(250,140,22,0.18)'))
    ),
    h(
      'div',
      { className: 'filter-section' },
      h(
        Row,
        { gutter: 16 },
        h(Col, { flex: '280px' }, h(Search, { placeholder: '搜索标题 / 摘要 / 内容', value: keyword, onChange: (e) => setKeyword(e.target.value), allowClear: true })),
        h(Col, { flex: '180px' }, h(Select, {
          placeholder: '按状态筛选',
          value: statusFilter || undefined,
          onChange: (value) => setStatusFilter(value || ''),
          allowClear: true,
          style: { width: '100%' },
          options: [
            { label: '草稿', value: 'draft' },
            { label: '已发布', value: 'published' },
            { label: '已归档', value: 'archived' },
          ],
        })),
        h(Col, { flex: '180px' }, h(Select, {
          placeholder: '按分类筛选',
          value: categoryFilter || undefined,
          onChange: (value) => setCategoryFilter(value || ''),
          allowClear: true,
          style: { width: '100%' },
          options: categories.map((category) => ({ label: category, value: category })),
        })),
        h(Col, { flex: 'auto', style: { textAlign: 'right' } }, h(Button, { type: 'primary', disabled: !canManage, onClick: openCreate }, '新建文章'))
      )
    ),
    h(
      'div',
      { className: 'table-container' },
      h(Table, {
        rowKey: '_id',
        loading,
        dataSource: items,
        columns,
        pagination: false,
      })
    ),
    h(
      Modal,
      {
        open: showModal,
        title: editingItem ? '编辑文章' : '新建文章',
        width: 860,
        onCancel: () => {
          setShowModal(false);
          setEditingItem(null);
          form.resetFields();
        },
        onOk: () => form.submit(),
        okText: editingItem ? '保存' : '创建',
        destroyOnClose: true,
      },
      h(
        Form,
        {
          form,
          layout: 'vertical',
          onFinish: handleSubmit,
        },
        h(Form.Item, { label: '文章标题', name: 'title', rules: [{ required: true, message: '请输入文章标题' }] }, h(Input, { placeholder: '请输入文章标题' })),
        h(Form.Item, { label: '文章摘要', name: 'summary' }, h(TextArea, { rows: 2, placeholder: '请输入文章摘要' })),
        h(Form.Item, {
          label: '文章内容',
          name: 'content',
          rules: [{ required: true, message: '请输入文章内容' }],
        }, h(RichTextEditor, { height: 360, placeholder: '请输入文章正文内容，支持标题、列表、引用、代码块和图片链接' })),
        h(
          Row,
          { gutter: 12 },
          h(Col, { span: 8 }, h(Form.Item, { label: '作者', name: 'author', rules: [{ required: true, message: '请输入作者' }] }, h(Input, { placeholder: '作者名称' }))),
          h(Col, { span: 8 }, h(Form.Item, { label: '分类', name: 'category' }, h(Input, { placeholder: '例如：平台公告' }))),
          h(Col, { span: 8 }, h(Form.Item, { label: '状态', name: 'status', rules: [{ required: true, message: '请选择状态' }] }, h(Select, { options: [
            { label: '草稿', value: 'draft' },
            { label: '已发布', value: 'published' },
            { label: '已归档', value: 'archived' },
          ] })))
        ),
        h(Form.Item, { label: '封面图片 URL', name: 'coverImage' }, h(Input, { placeholder: '可选：文章封面图地址' })),
        h(Form.Item, { label: '标签', name: 'tags' }, h(Select, { mode: 'tags', tokenSeparators: [','], placeholder: '输入后回车，可添加多个标签' }))
      )
    ),
    h(
      Drawer,
      {
        open: !!previewItem,
        width: 720,
        title: previewItem?.title || '文章预览',
        onClose: () => setPreviewItem(null),
      },
      previewItem
        ? h(
            Space,
            { direction: 'vertical', size: 16, style: { width: '100%' } },
            h(
              Space,
              { wrap: true, size: 8 },
              h(Tag, { color: 'blue' }, previewItem.category || '未分类'),
              h(Tag, { color: previewItem.status === 'published' ? 'success' : previewItem.status === 'archived' ? 'warning' : 'default' }, previewItem.status),
              h(Tag, { color: 'geekblue' }, `阅读量 ${previewItem.viewCount || 0}`),
              ...((previewItem.tags || []).map((tag) => h(Tag, { key: tag }, tag)))
            ),
            previewItem.summary
              ? h('div', { className: 'article-preview-summary' }, previewItem.summary)
              : null,
            h(
              'div',
              { className: 'article-preview-meta' },
              `作者：${previewItem.author || '-'} · 更新时间：${previewItem.updatedAt ? dayjs(previewItem.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}`
            ),
            h(
              'div',
              {
                className: 'article-preview-content',
                dangerouslySetInnerHTML: { __html: previewItem.content || '<p>暂无内容</p>' },
              }
            ),
            h(
              Space,
              null,
              h(Button, { onClick: () => handleOpenReadingPage(previewItem) }, '打开独立阅读页'),
              getShortLinkForArticle(previewItem._id)
                ? h(Button, {
                    onClick: async () => {
                      const shortLink = getShortLinkForArticle(previewItem._id);
                      const shortUrl = `${window.location.origin}/s/${shortLink.code}`;
                      try {
                        await navigator.clipboard.writeText(shortUrl);
                        message.success('短链接已复制');
                      } catch (error) {
                        message.info(shortUrl);
                      }
                    },
                  }, `复制短链（${getShortLinkForArticle(previewItem._id).hitCount || 0} 次访问）`)
                : h(Button, { disabled: !canManage, onClick: () => handleEnsureShortLink(previewItem) }, '生成短链'),
              h(Button, { onClick: () => handleSimulateRead(previewItem) }, '模拟阅读 +1'),
              h(Button, { type: 'primary', disabled: !canManage, onClick: () => { openEdit(previewItem); setPreviewItem(null); } }, '编辑文章')
            )
          )
        : null
    )
  );
}

export default ArticleManager;
