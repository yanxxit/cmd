/**
 * Schema 验证测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Database, createSchema, ValidationError } from '../src/index.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DB_PATH = join(process.cwd(), 'test-data', 'test-schema-db');

describe('Schema Validation', () => {
  let db;
  
  beforeAll(async () => {
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
    
    db = new Database(TEST_DB_PATH);
    await db.open();
  });
  
  afterAll(async () => {
    await db.close();
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true });
    }
  });
  
  it('应该创建 Schema', () => {
    const userSchema = createSchema({
      name: { type: 'string', required: true, minLength: 1, maxLength: 50 },
      email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      age: { type: 'number', required: true, min: 0, max: 150 },
      status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
      tags: { type: 'array', items: { type: 'string' } },
      metadata: { type: 'object' }
    });
    
    expect(userSchema).toBeDefined();
  });
  
  it('应该验证通过有效的数据', () => {
    const userSchema = createSchema({
      name: { type: 'string', required: true },
      age: { type: 'number', min: 0 }
    });
    
    const result = userSchema.validate({ name: 'Alice', age: 25 });
    expect(result.valid).toBe(true);
  });
  
  it('应该验证失败无效的数据', () => {
    const userSchema = createSchema({
      name: { type: 'string', required: true },
      age: { type: 'number', min: 0, max: 150 }
    });
    
    const result = userSchema.validate({ name: 'Alice', age: -5 });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('age');
  });
  
  it('应该验证必填字段', () => {
    const userSchema = createSchema({
      name: { type: 'string', required: true },
      email: { type: 'string', required: true }
    });
    
    const result = userSchema.validate({ name: 'Alice' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'email')).toBe(true);
  });
  
  it('应该验证字符串长度', () => {
    const userSchema = createSchema({
      name: { type: 'string', minLength: 3, maxLength: 10 }
    });
    
    expect(userSchema.validate({ name: 'Al' }).valid).toBe(false);
    expect(userSchema.validate({ name: 'Alice' }).valid).toBe(true);
    expect(userSchema.validate({ name: 'Alexanderia' }).valid).toBe(false);
  });
  
  it('应该验证枚举值', () => {
    const userSchema = createSchema({
      status: { type: 'string', enum: ['active', 'inactive'] }
    });
    
    expect(userSchema.validate({ status: 'active' }).valid).toBe(true);
    expect(userSchema.validate({ status: 'unknown' }).valid).toBe(false);
  });
  
  it('应该验证数组', () => {
    const userSchema = createSchema({
      tags: { type: 'array', items: { type: 'string' } }
    });
    
    expect(userSchema.validate({ tags: ['a', 'b'] }).valid).toBe(true);
    expect(userSchema.validate({ tags: ['a', 123] }).valid).toBe(false);
  });
  
  it('应该在插入时验证', async () => {
    const users = db.collection('users');
    
    const userSchema = createSchema({
      name: { type: 'string', required: true, minLength: 1 },
      email: { type: 'string', required: true },
      age: { type: 'number', min: 0, max: 150 }
    });
    
    users.setSchema(userSchema);
    
    // 有效数据应该插入成功
    const user = await users.insertOne({
      name: 'Alice',
      email: 'alice@example.com',
      age: 25
    });
    
    expect(user.name).toBe('Alice');
  });
  
  it('应该在插入时拒绝无效数据', async () => {
    const users = db.collection('users');
    
    const userSchema = createSchema({
      name: { type: 'string', required: true },
      age: { type: 'number', min: 0, max: 150 }
    });
    
    users.setSchema(userSchema);
    
    // 无效数据应该抛出异常
    await expect(users.insertOne({
      name: 'Bob',
      age: 200 // 超过最大值
    })).rejects.toThrow(ValidationError);
  });
  
  it('应该支持批量插入验证', async () => {
    const products = db.collection('products');
    
    const productSchema = createSchema({
      name: { type: 'string', required: true },
      price: { type: 'number', min: 0 },
      stock: { type: 'number', min: 0, integer: true }
    });
    
    products.setSchema(productSchema);
    
    // 有效数据
    const result = await products.insertMany([
      { name: 'Product 1', price: 10.99, stock: 100 },
      { name: 'Product 2', price: 20.99, stock: 50 }
    ]);
    
    expect(result.insertedCount).toBe(2);
    
    // 无效数据应该失败
    await expect(products.insertMany([
      { name: 'Product 3', price: -10 } // 负数价格
    ])).rejects.toThrow(ValidationError);
  });
  
  it('应该支持默认值', () => {
    const userSchema = createSchema({
      name: { type: 'string', required: true },
      status: { type: 'string', default: 'active' },
      role: { type: 'string', default: 'user' }
    });
    
    const doc = { name: 'Alice' };
    const withDefaults = userSchema.applyDefaults(doc);
    
    expect(withDefaults.status).toBe('active');
    expect(withDefaults.role).toBe('user');
  });
  
  it('应该支持严格模式', () => {
    const userSchema = createSchema({
      name: { type: 'string' },
      age: { type: 'number' }
    }, { strict: true });
    
    const result = userSchema.validate({
      name: 'Alice',
      age: 25,
      extra: 'field' // 额外字段
    });
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'extra')).toBe(true);
  });
  
  it('应该支持自定义验证', () => {
    const userSchema = createSchema({
      name: { type: 'string' },
      password: {
        type: 'custom',
        validate: (value) => {
          if (value.length < 8) {
            return '密码长度至少为 8 位';
          }
          if (!/[A-Z]/.test(value)) {
            return '密码必须包含大写字母';
          }
          return true;
        }
      }
    });
    
    expect(userSchema.validate({ password: 'short' }).valid).toBe(false);
    expect(userSchema.validate({ password: 'alllowercase' }).valid).toBe(false);
    expect(userSchema.validate({ password: 'ValidPass123' }).valid).toBe(true);
  });
  
  it('应该支持嵌套对象验证', () => {
    const orderSchema = createSchema({
      customer: {
        type: 'object',
        properties: {
          name: { type: 'string', required: true },
          email: { type: 'string' }
        }
      },
      items: { type: 'array' }
    });
    
    expect(orderSchema.validate({
      customer: { name: 'Alice', email: 'alice@example.com' },
      items: []
    }).valid).toBe(true);
    
    expect(orderSchema.validate({
      customer: { email: 'alice@example.com' } // 缺少 name
    }).valid).toBe(false);
  });
});
