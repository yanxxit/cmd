'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Space, message, Card, Typography, Row, Col, Switch, Divider } from 'antd';
import {
  SyncOutlined,
  PlusOutlined,
  SwapOutlined,
  UndoOutlined,
  ThunderboltOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { SwitchProps } from 'antd';

const { Title, Text } = Typography;

// ==================== 类型定义 ====================

/**
 * 差异节点
 */
interface DiffNode {
  path: string;
  key: string;
  type: 'same' | 'modified' | 'added';
  leftValue: any;
  rightValue: any;
  isContainer: boolean;
  children?: {
    nodes: DiffNode[];
    stats: {
      total: number;
      same: number;
      modified: number;
      added: number;
    };
  };
}

/**
 * 差异结果
 */
interface DiffResult {
  nodes: DiffNode[];
  stats: {
    total: number;
    same: number;
    modified: number;
    added: number;
  };
}

/**
 * 行差异信息
 */
interface LineDiffInfo {
  content: string;
  type: 'added' | 'modified' | 'deleted' | 'same';
}

/**
 * 高亮编辑器组件属性
 */
interface HighlightEditorProps {
  value: string;
  onChange: (value: string) => void;
  diffPaths: Map<string, 'added' | 'modified' | 'deleted'>;
  placeholder?: string;
  readOnly?: boolean;
}

// ==================== 常量配置 ====================

const BG_COLORS = {
  deleted: 'rgba(255, 77, 79, 0.15)',   // 红色 - 删除（左边有右边没有）
  added: 'rgba(82, 196, 26, 0.15)',     // 绿色 - 新增（右边有左边没有）
  modified: 'rgba(24, 144, 255, 0.15)',  // 蓝色 - 修改
  same: 'transparent',
};

const EXAMPLE_DATA = {
  left: {
    name: '张三',
    age: 25,
    email: 'zhangsan@example.com',
    address: {
      city: '北京',
      district: '朝阳区',
      street: '建国路',
    },
    hobbies: ['读书', '游泳', '编程'],
    work: {
      company: '科技公司',
      position: '工程师',
    },
    active: true,
  },
  right: {
    name: '李四',
    age: 25,
    phone: '13800138000',
    address: {
      city: '上海',
      district: '浦东新区',
      road: '世纪大道',
    },
    hobbies: ['音乐', '编程', '旅行'],
    work: {
      company: '互联网公司',
      position: '高级工程师',
      department: '技术部',
    },
    active: true,
    salary: 30000,
  },
};

// ==================== 工具函数 ====================

/**
 * 按拼音排序 Key
 */
const sortKeysByPinyin = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => sortKeysByPinyin(item));

  const sorted: any = {};
  Object.keys(obj)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN', { sensitivity: 'accent' }))
    .forEach(key => {
      sorted[key] = sortKeysByPinyin(obj[key]);
    });
  return sorted;
};

/**
 * 判断是否是容器类型
 */
const isContainer = (val: any): boolean => {
  return val !== null && typeof val === 'object';
};

/**
 * 计算 JSON 差异
 */
