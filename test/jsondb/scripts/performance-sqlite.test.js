/**
 * JSONDB vs SQLite 性能对比测试
 * 
 * 测试场景：
 * 1. 批量插入性能
 * 2. 单条查询性能
 * 3. 条件查询性能（有/无索引）
 * 4. 更新操作性能
 * 5. 删除操作性能
 * 6. 聚合查询性能
 */

import { Database as JSONDB } from '../src/index.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';

// 测试配置
const CONFIG = {
  jsondbPath: join(process.cwd(), 'test-perf-db'),
  sqlitePath: join(process.cwd(), 'test-perf-db.sqlite'),
  recordCount: 10000,  // 测试数据量
  queryIterations: 1000,  // 查询迭代次数
  updateCount: 100,  // 更新测试次数
  cleanup: true  // 测试后清理
};

// 测试结果
const results = {
  jsondb: {},
  sqlite: {}
};

/**
 * 生成测试数据
 */
function generateTestData(count) {
  const data = [];
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
  const statuses = ['active', 'inactive', 'pending', 'suspended'];
  
  for (let i = 0; i < count; i++) {
    data.push({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      age: 20 + (i % 50),
      department: departments[i % departments.length],
      status: statuses[i % statuses.length],
      salary: 5000 + (i * 10),
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      metadata: JSON.stringify({
        loginCount: i % 1000,
        lastLogin: new Date(Date.now() - (i % 30) * 86400000).toISOString(),
        tags: JSON.stringify([`tag${i % 10}`, `category${i % 5}`])
      })
    });
  }
  
  return data;
}

/**
 * 计算统计信息
 */
function calculateStats(times) {
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    avg: avg.toFixed(2),
    min: Math.min(...times).toFixed(2),
    max: Math.max(...times).toFixed(2),
    stdDev: stdDev.toFixed(2),
    qps: Math.round(1000 / avg)
  };
}

/**
 * 格式化时间
 */
function formatTime(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} μs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * JSONDB 测试
 */
