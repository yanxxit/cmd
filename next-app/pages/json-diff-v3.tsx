'use client';

import { useState, useRef } from 'react';
import { Button, Space, message, Card, Row, Col, Switch, Divider, Tag } from 'antd';
import {
  ThunderboltOutlined,
  SyncOutlined,
  PlusOutlined,
  SwapOutlined,
  UndoOutlined,
  CopyOutlined,
  FilterOutlined,
} from '@ant-design/icons';

// ==================== 类型定义 ====================

interface DiffResult {
  stats: { total: number; same: number; modified: number; added: number };
  diff: any;
}

interface LineDiffInfo {
  content: string;
  type: 'added' | 'modified' | 'deleted' | 'same';
}

interface HighlightEditorProps {
  value: string;
  onChange: (value: string) => void;
  diffPaths: Map<string, any>;
  placeholder?: string;
}

// ==================== 常量配置 ====================

const HIGHLIGHT_STYLES = {
  deleted: {
    background: 'linear-gradient(135deg, rgba(255, 77, 79, 0.2) 0%, rgba(255, 77, 79, 0.1) 100%)',
    border: '1px solid rgba(255, 77, 79, 0.3)',
    borderRadius: '3px',
    color: '#c0392b',
    fontWeight: 500,
  },
  added: {
    background: 'linear-gradient(135deg, rgba(82, 196, 26, 0.2) 0%, rgba(82, 196, 26, 0.1) 100%)',
    border: '1px solid rgba(82, 196, 26, 0.3)',
    borderRadius: '3px',
    color: '#27ae60',
    fontWeight: 500,
  },
  modified: {
    background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.2) 0%, rgba(24, 144, 255, 0.1) 100%)',
    border: '1px solid rgba(24, 144, 255, 0.3)',
    borderRadius: '3px',
    color: '#2980b9',
    fontWeight: 500,
  },
};

const EXAMPLES = {
  userInfo: {
    left: { id: 1001, name: '张三', age: 28, email: 'zhangsan@example.com', address: { city: '北京', district: '朝阳区' }, tags: ['前端', 'JavaScript', 'Vue'], isActive: true },
    right: { id: 1001, name: '张三', age: 30, email: 'zhangsan@example.com', address: { city: '上海', district: '浦东新区' }, tags: ['前端', 'JavaScript', 'React'], isActive: true },
  },
  productData: {
    left: { products: [{ id: 'p001', name: '智能手机', price: 4999, inventory: 100, specs: { brand: '小米', model: 'Mi 11' } }] },
    right: { products: [{ id: 'p001', name: '智能手机', price: 5299, inventory: 85, specs: { brand: '小米', model: 'Mi 11 Pro' } }] },
  },
  apiResponse: {
    left: { status: 'success', code: 200, data: { users: [{ id: 1, name: '李明', role: 'admin' }], pagination: { total: 25, page: 1 } } },
    right: { status: 'success', code: 200, data: { users: [{ id: 1, name: '李明', role: 'admin' }], pagination: { total: 28, page: 1 } } },
  },
};

// ==================== 工具函数 ====================

const sortKeysByPinyin = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => sortKeysByPinyin(item));
  const sorted: any = {};
  Object.keys(obj).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')).forEach(key => {
    sorted[key] = sortKeysByPinyin(obj[key]);
  });
  return sorted;
};

const calculateDiff = (left: any, right: any, path = ''): any => {
  const result: any = { nodes: [], stats: { total: 0, same: 0, modified: 0, added: 0 } };
  const allKeys = new Set<string>();
  if (left && typeof left === 'object') Object.keys(left).forEach(k => allKeys.add(k));
  if (right && typeof right === 'object') Object.keys(right).forEach(k => allKeys.add(k));

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const hasLeft = left && key in left;
    const hasRight = right && key in right;
    const leftVal = hasLeft ? left[key] : undefined;
    const rightVal = hasRight ? right[key] : undefined;

    result.stats.total++;
    if (hasLeft && !hasRight) {
      result.nodes.push({ path: currentPath, key, type: 'added', leftValue: leftVal });
      result.stats.added++;
    } else if (!hasLeft && hasRight) {
      result.nodes.push({ path: currentPath, key, type: 'added', rightValue: rightVal });
      result.stats.added++;
    } else if (hasLeft && hasRight) {
      if (typeof leftVal === 'object' && typeof rightVal === 'object') {
        const childDiff = calculateDiff(leftVal, rightVal, currentPath);
        if (childDiff.stats.modified || childDiff.stats.added) {
          result.nodes.push({ path: currentPath, key, type: 'modified', children: childDiff });
          result.stats.modified++;
          result.stats.same += childDiff.stats.same;
          result.stats.modified += childDiff.stats.modified;
          result.stats.added += childDiff.stats.added;
        } else {
          result.stats.same++;
        }
      } else {
        if (leftVal === rightVal) {
          result.stats.same++;
        } else {
          result.nodes.push({ path: currentPath, key, type: 'modified', leftValue: leftVal, rightValue: rightVal });
          result.stats.modified++;
        }
      }
    }
  }
  return result;
};