const calculateDiff = (left: any, right: any, path = ''): DiffResult => {
  const result: DiffResult = {
    nodes: [],
    stats: { total: 0, same: 0, modified: 0, added: 0 },
  };

  const allKeys = new Set<string>();
  if (left && typeof left === 'object') Object.keys(left).forEach(k => allKeys.add(k));
  if (right && typeof right === 'object') Object.keys(right).forEach(k => allKeys.add(k));

  if ((left && typeof left === 'object') || (right && typeof right === 'object')) {
    if (
      left && right &&
      ((Array.isArray(left) && !Array.isArray(right)) ||
       (!Array.isArray(left) && Array.isArray(right)))
    ) {
      result.nodes.push({
        path, key: '', type: 'modified',
        leftValue: left, rightValue: right, isContainer: false,
      });
      result.stats.total++;
      result.stats.modified++;
      return result;
    }

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const leftVal = left ? left[key] : undefined;
      const rightVal = right ? right[key] : undefined;
      const hasLeft = left && key in left;
      const hasRight = right && key in right;

      if (hasLeft && !hasRight) {
        addNodeWithChildren(result, key, leftVal, null, currentPath, 'added');
        result.stats.added++;
      } else if (!hasLeft && hasRight) {
        addNodeWithChildren(result, key, null, rightVal, currentPath, 'added');
        result.stats.added++;
      } else if (hasLeft && hasRight) {
        if (isContainer(leftVal) || isContainer(rightVal)) {
          if (JSON.stringify(leftVal) === JSON.stringify(rightVal)) {
            addNodeWithChildren(result, key, leftVal, rightVal, currentPath, 'same');
            result.stats.same++;
          } else {
            const childrenDiff = calculateDiff(leftVal, rightVal, currentPath);
            result.nodes.push({
              path: currentPath, key, type: 'modified',
              leftValue: leftVal, rightValue: rightVal,
              isContainer: true, children: childrenDiff,
            });
            result.stats.modified++;
            result.stats.total += childrenDiff.stats.total;
            result.stats.same += childrenDiff.stats.same;
            result.stats.modified += childrenDiff.stats.modified;
            result.stats.added += childrenDiff.stats.added;
          }
        } else {
          if (leftVal === rightVal) {
            result.nodes.push({
              path: currentPath, key, type: 'same',
              leftValue: leftVal, rightValue: rightVal, isContainer: false,
            });
            result.stats.same++;
          } else {
            result.nodes.push({
              path: currentPath, key, type: 'modified',
              leftValue: leftVal, rightValue: rightVal, isContainer: false,
            });
            result.stats.modified++;
          }
        }
      }
      result.stats.total++;
    }
  } else {
    result.stats.total++;
    if (left === right) {
      result.nodes.push({
        path, key: '', type: 'same',
        leftValue: left, rightValue: right, isContainer: false,
      });
      result.stats.same++;
    } else {
      result.nodes.push({
        path, key: '', type: 'modified',
        leftValue: left, rightValue: right, isContainer: false,
      });
      result.stats.modified++;
    }
  }

  return result;
};

/**
 * 添加节点及其子节点
 */
const addNodeWithChildren = (
  result: DiffResult,
  key: string,
  leftVal: any,
  rightVal: any,
  path: string,
  type: 'same' | 'modified' | 'added'
) => {
  if (isContainer(leftVal) || isContainer(rightVal)) {
    const val = leftVal || rightVal;
    const children: DiffResult = {
      nodes: [],
      stats: { total: 0, same: 0, modified: 0, added: 0 },
    };

    if (Array.isArray(val)) {
      val.forEach((item, index) => {
        const childPath = `${path}[${index}]`;
        if (isContainer(item)) {
          addNodeWithChildren(children, index.toString(), item, null, childPath, type);
        } else {
          children.nodes.push({
            path: childPath, key: index.toString(), type,
            leftValue: leftVal ? item : null,
            rightValue: rightVal ? item : null,
            isContainer: false,
          });
          children.stats.total++;
          children.stats[type]++;
        }
      });
    } else if (val && typeof val === 'object') {
      Object.keys(val).forEach(k => {
        const childPath = `${path}.${k}`;
        if (isContainer(val[k])) {
          addNodeWithChildren(
            children, k,
            leftVal ? val[k] : null,
            rightVal ? val[k] : null,
            childPath, type
          );
        } else {
          children.nodes.push({
            path: childPath, key: k, type,
            leftValue: leftVal ? val[k] : null,
            rightValue: rightVal ? val[k] : null,
            isContainer: false,
          });
          children.stats.total++;
          children.stats[type]++;
        }
      });
    }

    result.nodes.push({
      path, key, type,
      leftValue: leftVal, rightValue: rightVal,
      isContainer: true, children,
    });
    result.stats.total += children.stats.total + 1;
    result.stats[type] += children.stats[type] + 1;
  } else {
    result.nodes.push({
      path, key, type,
      leftValue: leftVal, rightValue: rightVal,
      isContainer: false,
    });
    result.stats.total++;
    result.stats[type]++;
  }
};

// ==================== 高亮编辑器组件 ====================