async function testJsonDB() {
  console.log('\n📊 JSONDB 测试\n');
  console.log('='.repeat(50));
  
  // 清理
  if (existsSync(CONFIG.jsondbPath)) {
    rmSync(CONFIG.jsondbPath, { recursive: true, force: true });
  }
  
  const db = new JSONDB(CONFIG.jsondbPath, { jsonb: true });
  await db.open();
  const users = db.collection('users');
  
  const testData = generateTestData(CONFIG.recordCount);
  const times = {};
  
  // ========== 测试 1: 批量插入 ==========
  console.log('\n📝 测试 1: 批量插入');
  let start = Date.now();
  await users.insertMany(testData);
  times.insertMany = Date.now() - start;
  
  results.jsondb.insertMany = {
    count: CONFIG.recordCount,
    total: times.insertMany,
    perRecord: (times.insertMany / CONFIG.recordCount).toFixed(3),
    throughput: Math.round(CONFIG.recordCount / (times.insertMany / 1000))
  };
  console.log(`  总耗时：${formatTime(times.insertMany)}`);
  console.log(`  吞吐量：${results.jsondb.insertMany.throughput} 条/秒`);
  
  // ========== 测试 2: 单条查询（按 ID） ==========
  console.log('\n🔍 测试 2: 单条查询（按 ID）');
  const queryByIdTimes = [];
  for (let i = 0; i < CONFIG.queryIterations; i++) {
    const randomId = Math.floor(Math.random() * CONFIG.recordCount) + 1;
    start = Date.now();
    await users.findOne({ id: randomId });
    queryByIdTimes.push(Date.now() - start);
  }
  results.jsondb.queryById = calculateStats(queryByIdTimes);
  console.log(`  平均：${formatTime(parseFloat(results.jsondb.queryById.avg))}`);
  console.log(`  QPS: ${results.jsondb.queryById.qps}`);
  
  // ========== 测试 3: 条件查询（有索引） ==========
  console.log('\n🔍 测试 3: 条件查询（有索引）');
  start = Date.now();
  await users.createIndex({ department: 1 });
  const indexTime = Date.now() - start;
  console.log(`  创建索引：${formatTime(indexTime)}`);
  
  const queryIndexTimes = [];
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR'];
  for (let i = 0; i < CONFIG.queryIterations; i++) {
    start = Date.now();
    await users.find({ department: departments[i % 4] }).toArray();
    queryIndexTimes.push(Date.now() - start);
  }
  results.jsondb.queryWithIndex = calculateStats(queryIndexTimes);
  console.log(`  平均：${formatTime(parseFloat(results.jsondb.queryWithIndex.avg))}`);
  console.log(`  QPS: ${results.jsondb.queryWithIndex.qps}`);
  
  // ========== 测试 4: 条件查询（无索引） ==========
  console.log('\n🔍 测试 4: 条件查询（无索引）');
  const queryNoIndexTimes = [];
  const statuses = ['active', 'inactive', 'pending'];
  for (let i = 0; i < CONFIG.queryIterations; i++) {
    start = Date.now();
    await users.find({ status: statuses[i % 3] }).noIndex().toArray();
    queryNoIndexTimes.push(Date.now() - start);
  }
  results.jsondb.queryNoIndex = calculateStats(queryNoIndexTimes);
  console.log(`  平均：${formatTime(parseFloat(results.jsondb.queryNoIndex.avg))}`);
  console.log(`  QPS: ${results.jsondb.queryNoIndex.qps}`);
  
  // 索引加速比
  results.jsondb.indexSpeedup = (parseFloat(results.jsondb.queryNoIndex.avg) / parseFloat(results.jsondb.queryWithIndex.avg)).toFixed(2);
  console.log(`  索引加速：${results.jsondb.indexSpeedup}x`);
  
  // ========== 测试 5: 更新操作 ==========
  console.log('\n✏️ 测试 5: 更新操作');
  const updateTimes = [];
  for (let i = 0; i < CONFIG.updateCount; i++) {
    const randomId = Math.floor(Math.random() * CONFIG.recordCount) + 1;
    start = Date.now();
    await users.updateOne({ id: randomId }, { $set: { lastUpdate: new Date().toISOString() } });
    updateTimes.push(Date.now() - start);
  }
  results.jsondb.update = calculateStats(updateTimes);
  console.log(`  平均：${formatTime(parseFloat(results.jsondb.update.avg))}`);
  
  // ========== 测试 6: 聚合查询 ==========
  console.log('\n📈 测试 6: 聚合查询');
  start = Date.now();
  await users.aggregate([
    { $group: {
      _id: '$department',
      count: { $count: {} },
      avgSalary: { $avg: '$salary' }
    }},
    { $sort: { count: -1 } }
  ]);
  const aggregateTime = Date.now() - start;
  results.jsondb.aggregate = { total: aggregateTime };
  console.log(`  耗时：${formatTime(aggregateTime)}`);
  
  // ========== 测试 7: 删除操作 ==========
  console.log('\n🗑️ 测试 7: 删除操作');
  const deleteTimes = [];
  for (let i = 0; i < CONFIG.updateCount; i++) {
    const randomId = Math.floor(Math.random() * CONFIG.recordCount) + 1;
    start = Date.now();
    await users.deleteOne({ id: randomId });
    deleteTimes.push(Date.now() - start);
  }
  results.jsondb.delete = calculateStats(deleteTimes);
  console.log(`  平均：${formatTime(parseFloat(results.jsondb.delete.avg))}`);
  
  await db.close();
  
  if (CONFIG.cleanup && existsSync(CONFIG.jsondbPath)) {
    rmSync(CONFIG.jsondbPath, { recursive: true, force: true });
  }
  
  return results.jsondb;
}

/**
 * SQLite 测试
 */
