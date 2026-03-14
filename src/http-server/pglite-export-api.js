/**
 * PGLite 数据导出 API
 * 支持 SQL 查询、CSV/SQL/Excel 导出
 */

import express from 'express';
import { initDatabase, getDatabase } from '../model/database.js';

const router = express.Router();

/**
 * 确保数据库已初始化
 */
async function ensureDbReady() {
  try {
    await initDatabase();
    return getDatabase();
  } catch (err) {
    console.error('PGLite 数据库初始化失败:', err);
    throw err;
  }
}

/**
 * POST /api/pglite/query
 * 执行 SQL 查询
 */
router.post('/query', async (req, res) => {
  try {
    const { sql } = req.body;
    
    if (!sql || typeof sql !== 'string') {
      return res.json({
        success: false,
        error: '请提供 SQL 查询语句'
      });
    }
    
    // 安全检查：禁止危险操作
    const upperSql = sql.toUpperCase().trim();
    const dangerousPatterns = [
      'DROP ', 'DELETE FROM', 'TRUNCATE', 'ALTER ', 'CREATE ',
      'GRANT ', 'REVOKE ', 'COPY ', '\\copy'
    ];
    
    for (const pattern of dangerousPatterns) {
      if (upperSql.startsWith(pattern)) {
        return res.json({
          success: false,
          error: `禁止执行 ${pattern} 操作，仅支持 SELECT 查询`
        });
      }
    }
    
    const db = await ensureDbReady();
    const result = await db.query(sql);
    
    res.json({
      success: true,
      data: {
        rows: result.rows,
        fields: result.fields.map(f => ({
          name: f.name,
          dataTypeID: f.dataTypeID
        })),
        rowCount: result.rowCount
      }
    });
    
  } catch (err) {
    console.error('PGLite 查询错误:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/pglite/tables
 * 获取所有表结构
 */
router.get('/tables', async (req, res) => {
  try {
    const db = await ensureDbReady();
    const result = await db.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (err) {
    console.error('获取表结构错误:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/pglite/table/:tableName
 * 获取表结构详情
 */
router.get('/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const db = await ensureDbReady();
    
    // 获取列信息
    const columns = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    // 获取索引信息
    const indexes = await db.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = $1
    `, [tableName]);
    
    res.json({
      success: true,
      data: {
        tableName,
        columns: columns.rows,
        indexes: indexes.rows
      }
    });
    
  } catch (err) {
    console.error('获取表详情错误:', err);
    res.json({
      success: false,
      error: err.message
    });
  }
});

export default router;
