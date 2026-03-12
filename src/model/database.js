/**
 * PGLite Database Manager
 * 数据库连接管理
 */

import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 全局数据库实例
let db = null;

/**
 * 初始化数据库
 */
export async function initDatabase() {
  if (db) return db;
  
  try {
    const dbDir = path.join(__dirname, '../../.pgdata');
    const dbPath = path.join(dbDir, 'todo');
    
    console.log('🗄️ 初始化 PGLite 数据库:', dbPath);
    
    // 确保目录存在
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // 创建数据库连接
    db = new PGlite(dbPath);
    await db.waitReady;
    
    console.log('✅ 数据库连接成功');
    
    // 创建表 - 使用 PGLite 兼容的语法
    await db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        completed BOOLEAN DEFAULT false,
        priority INTEGER DEFAULT 2,
        due_date TEXT,
        note TEXT,
        tags TEXT DEFAULT '',
        category TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 检查并添加 parent_id 字段
    try {
      await db.exec(`
        ALTER TABLE todos
        ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES todos(id) ON DELETE CASCADE
      `);
    } catch (err) {
      console.log('parent_id 字段可能已存在:', err.message);
    }

    // 检查并添加 tags 字段
    try {
      await db.exec(`
        ALTER TABLE todos
        ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT ''
      `);
    } catch (err) {
      console.log('tags 字段可能已存在:', err.message);
    }

    // 检查并添加 category 字段
    try {
      await db.exec(`
        ALTER TABLE todos
        ADD COLUMN IF NOT EXISTS category TEXT DEFAULT ''
      `);
    } catch (err) {
      console.log('category 字段可能已存在:', err.message);
    }
    
    // 创建索引（单独执行）
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at)`);
    
    console.log('✅ 数据表创建成功');
    
    return db;
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err);
    throw err;
  }
}

/**
 * 获取数据库实例
 */
export function getDatabase() {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return db;
}

/**
 * 关闭数据库连接
 */
export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
    console.log('🔒 数据库连接已关闭');
  }
}