const HighlightEditor: React.FC<HighlightEditorProps> = ({
  value,
  onChange,
  diffPaths,
  placeholder,
  readOnly = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const processedLines = processLines(value, diffPaths);

  // 处理输入变化
  const handleInput = () => {
    if (editorRef.current && !readOnly) {
      onChange(editorRef.current.innerText);
    }
  };

  return (
    <div style={styles.editorContainer}>
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          ...styles.editor,
          caretColor: readOnly ? 'transparent' : '#333',
          pointerEvents: readOnly ? 'none' : 'auto',
        }}
      >
        {processedLines.length === 0 && placeholder ? (
          <div style={styles.placeholder}>{placeholder}</div>
        ) : (
          processedLines.map((lineInfo, index) => (
            <EditorLine key={index} lineInfo={lineInfo} />
          ))
        )}
      </div>
    </div>
  );
};

/**
 * 编辑器行组件
 */
const EditorLine: React.FC<{ lineInfo: LineDiffInfo }> = ({ lineInfo }) => {
  const hasContent = lineInfo.content && lineInfo.content.trim();
  const leadingSpaces = hasContent ? (lineInfo.content.match(/^(\s*)/)?.[1] || '') : '';
  const textContent = hasContent ? lineInfo.content.slice(leadingSpaces.length) : '';
  const bgColor = BG_COLORS[lineInfo.type];

  return (
    <div style={styles.line}>
      {/* 前导空格 - 使用等宽字体保持缩进 */}
      {leadingSpaces && (
        <span style={{ display: 'inline-block', fontFamily: 'Menlo, Monaco, monospace' }}>
          {leadingSpaces}
        </span>
      )}
      {/* 文字内容带背景色 */}
      {textContent && (
        <span style={{ ...styles.lineContent, backgroundColor: bgColor }}>
          {textContent}
        </span>
      )}
      {/* 空行占位 */}
      {!hasContent && <span style={styles.emptyLine}>&nbsp;</span>}
    </div>
  );
};

/**
 * 处理 JSON 行差异
 */
const processLines = (
  text: string,
  diffPaths: Map<string, 'added' | 'modified' | 'deleted'>
): LineDiffInfo[] => {
  if (!text) return [];

  const lines = text.split('\n');
  const result: LineDiffInfo[] = [];
  const keyPathStack: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    let lineType: 'added' | 'modified' | 'deleted' | 'same' = 'same';

    const keyMatch = trimmedLine.match(/^"([^"]+)":/);
    if (keyMatch) {
      const key = keyMatch[1];
      if (trimmedLine.includes('{') || trimmedLine.includes('[')) {
        keyPathStack.push(key);
      }
      const currentPath = keyPathStack.length > 0
        ? keyPathStack.join('.') + '.' + key
        : key;

      for (const [path, type] of diffPaths.entries()) {
        if (path === currentPath || path.endsWith('.' + key) || path.endsWith('."' + key + '"')) {
          lineType = type === 'added' ? 'deleted' : type;
          break;
        }
        if (currentPath.startsWith(path + '.') || currentPath.startsWith(path + '[')) {
          if (type === 'deleted' || type === 'modified') {
            lineType = type;
          }
          break;
        }
      }
    }

    if (lineType === 'same' && !keyMatch && trimmedLine &&
        !['{', '}', '[', ']'].includes(trimmedLine)) {
      for (let j = i - 1; j >= 0; j--) {
        if (result[j] && result[j].type !== 'same') {
          lineType = result[j].type;
          break;
        }
        if (['{', '}', '[', ']'].includes(lines[j].trim())) break;
      }
    }

    if ((['{', '}', '[', ']'].includes(trimmedLine) || trimmedLine === '') && lineType === 'same') {
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        if (result[j] && result[j].type !== 'same') {
          lineType = result[j].type;
          break;
        }
      }
    }

    result.push({ content: line, type: lineType });
  }

  return result;
};

/**
 * 过滤相同的字段，只保留有差异的部分
 */
