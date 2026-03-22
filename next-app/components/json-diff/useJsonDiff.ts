import { useState, useEffect, useCallback, useMemo } from 'react';

import { sortKeysByPinyin, calculateDiff, filterSameFields, collectDiffPaths } from './logic';
import { DiffResult } from './types';

export interface HistoryItem {
  id: string;
  timestamp: number;
  left: string;
  right: string;
  stats: any;
}

export interface UseJsonDiffOptions {
  initialFilterSame?: boolean;
  maxHistory?: number;
}

/**
 * JSON 对比自定义 Hook
 */
export const useJsonDiff = (options: UseJsonDiffOptions = {}) => {
  const { initialFilterSame = false, maxHistory = 10 } = options;

  // 状态
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterSame, setFilterSame] = useState(initialFilterSame);
  const [leftDiffPaths, setLeftDiffPaths] = useState<Map<string, any>>(new Map());
  const [rightDiffPaths, setRightDiffPaths] = useState<Map<string, any>>(new Map());
  const [displayLeft, setDisplayLeft] = useState('');
  const [displayRight, setDisplayRight] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // 派生状态
  const hasContent = useMemo(() => !!(leftJson.trim() || rightJson.trim()), [leftJson, rightJson]);

  // 加载历史记录
  useEffect(() => {
    try {
      const saved = localStorage.getItem('json-diff-history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  // 保存历史记录
  const saveToHistory = useCallback((stats: any) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      left: leftJson,
      right: rightJson,
      stats,
    };
    const newHistory = [newItem, ...history].slice(0, maxHistory);
    setHistory(newHistory);
    localStorage.setItem('json-diff-history', JSON.stringify(newHistory));
  }, [leftJson, rightJson, history, maxHistory]);

  /**
   * 对比 JSON
   */
  const handleCompare = useCallback(() => {
    if (!leftJson.trim() && !rightJson.trim()) return;

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

      if (hasDiff || result.stats.same > 0) saveToHistory(result.stats);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [leftJson, rightJson, filterSame, saveToHistory]);

  /**
   * 切换过滤相同项
   */
  const toggleFilter = useCallback(() => {
    const newFilterState = !filterSame;
    setFilterSame(newFilterState);

    if (leftJson.trim() || rightJson.trim()) {
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
      } catch (e: any) {
        console.error(e);
      }
    }
  }, [leftJson, rightJson, filterSame]);

  /**
   * 清空
   */
  const handleClear = useCallback(() => {
    setLeftJson('');
    setRightJson('');
    setDisplayLeft('');
    setDisplayRight('');
    setDiffResult(null);
    setLeftDiffPaths(new Map());
    setRightDiffPaths(new Map());
    setFilterSame(false);
  }, []);

  /**
   * 交换左右
   */
  const handleSwap = useCallback(() => {
    setLeftJson(rightJson);
    setRightJson(leftJson);
    setDisplayLeft(displayRight);
    setDisplayRight(displayLeft);
    setLeftDiffPaths(rightDiffPaths);
    setRightDiffPaths(leftDiffPaths);
  }, [leftJson, rightJson, displayLeft, displayRight, leftDiffPaths, rightDiffPaths]);

  /**
   * 加载历史记录
   */
  const loadHistory = useCallback((item: HistoryItem) => {
    setLeftJson(item.left);
    setRightJson(item.right);
  }, []);

  /**
   * 清空历史
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('json-diff-history');
  }, []);

  return {
    // 数据
    leftJson,
    rightJson,
    diffResult,
    loading,
    filterSame,
    leftDiffPaths,
    rightDiffPaths,
    displayLeft,
    displayRight,
    history,
    hasContent,
    
    // 设置器
    setLeftJson,
    setRightJson,
    setDisplayLeft,
    setDisplayRight,
    
    // 操作
    handleCompare,
    toggleFilter,
    handleClear,
    handleSwap,
    saveToHistory,
    loadHistory,
    clearHistory,
  };
};
