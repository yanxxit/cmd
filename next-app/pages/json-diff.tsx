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
          // node.type === 'added' 表示该节点在右侧新增（左侧不存在）
          // 所以左侧标记为 'deleted'（删除），右侧标记为 'added'（新增）
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
 * 行差异类型
 */
interface LineDiffInfo {
  content: string;
  type: 'added' | 'modified' | 'deleted' | 'same';
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

// 背景色配置
const LINE_BG_COLORS = {
  added: 'rgba(82, 196, 26, 0.15)',   // 绿色 - 新增（右边有左边没有）
  modified: 'rgba(24, 144, 255, 0.15)', // 蓝色 - 修改
  deleted: 'rgba(255, 77, 79, 0.15)',  // 红色 - 删除（左边有右边没有）
  same: 'transparent',
};

const HighlightEditor: React.FC<HighlightEditorProps> = ({
  value,
  onChange,
  diffPaths,
  placeholder,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // 处理 JSON 内容，标记每一行的差异类型
  const processLines = (text: string): LineDiffInfo[] => {
    if (!text) return [];

    const lines = text.split('\n');
    const result: LineDiffInfo[] = [];
    let currentKeyPath = '';
    let keyPathStack: string[] = [];
    let keyLineMap = new Map<string, number>(); // 记录 key 所在行号

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      let lineType: 'added' | 'modified' | 'deleted' | 'same' = 'same';

      // 尝试从行中提取 key
      const keyMatch = trimmedLine.match(/^"([^"]+)":/);
      if (keyMatch) {
        const key = keyMatch[1];
        // 更新当前路径
        if (trimmedLine.includes('{') || trimmedLine.includes('[')) {
          keyPathStack.push(key);
          currentKeyPath = keyPathStack.join('.');
        } else {
          currentKeyPath = keyPathStack.length > 0
            ? keyPathStack.join('.') + '.' + key
            : key;
        }

        // 记录 key 的路径
        keyLineMap.set(currentKeyPath, i);

        // 检查差异 - 遍历所有差异路径
        for (const [path, type] of diffPaths.entries()) {
          // 完全匹配或路径包含
          if (path === currentKeyPath || path.endsWith('.' + key) || path.endsWith('."' + key + '"')) {
            // diffPaths 中的 type 含义：
            // - 'deleted': 该路径在左侧被删除（左侧有，右边没有）→ 左侧标红
            // - 'added': 该路径在左侧新增（右边有，左边没有）→ 左侧标绿
            // - 'modified': 该路径值不同 → 左侧标蓝
            if (type === 'deleted') {
              lineType = 'deleted'; // 左边有，右边没有 - 标红
            } else if (type === 'added') {
              lineType = 'added'; // 右边有，左边没有 - 标绿
            } else if (type === 'modified') {
              lineType = 'modified'; // 值不同 - 标蓝
            }
            break;
          }
          // 检查是否是父路径
          if (currentKeyPath.startsWith(path + '.') || currentKeyPath.startsWith(path + '[')) {
            if (type === 'deleted') {
              lineType = 'deleted';
            } else if (type === 'modified') {
              lineType = 'modified';
            }
            break;
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
              lineType = 'deleted';
            } else if (type === 'added') {
              lineType = 'added';
            } else if (type === 'modified') {
              lineType = 'modified';
            }
            break;
          }
        }
      }

      // 检查是否是值行（没有 key，只有值）
      // 向上查找最近的 key 行，继承其类型
      if (lineType === 'same' && !keyMatch && !indexMatch && trimmedLine &&
          !['{', '}', '[', ']'].includes(trimmedLine)) {
        for (let j = i - 1; j >= 0; j--) {
          const prevLine = lines[j].trim();
          const prevKeyMatch = prevLine.match(/^"([^"]+)":/);
          if (prevKeyMatch) {
            const prevKey = prevKeyMatch[1];
            // 获取上一行的类型
            if (result[j] && result[j].type !== 'same') {
              lineType = result[j].type;
            }
            break;
          }
          if (['{', '}', '[', ']'].includes(prevLine)) {
            break;
          }
        }
      }