const filterSameFields = (data: any, compareData: any): any => {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    if (!Array.isArray(compareData)) return data;
    return data
      .map((item, index) => {
        const compareItem = compareData[index];
        if ((typeof item === 'object') !== (typeof compareItem === 'object')) {
          return item;
        }
        if (JSON.stringify(item) === JSON.stringify(compareItem)) {
          return null;
        }
        return filterSameFields(item, compareItem);
      })
      .filter(item => item !== null);
  }

  if (!compareData || typeof compareData !== 'object') return data;

  const result: any = {};
  for (const key of Object.keys(data)) {
    const value = data[key];
    const compareValue = compareData[key];
    const hasCompare = key in compareData;

    if (hasCompare) {
      if (typeof value === 'object' && typeof compareValue === 'object') {
        const filtered = filterSameFields(value, compareValue);
        if (Array.isArray(filtered)) {
          if (filtered.length > 0) result[key] = filtered;
        } else if (filtered !== null && Object.keys(filtered).length > 0) {
          result[key] = filtered;
        }
      } else if (value !== compareValue) {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
};

// ==================== 主页面组件 ====================

export default function JsonDiffV2Page() {
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hideSame, setHideSame] = useState(false);
  const [leftDiffPaths, setLeftDiffPaths] = useState<Map<string, 'added' | 'modified' | 'deleted'>>(new Map());
  const [rightDiffPaths, setRightDiffPaths] = useState<Map<string, 'added' | 'modified' | 'deleted'>>(new Map());
  const [displayLeftJson, setDisplayLeftJson] = useState('');
  const [displayRightJson, setDisplayRightJson] = useState('');

  /**
   * 计算行级差异
   */
  const calculateLineDiffs = (diff: DiffResult, leftData: any, rightData: any) => {
    const leftPaths = new Map<string, 'added' | 'modified' | 'deleted'>();
    const rightPaths = new Map<string, 'added' | 'modified' | 'deleted'>();

    const collectPaths = (nodes: DiffNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'added') {
          leftPaths.set(node.path, 'deleted');
          rightPaths.set(node.path, 'added');
        } else if (node.type === 'modified') {
          leftPaths.set(node.path, 'modified');
          rightPaths.set(node.path, 'modified');
        }
        if (node.children) {
          collectPaths(node.children.nodes);
        }
      });
    };
    collectPaths(diff.nodes);

    setLeftDiffPaths(leftPaths);
    setRightDiffPaths(rightPaths);
  };

  /**
   * 复制差异部分
   */
  const handleCopyDiff = () => {
    if (!diffResult) {
      message.warning('请先进行对比');
      return;
    }

    // 提取差异数据
    const extractDiffData = (nodes: DiffNode[]): any => {
      const result: any = {};

      const processNodes = (nodeList: DiffNode[], parent: any) => {
        nodeList.forEach(node => {
          if (node.type !== 'same') {
            const key = node.key || node.path.split('.').pop() || node.path;
            const path = node.path;

            if (node.type === 'added') {
              parent[path] = {
                _action: node.leftValue !== undefined ? 'deleted' : 'added',
                _path: path,
              };
              if (node.leftValue !== undefined) {
                parent[path]._leftValue = node.leftValue;
              }
              if (node.rightValue !== undefined) {
                parent[path]._rightValue = node.rightValue;
              }
            } else if (node.type === 'modified') {
              parent[path] = {
                _action: 'modified',
                _path: path,
                _leftValue: node.leftValue,
                _rightValue: node.rightValue,
              };
            }

            if (node.children && node.children.nodes.length > 0) {
              parent[path]._children = {};
              processNodes(node.children.nodes, parent[path]._children);
            }
          }
        });
      };

      processNodes(nodes, result);
      return result;
    };

    const diffData = {
      timestamp: new Date().toISOString(),
      stats: diffResult.stats,
      diff: extractDiffData(diffResult.nodes),
      left: displayLeftJson || leftJson,
      right: displayRightJson || rightJson,
    };

    const text = JSON.stringify(diffData, null, 2);

    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制差异数据到剪贴板');
    }).catch(() => {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      message.success('已复制差异数据到剪贴板');
    });
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

      const result = calculateDiff(sortedLeft, sortedRight);
      setDiffResult(result);
      calculateLineDiffs(result, sortedLeft, sortedRight);

      // 根据 hideSame 状态设置显示的数据
      if (hideSame) {
        const filteredLeft = filterSameFields(sortedLeft, sortedRight);
        const filteredRight = filterSameFields(sortedRight, sortedLeft);
        setDisplayLeftJson(JSON.stringify(filteredLeft, null, 2));
        setDisplayRightJson(JSON.stringify(filteredRight, null, 2));
      } else {
        setDisplayLeftJson(JSON.stringify(sortedLeft, null, 2));
        setDisplayRightJson(JSON.stringify(sortedRight, null, 2));
      }

      message.success('对比完成');
    } catch (e: any) {
      message.error(`JSON 格式错误：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载示例
   */
  const handleLoadExample = () => {
    setLeftJson(JSON.stringify(EXAMPLE_DATA.left, null, 2));
    setRightJson(JSON.stringify(EXAMPLE_DATA.right, null, 2));
    message.success('已加载示例数据');
  };

  /**
   * 交换左右
   */
  const handleSwap = () => {
    setLeftJson(rightJson);
    setRightJson(leftJson);
    setDisplayLeftJson(displayRightJson);
    setDisplayRightJson(displayLeftJson);
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
    setDisplayLeftJson('');
    setDisplayRightJson('');
    setDiffResult(null);
    setLeftDiffPaths(new Map());
    setRightDiffPaths(new Map());
    setHideSame(false);
    message.success('已清空');
  };

  /**
   * 格式化 JSON
   */
  const handleFormat = (side: 'left' | 'right') => {
    const json = side === 'left' ? leftJson : rightJson;
    try {
      const sorted = sortKeysByPinyin(JSON.parse(json));
      if (side === 'left') {
        setLeftJson(JSON.stringify(sorted, null, 2));
      } else {
        setRightJson(JSON.stringify(sorted, null, 2));
      }
      message.success('已格式化并排序');
    } catch (e: any) {
      message.error(`JSON 格式错误：${e.message}`);
    }
  };

  /**
   * 切换隐藏相同项
   */
  const handleToggleHideSame: SwitchProps['onChange'] = (checked) => {
    setHideSame(checked);

    // 重新计算显示的数据
    if (leftJson && rightJson) {
      try {
        const leftData = JSON.parse(leftJson);
        const rightData = JSON.parse(rightJson);
        const sortedLeft = sortKeysByPinyin(leftData);
        const sortedRight = sortKeysByPinyin(rightData);

        if (checked) {
          const filteredLeft = filterSameFields(sortedLeft, sortedRight);
          const filteredRight = filterSameFields(sortedRight, sortedLeft);
          setDisplayLeftJson(JSON.stringify(filteredLeft, null, 2));
          setDisplayRightJson(JSON.stringify(filteredRight, null, 2));
        } else {
          setDisplayLeftJson(JSON.stringify(sortedLeft, null, 2));
          setDisplayRightJson(JSON.stringify(sortedRight, null, 2));
        }

        // 重新计算差异路径
        if (diffResult) {
          calculateLineDiffs(diffResult,
            checked ? filterSameFields(sortedLeft, sortedRight) : sortedLeft,
            checked ? filterSameFields(sortedRight, sortedLeft) : sortedRight
          );
        }
      } catch (e) {
        // ignore
      }
    }

    message.success(checked ? '已隐藏相同部分' : '已显示完整数据');
  };

  return (
    <div style={styles.container}>
      {/* 头部 */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.title}>
            <ThunderboltOutlined style={styles.titleIcon} />
            <span style={styles.titleText}>JSON 对比工具 V2</span>
          </div>
          <Space size="small">
            <Button
              type="primary"
              icon={<SyncOutlined spin={loading} />}
              onClick={handleCompare}
              loading={loading}
              size="large"
            >
              对比
            </Button>
            <Button icon={<PlusOutlined />} onClick={handleLoadExample} size="large">
              示例
            </Button>
            <Button icon={<SwapOutlined />} onClick={handleSwap} size="large">
              交换
            </Button>
            <Button icon={<UndoOutlined />} onClick={handleClear} size="large">
              重置
            </Button>
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopyDiff}
              size="large"
              disabled={!diffResult}
            >
              复制差异
            </Button>
            <Divider type="vertical" style={{ height: 24, margin: '0 8px' }} />
            <Space align="center">
              <Text>隐藏相同</Text>
              <Switch
                checked={hideSame}
                onChange={handleToggleHideSame}
                size="small"
                checkedChildren="开"
                unCheckedChildren="关"
              />
            </Space>
          </Space>
        </div>
        <Text type="secondary" style={styles.description}>
          快速对比两个 JSON 数据的差异，支持实时高亮显示
        </Text>
      </div>

      {/* 输入区域 */}
      <Row gutter={[16, 16]} style={styles.inputRow}>
        <Col xs={24} lg={12}>
          <Card
            title="📄 原始 JSON"
            extra={
              <Button size="small" onClick={() => handleFormat('left')}>
                ✨ 格式化
              </Button>
            }
            style={styles.card}
          >
            <HighlightEditor
              value={displayLeftJson || leftJson}
              onChange={setLeftJson}
              diffPaths={leftDiffPaths}
              placeholder="请输入或粘贴 JSON 数据..."
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="📄 目标 JSON"
            extra={
              <Button size="small" onClick={() => handleFormat('right')}>
                ✨ 格式化
              </Button>
            }
            style={styles.card}
          >
            <HighlightEditor
              value={displayRightJson || rightJson}
              onChange={setRightJson}
              diffPaths={rightDiffPaths}
              placeholder="请输入或粘贴 JSON 数据..."
            />
          </Card>
        </Col>
      </Row>

      {/* 统计信息 */}
      {diffResult && (
        <Card style={styles.statsCard}>
          <Row gutter={[16, 16]}>
            <Col xs={6} sm={6} md={6}>
              <div style={styles.statItem}>
                <div style={{ ...styles.statValue, color: '#1890ff' }}>{diffResult.stats.total}</div>
                <div style={styles.statLabel}>总节点</div>
              </div>
            </Col>
            <Col xs={6} sm={6} md={6}>
              <div style={styles.statItem}>
                <div style={{ ...styles.statValue, color: '#52c41a' }}>{diffResult.stats.same}</div>
                <div style={styles.statLabel}>相同</div>
              </div>
            </Col>
            <Col xs={6} sm={6} md={6}>
              <div style={styles.statItem}>
                <div style={{ ...styles.statValue, color: '#1890ff' }}>{diffResult.stats.modified}</div>
                <div style={styles.statLabel}>修改</div>
              </div>
            </Col>
            <Col xs={6} sm={6} md={6}>
              <div style={styles.statItem}>
                <div style={{ ...styles.statValue, color: '#ff4d4f' }}>{diffResult.stats.added}</div>
                <div style={styles.statLabel}>差异</div>
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
}

// ==================== 样式定义 ====================

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1600,
    margin: '0 auto',
    padding: '24px 20px',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: '20px 28px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    backdropFilter: 'blur(10px)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 24,
    fontWeight: 600,
  },
  titleIcon: {
    fontSize: 28,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  titleText: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  description: {
    fontSize: 14,
  },
  inputRow: {
    flex: 1,
  },
  card: {
    height: '100%',
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },
  editorContainer: {
    position: 'relative',
    width: '100%',
  },
  editor: {
    fontFamily: 'Menlo, Monaco, monospace',
    fontSize: 13,
    lineHeight: 1.5,
    minHeight: '400px',
    maxHeight: 'calc(100vh - 300px)',
    overflow: 'auto',
    outline: 'none',
    whiteSpace: 'pre',
    tabSize: 2,
  },
  placeholder: {
    color: '#999',
    pointerEvents: 'none',
  },
  line: {
    minHeight: '1.5em',
    lineHeight: 1.5,
    whiteSpace: 'pre',
  },
  lineContent: {
    padding: '0 4px',
    borderRadius: 2,
    display: 'inline-block',
    whiteSpace: 'pre',
  },
  emptyLine: {
    display: 'inline-block',
    minWidth: '100%',
  },
  statsCard: {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    background: 'rgba(255, 255, 255, 0.95)',
  },
  statItem: {
    textAlign: 'center',
    padding: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
};
