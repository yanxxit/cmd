import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Database, executeSQL, parseSQL } from '@yanit/jsondb';
import {
  adminSystemModel,
  articleModel,
  couponSystemModel,
  environmentVariableModel,
  memberSystemModel,
  shortLinkModel,
} from '../model/jsondb/index.js';
import { getAdminDatabase, getAdminDatabasePath } from '../model/jsondb/admin-db.js';
import {
  ensureAdminSystemConnected,
  requireAdminAuth,
  requireAdminPermission,
} from './admin-auth-helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JSONDB_ROOT = path.join(__dirname, '../../.jsondb');

const JSONDB_SOURCES = [
  {
    key: 'admin',
    title: '管理后台库',
    description: '管理员、角色、文章、环境变量、会员、优惠券与短链等业务表',
    path: getAdminDatabasePath(),
  },
  {
    key: 'testCase',
    title: '测试案例库',
    description: '测试案例主库',
    path: path.join(JSONDB_ROOT, 'test-case-manager'),
  },
  {
    key: 'testCaseCollection',
    title: '测试集合库',
    description: '测试集合与分组数据',
    path: path.join(JSONDB_ROOT, 'test-case-collection'),
  },
  {
    key: 'taskManager',
    title: '任务管理库',
    description: '任务管理 JSONDB 数据',
    path: path.join(JSONDB_ROOT, 'task-manager'),
  },
];

const dbCache = new Map();
const router = express.Router();
const DESC_SQL_REGEXP = /^\s*(?:DESC|DESCRIBE)\s+([a-zA-Z_][\w-]*)\s*;?\s*$/i;
const SHOW_TABLES_SQL_REGEXP = /^\s*SHOW\s+TABLES\s*;?\s*$/i;
const SHOW_DATABASES_SQL_REGEXP = /^\s*SHOW\s+DATABASES\s*;?\s*$/i;

router.use(ensureAdminSystemConnected);
router.use(requireAdminAuth);
router.use(requireAdminPermission('jsondb.view'));

function getSourceMeta(sourceKey = '') {
  return JSONDB_SOURCES.find((item) => item.key === sourceKey) || JSONDB_SOURCES[0];
}

async function ensureAdminSourceReady() {
  await Promise.all([
    adminSystemModel.connect(),
    environmentVariableModel.connect(),
    articleModel.connect(),
    shortLinkModel.connect(),
    memberSystemModel.connect(),
    couponSystemModel.connect(),
  ]);
}

async function getDatabaseBySource(sourceKey = '') {
  const source = getSourceMeta(sourceKey);
  if (source.key === 'admin') {
    await ensureAdminSourceReady();
    return {
      source,
      db: await getAdminDatabase(),
    };
  }

  if (dbCache.has(source.key)) {
    return {
      source,
      db: dbCache.get(source.key),
    };
  }

  const db = new Database(source.path, {
    jsonb: true,
    cacheTTL: 5000,
    enableQueryCache: true,
    queryCacheTTL: 30000,
  });
  await db.open();
  dbCache.set(source.key, db);
  return { source, db };
}

async function buildSourceStats(sourceKey = '') {
  const { source, db } = await getDatabaseBySource(sourceKey);
  const tables = await db.listCollections();
  let totalDocuments = 0;

  for (const tableName of tables) {
    totalDocuments += await db.collection(tableName).countDocuments();
  }

  return {
    key: source.key,
    title: source.title,
    description: source.description,
    path: source.path,
    tableCount: tables.length,
    totalDocuments,
  };
}

async function buildTableSummary(db, tableName = '') {
  const collection = db.collection(tableName);
  const [documentCount, previewRows] = await Promise.all([
    collection.countDocuments(),
    collection.findCursor({}).limit(1).toArray(),
  ]);
  const sample = previewRows[0] || {};

  return {
    name: tableName,
    documentCount,
    sampleKeys: Object.keys(sample).slice(0, 8),
    defaultSql: `SELECT * FROM ${tableName} LIMIT 20`,
    descSql: `DESC ${tableName}`,
  };
}

function inferValueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  return typeof value;
}

