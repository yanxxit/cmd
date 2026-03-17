/**
 * JSONDB vs MySQL 性能对比测试
 * 
 * 测试场景：
 * 1. 批量插入性能
 * 2. 单条查询性能
 * 3. 条件查询性能
 * 4. 更新操作性能
 * 5. 删除操作性能
 */

import { Database } from '../src/index.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

// 测试配置
const CONFIG = {
  jsondbPath: join(process.cwd(), 'test-perf-db'),
  recordCount: 10000,  // 测试数据量
  queryIterations: 1000,  // 查询迭代次数
  cleanup: true  // 测试后清理
};

// 测试结果
const results = {
  jsondb: {},
  notes: []
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
      metadata: {
        loginCount: i % 1000,
        lastLogin: new Date(Date.now() - (i % 30) * 86400000).toISOString(),
        tags: [`tag${i % 10}`, `category${i % 5}`]
      }
    });
  }
  
  return data;
}

/**
 * 计算平均时间和标准差
 */
function calculateStats(times) {
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    avg: avg.toFixed(2),
    min: Math.min(...times).toFixed(2),
    max: Math.max(...times).toFixed(2),
    stdDev: stdDev.toFixed(2)
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
 * JSONDB 性能测试
 */
async function testJsonDB() {
  console.log('\n📊 JSONDB 性能测试\n');
  console.log('='.repeat(50));
  
  // 清理旧数据
  if (existsSync(CONFIG.jsondbPath)) {
    rmSync(CONFIG.jsondbPath, { recursive: true, force: true });
  }
  
  const db = new Database(CONFIG.jsondbPath, { jsonb: true });
  await db.open();
  
  const users = db.collection('users');
  const times = [];
  
  // ========== 测试 1: 批量插入 ==========
  console.log('\n📝 测试 1: 批量插入性能');
  console.log('-'.repeat(50));
  
  const testData = generateTestData(CONFIG.recordCount);
  
  const insertStart = Date.now();
  await users.insertMany(testData);
  const insertTime = Date.now() - insertStart;
  
  results.jsondb.insertMany = {
    count: CONFIG.recordCount,
    total: insertTime,
    perRecord: (insertTime / CONFIG.recordCount).toFixed(3)
  };
  
  console.log(`  插入 ${CONFIG.recordCount} 条记录`);
  console.log(`  总耗时：${formatTime(insertTime)}`);
  console.log(`  平均每条：${(insertTime / CONFIG.recordCount).toFixed(3)} ms`);
  console.log(`  记录/秒：${Math.round(CONFIG.recordCount / (insertTime / 1000))}`);
  
  // ========== 测试 2: 单条查询（按 ID） ==========
  console.log('\n🔍 测试 2: 单条查询性能（按 ID）');
  console.log('-'.repeat(50));
  
  const queryByIdTimes = [];
  for (let i = 0; i < CONFIG.queryIterations; i++) {
    const randomId = Math.floor(Math.random() * CONFIG.recordCount) + 1;
    const start = Date.now();
    await users.findOne({ id: randomId });
    queryByIdTimes.push(Date.now() - start);
  }
  
  const queryByIdStats = calculateStats(queryByIdTimes);
  results.jsondb.queryById = queryByIdStats;
  
  console.log(`  查询次数：${CONFIG.queryIterations}`);
  console.log(`  平均耗时：${formatTime(parseFloat(queryByIdStats.avg))}`);
  console.log(`  最小/最大：${formatTime(parseFloat(queryByIdStats.min))} / ${formatTime(parseFloat(queryByIdStats.max))}`);
  console.log(`  标准差：${queryByIdStats.stdDev} ms`);
  console.log(`  查询/秒：${Math.round(1000 / parseFloat(queryByIdStats.avg))}`);
  
  // ========== 测试 3: 条件查询（有索引） ==========
  console.log('\n🔍 测试 3: 条件查询性能（有索引）');
  console.log('-'.repeat(50));
  
  // 创建索引
  const indexStart = Date.now();
  await users.createIndex({ department: 1 });
  const indexTime = Date.now() - indexStart;
  console.log(`  创建索引耗时：${formatTime(indexTime)}`);
  
  const queryWithIndexTimes = [];
  for (let i = 0; i < CONFIG.queryIterations; i++) {
    const departments = ['Engineering', 'Sales', 'Marketing', 'HR'];
    const randomDept = departments[i % departments.length];
    const start = Date.now();
    await users.find({ department: randomDept }).toArray();
    queryWithIndexTimes.push(Date.now() - start);
  }
  
  const queryWithIndexStats = calculateStats(queryWithIndexTimes);
  results.jsondb.queryWithIndex = queryWithIndexStats;
  
  console.log(`  查询次数：${CONFIG.queryIterations}`);
  console.log(`  平均耗时：${formatTime(parseFloat(queryWithIndexStats.avg))}`);
  console.log(`  最小/最大：${formatTime(parseFloat(queryWithIndexStats.min))} / ${formatTime(parseFloat(queryWithIndexStats.max))}`);
  console.log(`  查询/秒：${Math.round(1000 / parseFloat(queryWithIndexStats.avg))}`);
  
  // ========== 测试 4: 条件查询（无索引） ==========
  console.log('\n🔍 测试 4: 条件查询性能（无索引）');
  console.log('-'.repeat(50));
  
  const queryNoIndexTimes = [];
  for (let i = 0; i < CONFIG.queryIterations; i++) {
    const statuses = ['active', 'inactive', 'pending'];
    const randomStatus = statuses[i % statuses.length];
    const start = Date.now();
    await users.find({ status: randomStatus }).noIndex().toArray();
    queryNoIndexTimes.push(Date.now() - start);
  }
  
  const queryNoIndexStats = calculateStats(queryNoIndexTimes);
  results.jsondb.queryNoIndex = queryNoIndexStats;
  
  console.log(`  查询次数：${CONFIG.queryIterations}`);
  console.log(`  平均耗时：${formatTime(parseFloat(queryNoIndexStats.avg))}`);
  console.log(`  最小/最大：${formatTime(parseFloat(queryNoIndexStats.min))} / ${formatTime(parseFloat(queryNoIndexStats.max))}`);
  
  // 索引加速比
  const speedup = (parseFloat(queryNoIndexStats.avg) / parseFloat(queryWithIndexStats.avg)).toFixed(2);
  console.log(`  索引加速比：${speedup}x`);
  results.jsondb.indexSpeedup = speedup;
  
  // ========== 测试 5: 更新操作 ==========
  console.log('\n✏️ 测试 5: 更新操作性能');
  console.log('-'.repeat(50));
  
  const updateTimes = [];
  const updateCount = 100;
  for (let i = 0; i < updateCount; i++) {
    const randomId = Math.floor(Math.random() * CONFIG.recordCount) + 1;
    const start = Date.now();
    await users.updateOne({ id: randomId }, { $set: { lastUpdate: new Date().toISOString() } });
    updateTimes.push(Date.now() - start);
  }
  
  const updateStats = calculateStats(updateTimes);
  results.jsondb.update = updateStats;
  
  console.log(`  更新次数：${updateCount}`);
  console.log(`  平均耗时：${formatTime(parseFloat(updateStats.avg))}`);
  console.log(`  最小/最大：${formatTime(parseFloat(updateStats.min))} / ${formatTime(parseFloat(updateStats.max))}`);
  
  // ========== 测试 6: 聚合查询 ==========
  console.log('\n📈 测试 6: 聚合查询性能');
  console.log('-'.repeat(50));
  
  const aggregateStart = Date.now();
  const aggregateResult = await users.aggregate([
    { $group: {
      _id: '$department',
      count: { $count: {} },
      avgSalary: { $avg: '$salary' },
      avgAge: { $avg: '$age' }
    }},
    { $sort: { count: -1 } }
  ]);
  const aggregateTime = Date.now() - aggregateStart;
  
  results.jsondb.aggregate = {
    total: aggregateTime,
    groups: aggregateResult.length
  };
  
  console.log(`  分组数量：${aggregateResult.length}`);
  console.log(`  总耗时：${formatTime(aggregateTime)}`);
  console.log(`  结果示例:`, aggregateResult.slice(0, 2));
  
  // ========== 测试 7: 删除操作 ==========
  console.log('\n🗑️ 测试 7: 删除操作性能');
  console.log('-'.repeat(50));
  
  const deleteTimes = [];
  const deleteCount = 100;
  for (let i = 0; i < deleteCount; i++) {
    const randomId = Math.floor(Math.random() * CONFIG.recordCount) + 1;
    const start = Date.now();
    await users.deleteOne({ id: randomId });
    deleteTimes.push(Date.now() - start);
  }
  
  const deleteStats = calculateStats(deleteTimes);
  results.jsondb.delete = deleteStats;
  
  console.log(`  删除次数：${deleteCount}`);
  console.log(`  平均耗时：${formatTime(parseFloat(deleteStats.avg))}`);
  console.log(`  最小/最大：${formatTime(parseFloat(deleteStats.min))} / ${formatTime(parseFloat(deleteStats.max))}`);
  
  // 关闭数据库
  await db.close();
  
  // 清理
  if (CONFIG.cleanup && existsSync(CONFIG.jsondbPath)) {
    rmSync(CONFIG.jsondbPath, { recursive: true, force: true });
  }
  
  return results;
}

/**
 * 打印测试结果摘要
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 性能测试摘要');
  console.log('='.repeat(60));
  
  console.log('\n📝 插入性能');
  console.log(`  批量插入 ${CONFIG.recordCount} 条：${formatTime(results.jsondb.insertMany.total)}`);
  console.log(`  平均每条：${results.jsondb.insertMany.perRecord} ms`);
  console.log(`  吞吐量：${Math.round(CONFIG.recordCount / (results.jsondb.insertMany.total / 1000))} 条/秒`);
  
  console.log('\n🔍 查询性能');
  console.log(`  单条查询（按 ID）：${formatTime(parseFloat(results.jsondb.queryById.avg))} avg`);
  console.log(`  条件查询（有索引）：${formatTime(parseFloat(results.jsondb.queryWithIndex.avg))} avg`);
  console.log(`  条件查询（无索引）：${formatTime(parseFloat(results.jsondb.queryNoIndex.avg))} avg`);
  console.log(`  索引加速比：${results.jsondb.indexSpeedup}x`);
  
  console.log('\n✏️ 更新性能');
  console.log(`  单条更新：${formatTime(parseFloat(results.jsondb.update.avg))} avg`);
  
  console.log('\n🗑️ 删除性能');
  console.log(`  单条删除：${formatTime(parseFloat(results.jsondb.delete.avg))} avg`);
  
  console.log('\n📈 聚合性能');
  console.log(`  分组聚合：${formatTime(results.jsondb.aggregate.total)}`);
  
  console.log('\n' + '='.repeat(60));
}

/**
 * 生成测试报告
 */
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results: results.jsondb,
    summary: {
      insertThroughput: Math.round(CONFIG.recordCount / (results.jsondb.insertMany.total / 1000)),
      queryPerSecond: Math.round(1000 / parseFloat(results.jsondb.queryById.avg)),
      indexSpeedup: results.jsondb.indexSpeedup
    }
  };
  
  return report;
}

// 主函数
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         JSONDB vs MySQL 性能对比测试                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  
  console.log('\n📋 测试配置:');
  console.log(`  记录数量：${CONFIG.recordCount}`);
  console.log(`  查询迭代：${CONFIG.queryIterations}`);
  console.log(`  数据库路径：${CONFIG.jsondbPath}`);
  
  try {
    // 运行 JSONDB 测试
    await testJsonDB();
    
    // 打印摘要
    printSummary();
    
    // 生成报告
    const report = generateReport();
    console.log('\n📄 完整测试报告已生成');
    console.log(JSON.stringify(report, null, 2));
    
    console.log('\n✅ 测试完成！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
main();
