/**
 * JSONB 功能测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Database } from '../src/index.js';
import { rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const TEST_JSONB_PATH = join(process.cwd(), 'test-data', 'test-jsonb-db');
const TEST_NORMAL_PATH = join(process.cwd(), 'test-data', 'test-normal-db');

describe('JSONB Mode', () => {
  let jsonbDb;
  let normalDb;
  
  beforeAll(async () => {
    // 清理测试数据
    if (existsSync(TEST_JSONB_PATH)) {
      rmSync(TEST_JSONB_PATH, { recursive: true, force: true });
    }
    if (existsSync(TEST_NORMAL_PATH)) {
      rmSync(TEST_NORMAL_PATH, { recursive: true, force: true });
    }
    
    // 创建 JSONB 模式数据库
    jsonbDb = new Database(TEST_JSONB_PATH, { jsonb: true });
    await jsonbDb.open();
    
    // 创建普通模式数据库
    normalDb = new Database(TEST_NORMAL_PATH, { jsonb: false });
    await normalDb.open();
  });
  
  afterAll(async () => {
    await jsonbDb.close();
    await normalDb.close();
    
    if (existsSync(TEST_JSONB_PATH)) {
      rmSync(TEST_JSONB_PATH, { recursive: true, force: true });
    }
    if (existsSync(TEST_NORMAL_PATH)) {
      rmSync(TEST_NORMAL_PATH, { recursive: true, force: true });
    }
  });
  
  it('应该创建 JSONB 模式的集合', async () => {
    const users = jsonbDb.collection('users');
    expect(users.jsonb).toBe(true);
  });
  
  it('应该创建普通模式的集合', async () => {
    const users = normalDb.collection('users');
    expect(users.jsonb).toBe(false);
  });
  
  it('应该在 JSONB 模式下插入文档', async () => {
    const users = jsonbDb.collection('users');
    const user = await users.insertOne({
      name: 'Alice',
      age: 25,
      data: { nested: { value: 'test' } }
    });
    
    expect(user).toHaveProperty('_id');
    expect(user.name).toBe('Alice');
  });
  
  it('应该在普通模式下插入文档', async () => {
    const users = normalDb.collection('users');
    const user = await users.insertOne({
      name: 'Bob',
      age: 30,
      data: { nested: { value: 'test' } }
    });
    
    expect(user).toHaveProperty('_id');
    expect(user.name).toBe('Bob');
  });
  
  it('JSONB 模式文件应该是二进制格式', async () => {
    const content = readFileSync(join(TEST_JSONB_PATH, 'users.json'));
    // JSONB 模式下，文件应该是二进制格式
    // 前 4 字节是长度前缀 (uint32 BE)
    expect(content.length).toBeGreaterThan(4);
    
    // 验证长度前缀
    const length = content.readUInt32BE(0);
    expect(length).toBe(content.length - 4);
    
    // 解码验证数据
    const jsonBuffer = content.subarray(4);
    const json = jsonBuffer.toString('utf-8');
    const data = JSON.parse(json);
    expect(data._documents).toHaveLength(1);
  });
  
  it('普通模式文件应该是文本 JSON', async () => {
    const content = readFileSync(join(TEST_NORMAL_PATH, 'users.json'), 'utf-8');
    // 普通模式下，内容应该是格式化的 JSON 文本
    expect(content).toContain('\n');
    expect(content).toContain('  '); // 有缩进
  });
  
  it('应该在 JSONB 模式下查询文档', async () => {
    const users = jsonbDb.collection('users');
    const allUsers = await users.find().toArray();
    expect(allUsers).toHaveLength(1);
    expect(allUsers[0].name).toBe('Alice');
    
    const found = await users.findOne({ name: 'Alice' });
    expect(found).toBeDefined();
    expect(found.data.nested.value).toBe('test');
  });
  
  it('应该在普通模式下查询文档', async () => {
    const users = normalDb.collection('users');
    const allUsers = await users.find().toArray();
    expect(allUsers).toHaveLength(1);
    expect(allUsers[0].name).toBe('Bob');
    
    const found = await users.findOne({ name: 'Bob' });
    expect(found).toBeDefined();
    expect(found.data.nested.value).toBe('test');
  });
  
  it('应该在 JSONB 模式下更新文档', async () => {
    const users = jsonbDb.collection('users');
    await users.updateOne(
      { name: 'Alice' },
      { $set: { age: 26 } }
    );
    
    const updated = await users.findOne({ name: 'Alice' });
    expect(updated.age).toBe(26);
  });
  
  it('应该在 JSONB 模式下使用聚合', async () => {
    const users = jsonbDb.collection('users');
    await users.insertMany([
      { name: 'Charlie', age: 35 },
      { name: 'David', age: 28 }
    ]);
    
    const stats = await users.aggregate([
      { $group: { _id: null, avgAge: { $avg: '$age' } } }
    ]);
    
    expect(stats[0].avgAge).toBe(29.666666666666668); // (26 + 35 + 28) / 3
  });
  
  it('应该比较 JSONB 和普通模式的空间效率', async () => {
    const jsonbStats = await jsonbDb.collection('users').stats();
    const normalStats = await normalDb.collection('users').stats();
    
    // JSONB 模式使用二进制存储（带长度前缀）
    expect(jsonbStats.jsonb).toBe(true);
    expect(normalStats.jsonb).toBe(false);
    
    // JSONB 模式是二进制格式，没有格式化和空格
    // 但有 4 字节的长度前缀
    // 对于大数据集，JSONB 更节省空间
    console.log('JSONB size:', jsonbStats.size, 'Normal size:', normalStats.size);
    console.log('JSONB 是二进制格式，普通模式是格式化 JSON');
  });
  
  it('应该支持 JSONB 模式的并发操作', async () => {
    const tasks = jsonbDb.collection('tasks');
    
    await Promise.all([
      tasks.insertOne({ name: 'Task 1', status: 'pending' }),
      tasks.insertOne({ name: 'Task 2', status: 'pending' }),
      tasks.insertOne({ name: 'Task 3', status: 'pending' })
    ]);
    
    const count = await tasks.countDocuments();
    expect(count).toBe(3);
    
    await Promise.all([
      tasks.updateOne({ name: 'Task 1' }, { $set: { status: 'completed' } }),
      tasks.updateOne({ name: 'Task 2' }, { $set: { status: 'in-progress' } }),
      tasks.updateOne({ name: 'Task 3' }, { $set: { status: 'pending' } })
    ]);
    
    const completed = await tasks.countDocuments({ status: 'completed' });
    expect(completed).toBe(1);
  });
  
  it('应该支持 JSONB 模式的索引操作', async () => {
    const books = jsonbDb.collection('books');
    await books.insertMany([
      { title: 'Book 1', author: 'Author A', year: 2020 },
      { title: 'Book 2', author: 'Author B', year: 2021 }
    ]);
    
    const index = await books.createIndex({ author: 1 });
    expect(index.name).toBe('author_1');
    
    const indexes = await books.listIndexes();
    expect(indexes).toHaveLength(1);
    
    await books.dropIndex('author_1');
    const indexesAfterDrop = await books.listIndexes();
    expect(indexesAfterDrop).toHaveLength(0);
  });
});
