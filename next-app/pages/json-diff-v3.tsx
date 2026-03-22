'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button, Space, Card, Row, Col, Switch, Divider, Tag, Dropdown, MenuProps, Modal, Input, Upload, Tooltip, ConfigProvider, theme, UploadFile, App } from 'antd';
import {
  ThunderboltOutlined,
  SyncOutlined,
  PlusOutlined,
  SwapOutlined,
  UndoOutlined,
  CopyOutlined,
  FilterOutlined,
  CheckOutlined,
  DownloadOutlined,
  HistoryOutlined,
  ClearOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  UploadOutlined,
  FormatPainterOutlined,
  CompressOutlined,
  BulbOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { HighlightEditor } from '@/components/json-diff/HighlightEditor';
import { EXAMPLES } from '@/components/json-diff/constants';
import { DiffResult } from '@/components/json-diff/types';
import { sortKeysByPinyin, calculateDiff, filterSameFields, collectDiffPaths } from '@/components/json-diff/logic';
import { formatJson, minifyJson, parseJsonFile } from '@/components/json-diff/utils';
import createStyles from '@/components/json-diff/styles';

const { Dragger } = Upload;

type ExampleType = keyof typeof EXAMPLES;

interface HistoryItem {
  id: string;
  timestamp: number;
  left: string;
  right: string;
  stats: any;
}

export default function JsonDiffV3Page() {
  const { message } = App.useApp();
  
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterSame, setFilterSame] = useState(false);
  const [leftDiffPaths, setLeftDiffPaths] = useState<Map<string, any>>(new Map());
  const [rightDiffPaths, setRightDiffPaths] = useState<Map<string, any>>(new Map());
  const [displayLeft, setDisplayLeft] = useState('');
  const [displayRight, setDisplayRight] = useState('');
  const [hasContent, setHasContent] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const editorRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'left' | 'right' | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [leftFileName, setLeftFileName] = useState('');
  const [rightFileName, setRightFileName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // 检查是否有内容
  useEffect(() => {
    setHasContent(!!(leftJson.trim() || rightJson.trim()));
  }, [leftJson, rightJson]);

  // 加载历史记录
  useEffect(() => {
    const saved = localStorage.getItem('json-diff-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // 保存历史记录
  const saveToHistory = (stats: any) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      left: leftJson,
      right: rightJson,
      stats,
    };
    const newHistory = [newItem, ...history].slice(0, 10); // 保留最近 10 条
    setHistory(newHistory);
    localStorage.setItem('json-diff-history', JSON.stringify(newHistory));
  };

  /**
   * 对比 JSON
   */
  const handleCompare = () => {
    if (!leftJson.trim() && !rightJson.trim()) {
      message.warning('请输入 JSON 数据');
      return;
    }

    setLoading(true);
    try {
      const leftData = leftJson.trim() ? JSON.parse(leftJson) : null;
      const rightData = rightJson.trim() ? JSON.parse(rightJson) : null;
      const sortedLeft = sortKeysByPinyin(leftData);
      const sortedRight = sortKeysByPinyin(rightData);
      const compareLeft = filterSame ? filterSameFields(sortedLeft, sortedRight) : sortedLeft;
      const compareRight = filterSame ? filterSameFields(sortedRight, sortedLeft) : sortedRight;

      const result = calculateDiff(compareLeft, compareRight);
      const hasDiff = result.stats.modified > 0 || result.stats.added > 0;

      setDiffResult({ stats: result.stats, diff: result.nodes });

      const leftPaths = new Map();
      const rightPaths = new Map();
      collectDiffPaths(result, leftPaths, rightPaths);
      setLeftDiffPaths(leftPaths);
      setRightDiffPaths(rightPaths);

      setDisplayLeft(JSON.stringify(compareLeft, null, 2));
      setDisplayRight(JSON.stringify(compareRight, null, 2));

      // 保存到历史记录
      if (hasDiff || result.stats.same > 0) {
        saveToHistory(result.stats);
      }

      if (hasDiff) {
        message.success(filterSame ? '已过滤相同项并对比' : '对比完成');
      } else {
        message.info('两个 JSON 完全相同');
      }
    } catch (e: any) {
      message.error(`JSON 格式错误：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载示例
   */
  const loadExample = (type: ExampleType) => {
    const ex = EXAMPLES[type];
    setLeftJson(JSON.stringify(ex.left, null, 2));
    setRightJson(JSON.stringify(ex.right, null, 2));
    setDiffResult(null);
    setLeftDiffPaths(new Map());
    setRightDiffPaths(new Map());
    setDisplayLeft('');
    setDisplayRight('');
    message.success(`已加载示例：${ex.name}`);
  };

  /**
   * 交换左右
   */
  const handleSwap = () => {
    setLeftJson(rightJson);
    setRightJson(leftJson);
    setDisplayLeft(displayRight);
    setDisplayRight(displayLeft);
    setLeftDiffPaths(rightDiffPaths);
    setRightDiffPaths(leftDiffPaths);
    message.success('已交换左右');
  };

  /**
   * 清空
   */
  const handleClear = () => {
    setLeftJson('');
    setRightJson('');
    setDisplayLeft('');
    setDisplayRight('');
    setDiffResult(null);
    setLeftDiffPaths(new Map());
    setRightDiffPaths(new Map());
    setFilterSame(false);
    setLeftFileName('');
    setRightFileName('');
    message.success('已清空');
  };

  /**
   * 处理文件上传
   */
  const handleFileUpload = async (file: File, target: 'left' | 'right') => {
    setUploading(true);
    setUploadTarget(target);
    try {
      const content = await parseJsonFile(file);
      if (target === 'left') {
        setLeftJson(content);
        setLeftFileName(file.name);
      } else {
        setRightJson(content);
        setRightFileName(file.name);
      }
      message.success(`已加载文件：${file.name}`);
    } catch (e: any) {
      message.error(`文件解析失败：${e.message}`);
    } finally {
      setUploading(false);
      setUploadTarget(null);
    }
  };

  /**
   * 格式化 JSON
   */
  const handleFormat = () => {
    if (!leftJson.trim() && !rightJson.trim()) {
      message.warning('请输入 JSON 数据');
      return;
    }
    if (leftJson.trim()) setLeftJson(formatJson(leftJson));
    if (rightJson.trim()) setRightJson(formatJson(rightJson));
    message.success('已格式化 JSON');
  };

  /**
   * 压缩 JSON
   */
  const handleMinify = () => {
    if (!leftJson.trim() && !rightJson.trim()) {
      message.warning('请输入 JSON 数据');
      return;
    }
    if (leftJson.trim()) setLeftJson(minifyJson(leftJson));
    if (rightJson.trim()) setRightJson(minifyJson(rightJson));
    message.success('已压缩 JSON');
  };

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    message.success(darkMode ? '已切换到浅色模式' : '已切换到深色模式');
  };

  /**
   * 复制差异
   */
  const handleCopyDiff = () => {
    if (!diffResult) {
      message.warning('请先对比');
      return;
    }
    const data = {
      timestamp: new Date().toISOString(),
      stats: diffResult.stats,
      summary: {
        total: diffResult.stats.total,
        same: diffResult.stats.same,
        modified: diffResult.stats.modified,
        added: diffResult.stats.added,
        hasDiff: diffResult.stats.modified > 0 || diffResult.stats.added > 0,
      },
      left: displayLeft || leftJson,
      right: displayRight || rightJson,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    message.success('已复制差异数据');
  };

  /**
   * 导出差异
   */
  const handleExport = () => {
    if (!diffResult) {
      message.warning('请先对比');
      return;
    }
    const data = {
      timestamp: new Date().toISOString(),
      stats: diffResult.stats,
      left: displayLeft || leftJson,
      right: displayRight || rightJson,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `json-diff-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('已导出差异数据');
  };

  /**
   * 切换过滤相同项
   */
  const toggleFilter = () => {
    const newFilterState = !filterSame;
    setFilterSame(newFilterState);

    if (leftJson.trim() || rightJson.trim()) {
      setLoading(true);
      try {
        const leftData = leftJson.trim() ? JSON.parse(leftJson) : null;
        const rightData = rightJson.trim() ? JSON.parse(rightJson) : null;
        const sortedLeft = sortKeysByPinyin(leftData);
        const sortedRight = sortKeysByPinyin(rightData);
        const compareLeft = newFilterState ? filterSameFields(sortedLeft, sortedRight) : sortedLeft;
        const compareRight = newFilterState ? filterSameFields(sortedRight, sortedLeft) : sortedRight;

        const result = calculateDiff(compareLeft, compareRight);
        setDiffResult({ stats: result.stats, diff: result.nodes });

        const leftPaths = new Map();
        const rightPaths = new Map();
        collectDiffPaths(result, leftPaths, rightPaths);
        setLeftDiffPaths(leftPaths);
        setRightDiffPaths(rightPaths);

        setDisplayLeft(JSON.stringify(compareLeft, null, 2));
        setDisplayRight(JSON.stringify(compareRight, null, 2));
        message.success(newFilterState ? '已过滤相同项' : '已显示全部');
      } catch (e: any) {
        message.error(`JSON 格式错误：${e.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      message.success(newFilterState ? '已开启过滤相同项' : '已关闭过滤相同项');
    }
  };

  /**
   * 调整字体大小
   */
  const handleZoomIn = () => setFontSize(prev => Math.min(prev + 2, 20));
  const handleZoomOut = () => setFontSize(prev => Math.max(prev - 2, 11));

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleCompare();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leftJson, rightJson, filterSame, darkMode]);

  // 历史记录菜单
  const historyMenu: MenuProps = {
    items: history.slice(0, 5).map(item => ({
      key: item.id,
      label: new Date(item.timestamp).toLocaleString(),
      onClick: () => {
        setLeftJson(item.left);
        setRightJson(item.right);
        setShowHistory(false);
        message.success('已加载历史记录');
      },
    })),
  };

  return (
    <ConfigProvider theme={{ algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <div style={createStyles(darkMode).pageContainer as React.CSSProperties}>
      {(() => {
        const styles = createStyles(darkMode);
        return (
          <>
      {/* 顶部工具栏 */}
      <div style={styles.toolbar as React.CSSProperties}>
        <div style={styles.toolbarLeft}>
          <div style={styles.logo}>
            <ThunderboltOutlined style={styles.logoIcon} />
            <span style={styles.logoText}>JSON 对比</span>
          </div>
          <Divider type="vertical" style={{ height: 24 }} />
          <Space size="small">
            <Dropdown menu={{ items: Object.entries(EXAMPLES).map(([key, ex]) => ({
              key,
              label: `${ex.name}`,
              description: ex.description,
              onClick: () => loadExample(key as ExampleType),
            })) }} trigger={['click']}>
              <Button icon={<PlusOutlined />} size="small">示例</Button>
            </Dropdown>
            <Button
              type="primary"
              icon={<SyncOutlined spin={loading} />}
              onClick={handleCompare}
              loading={loading}
              size="small"
            >
              对比
            </Button>
          </Space>
        </div>
        <div style={styles.toolbarRight}>
          <Space size="small">
            <Tooltip title="上传 JSON 文件">
              <Button 
                icon={<UploadOutlined />} 
                size="small" 
                loading={uploading}
                onClick={() => setShowUploadModal(true)}
              >
                上传
              </Button>
            </Tooltip>
            <Tooltip title="格式化 JSON">
              <Button icon={<FormatPainterOutlined />} onClick={handleFormat} size="small" disabled={!hasContent}>
                格式化
              </Button>
            </Tooltip>
            <Tooltip title="压缩 JSON">
              <Button icon={<CompressOutlined />} onClick={handleMinify} size="small" disabled={!hasContent}>
                压缩
              </Button>
            </Tooltip>
            <Divider type="vertical" style={{ height: 16 }} />
            <Button icon={<SwapOutlined />} onClick={handleSwap} size="small" disabled={!hasContent}>
              交换
            </Button>
            <Button icon={<UndoOutlined />} onClick={handleClear} size="small" disabled={!hasContent}>
              重置
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!diffResult} size="small">
              导出
            </Button>
            <Button icon={<CopyOutlined />} onClick={handleCopyDiff} disabled={!diffResult} size="small">
              复制
            </Button>
            <Button icon={<HistoryOutlined />} onClick={() => setShowHistory(true)} size="small" disabled={history.length === 0}>
              历史
            </Button>
            <Divider type="vertical" style={{ height: 16 }} />
            <Space align="center" size={4}>
              <Button size="small" icon={<ZoomOutOutlined />} onClick={handleZoomOut} disabled={fontSize <= 11} />
              <span style={{ fontSize: 12, color: '#666', minWidth: 30, textAlign: 'center' }}>{fontSize}</span>
              <Button size="small" icon={<ZoomInOutlined />} onClick={handleZoomIn} disabled={fontSize >= 20} />
            </Space>
            <Divider type="vertical" style={{ height: 16 }} />
            <Space align="center" size={6}>
              <FilterOutlined style={{ fontSize: 14, color: filterSame ? '#52c41a' : '#666' }} />
              <span style={{ fontSize: 13, color: filterSame ? '#52c41a' : '#666' }}>过滤相同</span>
              <Switch
                checked={filterSame}
                onChange={toggleFilter}
                size="small"
                checkedChildren={<CheckOutlined />}
                unCheckedChildren={<FilterOutlined />}
              />
            </Space>
            <Divider type="vertical" style={{ height: 16 }} />
            <Tooltip title={darkMode ? '浅色模式' : '深色模式'}>
              <Button 
                icon={<BulbOutlined rotate={darkMode ? 180 : 0} />} 
                onClick={toggleTheme} 
                size="small"
              >
                {darkMode ? '浅' : '深'}
              </Button>
            </Tooltip>
          </Space>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={styles.mainContent}>
        <Row gutter={12} style={{ height: '100%' }}>
          <Col span={12}>
            <Card 
              style={{ ...styles.editorCard, fontSize }} 
              styles={{ body: { padding: 0, height: '100%' } }}
            >
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>
                  📄 原始 JSON
                  {leftFileName && (
                    <Tag icon={<FileTextOutlined />} color="blue" style={{ marginLeft: 8 }}>
                      {leftFileName}
                    </Tag>
                  )}
                </span>
              </div>
              <div style={styles.editorWrapper}>
                <HighlightEditor
                  value={displayLeft || leftJson}
                  onChange={setLeftJson}
                  diffPaths={leftDiffPaths}
                  placeholder="请输入或粘贴 JSON 数据... (⌘/Ctrl + Enter 对比)"
                  fontSize={fontSize}
                  title="左侧 JSON"
                />
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card 
              style={{ ...styles.editorCard, fontSize }} 
              styles={{ body: { padding: 0, height: '100%' } }}
            >
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>
                  📄 目标 JSON
                  {rightFileName && (
                    <Tag icon={<FileTextOutlined />} color="green" style={{ marginLeft: 8 }}>
                      {rightFileName}
                    </Tag>
                  )}
                </span>
              </div>
              <div style={styles.editorWrapper}>
                <HighlightEditor
                  value={displayRight || rightJson}
                  onChange={setRightJson}
                  diffPaths={rightDiffPaths}
                  placeholder="请输入或粘贴 JSON 数据... (⌘/Ctrl + Enter 对比)"
                  fontSize={fontSize}
                  title="右侧 JSON"
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 历史记录弹窗 */}
      <Modal
        title={<><HistoryOutlined /> 历史记录</>}
        open={showHistory}
        onCancel={() => setShowHistory(false)}
        footer={[
          <Button key="clear" icon={<ClearOutlined />} danger onClick={() => {
            setHistory([]);
            localStorage.removeItem('json-diff-history');
            setShowHistory(false);
            message.success('已清空历史记录');
          }}>
            清空历史
          </Button>,
          <Button key="close" onClick={() => setShowHistory(false)}>关闭</Button>,
        ]}
        width={600}
      >
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无历史记录</div>
          ) : (
            history.map(item => (
              <Card
                key={item.id}
                size="small"
                style={{ marginBottom: 12, cursor: 'pointer' }}
                onClick={() => {
                  setLeftJson(item.left);
                  setRightJson(item.right);
                  setShowHistory(false);
                  message.success('已加载历史记录');
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{new Date(item.timestamp).toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      总数：{item.stats.total} | 相同：{item.stats.same} | 修改：{item.stats.modified} | 差异：{item.stats.added}
                    </div>
                  </div>
                  <Button type="primary" size="small">加载</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </Modal>

      {/* 上传文件弹窗 */}
      <Modal
        title={<><UploadOutlined /> 上传 JSON 文件</>}
        open={showUploadModal}
        onCancel={() => setShowUploadModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowUploadModal(false)}>关闭</Button>,
        ]}
        width={600}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="📄 上传到左侧" hoverable>
              <Dragger
                accept=".json,application/json"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleFileUpload(file, 'left');
                  setShowUploadModal(false);
                  return false;
                }}
              >
                <p className="ant-upload-drag-icon">
                  <FileTextOutlined style={{ color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此处</p>
                <p className="ant-upload-hint">仅支持 .json 文件</p>
              </Dragger>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="📄 上传到右侧" hoverable>
              <Dragger
                accept=".json,application/json"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleFileUpload(file, 'right');
                  setShowUploadModal(false);
                  return false;
                }}
              >
                <p className="ant-upload-drag-icon">
                  <FileTextOutlined style={{ color: '#52c41a' }} />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此处</p>
                <p className="ant-upload-hint">仅支持 .json 文件</p>
              </Dragger>
            </Card>
          </Col>
        </Row>
      </Modal>

      {/* 隐藏的文件输入 */}
      <input
        id="file-upload-left"
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'left');
          e.target.value = '';
        }}
      />
      <input
        id="file-upload-right"
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'right');
          e.target.value = '';
        }}
      />
          </>
        );
      })()}
    </div>
    </ConfigProvider>
  );
}
