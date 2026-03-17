/**
 * JSONDB JSONB 模式示例
 * 演示如何使用 JSONB 二进制存储模式
 */

import { Database } from '../src/index.js';
import { rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const JSONB_DB_PATH = './data/jsonb-db';
const NORMAL_DB_PATH = './data/normal-db';

// 清理旧数据
[JSONB_DB_PATH, NORMAL_DB_PATH].forEach(path => {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
});

async function main() {
  console.log('=== JSONDB JSONB 模式示例 ===\n');
  
  // 1. 创建 JSONB 模式数据库
  console.log('📦 创建 JSONB 模式数据库（二进制存储）...');
  const jsonbDb = new Database(JSONB_DB_PATH, { jsonb: true });
  await jsonbDb.open();
  
  // 2. 创建普通模式数据库
  console.log('📦 创建普通模式数据库（文本 JSON）...');
  const normalDb = new Database(NORMAL_DB_PATH, { jsonb: false });
  await normalDb.open();
  
  const jsonbUsers = jsonbDb.collection('users');
  const normalUsers = normalDb.collection('users');
  
  // 3. 插入大量数据
  console.log('\n📝 插入测试数据...');
  const testData = [];
  for (let i = 0; i < 100; i++) {
    testData.push({
      name: `User ${i}`,
      email: `user${i}@example.com`,
      age: Math.floor(Math.random() * 50) + 20,
      department: ['Engineering', 'Sales', 'Marketing', 'HR'][Math.floor(Math.random() * 4)],
      metadata: {
        created: new Date().toISOString(),
        tags: [`tag${i % 10}`, `category${i % 5}`],
        settings: {
          theme: ['light', 'dark'][Math.floor(Math.random() * 2)],
          notifications: Math.random() > 0.5
        }
      }
    });
  }
  
  await jsonbUsers.insertMany(testData);
  await normalUsers.insertMany(testData);
  
  console.log(`插入了 ${testData.length} 条记录`);
  
  // 4. 比较文件格式
  console.log('\n📊 比较文件格式...');
  const jsonbBuffer = readFileSync(join(JSONB_DB_PATH, 'users.json'));
  const normalContent = readFileSync(join(NORMAL_DB_PATH, 'users.json'), 'utf-8');
  
  console.log(`JSONB 模式文件大小：${jsonbBuffer.length} 字节`);
  console.log(`普通模式文件大小：${normalContent.length} 字节`);
  
  // JSONB 格式：[4 字节长度][JSON 数据]
  const lengthPrefix = jsonbBuffer.readUInt32BE(0);
  console.log(`\nJSONB 格式:`);
  console.log(`  - 长度前缀：${lengthPrefix} 字节`);
  console.log(`  - 实际数据：${jsonbBuffer.length - 4} 字节`);
  console.log(`  - 前 50 字节（16 进制）: ${jsonbBuffer.subarray(0, 50).toString('hex')}`);
  
  console.log(`\n普通模式（前 200 字符）:`);
  console.log(normalContent.substring(0, 200).trim());
  
  // 5. 查询性能测试
  console.log('\n⚡ 查询性能测试...');
  
  const startTime = Date.now();
  const jsonbResult = await jsonbUsers.find({ age: { $gte: 40 } }).toArray();
  const jsonbTime = Date.now() - startTime;
  
  const startTime2 = Date.now();
  const normalResult = await normalUsers.find({ age: { $gte: 40 } }).toArray();
  const normalTime = Date.now() - startTime2;
  
  console.log(`JSONB 模式查询时间：${jsonbTime}ms (${jsonbResult.length} 条结果)`);
  console.log(`普通模式查询时间：${normalTime}ms (${normalResult.length} 条结果)`);
  
  // 6. 聚合测试
  console.log('\n📈 聚合测试...');
  const jsonbStats = await jsonbUsers.aggregate([
    { $group: { _id: '$department', count: { $count: {} }, avgAge: { $avg: '$age' } } },
    { $sort: { count: -1 } }
  ]);
  
  console.log('按部门统计（JSONB 模式）:');
  jsonbStats.forEach(stat => {
    console.log(`  ${stat._id}: ${stat.count} 人，平均年龄 ${stat.avgAge.toFixed(1)}`);
  });
  
  // 7. 验证数据一致性
  console.log('\n✅ 验证数据一致性...');
  const jsonbCount = await jsonbUsers.countDocuments();
  const normalCount = await normalUsers.countDocuments();
  console.log(`JSONB 模式文档数：${jsonbCount}`);
  console.log(`普通模式文档数：${normalCount}`);
  console.log(`数据一致：${jsonbCount === normalCount ? '✓' : '✗'}`);
  
  // 8. 统计信息
  console.log('\n📋 统计信息...');
  const jsonbCollectionStats = await jsonbUsers.stats();
  const normalCollectionStats = await normalUsers.stats();
  
  console.log('JSONB 模式集合统计:', jsonbCollectionStats);
  console.log('普通模式集合统计:', normalCollectionStats);
  
  // 9. 数据库统计
  console.log('\n📊 数据库统计...');
  const jsonbDbStats = await jsonbDb.stats();
  const normalDbStats = await normalDb.stats();
  
  console.log('JSONB 数据库统计:', jsonbDbStats);
  console.log('普通数据库统计:', normalDbStats);
  
  // 关闭连接
  await jsonbDb.close();
  await normalDb.close();
  
  console.log('\n✅ 示例完成！');
  console.log('\n💡 JSONB 模式特点:');
  console.log('  - 二进制格式：[4 字节长度][UTF-8 JSON 数据]');
  console.log('  - 无格式化和空格，适合大规模数据存储');
  console.log('  - 向后兼容普通 JSON 格式');
  console.log('  - 适合对存储空间和 I/O 性能敏感的场景');
}

main().catch(console.error);