const filterSameFields = (data: any, compareData: any): any => {
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    if (!Array.isArray(compareData)) return data;
    return data.map((item, i) => JSON.stringify(item) === JSON.stringify(compareData[i]) ? null : filterSameFields(item, compareData[i])).filter(item => item !== null);
  }
  const result: any = {};
  for (const key of Object.keys(data)) {
    if (key in compareData) {
      if (typeof data[key] === 'object') {
        const filtered = filterSameFields(data[key], compareData[key]);
        if (Array.isArray(filtered) ? filtered.length : Object.keys(filtered).length) result[key] = filtered;
      } else if (data[key] !== compareData[key]) {
        result[key] = data[key];
      }
    } else {
      result[key] = data[key];
    }
  }
  return result;
};

const processLines = (text: string, diffPaths: Map<string, any>): LineDiffInfo[] => {
  if (!text) return [];
  const lines = text.split('\n');
  const result: LineDiffInfo[] = [];
  const keyPathStack: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    let type: 'added' | 'modified' | 'deleted' | 'same' = 'same';

    const keyMatch = trimmed.match(/^"([^"]+)":/);
    if (keyMatch) {
      const key = keyMatch[1];
      if (trimmed.includes('{') || trimmed.includes('[')) keyPathStack.push(key);
      const path = keyPathStack.length > 0 ? keyPathStack.join('.') + '.' + key : key;
      for (const [p, t] of diffPaths.entries()) {
        if (p === path || p.endsWith('.' + key)) {
          type = t === 'added' ? 'deleted' : t;
          break;
        }
      }
    }

    if (type === 'same' && !keyMatch && trimmed && !['{', '}', '[', ']'].includes(trimmed)) {
      for (let j = i - 1; j >= 0; j--) {
        if (result[j] && result[j].type !== 'same') { type = result[j].type; break; }
      }
    }
    result.push({ content: line, type });
  }
  return result;
};

// ==================== 编辑器组件 ====================

