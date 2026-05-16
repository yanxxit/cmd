const { createElement: h, useEffect, useMemo, useState } = React;
const { Alert, Button, Result, Skeleton, Space, Tag, Typography } = antd;
const { Title, Text, Paragraph } = Typography;
const [{ api, getAuthToken }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

function getQuery() {
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get('id') || '',
    preview: params.get('preview') === '1',
  };
}

async function loadArticleByMode(id, preview) {
  if (preview && getAuthToken()) {
    return await api.get(`/api/admin-articles/${id}`);
  }
  const response = await fetch(`/api/public/articles/${encodeURIComponent(id)}`);
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || '获取文章失败');
  }
  return result.data;
}

function ArticleViewPage() {
  const query = useMemo(() => getQuery(), []);
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadArticle() {
      if (!query.id) {
        setError('缺少文章 ID');
        setLoading(false);
        return;
      }
      try {
        const data = await loadArticleByMode(query.id, query.preview);
        setArticle(data);
      } catch (err) {
        setError(err.message || '获取文章失败');
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [query.id, query.preview]);

  if (loading) {
    return h(
      'div',
      { className: 'article-view-shell' },
      h(
        'div',
        { className: 'article-view-container' },
        h(Skeleton, { active: true, paragraph: { rows: 8 } })
      )
    );
  }

  if (error) {
    return h(
      'div',
      { className: 'article-view-shell' },
      h(
        Result,
        {
          status: 'error',
          title: '文章加载失败',
          subTitle: error,
          extra: h(Button, { type: 'primary', onClick: () => window.location.reload() }, '刷新重试'),
        }
      )
    );
  }

  return h(
    'div',
    { className: 'article-view-shell' },
    h(
      'div',
      { className: 'article-view-container' },
      h(
        'div',
        { className: 'article-view-header' },
        h(
          Space,
          { wrap: true, size: 8, style: { marginBottom: 16 } },
          h(Tag, { color: 'blue' }, article.category || '未分类'),
          h(Tag, { color: article.status === 'published' ? 'success' : 'warning' }, query.preview ? '后台预览' : '公开阅读'),
          h(Tag, { color: 'geekblue' }, `阅读量 ${article.viewCount || 0}`),
          ...((article.tags || []).map((tag) => h(Tag, { key: tag }, tag)))
        ),
        h(Title, { level: 1, className: 'article-view-title' }, article.title),
        article.summary
          ? h(Paragraph, { className: 'article-view-summary' }, article.summary)
          : null,
        h(
          'div',
          { className: 'article-view-meta' },
          h(Text, { type: 'secondary' }, `作者：${article.author || '-'} · 发布时间：${article.publishedAt ? dayjs(article.publishedAt).format('YYYY-MM-DD HH:mm:ss') : '未发布'} · 更新时间：${article.updatedAt ? dayjs(article.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}`)
        )
      ),
      h(
        'article',
        {
          className: 'article-view-content',
          dangerouslySetInnerHTML: { __html: article.content || '<p>暂无内容</p>' },
        }
      ),
      query.preview
        ? h(Alert, {
            style: { marginTop: 24 },
            type: 'info',
            showIcon: true,
            message: '当前为后台预览模式，适用于未发布文章或草稿内容预览。',
          })
        : null
    )
  );
}

export default ArticleViewPage;
