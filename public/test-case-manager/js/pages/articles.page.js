const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: ArticleManager } = await import(window.getModuleUrl('./js/components/ArticleManager.js'));

function ArticlesPage({ currentAdmin }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '文章管理'),
      h(Text, { type: 'secondary' }, '集中完成文章的增删改查、预览与阅读量统计，支持按状态和分类快速筛选')
    ),
    h(ArticleManager, { currentAdmin })
  );
}

export default ArticlesPage;