function stringifySample(value) {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

async function inspectTableSchema(db, tableName = '', options = {}) {
  const sampleSize = Math.min(Math.max(Number(options.sampleSize || 200), 1), 500);
  const collection = db.collection(tableName);
  const [documentCount, rows] = await Promise.all([
    collection.countDocuments(),
    collection.findCursor({}).limit(sampleSize).toArray(),
  ]);

  const fieldMap = new Map();
  rows.forEach((row) => {
    if (!row || typeof row !== 'object') return;
    Object.entries(row).forEach(([key, value]) => {
      if (!fieldMap.has(key)) {
        fieldMap.set(key, {
          field: key,
          types: new Set(),
          presentCount: 0,
          sampleValue: '',
          nullable: false,
        });
      }
      const fieldInfo = fieldMap.get(key);
      fieldInfo.presentCount += 1;
      const valueType = inferValueType(value);
      fieldInfo.types.add(valueType);
      if (value === null) {
        fieldInfo.nullable = true;
      }
      if (!fieldInfo.sampleValue) {
        fieldInfo.sampleValue = stringifySample(value);
      }
    });
  });

  const sampleCount = rows.length;
  const fields = Array.from(fieldMap.values())
    .map((item) => ({
      field: item.field,
      types: Array.from(item.types),
      type: Array.from(item.types).join(' | ') || 'unknown',
      nullable: item.nullable || item.presentCount < sampleCount,
      sampleValue: item.sampleValue || '-',
      presence: sampleCount ? `${item.presentCount}/${sampleCount}` : '0/0',
      presentCount: item.presentCount,
    }))
    .sort((a, b) => a.field.localeCompare(b.field));

  return {
    tableName,
    documentCount,
    sampleCount,
    fields,
  };
}

router.get('/sources', async (_req, res) => {
  try {
    const items = [];
    for (const source of JSONDB_SOURCES) {
      items.push(await buildSourceStats(source.key));
    }
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/tables', async (req, res) => {
  try {
    const { db } = await getDatabaseBySource(String(req.query.source || 'admin'));
    const keyword = String(req.query.keyword || '').trim().toLowerCase();
    const tables = await db.listCollections();
    const filteredTables = keyword
      ? tables.filter((item) => item.toLowerCase().includes(keyword))
      : tables;

    const items = [];
    for (const tableName of filteredTables) {
      items.push(await buildTableSummary(db, tableName));
    }
    items.sort((a, b) => b.documentCount - a.documentCount || a.name.localeCompare(b.name));
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/tables/:tableName/preview', async (req, res) => {
  try {
    const { db } = await getDatabaseBySource(String(req.query.source || 'admin'));
    const tableName = String(req.params.tableName || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const tables = await db.listCollections();

    if (!tables.includes(tableName)) {
      return res.status(404).json({ success: false, error: '数据表不存在' });
    }

    const collection = db.collection(tableName);
    const [rows, documentCount] = await Promise.all([
      collection.findCursor({}).limit(limit).toArray(),
      collection.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        tableName,
        documentCount,
        limit,
        rows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/tables/:tableName/schema', async (req, res) => {
  try {
    const { db } = await getDatabaseBySource(String(req.query.source || 'admin'));
    const tableName = String(req.params.tableName || '').trim();
    const tables = await db.listCollections();

    if (!tables.includes(tableName)) {
      return res.status(404).json({ success: false, error: '数据表不存在' });
    }

    const schema = await inspectTableSchema(db, tableName, {
      sampleSize: req.query.sampleSize,
    });

    res.json({ success: true, data: schema });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/query', async (req, res) => {
  try {
    const sourceKey = String(req.body?.source || 'admin');
    const sql = String(req.body?.sql || '').trim();

    if (!sql) {
      return res.status(400).json({ success: false, error: 'SQL 不能为空' });
    }

    if (SHOW_DATABASES_SQL_REGEXP.test(sql)) {
      const items = [];
      for (const source of JSONDB_SOURCES) {
        items.push(await buildSourceStats(source.key));
      }

      return res.json({
        success: true,
        data: {
          source: {
            key: 'all',
            title: '全部数据库',
          },
          statementType: 'SHOW DATABASES',
          tableName: '',
          rowCount: items.length,
          rows: items.map((item) => ({
            key: item.key,
            title: item.title,
            description: item.description,
            path: item.path,
            tableCount: item.tableCount,
            totalDocuments: item.totalDocuments,
          })),
        },
      });
    }

    if (SHOW_TABLES_SQL_REGEXP.test(sql)) {
      const { db, source } = await getDatabaseBySource(sourceKey);
      const tableNames = await db.listCollections();
      const rows = [];
      for (const tableName of tableNames) {
        rows.push(await buildTableSummary(db, tableName));
      }
      rows.sort((a, b) => b.documentCount - a.documentCount || a.name.localeCompare(b.name));

      return res.json({
        success: true,
        data: {
          source: {
            key: source.key,
            title: source.title,
          },
          statementType: 'SHOW TABLES',
          tableName: '',
          rowCount: rows.length,
          rows: rows.map((item) => ({
            name: item.name,
            documentCount: item.documentCount,
            sampleKeys: item.sampleKeys.join(', '),
            defaultSql: item.defaultSql,
            descSql: item.descSql,
          })),
        },
      });
    }

    const descMatch = sql.match(DESC_SQL_REGEXP);
    if (descMatch) {
      const tableName = String(descMatch[1] || '').trim();
      const { db, source } = await getDatabaseBySource(sourceKey);
      const tables = await db.listCollections();
      if (!tableName || !tables.includes(tableName)) {
        return res.status(400).json({ success: false, error: `数据表不存在：${tableName || 'unknown'}` });
      }

      const schema = await inspectTableSchema(db, tableName, {
        sampleSize: req.body?.sampleSize,
      });

      return res.json({
        success: true,
        data: {
          source: {
            key: source.key,
            title: source.title,
          },
          statementType: 'DESC',
          tableName,
          rowCount: schema.fields.length,
          rows: schema.fields,
          schema: {
            documentCount: schema.documentCount,
            sampleCount: schema.sampleCount,
          },
        },
      });
    }

    const parseResult = parseSQL(sql);
    if (!parseResult.success || !parseResult.statement) {
      return res.status(400).json({ success: false, error: parseResult.error || 'SQL 解析失败' });
    }

    if (parseResult.statement.type !== 'SELECT') {
      return res.status(400).json({ success: false, error: '当前页面仅支持 SELECT 查询，暂不开放写操作' });
    }

    const { db, source } = await getDatabaseBySource(sourceKey);
    const tableName = String(parseResult.statement.table || '').trim();
    const tables = await db.listCollections();

    if (!tableName || !tables.includes(tableName)) {
      return res.status(400).json({ success: false, error: `数据表不存在：${tableName || 'unknown'}` });
    }

    const result = await executeSQL(db.collection(tableName), sql);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error || 'SQL 执行失败' });
    }

    res.json({
      success: true,
      data: {
        source: {
          key: source.key,
          title: source.title,
        },
        statementType: parseResult.statement.type,
        tableName,
        rowCount: Array.isArray(result.data) ? result.data.length : 0,
        rows: Array.isArray(result.data) ? result.data : [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
