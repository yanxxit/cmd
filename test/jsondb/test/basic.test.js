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
  
  beforeAll(() => {
    // 清理测试数据
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
  });
  
  afterAll(() => {
    // 清理测试数据
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
  });
  
  it('应该创建并打开数据库', () => {
    db = new Database(TEST_DB_PATH);
    db.open();
    expect(db).toBeDefined();
  });
  
  it('应该获取集合', () => {
    const users = db.collection('users');
    expect(users).toBeDefined();
    expect(users.name).toBe('users');
  });
  
  it('应该创建集合', () => {
    const posts = db.createCollection('posts');
    expect(posts).toBeDefined();
    
    const collections = db.listCollections();
    expect(collections).toContain('posts');
  });
  
  it('应该删除集合', () => {
    db.createCollection('temp');
    const result = db.dropCollection('temp');
    expect(result.acknowledged).toBe(true);
    
    const collections = db.listCollections();
    expect(collections).not.toContain('temp');
  });
  
  it('应该获取统计信息', () => {
    const stats = db.stats();
    expect(stats).toHaveProperty('db');
    expect(stats).toHaveProperty('collections');
  });
  
  it('应该关闭数据库', () => {
    db.close();
    expect(db._meta).toBeNull();
  });
});

describe('Collection - CRUD', () => {
  let db;
  let users;
  
  beforeAll(() => {
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
    
    db = new Database(TEST_DB_PATH);
    db.open();
    users = db.collection('users');
  });
  
  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
  });
  
  it('应该插入单个文档', () => {
    const user = users.insertOne({
      name: 'Alice',
      age: 25,
      email: 'alice@example.com'
    });
    
    expect(user).toHaveProperty('_id');
    expect(user.name).toBe('Alice');
    expect(user).toHaveProperty('createdAt');
  });
  
  it('应该插入多个文档', () => {
    const result = users.insertMany([
      { name: 'Bob', age: 30, email: 'bob@example.com' },
      { name: 'Charlie', age: 28, email: 'charlie@example.com' },
      { name: 'David', age: 35, email: 'david@example.com' }
    ]);
    
    expect(result.acknowledged).toBe(true);
    expect(result.insertedCount).toBe(3);
    expect(result.insertedIds).toHaveProperty('0');
  });
  
  it('应该查询所有文档', () => {
    const allUsers = users.find().toArray();
    expect(allUsers.length).toBe(4);
  });
  
  it('应该查询单个文档', () => {
    const user = users.findOne({ name: 'Alice' });
    expect(user).toBeDefined();
    expect(user.name).toBe('Alice');
  });
  
  it('应该条件查询', () => {
    const youngUsers = users.find({ age: { $lt: 30 } }).toArray();
    expect(youngUsers.length).toBe(2);
  });
  
  it('应该更新文档', () => {
    const result = users.updateOne(
      { name: 'Alice' },
      { $set: { age: 26 } }
    );
    
    expect(result.matchedCount).toBe(1);
    expect(result.modifiedCount).toBe(1);
    
    const updatedUser = users.findOne({ name: 'Alice' });
    expect(updatedUser.age).toBe(26);
  });
  
  it('应该更新多个文档', () => {
    const result = users.updateMany(
      {},
      { $set: { status: 'active' } }
    );
    
    expect(result.modifiedCount).toBeGreaterThanOrEqual(1);
  });
  
  it('应该删除文档', () => {
    const result = users.deleteOne({ name: 'David' });
    expect(result.deletedCount).toBe(1);
    
    const allUsers = users.find().toArray();
    expect(allUsers.length).toBe(3);
  });
  
  it('应该计数文档', () => {
    const count = users.countDocuments();
    expect(count).toBe(3);
  });
  
  it('应该排序查询', () => {
    const sortedUsers = users.find().sort({ age: 1 }).toArray();
    expect(sortedUsers[0].age).toBeLessThanOrEqual(sortedUsers[1].age);
  });
  
  it('应该限制查询数量', () => {
    const limitedUsers = users.find().limit(2).toArray();
    expect(limitedUsers.length).toBe(2);
  });
  
  it('应该投影字段', () => {
    const projectedUsers = users.find().project({ name: 1, _id: 0 }).toArray();
    expect(projectedUsers[0]).toHaveProperty('name');
    expect(projectedUsers[0]).not.toHaveProperty('age');
  });
});

describe('Query Operators', () => {
  let db;
  let products;
  
  beforeAll(() => {
    db = new Database(TEST_DB_PATH);
    db.open();
    products = db.collection('products');
    
    products.insertMany([
      { name: 'Laptop', price: 1000, stock: 50, category: 'electronics' },
      { name: 'Mouse', price: 25, stock: 100, category: 'electronics' },
      { name: 'Desk', price: 300, stock: 20, category: 'furniture' },
      { name: 'Chair', price: 150, stock: 30, category: 'furniture' }
    ]);
  });
  
  afterAll(() => {
    db.close();
  });
  
  it('应该使用 $eq 操作符', () => {
    const result = products.find({ category: { $eq: 'electronics' } }).toArray();
    expect(result.length).toBe(2);
  });
  
  it('应该使用 $ne 操作符', () => {
    const result = products.find({ category: { $ne: 'electronics' } }).toArray();
    expect(result.length).toBe(2);
  });
  
  it('应该使用 $gt 和 $lt 操作符', () => {
    const result = products.find({
      price: { $gt: 100, $lt: 500 }
    }).toArray();
    expect(result.length).toBe(2);
  });
  
  it('应该使用 $in 操作符', () => {
    const result = products.find({
      category: { $in: ['electronics', 'furniture'] }
    }).toArray();
    expect(result.length).toBe(4);
  });
  
  it('应该使用 $and 操作符', () => {
    const result = products.find({
      $and: [
        { price: { $gte: 100 } },
        { stock: { $lte: 50 } }
      ]
    }).toArray();
    expect(result.length).toBe(3); // Laptop(1000, 50), Desk(300, 20), Chair(150, 30)
  });
  
  it('应该使用 $or 操作符', () => {
    const result = products.find({
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
  
  beforeAll(() => {
    db = new Database(TEST_DB_PATH);
    db.open();
    orders = db.collection('orders');
    
    orders.insertMany([
      { item: 'A', amount: 100, quantity: 2 },
      { item: 'B', amount: 50, quantity: 5 },
      { item: 'A', amount: 100, quantity: 3 },
      { item: 'C', amount: 25, quantity: 10 }
    ]);
  });
  
  afterAll(() => {
    db.close();
  });
  
  it('应该使用 $match 阶段', () => {
    const result = orders.aggregate([
      { $match: { item: 'A' } }
    ]);
    expect(result.length).toBe(2);
  });
  
  it('应该使用 $group 阶段', () => {
    const result = orders.aggregate([
      { $group: { _id: '$item', total: { $sum: '$amount' } } }
    ]);
    
    const itemA = result.find(r => r._id === 'A');
    expect(itemA.total).toBe(200);
  });
  
  it('应该使用 $sort 和 $limit 阶段', () => {
    const result = orders.aggregate([
      { $sort: { amount: -1 } },
      { $limit: 2 }
    ]);
    
    expect(result.length).toBe(2);
    expect(result[0].amount).toBe(100);
  });
  
  it('应该使用 $count 阶段', () => {
    const result = orders.aggregate([
      { $count: 'total' }
    ]);
    
    expect(result[0].total).toBe(4);
  });
});
