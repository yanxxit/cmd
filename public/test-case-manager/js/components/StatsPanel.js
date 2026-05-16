// 统计面板组件 ESM descriptor
const { useState, useEffect } = React;
const { Row, Col, Card } = antd;

function StatsPanel() {
  const api = window.__APP__.api;
  const [stats, setStats] = useState({ total: 0, byApiName: {}, byTags: {} });
  const [collectionStats, setCollectionStats] = useState({ totalCollections: 0, totalCases: 0 });

  const loadStats = async () => {
    try {
      const [testCaseStats, collectionData] = await Promise.all([
        api.get('/api/test-cases/stats'),
        api.get('/api/test-case-collections/stats'),
      ]);
      setStats(testCaseStats);
      setCollectionStats(collectionData);
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const cards = [
    {
      key: 'total', title: '总案例数', value: stats.total,
      icon: 'file-text', color: '#1677ff', bg: 'rgba(22,119,255,0.12)',
      desc: '系统中所有测试案例',
    },
    {
      key: 'collections', title: '集合数', value: collectionStats.totalCollections,
      icon: 'folder', color: '#722ed1', bg: 'rgba(114,46,209,0.12)',
      desc: '已创建的测试集合',
    },
    {
      key: 'apis', title: '接口数', value: Object.keys(stats.byApiName || {}).length,
      icon: 'layers', color: '#13c2c2', bg: 'rgba(19,194,194,0.12)',
      desc: '已覆盖的 API 接口',
    },
    {
      key: 'tags', title: '标签数', value: Object.keys(stats.byTags || {}).length,
      icon: 'tags', color: '#fa8c16', bg: 'rgba(250,140,22,0.12)',
      desc: '已使用的分类标签',
    },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {cards.map((c) => (
        <Col xs={24} sm={12} md={12} lg={6} key={c.key}>
          <Card className="stat-card" bordered={false}>
            <div className="stat-card-inner">
              <div className="stat-icon-badge" style={{ background: c.bg, color: c.color }}>
                <i data-lucide={c.icon}></i>
              </div>
              <div className="stat-meta">
                <div className="stat-title">{c.title}</div>
                <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
                <div className="stat-desc">{c.desc}</div>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default {
  type: 'component',
  name: 'StatsPanel',
  component: StatsPanel,
};
