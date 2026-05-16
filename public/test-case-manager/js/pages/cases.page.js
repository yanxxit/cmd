// 全部案例子页面 ESM descriptor
const { Typography } = antd;
const { Title, Text } = Typography;

function CasesPage({ collectionId }) {
  const StatsPanel = window.__APP__.components.StatsPanel;
  const TestCaseList = window.__APP__.components.TestCaseList;

  return (
    <>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>全部案例</Title>
        <Text type="secondary">管理和查看所有测试用例，支持按接口、标签和集合筛选</Text>
      </div>
      <StatsPanel />
      <TestCaseList collectionId={collectionId} />
    </>
  );
}

export default {
  type: 'page',
  key: 'cases',
  title: '全部案例',
  component: CasesPage,
};