      // 处理括号行和空行 - 根据上下文决定类型
      if (['{', '}', '[', ']'].includes(trimmedLine) || trimmedLine === '') {
        // 查找上下文的类型
        let contextType: 'added' | 'modified' | 'deleted' | 'same' = 'same';
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          const prevLine = lines[j].trim();
          if (prevLine && !['{', '}', '[', ']'].includes(prevLine)) {
            const prevResult = result[j];
            if (prevResult && prevResult.type !== 'same') {
              contextType = prevResult.type;
            }
            break;
          }
        }
        if (contextType !== 'same') {
          lineType = contextType;
        }
      }

      result.push({
        content: line,
        type: lineType,
      });
    }

    return result;
  };

  const processedLines = processLines(value);

  // 生成带高亮的 HTML（用于 pre）
  const generateHighlightedHtml = () => {
    if (!value) return '';
    return processedLines
      .map((lineInfo) => {
        const escapedLine = lineInfo.content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<div>${escapedLine || ' '}</div>`;
      })
      .join('');
  };

  // 生成可编辑的行（用于 contentEditable div）
  const renderEditableLines = () => {
    if (!value) {
      return <div style={{ color: '#999' }}>{placeholder}</div>;
    }

    return processedLines.map((lineInfo, index) => {
      const bgColor = LINE_BG_COLORS[lineInfo.type];
      const hasContent = lineInfo.content && lineInfo.content.trim();
      const leadingSpaces = hasContent ? (lineInfo.content.match(/^(\s*)/)?.[1] || '') : '';
      const textContent = hasContent ? lineInfo.content.slice(leadingSpaces.length) : '';

      return (
        <div
          key={index}
          style={{
            minHeight: '1.2em',
            lineHeight: 1.2,
          }}
        >
          {/* 前导空格 */}
          {leadingSpaces && <span style={{ display: 'inline-block' }}>{leadingSpaces}</span>}
          {/* 文字内容带背景色 */}
          {textContent && (
            <span
              style={{
                backgroundColor: bgColor,
                padding: '0 4px',
                borderRadius: '2px',
                display: 'inline-block',
              }}
            >
              {textContent}
            </span>
          )}
          {/* 空行占位 */}
          {!hasContent && <span style={{ display: 'inline-block', minWidth: '100%' }}>&nbsp;</span>}
        </div>
      );
    });
  };

  // 处理输入变化
  const handleInput = () => {
    if (editorRef.current) {
      const newValue = editorRef.current.innerText;
      onChange(newValue);
    }
  };

  // 自适应高度
  const adjustHeight = () => {
    const editor = editorRef.current;
    const pre = preRef.current;
    if (editor && pre) {
      editor.style.height = 'auto';
      pre.style.height = 'auto';
      const newHeight = Math.max(editor.scrollHeight, 300);
      editor.style.height = `${newHeight}px`;
      pre.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value, processedLines.length]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* 高亮层 - 用于格式显示 */}
      <pre
        ref={preRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          padding: '16px 20px',
          fontFamily: 'Menlo, Monaco, monospace',
          fontSize: 13,
          lineHeight: 1.2,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          pointerEvents: 'none',
          overflow: 'hidden',
          minHeight: '300px',
        }}
        dangerouslySetInnerHTML={{ __html: generateHighlightedHtml() }}
      />
      {/* 可编辑层 */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '300px',
          padding: '16px 20px',
          fontFamily: 'Menlo, Monaco, monospace',
          fontSize: 13,
          lineHeight: 1.2,
          outline: 'none',
          color: 'transparent',
          caretColor: '#333',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflow: 'hidden',
        }}
      >
        {renderEditableLines()}
      </div>
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