function testSQLite() {
  console.log('\n\n📊 SQLite 测试\n');
  console.log('='.repeat(50));
  
  // 清理
  if (existsSync(CONFIG.sqlitePath)) {
    rmSync(CONFIG.sqlitePath);
  }
  
  const db = new Database(CONFIG.sqlitePath);
  db.pragma('journal_mode = WAL');
  
  const testData = generateTestData(CONFIG.recordCount);
  const times = {};
  
  // ========== 测试 1: 批量插入 ==========
  console.log('\n📝 测试 1: 批量插入');
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT,
      age INTEGER,
      department TEXT,
      status TEXT,
      salary REAL,
      createdAt TEXT,
      metadata TEXT,
      lastUpdate TEXT
    )
  `);
  
  const insertStmt = db.prepare(`
    INSERT INTO users (id, name, email, age, department, status, salary, createdAt, metadata)
    VALUES (@id, @name, @email, @age, @department, @status, @salary, @createdAt, @metadata)
  `);
  
  const insertMany = db.transaction((data) => {
    for (const item of data) {
      insertStmt.run(item);
    }
  });
  
  let start = Date.now();
  insertMany(testData);
  times.insertMany = Date.now() - start;
  
  results.sqlite.insertMany = {
    count: CONFIG.recordCount,
    total: times.insertMany,
    perRecord: (times.insertMany / CONFIG.recordCount).toFixed(3),
    throughput: Math.round(CONFIG.recordCount / (times.insertMany / 1000))
  };
  console.log(`  总耗时：${formatTime(times.insertMany)}`);
  console.log(`  吞吐量：${results.sqlite.insertMany.throughput} 条/秒`);
  
  // ========== 测试 2: 单条查询（按 ID） ==========
  console.log('\n🔍 测试 2: 单条查询（按 ID）');
  const queryByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const queryByIdTimes = [];
  for (let i = 0; i < CONFIG.queryIterations; i++) {
    const randomId = Math.floor(Math.random() * CONFIG.recordCount) + 1;
    start = Date.now();
    queryByIdStmt.get(randomId);
    queryByIdTimes.push(Date.now() - start);
  }
  results.sqlite.queryById = calculateStats(queryByIdTimes);
  console.log(`  平均：${formatTime(parseFloat(results.sqlite.queryById.avg))}`);
  console.log(`  QPS: ${results.sqlite.queryById.qps}`);
  
  // ========== 测试 3: 条件查询（有索引） ==========
  console.log('\n🔍 测试 3: 条件查询（有索引）');
  start = Date.now();
  db.exec('CREATE INDEX idx_department ON users(department)');
  const indexTime = Date.now() - start;
  console.log(`  创建索引：${formatTime(indexTime)}`);
  
  const queryIndexStmt = db.prepare('SELECT * FROM users WHERE department = ?');
  const queryIndexTimes = [];
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR'];
  for (let i = 0; i < CONFIG.queryIterations; i++) {
    start = Date.now();
    queryIndexStmt.all(departments[i % 4]);
    queryIndexTimes.push(Date.now() - start);
  }
  results.sqlite.queryWithIndex = calculateStats(queryIndexTimes);
  console.log(`  平均：${formatTime(parseFloat(results.sqlite.queryWithIndex.avg))}`);
  console.log(`  QPS: ${results.sqlite.queryWithIndex.qps}`);
  
  // ========== 测试 4: 条件查询（无索引） ==========
  console.log('\n🔍 测试 4: 条件查询（无索引）');
  const queryNoIndexStmt = db.prepare('SELECT * FROM users WHERE status = ?');
  const queryNoIndexTimes = [];
  const statuses = ['active', 'inactive', 'pending'];
  for (let i = 0; i < CONFIG.queryIterations; i++) {
    start = Date.now();
    queryNoIndexStmt.all(statuses[i % 3]);
    queryNoIndexTimes.push(Date.now() - start);
  }
  results.sqlite.queryNoIndex = calculateStats(queryNoIndexTimes);
  console.log(`  平均：${formatTime(parseFloat(results.sqlite.queryNoIndex.avg))}`);
  console.log(`  QPS: ${results.sqlite.queryNoIndex.qps}`);
  
  // 索引加速比
  results.sqlite.indexSpeedup = (parseFloat(results.sqlite.queryNoIndex.avg) / parseFloat(results.sqlite.queryWithIndex.avg)).toFixed(2);
  console.log(`  索引加速：${results.sqlite.indexSpeedup}x`);
  
  // ========== 测试 5: 更新操作 ==========
  console.log('\n✏️ 测试 5: 更新操作');
  const updateStmt = db.prepare(`
    UPDATE users SET lastUpdate = ? WHERE id = ?
  `);
  const updateTimes = [];
  for (let i = 0; i < CONFIG.updateCount; i++) {
    const randomId = Math.floor(Math.random() * CONFIG.recordCount) + 1;
    start = Date.now();
    updateStmt.run(new Date().toISOString(), randomId);
    updateTimes.push(Date.now() - start);
  }
  results.sqlite.update = calculateStats(updateTimes);
  console.log(`  平均：${formatTime(parseFloat(results.sqlite.update.avg))}`);
  
  // ========== 测试 6: 聚合查询 ==========
  console.log('\n📈 测试 6: 聚合查询');
  const aggregateStmt = db.prepare(`
    SELECT department, COUNT(*) as count, AVG(salary) as avgSalary
    FROM users
    GROUP BY department
    ORDER BY count DESC
  `);
  start = Date.now();
  aggregateStmt.all();
  const aggregateTime = Date.now() - start;
  results.sqlite.aggregate = { total: aggregateTime };
  console.log(`  耗时：${formatTime(aggregateTime)}`);
  
  // ========== 测试 7: 删除操作 ==========
  console.log('\n🗑️ 测试 7: 删除操作');
  const deleteStmt = db.prepare('DELETE FROM users WHERE id = ?');
  const deleteTimes = [];
  for (let i = 0; i < CONFIG.updateCount; i++) {
    const randomId = Math.floor(Math.random() * CONFIG.recordCount) + 1;
    start = Date.now();
    deleteStmt.run(randomId);
    deleteTimes.push(Date.now() - start);
  }
  results.sqlite.delete = calculateStats(deleteTimes);
  console.log(`  平均：${formatTime(parseFloat(results.sqlite.delete.avg))}`);
  
  db.close();
  
  if (CONFIG.cleanup && existsSync(CONFIG.sqlitePath)) {
    rmSync(CONFIG.sqlitePath);
  }
  
  return results.sqlite;
}

/**
 * 对比分析
 */
function compareResults() {
  console.log('\n\n' + '╔═══════════════════════════════════════════════════════════╗');
  console.log('║              性能对比分析                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  const comparisons = [
    {
      name: '批量插入',
      jsondb: results.jsondb.insertMany.throughput,
      sqlite: results.sqlite.insertMany.throughput,
      unit: '条/秒',
      better: 'high'
    },
    {
      name: '单条查询（ID）',
      jsondb: results.jsondb.queryById.qps,
      sqlite: results.sqlite.queryById.qps,
      unit: 'QPS',
      better: 'high'
    },
    {
      name: '条件查询（有索引）',
      jsondb: results.jsondb.queryWithIndex.qps,
      sqlite: results.sqlite.queryWithIndex.qps,
      unit: 'QPS',
      better: 'high'
    },
    {
      name: '条件查询（无索引）',
      jsondb: results.jsondb.queryNoIndex.qps,
      sqlite: results.sqlite.queryNoIndex.qps,
      unit: 'QPS',
      better: 'high'
    },
    {
      name: '更新操作',
      jsondb: (1000 / parseFloat(results.jsondb.update.avg)).toFixed(0),
      sqlite: (1000 / parseFloat(results.sqlite.update.avg)).toFixed(0),
      unit: 'QPS',
      better: 'high'
    },
    {
      name: '删除操作',
      jsondb: (1000 / parseFloat(results.jsondb.delete.avg)).toFixed(0),
      sqlite: (1000 / parseFloat(results.sqlite.delete.avg)).toFixed(0),
      unit: 'QPS',
      better: 'high'
    },
    {
      name: '聚合查询',
      jsondb: (1000 / results.jsondb.aggregate.total).toFixed(0),
      sqlite: (1000 / results.sqlite.aggregate.total).toFixed(0),
      unit: 'QPS',
      better: 'high'
    }
  ];
  
  let jsondbWins = 0;
  let sqliteWins = 0;
  
  console.log('\n┌─────────────────────┬──────────────┬──────────────┬────────────┐');
  console.log('│ 测试项              │ JSONDB       │ SQLite       │ 胜出       │');
  console.log('├─────────────────────┼──────────────┼──────────────┼────────────┤');
  
  for (const comp of comparisons) {
    const jsondbVal = parseFloat(comp.jsondb);
    const sqliteVal = parseFloat(comp.sqlite);
    const winner = jsondbVal >= sqliteVal ? 'JSONDB' : 'SQLite';
    
    if (winner === 'JSONDB') jsondbWins++;
    else sqliteWins++;
    
    console.log(`│ ${comp.name.padEnd(19)} │ ${String(comp.jsondb).padEnd(12)} │ ${String(comp.sqlite).padEnd(12)} │ ${winner.padEnd(10)} │`);
  }
  
  console.log('└─────────────────────┴──────────────┴──────────────┴────────────┘');
  
  console.log(`\n📊 总结：JSONDB 胜出 ${jsondbWins} 项，SQLite 胜出 ${sqliteWins} 项`);
  
  // 计算相对性能
  console.log('\n📈 相对性能比（JSONDB / SQLite）:');
  for (const comp of comparisons) {
    const ratio = (parseFloat(comp.jsondb) / parseFloat(comp.sqlite) * 100).toFixed(1);
    console.log(`  ${comp.name}: ${ratio}%`);
  }
  
  return { jsondbWins, sqliteWins };
}

/**
 * 生成测试报告
 */
function generateReport() {
  return {
    timestamp: new Date().toISOString(),
    config: {
      recordCount: CONFIG.recordCount,
      queryIterations: CONFIG.queryIterations,
      updateCount: CONFIG.updateCount
    },
    results: {
      jsondb: results.jsondb,
      sqlite: results.sqlite
    },
    comparison: compareResults()
  };
}

// 主函数
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║          JSONDB vs SQLite 性能对比测试                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  console.log('\n📋 测试配置:');
  console.log(`  记录数量：${CONFIG.recordCount}`);
  console.log(`  查询迭代：${CONFIG.queryIterations}`);
  console.log(`  更新/删除：${CONFIG.updateCount}`);
  
  try {
    // 运行测试
    await testJsonDB();
    testSQLite();
    
    // 对比分析
    compareResults();
    
    // 生成报告
    const report = generateReport();
    console.log('\n📄 完整测试报告:');
    console.log(JSON.stringify(report, null, 2));
    
    console.log('\n✅ 测试完成！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

main();
