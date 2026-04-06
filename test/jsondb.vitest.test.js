import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

/**
 * Vitest 测试：JSONDB 功能
 */

describe('JSONDB 数据库', () => {
  const testDbPath = './temp/test-jsondb';

  beforeAll(async () => {
    // 清理测试目录
    try {
      await fs.rm(testDbPath, { recursive: true, force: true });
    } catch (e) {
      // 忽略
    }
  });

  afterAll(async () => {
    // 清理测试目录
    try {
      await fs.rm(testDbPath, { recursive: true, force: true });
    } catch (e) {
      // 忽略
    }
  });

  describe('基本操作', () => {
    it('应该能够打开数据库', async () => {
      const { Database } = await import('jsondb');
      const db = new Database(testDbPath);
      await db.open();
      expect(db).toBeDefined();
      await db.close();
    });

    it('应该能够创建集合', async () => {
      const { Database } = await import('jsondb');
      const db = new Database(testDbPath);
      await db.open();

      const collection = await db.createCollection('users');
      expect(collection).toBeDefined();

      await db.close();
    });

    it('应该能够插入文档', async () => {
      const { Database } = await import('jsondb');
      const db = new Database(testDbPath);
      await db.open();

      const users = db.collection('users');
      const user = await users.insertOne({
        name: 'Alice',
        age: 25,
        email: 'alice@example.com'
      });

      expect(user).toBeDefined();
      expect(user.name).toBe('Alice');

      await db.close();
    });

    it('应该能够查询文档', async () => {
      const { Database } = await import('jsondb');
      const db = new Database(testDbPath);
      await db.open();

      const users = db.collection('users');
      const allUsers = await users.find().toArray();

      expect(Array.isArray(allUsers)).toBe(true);
      expect(allUsers.length).toBeGreaterThan(0);

      await db.close();
    });

    it('应该能够更新文档', async () => {
      const { Database } = await import('jsondb');
      const db = new Database(testDbPath);
      await db.open();

      const users = db.collection('users');
      
      // 插入测试数据
      const user = await users.insertOne({ name: 'Bob', age: 30 });
      
      // 更新
      const result = await users.updateOne(
        { name: 'Bob' },
        { $set: { age: 31 } }
      );

      expect(result).toBeDefined();

      // 验证更新
      const updated = await users.findOne({ name: 'Bob' });
      expect(updated.age).toBe(31);

      await db.close();
    });

    it('应该能够删除文档', async () => {
      const { Database } = await import('jsondb');
      const db = new Database(testDbPath);
      await db.open();

      const users = db.collection('users');
      
      // 插入测试数据
      await users.insertOne({ name: 'Charlie', age: 35 });
      
      // 删除
      const result = await users.deleteOne({ name: 'Charlie' });
      expect(result).toBeDefined();

      // 验证删除
      const found = await users.findOne({ name: 'Charlie' });
      expect(found).toBeNull();

      await db.close();
    });
  });

  describe('JSONB 模式', () => {
    it('应该支持 JSONB 模式', async () => {
      const { Database } = await import('jsondb');
      const db = new Database(testDbPath + '-jsonb', { jsonb: true });
      await db.open();

      const collection = await db.createCollection('test');
      await collection.insertOne({ data: 'test' });

      const items = await collection.find().toArray();
      expect(items.length).toBe(1);

      await db.close();
    });
  });

  describe('遍历功能', () => {
    it('应该支持 for await...of 遍历', async () => {
      const { Database } = await import('jsondb');
      const db = new Database(testDbPath);
      await db.open();

      const users = db.collection('users');
      const names = [];

      for await (const user of users.find().limit(5)) {
        if (user.name) {
          names.push(user.name);
        }
      }

      expect(Array.isArray(names)).toBe(true);

      await db.close();
    });
  });
});