const HighlightEditor: React.FC<HighlightEditorProps> = ({ value, onChange, diffPaths, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const processedLines = processLines(value, diffPaths);

  return (
    <div ref={editorRef} contentEditable onInput={(e) => onChange(e.currentTarget.innerText)} style={styles.editor}>
      {processedLines.length === 0 ? (
        <div style={styles.placeholder}>{placeholder}</div>
      ) : (
        processedLines.map((line, i) => {
          const hasContent = line.content.trim();
          const leadingSpaces = hasContent ? (line.content.match(/^(\s*)/)?.[1] || '') : '';
          const textContent = hasContent ? line.content.slice(leadingSpaces.length) : '';
          const hlStyle = HIGHLIGHT_STYLES[line.type];
          const isSame = line.type === 'same';
          return (
            <div key={i} style={styles.line}>
              {leadingSpaces && <span style={styles.leadingSpace}>{leadingSpaces}</span>}
              {textContent && (
                <span style={{
                  ...styles.lineContent,
                  background: isSame ? 'transparent' : hlStyle?.background,
                  border: isSame ? 'none' : hlStyle?.border,
                  color: isSame ? '#555' : hlStyle?.color,
                  fontWeight: isSame ? 400 : hlStyle?.fontWeight,
                  boxShadow: isSame ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}>
                  {textContent}
                </span>
              )}
              {!hasContent && <span style={styles.emptyLine}>&nbsp;</span>}
            </div>
          );
        })
      )}
    </div>
  );
};

// ==================== 主页面组件 ====================

export default function JsonDiffV3Page() {
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterSame, setFilterSame] = useState(false);
  const [leftDiffPaths, setLeftDiffPaths] = useState<Map<string, any>>(new Map());
  const [rightDiffPaths, setRightDiffPaths] = useState<Map<string, any>>(new Map());
  const [displayLeft, setDisplayLeft] = useState('');
  const [displayRight, setDisplayRight] = useState('');

  const collectDiffPaths = (diff: any, leftPaths: Map<string, any>, rightPaths: Map<string, any>) => {
    diff.nodes.forEach((node: any) => {
      if (node.type === 'added') {
        if (node.leftValue !== undefined) leftPaths.set(node.path, 'deleted');
        else rightPaths.set(node.path, 'added');
      } else if (node.type === 'modified') {
        leftPaths.set(node.path, 'modified');
        rightPaths.set(node.path, 'modified');
      }
      if (node.children) collectDiffPaths(node.children, leftPaths, rightPaths);
    });
  };

  const handleCompare = () => {
    setLoading(true);
    try {
      const leftData = leftJson.trim() ? JSON.parse(leftJson) : null;
      const rightData = rightJson.trim() ? JSON.parse(rightJson) : null;
      const sortedLeft = sortKeysByPinyin(leftData);
      const sortedRight = sortKeysByPinyin(rightData);
      const compareLeft = filterSame ? filterSameFields(sortedLeft, sortedRight) : sortedLeft;
      const compareRight = filterSame ? filterSameFields(sortedRight, sortedLeft) : sortedRight;

      const result = calculateDiff(compareLeft, compareRight);
      setDiffResult({ stats: result.stats, diff: result.nodes });

      const leftPaths = new Map(), rightPaths = new Map();
      collectDiffPaths(result, leftPaths, rightPaths);
      setLeftDiffPaths(leftPaths);
      setRightDiffPaths(rightPaths);

      setDisplayLeft(JSON.stringify(compareLeft, null, 2));
      setDisplayRight(JSON.stringify(compareRight, null, 2));
      message.success('对比完成');
    } catch (e: any) {
      message.error(`JSON 格式错误：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (type: keyof typeof EXAMPLES) => {
    const ex = EXAMPLES[type];
    setLeftJson(JSON.stringify(ex.left, null, 2));
    setRightJson(JSON.stringify(ex.right, null, 2));
    message.success('已加载示例');
  };

  const handleSwap = () => {
    setLeftJson(rightJson); setRightJson(leftJson);
    setDisplayLeft(displayRight); setDisplayRight(displayLeft);
    setLeftDiffPaths(rightDiffPaths); setRightDiffPaths(leftDiffPaths);
    message.success('已交换');
  };

  const handleClear = () => {
    setLeftJson(''); setRightJson(''); setDisplayLeft(''); setDisplayRight('');
    setDiffResult(null); setLeftDiffPaths(new Map()); setRightDiffPaths(new Map());
    setFilterSame(false);
    message.success('已清空');
  };

  const handleCopyDiff = () => {
    if (!diffResult) { message.warning('请先对比'); return; }
    navigator.clipboard.writeText(JSON.stringify({ timestamp: new Date().toISOString(), stats: diffResult.stats, left: displayLeft || leftJson, right: displayRight || rightJson }, null, 2));
    message.success('已复制');
  };

  const toggleFilter = () => {
    const newFilterState = !filterSame;
    setFilterSame(newFilterState);

    // 切换过滤状态时，如果有数据则重新对比
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

        const leftPaths = new Map(), rightPaths = new Map();
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

  return (
    <div style={styles.pageContainer}>
      {/* 顶部工具栏 - 固定高度 */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <div style={styles.logo}>
            <ThunderboltOutlined style={styles.logoIcon} />
            <span style={styles.logoText}>JSON 对比</span>
          </div>
          <Divider type="vertical" style={{ height: 24 }} />
          <Space size="small">
            <Button type="primary" icon={<SyncOutlined spin={loading} />} onClick={handleCompare} loading={loading} size="small">对比</Button>
            <Button size="small" onClick={() => loadExample('userInfo')}>示例 1</Button>
            <Button size="small" onClick={() => loadExample('productData')}>示例 2</Button>
            <Button size="small" onClick={() => loadExample('apiResponse')}>示例 3</Button>
          </Space>
        </div>
        <div style={styles.toolbarRight}>
          <Space size="small">
            <Button icon={<SwapOutlined />} onClick={handleSwap} size="small">交换</Button>
            <Button icon={<UndoOutlined />} onClick={handleClear} size="small">重置</Button>
            <Button icon={<CopyOutlined />} onClick={handleCopyDiff} disabled={!diffResult} size="small">复制</Button>
            <Divider type="vertical" style={{ height: 16 }} />
            <Space align="center" size={6}>
              <FilterOutlined style={{ fontSize: 14, color: '#666' }} />
              <span style={{ fontSize: 13, color: '#666' }}>过滤相同</span>
              <Switch checked={filterSame} onChange={toggleFilter} size="small" />
            </Space>
          </Space>
        </div>
      </div>

      {/* 主内容区 - 编辑区占据 100% 剩余空间 */}
      <div style={styles.mainContent}>
        <Row gutter={12} style={{ height: '100%' }}>
          <Col span={12}>
            <Card style={styles.editorCard} bodyStyle={{ padding: 0, height: '100%' }}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>📄 原始 JSON</span>
                <Space wrap size={4} style={{ marginLeft: 'auto' }}>
                  <Tag color="#ff4d4f" style={{ margin: 0, fontSize: 11 }}>删除</Tag>
                  <Tag color="#52c41a" style={{ margin: 0, fontSize: 11 }}>新增</Tag>
                  <Tag color="#1890ff" style={{ margin: 0, fontSize: 11 }}>修改</Tag>
                </Space>
              </div>
              <div style={styles.editorWrapper}>
                <HighlightEditor
                  value={displayLeft || leftJson}
                  onChange={setLeftJson}
                  diffPaths={leftDiffPaths}
                  placeholder="请输入或粘贴 JSON 数据..."
                />
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card style={styles.editorCard} bodyStyle={{ padding: 0, height: '100%' }}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>📄 目标 JSON</span>
                <Space wrap size={4} style={{ marginLeft: 'auto' }}>
                  <Tag color="#ff4d4f" style={{ margin: 0, fontSize: 11 }}>删除</Tag>
                  <Tag color="#52c41a" style={{ margin: 0, fontSize: 11 }}>新增</Tag>
                  <Tag color="#1890ff" style={{ margin: 0, fontSize: 11 }}>修改</Tag>
                </Space>
              </div>
              <div style={styles.editorWrapper}>
                <HighlightEditor
                  value={displayRight || rightJson}
                  onChange={setRightJson}
                  diffPaths={rightDiffPaths}
                  placeholder="请输入或粘贴 JSON 数据..."
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

// ==================== 样式定义 ====================

const styles: Record<string, React.CSSProperties> = {
  // 页面容器 - 全屏布局
  pageContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    overflow: 'hidden',
  },

  // 顶部工具栏 - 固定 56px
  toolbar: {
    height: 56,
    minHeight: 56,
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    zIndex: 100,
  },

  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  logoIcon: {
    fontSize: 22,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },

  logoText: {
    fontSize: 18,
    fontWeight: 600,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },

  // 主内容区 - 编辑区占据 100% 剩余空间
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 12,
    gap: 12,
    minHeight: 0,
    overflow: 'hidden',
  },

  // 编辑区 - 可滚动，占据剩余空间
  editorArea: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },

  editorCard: {
    height: '100%',
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(255, 255, 255, 0.98)',
  },

  cardHeader: {
    height: 44,
    minHeight: 44,
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: 8,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
  },

  editorWrapper: {
    flex: 1,
    overflow: 'auto',
    background: '#fff',
  },

  editor: {
    fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, "Courier New", monospace',
    fontSize: 13,
    lineHeight: 1.8,
    padding: '20px 24px',
    minHeight: '100%',
    outline: 'none',
    whiteSpace: 'pre',
    color: '#2c3e50',
    cursor: 'text',
  },

  placeholder: {
    color: '#bbb',
    pointerEvents: 'none',
  },

  line: {
    minHeight: '1.8em',
    lineHeight: 1.8,
    whiteSpace: 'pre',
  },

  leadingSpace: {
    display: 'inline-block',
    fontFamily: '"JetBrains Mono", "Fira Code", Menlo, Monaco, monospace',
  },

  lineContent: {
    padding: '2px 8px',
    borderRadius: '4px',
    display: 'inline-block',
    whiteSpace: 'pre',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },

  emptyLine: {
    display: 'inline-block',
    minWidth: '100%',
  },
};
