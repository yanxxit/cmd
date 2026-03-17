/**
 * 索引性能测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Database } from '../src/index.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DB_PATH = join(process.cwd(), 'test-data', 'test-index-db');

describe('Index Performance', () => {
  let db;
  let users;
  
  beforeAll(async () => {
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
    
    db = new Database(TEST_DB_PATH);
    await db.open();
    users = db.collection('users');
    
    // 插入大量测试数据
    const testData = [];
    for (let i = 0; i < 1000; i++) {
      testData.push({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        age: 20 + (i % 50),
        department: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'][i % 5],
        salary: 5000 + (i * 10)
      });
    }
    
    await users.insertMany(testData);
  });
  
  afterAll(async () => {
    await db.close();
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
  });
  
  it('应该创建索引', async () => {
    const index = await users.createIndex({ department: 1 });
    expect(index.name).toBe('department_1');
    
    const indexes = await users.listIndexes();
    expect(indexes).toHaveLength(1);
  });
  
  it('应该使用索引优化查询', async () => {
    // 不使用索引
    const startTime1 = Date.now();
    const result1 = await users.find({ department: 'Engineering' }).noIndex().toArray();
    const time1 = Date.now() - startTime1;
    
    // 使用索引（默认）
    const startTime2 = Date.now();
    const result2 = await users.find({ department: 'Engineering' }).toArray();
    const time2 = Date.now() - startTime2;
    
    expect(result1.length).toBe(result2.length);
    expect(result1.length).toBe(200); // 1000 / 5 = 200
    
    console.log(`无索引查询时间：${time1}ms, 有索引查询时间：${time2}ms`);
  });
  
  it('应该支持 hint 指定索引', async () => {
    const result = await users.find({ department: 'Sales' }).hint('department_1').toArray();
    expect(result.length).toBe(200);
  });
  
  it('应该支持 $in 操作符索引查询', async () => {
    const result = await users.find({
      department: { $in: ['Engineering', 'Sales'] }
    }).toArray();
    
    expect(result.length).toBe(400);
  });
  
  it('应该支持 $eq 操作符索引查询', async () => {
    const result = await users.find({
      department: { $eq: 'HR' }
    }).toArray();
    
    expect(result.length).toBe(200);
  });
  
  it('应该对嵌套字段创建索引', async () => {
    const orders = db.collection('orders');
    
    await orders.insertMany([
      { customer: { id: 1, name: 'Alice' }, amount: 100 },
      { customer: { id: 2, name: 'Bob' }, amount: 200 },
      { customer: { id: 1, name: 'Alice' }, amount: 150 },
      { customer: { id: 3, name: 'Charlie' }, amount: 300 }
    ]);
    
    // 对嵌套字段创建索引
    const index = await orders.createIndex({ 'customer.id': 1 });
    expect(index.name).toBe('customer.id_1');
    
    // 使用索引查询
    const result = await orders.find({ 'customer.id': 1 }).toArray();
    expect(result.length).toBe(2);
  });
  
  it('应该在插入后维护索引', async () => {
    const products = db.collection('products');
    await products.createIndex({ category: 1 });
    
    await products.insertOne({ name: 'Product 1', category: 'A' });
    await products.insertOne({ name: 'Product 2', category: 'B' });
    await products.insertOne({ name: 'Product 3', category: 'A' });
    
    const result = await products.find({ category: 'A' }).toArray();
    expect(result.length).toBe(2);
  });
  
  it('应该在删除后维护索引', async () => {
    const items = db.collection('items');
    await items.insertMany([
      { name: 'Item 1', status: 'active' },
      { name: 'Item 2', status: 'inactive' },
      { name: 'Item 3', status: 'active' }
    ]);
    
    await items.createIndex({ status: 1 });
    
    // 删除一个
    await items.deleteOne({ name: 'Item 1' });
    
    const result = await items.find({ status: 'active' }).toArray();
    expect(result.length).toBe(1);
  });
  
  it('应该支持复合索引', async () => {
    const employees = db.collection('employees');
    
    await employees.insertMany([
      { name: 'A1', dept: 'IT', salary: 5000 },
      { name: 'A2', dept: 'IT', salary: 6000 },
      { name: 'B1', dept: 'HR', salary: 4000 },
      { name: 'B2', dept: 'HR', salary: 4500 }
    ]);
    
    // 创建复合索引
    const index = await employees.createIndex({ dept: 1, salary: 1 });
    expect(index.name).toBe('dept_1_salary_1');
    
    // 查询
    const result = await employees.find({ dept: 'IT' }).toArray();
    expect(result.length).toBe(2);
  });
});
