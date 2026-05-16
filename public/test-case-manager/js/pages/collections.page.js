// 集合管理子页面 ESM descriptor
const { Typography } = antd;
const { Title, Text } = Typography;

function CollectionsPage() {
  const CollectionManager = window.__APP__.components.CollectionManager;

  return (
    <>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>集合管理</Title>
        <Text type="secondary">通过集合组织测试用例，便于分类管理与协作</Text>
      </div>
      <CollectionManager />
    </>
  );
}

export default {
  type: 'page',
  key: 'collections',
  title: '集合管理',
  component: CollectionsPage,
};
