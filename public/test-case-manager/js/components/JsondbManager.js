const { createElement: h, useEffect, useMemo, useState } = React;
const {
  Alert, Button, Card, Col, Dropdown, Empty, Input, Row, Space, Table, Tabs, Tag, Tooltip, Typography, message,
} = antd;
const { Search, TextArea } = Input;
const { Text } = Typography;
const [{ api }] = await Promise.all([
  import(window.getModuleUrl('./js/api.js')),
]);

function renderDbStat(title, value, color, bg) {
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

function toTextValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function buildColumns(rows = []) {
  const keySet = new Set();
  rows.forEach((row) => {
    if (!row || typeof row !== 'object') return;
    Object.keys(row).forEach((key) => {
      if (key === '__rowKey') return;
      keySet.add(key);
    });
  });

  const orderedKeys = Array.from(keySet).sort((a, b) => {
    const preferredOrder = ['field', 'type', 'types', 'nullable', 'presence', 'sampleValue'];
    const aIndex = preferredOrder.indexOf(a);
    const bIndex = preferredOrder.indexOf(b);
    if (aIndex > -1 || bIndex > -1) {
      const safeA = aIndex === -1 ? 999 : aIndex;
      const safeB = bIndex === -1 ? 999 : bIndex;
      return safeA - safeB;
    }
    return a.localeCompare(b);
  });

  return orderedKeys.slice(0, 20).map((key) => ({
    title: key,
    dataIndex: key,
    key,
    ellipsis: true,
    render: (value) => {
      const textValue = toTextValue(value);
      return h('span', { title: textValue || '-' }, textValue || '-');
    },
  }));
}

function JsondbManager({ currentAdmin }) {
  const [sources, setSources] = useState([]);
  const [activeSource, setActiveSource] = useState('admin');
  const [tables, setTables] = useState([]);
  const [tableKeyword, setTableKeyword] = useState('');
  const [activeTable, setActiveTable] = useState('');
  const [sqlText, setSqlText] = useState('');
  const [loadingSources, setLoadingSources] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [resultRows, setResultRows] = useState([]);
  const [resultMeta, setResultMeta] = useState(null);
  const [resultPage, setResultPage] = useState(1);
  const [resultPageSize, setResultPageSize] = useState(10);
  const [fieldKeyword, setFieldKeyword] = useState('');

  const canQuery = Array.isArray(currentAdmin?.permissions) && currentAdmin.permissions.includes('jsondb.view');
  const isSchemaResult = resultMeta?.statementType === 'DESC';

  const activeSourceInfo = useMemo(
    () => sources.find((item) => item.key === activeSource) || null,
    [sources, activeSource]
  );

  const visibleResultRows = useMemo(() => {
    if (!isSchemaResult || !fieldKeyword.trim()) {
      return resultRows;
    }
    const keyword = fieldKeyword.trim().toLowerCase();
    return resultRows.filter((item) => {
      const fieldText = String(item.field || '').toLowerCase();
      const typeText = String(item.type || '').toLowerCase();
      const sampleText = String(item.sampleValue || '').toLowerCase();
      return fieldText.includes(keyword) || typeText.includes(keyword) || sampleText.includes(keyword);
    });
  }, [fieldKeyword, isSchemaResult, resultRows]);

  const resultColumns = useMemo(() => buildColumns(visibleResultRows), [visibleResultRows]);
  const pagedRows = useMemo(() => {
    const start = (resultPage - 1) * resultPageSize;
    return visibleResultRows.slice(start, start + resultPageSize);
  }, [visibleResultRows, resultPage, resultPageSize]);

  const resetResultPaging = () => {
    setResultPage(1);
    setResultPageSize(10);
  };

  const applyResult = (rows = [], meta = null) => {
    resetResultPaging();
    setFieldKeyword('');
    setResultRows(rows.map((item, index) => ({ __rowKey: `${meta?.tableName || 'result'}-${index}`, ...item })));
    setResultMeta(meta);
  };

  const loadSources = async () => {
    setLoadingSources(true);
    try {
      const data = await api.get('/api/admin-jsondb/sources');
      setSources(data || []);
      if (data?.[0] && !data.some((item) => item.key === activeSource)) {
        setActiveSource(data[0].key);
      }
    } catch (error) {
      message.error('加载数据库列表失败：' + error.message);
    } finally {
      setLoadingSources(false);
    }
  };

  const loadTables = async (sourceKey = activeSource, keyword = tableKeyword) => {
    setLoadingTables(true);
    try {
      const params = new URLSearchParams();
      params.set('source', sourceKey);
      if (keyword) params.set('keyword', keyword);
      const data = await api.get(`/api/admin-jsondb/tables?${params.toString()}`);
      setTables(data || []);
      if (!data?.length) {
        setActiveTable('');
        return;
      }
      const nextTable = data.find((item) => item.name === activeTable) || data[0];
      setActiveTable(nextTable.name);
      if (!sqlText.trim() || !data.some((item) => item.name === activeTable)) {
        setSqlText(nextTable.defaultSql || `SELECT * FROM ${nextTable.name} LIMIT 20`);
      }
    } catch (error) {
      message.error('加载数据表失败：' + error.message);
    } finally {
      setLoadingTables(false);
    }
  };

  const loadPreview = async (tableName, sourceKey = activeSource) => {
    if (!tableName) return;
    setQueryLoading(true);
    try {
      const preview = await api.get(`/api/admin-jsondb/tables/${encodeURIComponent(tableName)}/preview?source=${encodeURIComponent(sourceKey)}&limit=20`);
      applyResult(preview?.rows || [], {
        mode: 'preview',
        tableName,
        rowCount: preview?.rows?.length || 0,
        documentCount: preview?.documentCount || 0,
      });
    } catch (error) {
      message.error('加载表预览失败：' + error.message);
    } finally {
      setQueryLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  useEffect(() => {
    loadTables(activeSource, tableKeyword);
  }, [activeSource, tableKeyword]);

  useEffect(() => {
    if (!activeTable) return;
    loadPreview(activeTable, activeSource);
  }, [activeTable, activeSource]);

  const handleSelectTable = (table) => {
    setActiveTable(table.name);
    setSqlText(table.defaultSql || `SELECT * FROM ${table.name} LIMIT 20`);
  };

  const handleDescribeTable = () => {
    if (!activeTable) return;
    setSqlText(`DESC ${activeTable}`);
  };

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeCsvCell = (value) => {
    const text = toTextValue(value);
    if (!text) return '';
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const exportRowsAsCsv = (rows = [], fileName = 'jsondb-export.csv') => {
    if (!rows.length) {
      message.warning('当前没有可导出的结果');
      return;
    }
    const cleanRows = rows.map(({ __rowKey, ...rest }) => rest);
    const headers = buildColumns(cleanRows).map((item) => item.dataIndex);
    const lines = [
      headers.join(','),
      ...cleanRows.map((row) => headers.map((key) => escapeCsvCell(row[key])).join(',')),
    ];
    downloadFile(`\uFEFF${lines.join('\n')}`, fileName, 'text/csv;charset=utf-8;');
    message.success('CSV 导出成功');
  };

  const exportRowsAsJson = (rows = [], fileName = 'jsondb-export.json') => {
    if (!rows.length) {
      message.warning('当前没有可导出的结果');
      return;
    }
    const cleanRows = rows.map(({ __rowKey, ...rest }) => rest);
    downloadFile(JSON.stringify(cleanRows, null, 2), fileName, 'application/json;charset=utf-8;');
    message.success('JSON 导出成功');
  };

  const createExportName = (scope = 'all', ext = 'csv') => {
    const tableName = resultMeta?.tableName || activeTable || 'result';
    const mode = String(resultMeta?.statementType || resultMeta?.mode || 'query').toLowerCase();
    const stamp = dayjs().format('YYYYMMDD-HHmmss');
    return `${tableName}-${mode}-${scope}-${stamp}.${ext}`;
  };

  const handleCopyFields = async () => {
    const fields = visibleResultRows
      .map((item) => String(item.field || '').trim())
      .filter(Boolean);
    if (!fields.length) {
      message.warning('当前没有可复制的字段');
      return;
    }
    try {
      await navigator.clipboard.writeText(fields.join('\n'));
      message.success(`已复制 ${fields.length} 个字段名`);
    } catch (error) {
      message.error('复制失败，请检查浏览器权限');
    }
  };

  const handleRunQuery = async () => {
    if (!sqlText.trim()) {
      message.warning('请先输入 SQL');
      return;
    }
    setQueryLoading(true);
    try {
      const result = await api.post('/api/admin-jsondb/query', {
        source: activeSource,
        sql: sqlText,
      });
      applyResult(result?.rows || [], {
        mode: 'query',
        tableName: result?.tableName || '',
        rowCount: result?.rowCount || 0,
        statementType: result?.statementType || 'SELECT',
        documentCount: result?.schema?.documentCount,
        sampleCount: result?.schema?.sampleCount,
      });
      if (result?.tableName) {
        setActiveTable(result.tableName);
      }
      message.success(`查询完成，返回 ${result?.rowCount || 0} 行`);
    } catch (error) {
      message.error('SQL 执行失败：' + error.message);
    } finally {
      setQueryLoading(false);
    }
  };

  const tabItems = sources.map((source) => ({
    key: source.key,
    label: h(
      Space,
      { size: 6 },
      h('span', null, source.title),
      h(Tag, { bordered: false, color: 'blue' }, `${source.tableCount || 0} 表`)
    ),
  }));

  const exportMenu = {
    items: [
      { key: 'page-csv', label: '导出当前页 CSV' },
      { key: 'all-csv', label: '导出全部结果 CSV' },
      { key: 'all-json', label: '导出全部结果 JSON' },
    ],
    onClick: ({ key }) => {
      if (key === 'page-csv') {
        exportRowsAsCsv(pagedRows, createExportName('page', 'csv'));
        return;
      }
      if (key === 'all-csv') {
        exportRowsAsCsv(visibleResultRows, createExportName('all', 'csv'));
        return;
      }
      if (key === 'all-json') {
        exportRowsAsJson(visibleResultRows, createExportName('all', 'json'));
      }
    },
  };

  return h(
    React.Fragment,
    null,
    h(
      Row,
      { gutter: 16, style: { marginBottom: 16 } },
      h(Col, { xs: 24, md: 8 }, renderDbStat('数据库', sources.length, '#1677ff', 'rgba(22, 119, 255, 0.18)')),
      h(Col, { xs: 24, md: 8 }, renderDbStat('当前表数', activeSourceInfo?.tableCount || 0, '#722ed1', 'rgba(114, 46, 209, 0.18)')),
      h(Col, { xs: 24, md: 8 }, renderDbStat('当前文档数', activeSourceInfo?.totalDocuments || 0, '#13c2c2', 'rgba(19, 194, 194, 0.18)'))
    ),
    h(
      Card,
      { className: 'info-card', bordered: false, loading: loadingSources, bodyStyle: { paddingBottom: 12 } },
      h(Tabs, {
        activeKey: activeSource,
        items: tabItems,
        onChange: (key) => {
          setActiveSource(key);
          setActiveTable('');
          setResultRows([]);
          setResultMeta(null);
        },
      }),
      activeSourceInfo
        ? h(
            Alert,
            {
              showIcon: true,
              type: 'info',
              style: { marginBottom: 16 },
              message: activeSourceInfo.title,
              description: `${activeSourceInfo.description} · ${activeSourceInfo.path}`,
            }
          )
        : null,
      h(
        Row,
        { gutter: 16, className: 'jsondb-layout' },
        h(
          Col,
          { xs: 24, lg: 7 },
          h(
            'div',
            { className: 'filter-section jsondb-panel' },
            h(
              Space,
              { direction: 'vertical', size: 12, style: { width: '100%' } },
              h(Search, {
                allowClear: true,
                placeholder: '搜索数据表',
                value: tableKeyword,
                onChange: (event) => setTableKeyword(event.target.value),
              }),
              h(
                'div',
                { className: 'jsondb-table-list' },
                loadingTables
                  ? h('div', { className: 'jsondb-panel-empty' }, '正在加载表列表...')
                  : tables.length
                    ? tables.map((table) => h(
                        'button',
                        {
                          type: 'button',
                          key: table.name,
                          className: `jsondb-table-item${table.name === activeTable ? ' is-active' : ''}`,
                          onClick: () => handleSelectTable(table),
                        },
                        h(
                          'div',
                          { className: 'jsondb-table-item-head' },
                          h('span', { className: 'jsondb-table-name' }, table.name),
                          h(Tag, { bordered: false, color: 'processing' }, `${table.documentCount || 0} 行`)
                        ),
                        h(
                          'div',
                          { className: 'jsondb-table-item-meta' },
                          table.sampleKeys?.length ? table.sampleKeys.join(' / ') : '暂无字段预览'
                        )
                      ))
                    : h(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: '当前库没有匹配的数据表' })
              )
            )
          )
        ),
        h(
          Col,
          { xs: 24, lg: 17 },
          h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'filter-section jsondb-panel', style: { marginBottom: 16 } },
              h(
                Space,
                { direction: 'vertical', size: 12, style: { width: '100%' } },
                h(
                  Space,
                  { align: 'start', style: { width: '100%', justifyContent: 'space-between' } },
                  h(
                    Space,
                    { direction: 'vertical', size: 2 },
                    h('span', { style: { fontWeight: 600 } }, 'SQL 查询台'),
                    h(Text, { type: 'secondary' }, '支持 SELECT、DESC / DESCRIBE、SHOW TABLES、SHOW DATABASES，点击左侧表名可自动填充查询模板')
                  ),
                  h(
                    Space,
                    null,
                    h(Button, {
                      onClick: () => activeTable && loadPreview(activeTable, activeSource),
                      disabled: !activeTable,
                    }, '查看表预览'),
                    h(Button, {
                      onClick: handleDescribeTable,
                      disabled: !activeTable,
                    }, '查看字段结构'),
                    h(Button, {
                      type: 'primary',
                      loading: queryLoading,
                      disabled: !canQuery,
                      onClick: handleRunQuery,
                    }, '执行查询')
                  )
                ),
                h(TextArea, {
                  value: sqlText,
                  rows: 7,
                  className: 'jsondb-sql-editor',
                  placeholder: '例如：SHOW TABLES、SHOW DATABASES、SELECT * FROM admins LIMIT 20 或 DESC admins',
                  onChange: (event) => setSqlText(event.target.value),
                })
              )
            ),
            h(
              'div',
              { className: 'table-container jsondb-panel' },
              h(
                'div',
                { className: 'jsondb-result-toolbar' },
                h(
                  Space,
                  { size: 12 },
                  h('span', { style: { fontWeight: 600 } }, resultMeta?.mode === 'query' ? '查询结果' : '表预览'),
                  resultMeta?.tableName ? h(Tag, { color: 'blue' }, resultMeta.tableName) : null,
                  resultMeta?.statementType ? h(Tag, { color: 'purple' }, resultMeta.statementType) : null,
                  h(Text, { type: 'secondary' }, `返回 ${resultMeta?.rowCount || 0} 行`),
                  resultMeta?.documentCount !== undefined
                    ? h(Text, { type: 'secondary' }, `表内共 ${resultMeta.documentCount} 行`)
                    : null,
                  resultMeta?.sampleCount !== undefined
                    ? h(Text, { type: 'secondary' }, `结构样本 ${resultMeta.sampleCount} 行`)
                    : null
                ),
                isSchemaResult
                  ? h(
                      Space,
                      { size: 8, wrap: true },
                      h(Search, {
                        allowClear: true,
                        placeholder: '搜索字段名 / 类型 / 示例值',
                        value: fieldKeyword,
                        style: { width: 260 },
                        onChange: (event) => {
                          setFieldKeyword(event.target.value);
                          setResultPage(1);
                        },
                      }),
                      h(
                        Tooltip,
                        { title: '复制当前筛选后的字段名列表' },
                        h(Button, {
                          onClick: handleCopyFields,
                          disabled: !visibleResultRows.length,
                        }, '复制字段名')
                      )
                    )
                  : null,
                h(
                  Space,
                  null,
                  h(Text, { type: 'secondary' }, `分页 ${resultPage} / ${Math.max(Math.ceil((visibleResultRows.length || 0) / resultPageSize), 1)}`),
                  h(
                    Dropdown,
                    {
                      menu: exportMenu,
                      trigger: ['click'],
                      disabled: !visibleResultRows.length,
                    },
                    h(Button, null, '导出结果')
                  )
                ),
              ),
              resultColumns.length
                ? h(Table, {
                    rowKey: (record) => record.__rowKey || record._id || Math.random(),
                    columns: resultColumns,
                    dataSource: visibleResultRows,
                    size: 'middle',
                    pagination: {
                      current: resultPage,
                      pageSize: resultPageSize,
                      total: visibleResultRows.length,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50', '100'],
                      showTotal: (total) => `共 ${total} 条`,
                      onChange: (page, pageSize) => {
                        setResultPage(page);
                        setResultPageSize(pageSize);
                      },
                    },
                    scroll: { x: 'max-content' },
                  })
                : h(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: '选择左侧数据表或执行一条 SELECT 查询' })
            )
          )
        )
      )
    )
  );
}

export default JsondbManager;
