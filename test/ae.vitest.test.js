/**
 * AE 云函数调试工具单元测试
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateCacheKey } from '../src/ae/cache.js';
import { 
  addHistoryRecord, 
  getHistoryRecords, 
  getHistoryRecordById, 
  updateHistoryRecord, 
  addTags, 
  deleteHistoryRecord, 
  getStats 
} from '../src/ae/history.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('缓存管理模块测试', () => {
  it('应该能够生成一致的缓存键', () => {
    const params = { key: 'value' };
    const key1 = generateCacheKey('testFunction', params);
    const key2 = generateCacheKey('testFunction', params);
    
    expect(key1).toBe(key2);
    expect(key1).toContain('testFunction');
  });

  it('不同参数应该生成不同的缓存键', () => {
    const key1 = generateCacheKey('testFunction', { key: 'value1' });
    const key2 = generateCacheKey('testFunction', { key: 'value2' });
    
    expect(key1).not.toBe(key2);
  });

  it('不同函数名称应该生成不同的缓存键', () => {
    const key1 = generateCacheKey('function1', { key: 'value' });
    const key2 = generateCacheKey('function2', { key: 'value' });
    
    expect(key1).not.toBe(key2);
  });
});

describe('历史记录管理模块测试', () => {
  let testRecordId;

  it('应该能够添加历史记录', async () => {
    const record = await addHistoryRecord({
      functionName: 'test_function',
      params: { key: 'value' },
      result: { status: 'ok' },
      duration: 100,
      status: 'success',
      title: '测试记录'
    });

    expect(record).toBeDefined();
    expect(record.id).toBeDefined();
    expect(record.functionName).toBe('test_function');
    expect(record.status).toBe('success');
    
    testRecordId = record.id;
  });

  it('应该能够获取历史记录', async () => {
    const record = await getHistoryRecordById(testRecordId);
    
    expect(record).toBeDefined();
    expect(record.id).toBe(testRecordId);
    expect(record.functionName).toBe('test_function');
  });

  it('应该能够获取历史记录列表', async () => {
    const records = await getHistoryRecords({ limit: 10 });
    
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBeGreaterThan(0);
  });

  it('应该能够按函数名称过滤', async () => {
    const records = await getHistoryRecords({ 
      functionName: 'test_function',
      limit: 10 
    });
    
    expect(records.length).toBeGreaterThan(0);
    records.forEach(r => {
      expect(r.functionName).toBe('test_function');
    });
  });

  it('应该能够更新记录标题', async () => {
    const updated = await updateHistoryRecord(testRecordId, {
      title: '新标题'
    });

    expect(updated).toBeDefined();
    expect(updated.title).toBe('新标题');
  });

  it('应该能够添加标签', async () => {
    const updated = await addTags(testRecordId, ['test', 'development']);

    expect(updated).toBeDefined();
    expect(updated.tags).toContain('test');
    expect(updated.tags).toContain('development');
  });

  it('应该能够删除记录', async () => {
    const success = await deleteHistoryRecord(testRecordId);
    expect(success).toBe(true);

    const record = await getHistoryRecordById(testRecordId);
    expect(record).toBeNull();
  });

  it('获取不存在的记录应该返回 null', async () => {
    const record = await getHistoryRecordById('non_existent_id');
    expect(record).toBeNull();
  });
});

describe('统计功能测试', () => {
  it('应该能够获取统计信息', async () => {
    // 添加一些测试数据
    await addHistoryRecord({
      functionName: 'func1',
      params: {},
      result: {},
      duration: 100,
      status: 'success',
      tags: ['tag1']
    });

    await addHistoryRecord({
      functionName: 'func2',
      params: {},
      result: {},
      duration: 200,
      status: 'failed',
      tags: ['tag2']
    });

    const stats = await getStats();

    expect(stats).toBeDefined();
    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(stats.successCount).toBeGreaterThanOrEqual(1);
    expect(stats.failCount).toBeGreaterThanOrEqual(1);
    expect(stats.avgDuration).toBeGreaterThan(0);
    expect(Object.keys(stats.functionNameCount).length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(stats.tagCount).length).toBeGreaterThanOrEqual(2);
  });
});
