/**
 * 基础功能测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Database } from '../src/index.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DB_PATH = join(process.cwd(), 'test-data', 'test-db');

describe('Database', () => {
  let db;
  
  beforeAll(async () => {
    // 清理测试数据
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
  });
  
  afterAll(async () => {
    // 清理测试数据
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
  });
  
  it('应该创建并打开数据库', async () => {
    db = new Database(TEST_DB_PATH);
    await db.open();
    expect(db).toBeDefined();
  });
  
  it('应该获取集合', () => {
    const users = db.collection('users');
    expect(users).toBeDefined();
    expect(users.name).toBe('users');
  });
  
  it('应该创建集合', async () => {
    const posts = await db.createCollection('posts');
    expect(posts).toBeDefined();
    
    const collections = await db.listCollections();
    expect(collections).toContain('posts');
  });
  
  it('应该删除集合', async () => {
    await db.createCollection('temp');
    const result = await db.dropCollection('temp');
    expect(result.acknowledged).toBe(true);
    
    const collections = await db.listCollections();
    expect(collections).not.toContain('temp');
  });
  
  it('应该获取统计信息', async () => {
    const stats = await db.stats();
    expect(stats).toHaveProperty('db');
    expect(stats).toHaveProperty('collections');
  });
  
  it('应该关闭数据库', async () => {
    await db.close();
    expect(db._meta).toBeNull();
  });
});

describe('Collection - CRUD', () => {
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
  
  it('应该插入单个文档', async () => {
    const user = await users.insertOne({
      name: 'Alice',
      age: 25,
      email: 'alice@example.com'
    });
    
    expect(user).toHaveProperty('_id');
    expect(user.name).toBe('Alice');
    expect(user).toHaveProperty('createdAt');
  });
  
  it('应该插入多个文档', async () => {
    const result = await users.insertMany([
      { name: 'Bob', age: 30, email: 'bob@example.com' },
      { name: 'Charlie', age: 28, email: 'charlie@example.com' },
      { name: 'David', age: 35, email: 'david@example.com' }
    ]);
    
    expect(result.acknowledged).toBe(true);
    expect(result.insertedCount).toBe(3);
    expect(result.insertedIds).toHaveProperty('0');
  });
  
  it('应该查询所有文档', async () => {
    const allUsers = await users.find().toArray();
    expect(allUsers.length).toBe(4);
  });
  
  it('应该查询单个文档', async () => {
    const user = await users.findOne({ name: 'Alice' });
    expect(user).toBeDefined();
    expect(user.name).toBe('Alice');
  });
  
  it('应该条件查询', async () => {
    const youngUsers = await users.find({ age: { $lt: 30 } }).toArray();
    expect(youngUsers.length).toBe(2);
  });
  
  it('应该更新文档', async () => {
    const result = await users.updateOne(
      { name: 'Alice' },
      { $set: { age: 26 } }
    );
    
    expect(result.matchedCount).toBe(1);
    expect(result.modifiedCount).toBe(1);
    
    const updatedUser = await users.findOne({ name: 'Alice' });
    expect(updatedUser.age).toBe(26);
  });
  
  it('应该更新多个文档', async () => {
    const result = await users.updateMany(
      {},
      { $set: { status: 'active' } }
    );
    
    expect(result.modifiedCount).toBeGreaterThanOrEqual(1);
  });
  
  it('应该删除文档', async () => {
    const result = await users.deleteOne({ name: 'David' });
    expect(result.deletedCount).toBe(1);
    
    const allUsers = await users.find().toArray();
    expect(allUsers.length).toBe(3);
  });
  
  it('应该计数文档', async () => {
    const count = await users.countDocuments();
    expect(count).toBe(3);
  });
  
  it('应该排序查询', async () => {
    const sortedUsers = await users.find().sort({ age: 1 }).toArray();
    expect(sortedUsers[0].age).toBeLessThanOrEqual(sortedUsers[1].age);
  });
  
  it('应该限制查询数量', async () => {
    const limitedUsers = await users.find().limit(2).toArray();
    expect(limitedUsers.length).toBe(2);
  });
  
  it('应该投影字段', async () => {
    const projectedUsers = await users.find().project({ name: 1, _id: 0 }).toArray();
    expect(projectedUsers[0]).toHaveProperty('name');
    expect(projectedUsers[0]).not.toHaveProperty('age');
  });
});

describe('Query Operators', () => {
  let db;
  let products;
  
  beforeAll(async () => {
    db = new Database(TEST_DB_PATH);
    await db.open();
    products = db.collection('products');
    
    await products.insertMany([
      { name: 'Laptop', price: 1000, stock: 50, category: 'electronics' },
      { name: 'Mouse', price: 25, stock: 100, category: 'electronics' },
      { name: 'Desk', price: 300, stock: 20, category: 'furniture' },
      { name: 'Chair', price: 150, stock: 30, category: 'furniture' }
    ]);
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  it('应该使用 $eq 操作符', async () => {
    const result = await products.find({ category: { $eq: 'electronics' } }).toArray();
    expect(result.length).toBe(2);
  });
  
  it('应该使用 $ne 操作符', async () => {
    const result = await products.find({ category: { $ne: 'electronics' } }).toArray();
    expect(result.length).toBe(2);
  });
  
  it('应该使用 $gt 和 $lt 操作符', async () => {
    const result = await products.find({
      price: { $gt: 100, $lt: 500 }
    }).toArray();
    expect(result.length).toBe(2);
  });
  
  it('应该使用 $in 操作符', async () => {
    const result = await products.find({
      category: { $in: ['electronics', 'furniture'] }
    }).toArray();
    expect(result.length).toBe(4);
  });
  
  it('应该使用 $and 操作符', async () => {
    const result = await products.find({
      $and: [
        { price: { $gte: 100 } },
        { stock: { $lte: 50 } }
      ]
    }).toArray();
    expect(result.length).toBe(3); // Laptop(1000, 50), Desk(300, 20), Chair(150, 30)
  });
  
  it('应该使用 $or 操作符', async () => {
    const result = await products.find({
      $or: [
        { price: { $lt: 100 } },
        { stock: { $gt: 90 } }
      ]
    }).toArray();
    expect(result.length).toBe(1); // Mouse(25, 100)
  });
});

describe('Aggregation', () => {
  let db;
  let orders;
  
  beforeAll(async () => {
    db = new Database(TEST_DB_PATH);
    await db.open();
    orders = db.collection('orders');
    
    await orders.insertMany([
      { item: 'A', amount: 100, quantity: 2 },
      { item: 'B', amount: 50, quantity: 5 },
      { item: 'A', amount: 100, quantity: 3 },
      { item: 'C', amount: 25, quantity: 10 }
    ]);
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  it('应该使用 $match 阶段', async () => {
    const result = await orders.aggregate([
      { $match: { item: 'A' } }
    ]);
    expect(result.length).toBe(2);
  });
  
  it('应该使用 $group 阶段', async () => {
    const result = await orders.aggregate([
      { $group: { _id: '$item', total: { $sum: '$amount' } } }
    ]);
    
    const itemA = result.find(r => r._id === 'A');
    expect(itemA.total).toBe(200);
  });
  
  it('应该使用 $sort 和 $limit 阶段', async () => {
    const result = await orders.aggregate([
      { $sort: { amount: -1 } },
      { $limit: 2 }
    ]);
    
    expect(result.length).toBe(2);
    expect(result[0].amount).toBe(100);
  });
  
  it('应该使用 $count 阶段', async () => {
    const result = await orders.aggregate([
      { $count: 'total' }
    ]);
    
    expect(result[0].total).toBe(4);
  });
});

describe('Async Iterator', () => {
  let db;
  let items;
  
  beforeAll(async () => {
    db = new Database(TEST_DB_PATH);
    await db.open();
    items = db.collection('items');
    
    await items.insertMany([
      { name: 'Item 1', value: 10 },
      { name: 'Item 2', value: 20 },
      { name: 'Item 3', value: 30 }
    ]);
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  it('应该支持 for await...of 循环', async () => {
    const results = [];
    for await (const item of items.find().limit(2)) {
      results.push(item.name);
    }
    expect(results).toEqual(['Item 1', 'Item 2']);
  });
  
  it('应该支持 async forEach', async () => {
    const results = [];
    await items.find().forEach(item => {
      results.push(item.value);
    });
    expect(results).toEqual([10, 20, 30]);
  });
  
  it('应该支持 async next()', async () => {
    const cursor = items.find().limit(2);
    const first = await cursor.next();
    const second = await cursor.next();
    const third = await cursor.next();
    
    expect(first.name).toBe('Item 1');
    expect(second.name).toBe('Item 2');
    expect(third).toBeNull();
  });
});
