// 集合管理页面模块
const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: CollectionManager } = await import(window.getModuleUrl('./js/components/CollectionManager.js'));

function CollectionsPage() {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '集合管理'),
      h(Text, { type: 'secondary' }, '通过集合组织测试用例，便于分类管理与协作')
    ),
    h(CollectionManager)
  );
}

export default CollectionsPage;
