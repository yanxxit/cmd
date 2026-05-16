// 全部案例页面模块
const { createElement: h } = React;
const { Typography } = antd;
const { Title, Text } = Typography;
const [{ default: StatsPanel }, { default: TestCaseList }] = await Promise.all([
  import(window.getModuleUrl('./js/components/StatsPanel.js')),
  import(window.getModuleUrl('./js/components/TestCaseList.js')),
]);

function CasesPage({ collectionId }) {
  return h(
    React.Fragment,
    null,
    h(
      'div',
      { className: 'page-header' },
      h(Title, { level: 4, style: { margin: 0 } }, '全部案例'),
      h(Text, { type: 'secondary' }, '管理和查看所有测试用例，支持按接口、标签和集合筛选')
    ),
    h(StatsPanel),
    h(TestCaseList, { collectionId })
  );
}

export default CasesPage;
