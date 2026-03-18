/**
 * 优化功能测试
 * 测试批量操作、查询缓存、事务功能
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Database, createBulkOp, createTransaction, withTransaction, QueryCache } from '../src/index.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DB_PATH = join(process.cwd(), 'test-data', 'test-optimization-db');

describe('BulkOperation 批量操作', () => {
  let db;
  let users;
  
  beforeAll(async () => {
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
    
    db = new Database(TEST_DB_PATH);
    await db.open();
    users = db.collection('users');
  });
  
  afterAll(async () => {
    await db.close();
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
  });
  
  it('应该支持批量插入', async () => {
    const bulkOp = createBulkOp(users);
    const result = await bulkOp
      .insert([
        { name: 'User 1', age: 20 },
        { name: 'User 2', age: 25 },
        { name: 'User 3', age: 30 }
      ])
      .execute();
    
    expect(result.insertedCount).toBe(3);
    expect(result.insertedIds).toHaveLength(3);
  });
  
  it('应该支持批量更新', async () => {
    const bulkOp = createBulkOp(users);
    const result = await bulkOp
      .update({ age: { $gte: 25 } }, { $set: { status: 'active' } })
      .execute();
    
    expect(result.updatedCount).toBeGreaterThanOrEqual(2);
  });
  
  it('应该支持批量删除', async () => {
    const bulkOp = createBulkOp(users);
    const result = await bulkOp
      .delete({ age: { $lt: 25 } })
      .execute();
    
    expect(result.deletedCount).toBeGreaterThanOrEqual(1);
  });
  
  it('应该支持链式批量操作', async () => {
    const bulkOp = createBulkOp(users);
    const result = await bulkOp
      .insert([{ name: 'User 4', age: 35 }])
      .update({ name: 'User 4' }, { $set: { age: 36 } })
      .execute();
    
    expect(result.insertedCount).toBe(1);
    expect(result.updatedCount).toBe(1);
  });
});

describe('QueryCache 查询缓存', () => {
  let cache;
  
  beforeAll(() => {
    cache = new QueryCache({ maxSize: 100, ttl: 5000 });
  });
  
  it('应该能设置和获取缓存', () => {
    const key = cache.generateKey('users', { age: 25 });
    cache.set(key, [{ name: 'Alice' }]);
    
    const result = cache.get(key);
    expect(result).toEqual([{ name: 'Alice' }]);
  });
  
  it('应该能生成不同的缓存键', () => {
    const key1 = cache.generateKey('users', { age: 25 });
    const key2 = cache.generateKey('users', { age: 30 });
    const key3 = cache.generateKey('users', { age: 25 }, { limit: 10 });
    
    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
  });
  
  it('应该能获取缓存统计', () => {
    const stats = cache.getStats();
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('hitRate');
  });
  
  it('应该能清空缓存', () => {
    cache.clear();
    const stats = cache.getStats();
    expect(stats.size).toBe(0);
    expect(stats.hits).toBe(0);
  });
  
  it('应该支持缓存过期', async () => {
    const shortTtlCache = new QueryCache({ ttl: 100 });
    const key = shortTtlCache.generateKey('test', { id: 1 });
    shortTtlCache.set(key, { data: 'test' });
    
    expect(shortTtlCache.get(key)).toEqual({ data: 'test' });
    
    // 等待过期
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(shortTtlCache.get(key)).toBeNull();
  });
});

describe('Transaction 事务', () => {
  let db;
  let users;
  let orders;
  
  beforeAll(async () => {
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
    
    db = new Database(TEST_DB_PATH);
    await db.open();
    users = db.collection('users');
    orders = db.collection('orders');
  });
  
  afterAll(async () => {
    await db.close();
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
  });
  
  it('应该支持事务提交', async () => {
    const tx = createTransaction([users, orders]);
    
    const result = await tx
      .insert(users, { name: 'Tx User 1', email: 'tx1@test.com' })
      .insert(orders, { userId: 1, amount: 100 })
      .commit();
    
    expect(result.success).toBe(true);
  });
  
  it('应该支持事务回滚', async () => {
    const tx = createTransaction([users]);
    
    await tx
      .insert(users, { name: 'Tx User 2', email: 'tx2@test.com' })
      .commit();
    
    // 验证已提交
    const count = await users.countDocuments({ email: 'tx2@test.com' });
    expect(count).toBe(1);
  });
  
  it('应该支持 withTransaction 快捷方式', async () => {
    const result = await withTransaction([orders], async (tx) => {
      tx.insert(orders, { userId: 2, amount: 200 });
      tx.insert(orders, { userId: 3, amount: 300 });
    });
    
    expect(result.success).toBe(true);
  });
  
  it('应该能获取事务状态', () => {
    const tx = createTransaction([users]);
    expect(tx.getStatus()).toBe('active');
  });
  
  it('应该支持多集合事务', async () => {
    const initialUserCount = await users.countDocuments();
    const initialOrderCount = await orders.countDocuments();
    
    const tx = createTransaction([users, orders]);
    await tx
      .insert(users, { name: 'Multi User', email: 'multi@test.com' })
      .insert(orders, { userId: 999, amount: 999 })
      .commit();
    
    expect(await users.countDocuments()).toBe(initialUserCount + 1);
    expect(await orders.countDocuments()).toBe(initialOrderCount + 1);
  });
});

describe('性能对比', () => {
  let db;
  let perfUsers;
  
  beforeAll(async () => {
    db = new Database(TEST_DB_PATH + '-perf');
    await db.open();
    perfUsers = db.collection('perfUsers');
  });
  
  afterAll(async () => {
    await db.close();
    if (existsSync(TEST_DB_PATH + '-perf')) {
      rmSync(TEST_DB_PATH + '-perf', { recursive: true, force: true });
    }
  });
  
  it('批量插入应该比单条插入快', async () => {
    const count = 100;
    
    // 单条插入
    const singleStart = Date.now();
    for (let i = 0; i < count; i++) {
      await perfUsers.insertOne({ name: `Single ${i}`, type: 'single' });
    }
    const singleTime = Date.now() - singleStart;
    
    // 批量插入
    const bulkData = [];
    for (let i = 0; i < count; i++) {
      bulkData.push({ name: `Bulk ${i}`, type: 'bulk' });
    }
    
    const bulkStart = Date.now();
    await perfUsers.insertMany(bulkData);
    const bulkTime = Date.now() - bulkStart;
    
    // 批量插入应该更快
    expect(bulkTime).toBeLessThan(singleTime);
    console.log(`单条插入：${singleTime}ms, 批量插入：${bulkTime}ms, 提升：${(singleTime/bulkTime).toFixed(2)}x`);
  });
});
