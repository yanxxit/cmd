const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const { default: JsondbManager } = await import(window.getModuleUrl('./js/components/JsondbManager.js'));

function JsondbPage({ currentAdmin }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, 'JSONDB 管理'),
      h(Text, { type: 'secondary' }, '集中查看 @yanit/jsondb 数据库与表列表，并使用只读 SQL 快速检索数据')
    ),
    h(JsondbManager, { currentAdmin })
  );
}

export default JsondbPage;
