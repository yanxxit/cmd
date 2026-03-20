'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Button,
  Space,
  message,
  Card,
  Typography,
  Row,
  Col,
  Switch,
} from 'antd';
import {
  SyncOutlined,
  PlusOutlined,
  SwapOutlined,
  UndoOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

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

interface DiffResult {
  nodes: DiffNode[];
  stats: {
    total: number;
    same: number;
    modified: number;
    added: number;
  };
}

interface LineDiff {
  lineNumber: number;
  type: 'added' | 'modified' | 'same' | 'deleted';
  path: string;
}

export default function JsonDiffPage() {
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hideSame, setHideSame] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [leftLineDiffs, setLeftLineDiffs] = useState<LineDiff[]>([]);
  const [rightLineDiffs, setRightLineDiffs] = useState<LineDiff[]>([]);

  /**
   * 按拼音排序 Key
   */
  const sortKeysByPinyin = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => sortKeysByPinyin(item));
    }

    const sorted: any = {};
    const keys = Object.keys(obj).sort((a, b) => {
      return a.localeCompare(b, 'zh-Hans-CN', { sensitivity: 'accent' });
    });

    for (const key of keys) {
      sorted[key] = sortKeysByPinyin(obj[key]);
    }

    return sorted;
  };

  /**
   * 过滤相同的字段，只保留有差异的部分
   */
  const filterSameFields = (data: any, compareData: any): any => {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      if (!Array.isArray(compareData)) {
        return data;
      }

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

    if (!compareData || typeof compareData !== 'object') {
      return data;
    }

    const result: any = {};
    for (const key of Object.keys(data)) {
      const value = data[key];
      const compareValue = compareData[key];
      const hasCompare = key in compareData;

      if (hasCompare) {
        if (typeof value === 'object' && typeof compareValue === 'object') {
          const filtered = filterSameFields(value, compareValue);
          if (Array.isArray(filtered)) {
            if (filtered.length > 0) {
              result[key] = filtered;
            }
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

  /**
   * 格式化 JSON
   */
  const formatJson = (json: string): string => {
    const data = JSON.parse(json);
    const sorted = sortKeysByPinyin(data);
    return JSON.stringify(sorted, null, 2);
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
      stats: {
        total: 0,
        same: 0,
        modified: 0,
        added: 0,
      },
    };

    const allKeys = new Set<string>();
    if (left && typeof left === 'object') {
      Object.keys(left).forEach(k => allKeys.add(k));
    }
    if (right && typeof right === 'object') {
      Object.keys(right).forEach(k => allKeys.add(k));
    }

    if ((left && typeof left === 'object') || (right && typeof right === 'object')) {
      if (
        left &&
        right &&
        ((Array.isArray(left) && !Array.isArray(right)) ||
          (!Array.isArray(left) && Array.isArray(right)))
      ) {
        result.nodes.push({
          path,
          key: '',
          type: 'modified',
          leftValue: left,
          rightValue: right,
          isContainer: false,
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
                path: currentPath,
                key,
                type: 'modified',
                leftValue: leftVal,
                rightValue: rightVal,
                isContainer: true,
                children: childrenDiff,
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
                path: currentPath,
                key,
                type: 'same',
                leftValue: leftVal,
                rightValue: rightVal,
                isContainer: false,
              });
              result.stats.same++;
            } else {
              result.nodes.push({
                path: currentPath,
                key,
                type: 'modified',
                leftValue: leftVal,
                rightValue: rightVal,
                isContainer: false,
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
          path,
          key: '',
          type: 'same',
          leftValue: left,
          rightValue: right,
          isContainer: false,
        });
        result.stats.same++;
      } else {
        result.nodes.push({
          path,
          key: '',
          type: 'modified',
          leftValue: left,
          rightValue: right,
          isContainer: false,
        });
        result.stats.modified++;
      }
    }

    return result;
  };

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
              path: childPath,
              key: index.toString(),
              type,
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
              children,
              k,
              leftVal ? val[k] : null,
              rightVal ? val[k] : null,
              childPath,
              type
            );
          } else {
            children.nodes.push({
              path: childPath,
              key: k,
              type,
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
        path,
        key,
        type,
        leftValue: leftVal,
        rightValue: rightVal,
        isContainer: true,
        children,
      });
      result.stats.total += children.stats.total + 1;
      result.stats[type] += children.stats[type] + 1;
    } else {
      result.nodes.push({
        path,
        key,
        type,
        leftValue: leftVal,
        rightValue: rightVal,
        isContainer: false,
      });
      result.stats.total++;
      result.stats[type]++;
    }
  };

  /**
   * 查找差异节点
   */
  const findDiffNode = (nodes: DiffNode[], path: string): DiffNode | null => {
    if (!nodes) return null;
    for (const node of nodes) {
      if (node.path === path) {
        return node;
      }
      if (node.children) {
        const found = findDiffNode(node.children.nodes, path);
        if (found) return found;
      }
    }
    return null;
  };

  /**
   * HTML 转义
   */
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  /**
   * 渲染值
   */
  const renderValue = (value: any, diffNode: DiffNode | null, side: 'left' | 'right'): JSX.Element => {
    const diffType = diffNode ? diffNode.type : 'same';
    let valueHtml: JSX.Element;

    if (typeof value === 'string') {
      valueHtml = <span className="json-string">"{escapeHtml(value)}"</span>;
    } else if (typeof value === 'number') {
      valueHtml = <span className="json-number">{value}</span>;
    } else if (typeof value === 'boolean') {
      valueHtml = <span className="json-boolean">{String(value)}</span>;
    } else if (value === null) {
      valueHtml = <span className="json-null">null</span>;
    } else {
      valueHtml = <span>{String(value)}</span>;
    }

    if (diffType === 'modified' && diffNode) {
      const leftVal = diffNode.leftValue;
      const rightVal = diffNode.rightValue;

      if (side === 'left' && leftVal !== undefined && typeof leftVal !== 'object') {
        valueHtml = <span className="json-string">"{escapeHtml(String(leftVal))}"</span>;
      } else if (side === 'right' && rightVal !== undefined && typeof rightVal !== 'object') {
        valueHtml = <span className="json-string">"{escapeHtml(String(rightVal))}"</span>;
      }
    }

    return valueHtml;
  };

  /**
   * 渲染 JSON 树
   */
  const renderJsonTree = (
    data: any,
    diff: DiffResult,
    side: 'left' | 'right',
    path = '',
    indent = 0,
    expandedPaths?: Set<string>
  ): JSX.Element => {
    if (data === null || data === undefined) {
      return <span className="json-null">null</span>;
    }

    if (typeof data !== 'object') {
      return renderValue(data, findDiffNode(diff.nodes, path), side);
    }

    if (Array.isArray(data)) {
      return renderArray(data, diff, side, path, indent, expandedPaths);
    }

    return renderObject(data, diff, side, path, indent, expandedPaths);
  };

  /**
   * 渲染对象
   */
  const renderObject = (
    obj: any,
    diff: DiffResult,
    side: 'left' | 'right',
    path: string,
    indent: number,
    expandedPaths?: Set<string>
  ): JSX.Element => {
    if (Object.keys(obj).length === 0) {
      return <span>{'{}'}</span>;
    }

    const keys = Object.keys(obj);
    const isExpanded = expandedPaths?.has(path) ?? true; // 默认展开

    return (
      <div className="json-object">
        <div className="node-header" style={{ display: 'flex', alignItems: 'flex-start' }}>
          <span
            className="node-toggle"
            onClick={() => toggleNode(path)}
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              width: 16,
              textAlign: 'center',
              color: '#666',
              fontSize: 10,
              marginRight: 4,
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="json-brace">{'{'}</span>
        </div>
        {isExpanded && (
          <div className="node-children" style={{ paddingLeft: 20 }}>
            {keys.map((key, index) => {
              const currentPath = path ? `${path}.${key}` : key;
              const value = obj[key];
              const isLast = index === keys.length - 1;
              const comma = isLast ? '' : ',';

              const diffNode = findDiffNode(diff.nodes, currentPath);
              const diffType = diffNode ? diffNode.type : 'same';

              const containerClass =
                diffType === 'added'
                  ? 'json-diff-added'
                  : diffType === 'modified'
                  ? 'json-diff-modified'
                  : 'json-diff-same';

              return (
                <div key={currentPath} className={`node-row ${containerClass}`}>
                  <span className="line-number" style={{ color: '#999', marginRight: 8, userSelect: 'none' }}>
                    {indent + 1}
                  </span>
                  <span className="json-key" style={{ color: '#881391', fontWeight: 600 }}>
                    "{key}"
                  </span>
                  :{' '}
                  {typeof value === 'object' && value !== null ? (
                    <>
                      {Array.isArray(value) ? (
                        <span>
                          [{Object.keys(value).length} 项]
                          <div>{renderJsonTree(value, diff, side, currentPath, indent + 1, expandedPaths)}</div>
                          ]
                        </span>
                      ) : (
                        <span>
                          {'{'}
                          {Object.keys(value).length} 属性
                          <div>{renderJsonTree(value, diff, side, currentPath, indent + 1, expandedPaths)}</div>
                          {'}'}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {renderValue(value, diffNode, side)}
                      {comma}
                      {diffType === 'added' && (
                        <span className="diff-indicator" style={{ color: '#f44336', marginLeft: 8 }}>
                          🗑️
                        </span>
                      )}
                      {diffType === 'modified' && (
                        <span className="diff-indicator" style={{ color: '#2196f3', marginLeft: 8 }}>
                          ⚠️
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="node-footer" style={{ paddingLeft: isExpanded ? 0 : 36 }}>
          {'}'}
        </div>
      </div>
    );
  };

  /**
   * 渲染数组
   */
  const renderArray = (
    arr: any[],
    diff: DiffResult,
    side: 'left' | 'right',
    path: string,
    indent: number,
    expandedPaths?: Set<string>
  ): JSX.Element => {
    if (arr.length === 0) {
      return <span>[]</span>;
    }

    const isExpanded = expandedPaths?.has(path) ?? true; // 默认展开

    return (
      <div className="json-array">
        <div className="node-header" style={{ display: 'flex', alignItems: 'flex-start' }}>
          <span
            className="node-toggle"
            onClick={() => toggleNode(path)}
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              width: 16,
              textAlign: 'center',
              color: '#666',
              fontSize: 10,
              marginRight: 4,
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="json-brace">[</span>
        </div>
        {isExpanded && (
          <div className="node-children" style={{ paddingLeft: 20 }}>
            {arr.map((item, index) => {
              const currentPath = `${path}[${index}]`;
              const isLast = index === arr.length - 1;
              const comma = isLast ? '' : ',';

              const diffNode = findDiffNode(diff.nodes, currentPath);
              const diffType = diffNode ? diffNode.type : 'same';

              const containerClass =
                diffType === 'added'
                  ? 'json-diff-added'
                  : diffType === 'modified'
                  ? 'json-diff-modified'
                  : 'json-diff-same';

              return (
                <div key={currentPath} className={`node-row ${containerClass}`}>
                  <span className="line-number" style={{ color: '#999', marginRight: 8, userSelect: 'none' }}>
                    {indent + 1}
                  </span>
                  <span style={{ color: '#666' }}>[{index}]</span>{' '}
                  {renderJsonTree(item, diff, side, currentPath, indent + 1, expandedPaths)}
                  {comma}
                  {diffType === 'added' && (
                    <span className="diff-indicator" style={{ color: '#f44336', marginLeft: 8 }}>
                      🗑️
                    </span>
                  )}
                  {diffType === 'modified' && (
                    <span className="diff-indicator" style={{ color: '#2196f3', marginLeft: 8 }}>
                      ⚠️
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="node-footer" style={{ paddingLeft: isExpanded ? 0 : 36 }}>]</div>
      </div>
    );
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

      // 如果启用了隐藏相同项，使用过滤后的数据进行对比
      let compareLeft = sortedLeft;
      let compareRight = sortedRight;

      if (hideSame) {
        compareLeft = filterSameFields(sortedLeft, sortedRight);
        compareRight = filterSameFields(sortedRight, sortedLeft);
      }

      const result = calculateDiff(compareLeft, compareRight);
      setDiffResult(result);

      // 计算行级差异
      calculateLineDiffs(result, compareLeft, compareRight);

      message.success('对比完成');
    } catch (e: any) {
      message.error(`JSON 格式错误：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 清空
   */
  const handleClear = () => {
    setLeftJson('');
    setRightJson('');
    setDiffResult(null);
    setHideSame(false);
    message.success('已清空');
  };

  /**
   * 交换左右
   */
  const handleSwap = () => {
    setLeftJson(rightJson);
    setRightJson(leftJson);
    message.success('已交换左右');
  };

  /**
   * 加载示例
   */
  const handleLoadExample = () => {
    const left = {
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
    };

    const right = {
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
    };

    // 加载示例时先格式化
    setLeftJson(formatJson(JSON.stringify(left)));
    setRightJson(formatJson(JSON.stringify(right)));
    message.success('已加载示例数据');
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
  const handleToggleHideSame = () => {
    const newHideSame = !hideSame;
    setHideSame(newHideSame);

    if (leftJson && rightJson) {
      try {
        const leftData = JSON.parse(leftJson);
        const rightData = JSON.parse(rightJson);
        const sortedLeft = sortKeysByPinyin(leftData);
        const sortedRight = sortKeysByPinyin(rightData);

        if (newHideSame) {
          // 隐藏相同项，过滤后显示
          const filteredLeft = filterSameFields(sortedLeft, sortedRight);
          const filteredRight = filterSameFields(sortedRight, sortedLeft);
          const filteredLeftStr = JSON.stringify(filteredLeft, null, 2);
          const filteredRightStr = JSON.stringify(filteredRight, null, 2);
          setLeftJson(filteredLeftStr);
          setRightJson(filteredRightStr);

          // 重新计算差异
          const result = calculateDiff(filteredLeft, filteredRight);
          setDiffResult(result);

          message.success('已隐藏相同部分');
        } else {
          // 显示完整数据
          const fullLeftStr = JSON.stringify(sortedLeft, null, 2);
          const fullRightStr = JSON.stringify(sortedRight, null, 2);
          setLeftJson(fullLeftStr);
          setRightJson(fullRightStr);

          // 重新计算差异
          const result = calculateDiff(sortedLeft, sortedRight);
          setDiffResult(result);

          message.success('已显示完整数据');
        }
      } catch (e: any) {
        message.error('格式化失败');
      }
    }
  };

  /**
   * 处理粘贴事件 - 自动格式化
   */
  const handlePaste = (side: 'left' | 'right', value: string) => {
    try {
      const sorted = sortKeysByPinyin(JSON.parse(value));
      const formatted = JSON.stringify(sorted, null, 2);
      if (side === 'left') {
        setLeftJson(formatted);
      } else {
        setRightJson(formatted);
      }
    } catch (e) {
      // 不是有效 JSON，保持原样
      if (side === 'left') {
        setLeftJson(value);
      } else {
        setRightJson(value);
      }
    }
  };

  /**
   * 计算行级差异信息
   */
  const calculateLineDiffs = (diff: DiffResult, leftData: any, rightData: any) => {
    const leftPaths = new Map<string, 'added' | 'modified' | 'deleted'>();
    const rightPaths = new Map<string, 'added' | 'modified' | 'deleted'>();

    // 收集所有差异路径
    const collectPaths = (nodes: DiffNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'added') {
          leftPaths.set(node.path, 'deleted'); // 左边删除
          rightPaths.set(node.path, 'added'); // 右边新增
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

    setLeftLineDiffs(Array.from(leftPaths.entries()).map(([path, type]) => ({
      lineNumber: 0,
      type,
      path,
    })));
    setRightLineDiffs(Array.from(rightPaths.entries()).map(([path, type]) => ({
      lineNumber: 0,
      type,
      path,
    })));
  };

  /**
   * 切换节点展开/收起状态
   */
  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  /**
   * 展开全部节点
   */
  const expandAll = () => {
    if (!diffResult) return;
    const allPaths = new Set<string>();
    const collectPaths = (nodes: DiffNode[], parentPath = '') => {
      nodes.forEach(node => {
        if (node.isContainer) {
          allPaths.add(node.path);
          if (node.children) {
            collectPaths(node.children.nodes, node.path);
          }
        }
      });
    };
    collectPaths(diffResult.nodes);
    setExpandedPaths(allPaths);
    message.success('已展开全部');
  };

  /**
   * 收起全部节点
   */
  const collapseAll = () => {
    setExpandedPaths(new Set());
    message.success('已收起全部');
  };

  return (
    <div style={styles.container}>
      {/* 头部区域 - 简洁设计 */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerTitle}>
            <span style={styles.headerIcon}>🔀</span>
            <span style={styles.headerText}>JSON 对比工具</span>
          </div>
          <div style={styles.headerActions}>
            <Space size="small">
              <Button type="primary" icon={<SyncOutlined />} onClick={handleCompare} loading={loading} size="small">
                对比
              </Button>
              <Button icon={<PlusOutlined />} onClick={handleLoadExample} size="small">
                示例
              </Button>
              <Button icon={<SwapOutlined />} onClick={handleSwap} size="small">
                交换
              </Button>
              <Button icon={<UndoOutlined />} onClick={handleClear} size="small">
                重置
              </Button>
              <div style={styles.switchWrapper}>
                <span style={styles.switchLabel}>隐藏相同项</span>
                <Switch checked={hideSame} onChange={handleToggleHideSame} size="small" checkedChildren="开" unCheckedChildren="关" />
              </div>
            </Space>
          </div>
        </div>
        <p style={styles.headerDesc}>快速对比两个 JSON 数据的差异，支持实时高亮显示</p>
      </div>

      {/* 输入区域 */}
      <Row gutter={[24, 24]} style={{ flex: 1, minHeight: 'calc(100vh - 180px)' }}>
        <Col xs={24} lg={12}>
          <Card style={{ ...styles.inputCard, height: '100%' }} bodyStyle={{ padding: 0, height: '100%' }}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>📄 原始 JSON</span>
              <Button type="text" size="small" onClick={() => handleFormat('left')}>
                ✨ 格式化
              </Button>
            </div>
            <div style={{ ...styles.inputWrapper, height: 'calc(100% - 50px)' }}>
              <HighlightEditor
                value={leftJson}
                onChange={setLeftJson}
                diffPaths={new Map(leftLineDiffs.map(d => [d.path, d.type] as [string, 'added' | 'modified' | 'deleted']))}
                placeholder="请输入或粘贴 JSON 数据..."
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ ...styles.inputCard, height: '100%' }} bodyStyle={{ padding: 0, height: '100%' }}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>📄 目标 JSON</span>
              <Button type="text" size="small" onClick={() => handleFormat('right')}>
                ✨ 格式化
              </Button>
            </div>
            <div style={{ ...styles.inputWrapper, height: 'calc(100% - 50px)' }}>
              <HighlightEditor
                value={rightJson}
                onChange={setRightJson}
                diffPaths={new Map(rightLineDiffs.map(d => [d.path, d.type] as [string, 'added' | 'modified' | 'deleted']))}
                placeholder="请输入或粘贴 JSON 数据..."
              />
            </div>
          </Card>
        </Col>
      </Row>

      <style jsx global>{`
        .json-string {
          color: #c41a16;
        }
        .json-number {
          color: #1c00cf;
        }
        .json-boolean {
          color: #0c3a8c;
        }
        .json-null {
          color: #0c3a8c;
        }
        .json-key {
          color: #881391;
          font-weight: 600;
        }
        .json-diff-added {
          background: rgba(244, 67, 54, 0.15);
          border-left: 3px solid #f44336;
          padding: 2px 6px;
          border-radius: 2px;
          margin: 2px 0;
        }
        .json-diff-modified {
          background: rgba(33, 150, 243, 0.15);
          border-left: 3px solid #2196f3;
          padding: 2px 6px;
          border-radius: 2px;
          margin: 2px 0;
        }
        .json-diff-same {
          opacity: 0.85;
        }
        .node-row {
          line-height: 1.8;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }
        .output-wrapper {
          background: #fafafa;
          border: 1px solid #e8e8e8;
          border-radius: 6px;
          padding: 12px;
          max-height: 500px;
          overflow: auto;
        }
      `}</style>
    </div>
  );
}

/**
 * 高亮编辑器组件 - 支持行背景色高亮，宽高自适应
 */
interface HighlightEditorProps {
  value: string;
  onChange: (value: string) => void;
  diffPaths: Map<string, 'added' | 'modified' | 'deleted'>;
  placeholder?: string;
}

const HighlightEditor: React.FC<HighlightEditorProps> = ({
  value,
  onChange,
  diffPaths,
  placeholder,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理滚动同步
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const st = e.currentTarget.scrollTop;
    if (preRef.current) {
      preRef.current.scrollTop = st;
    }
  };

  // 自适应高度
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    const pre = preRef.current;
    if (textarea && pre) {
      // 重置高度以获取正确的 scrollHeight
      textarea.style.height = 'auto';
      pre.style.height = 'auto';

      // 设置自适应高度（最小 300px）
      const newHeight = Math.max(textarea.scrollHeight, 300);
      textarea.style.height = `${newHeight}px`;
      pre.style.height = `${newHeight}px`;
    }
  };

  // 内容变化时调整高度
  useEffect(() => {
    adjustHeight();
  }, [value]);

  // 获取行的背景色
  const getLineBackground = (lineIndex: number, lines: string[]): string => {
    const line = lines[lineIndex];
    const trimmedLine = line.trim();

    // 尝试从行中提取 key
    const keyMatch = trimmedLine.match(/^"([^"]+)":/);
    if (keyMatch) {
      const key = keyMatch[1];
      for (const [path, type] of diffPaths.entries()) {
        const pathParts = path.split('.');
        const lastPart = pathParts[pathParts.length - 1].replace(/\[\d+\]/g, '');
        if (lastPart === key || path.endsWith(key)) {
          if (type === 'deleted') {
            return 'rgba(255, 77, 79, 0.12)';
          } else if (type === 'added') {
            return 'rgba(82, 196, 26, 0.12)';
          } else if (type === 'modified') {
            return 'rgba(24, 144, 255, 0.12)';
          }
        }
      }
    }

    // 检查数组索引
    const indexMatch = trimmedLine.match(/^\[(\d+)\]/);
    if (indexMatch) {
      const index = indexMatch[1];
      for (const [path, type] of diffPaths.entries()) {
        if (path.includes(`[${index}]`)) {
          if (type === 'deleted') {
            return 'rgba(255, 77, 79, 0.12)';
          } else if (type === 'added') {
            return 'rgba(82, 196, 26, 0.12)';
          } else if (type === 'modified') {
            return 'rgba(24, 144, 255, 0.12)';
          }
        }
      }
    }

    // 检查是否是值行（没有 key，只有值）
    // 向上查找最近的 key 行，继承其背景色
    for (let i = lineIndex - 1; i >= 0; i--) {
      const prevLine = lines[i].trim();
      const prevKeyMatch = prevLine.match(/^"([^"]+)":/);
      if (prevKeyMatch) {
        const prevKey = prevKeyMatch[1];
        for (const [path, type] of diffPaths.entries()) {
          const pathParts = path.split('.');
          const lastPart = pathParts[pathParts.length - 1].replace(/\[\d+\]/g, '');
          if (lastPart === prevKey || path.endsWith(prevKey)) {
            if (type === 'deleted') {
              return 'rgba(255, 77, 79, 0.12)';
            } else if (type === 'added') {
              return 'rgba(82, 196, 26, 0.12)';
            } else if (type === 'modified') {
              return 'rgba(24, 144, 255, 0.12)';
            }
          }
        }
        break;
      }
      // 如果遇到空行或括号行，停止查找
      if (prevLine === '' || prevLine === '{' || prevLine === '}' || prevLine === '[' || prevLine === ']') {
        break;
      }
    }

    return 'transparent';
  };

  // 生成带高亮的 HTML
  const generateHighlightedHtml = () => {
    if (!value) return '';
    const lines = value.split('\n');
    return lines
      .map((line, index) => {
        const bg = getLineBackground(index, lines);
        const escapedLine = line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<div style="background-color: ${bg}; line-height: 1.2; padding: 1px 0;">${escapedLine || ' '}</div>`;
      })
      .join('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <pre
        ref={preRef}
        style={{
          position: 'relative',
          margin: 0,
          padding: '16px 20px',
          fontFamily: 'Menlo, Monaco, monospace',
          fontSize: 13,
          lineHeight: 1.2,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          pointerEvents: 'none',
          overflow: 'visible',
          minHeight: '300px',
        }}
        dangerouslySetInnerHTML={{ __html: generateHighlightedHtml() }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setTimeout(adjustHeight, 0);
        }}
        onScroll={handleScroll}
        placeholder={placeholder}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          minHeight: '300px',
          padding: '16px 20px',
          fontFamily: 'Menlo, Monaco, monospace',
          fontSize: 13,
          lineHeight: 1.2,
          border: 'none',
          resize: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          color: 'transparent',
          caretColor: '#333',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflow: 'hidden',
        }}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1600,
    margin: '0 auto',
    padding: '24px 20px',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column',
  },
  // 头部区域
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    backdropFilter: 'blur(10px)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 24,
    fontWeight: 600,
    color: '#1a1a1a',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  switchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    marginLeft: 8,
    borderLeft: '1px solid #e8e8e8',
  },
  headerIcon: {
    fontSize: 28,
  },
  headerText: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  headerDesc: {
    margin: 0,
    color: '#666',
    fontSize: 14,
  },
  // 输入卡片
  inputCard: {
    borderRadius: 0,
    boxShadow: 'none',
    overflow: 'hidden',
    background: 'transparent',
    border: 'none',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    background: '#fafafa',
    borderBottom: '1px solid #f0f0f0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#333',
  },
  inputWrapper: {
    background: '#fff',
    flex: 1,
    minHeight: 'calc(100vh - 200px)',
  },
};
