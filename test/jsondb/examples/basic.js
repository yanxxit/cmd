/**
 * JSONDB 基础使用示例
 * 使用 async/await 异步操作
 */

import { Database } from '../src/index.js';
import { rmSync, existsSync } from 'fs';

const DB_PATH = './data/example-db';

// 清理旧数据
if (existsSync(DB_PATH)) {
  rmSync(DB_PATH, { recursive: true, force: true });
}

// 主函数
async function main() {
  // 1. 连接数据库
  console.log('📦 连接数据库...');
  const db = new Database(DB_PATH);
  await db.open();

  // 2. 获取集合
  const users = db.collection('users');

  // 3. 插入文档
  console.log('\n📝 插入文档...');
  const user1 = await users.insertOne({
    name: 'Alice',
    age: 25,
    email: 'alice@example.com',
    skills: ['JavaScript', 'Node.js', 'React']
  });
  console.log('插入用户:', user1);

  const result = await users.insertMany([
    { name: 'Bob', age: 30, email: 'bob@example.com', skills: ['Python', 'Django'] },
    { name: 'Charlie', age: 28, email: 'charlie@example.com', skills: ['Java', 'Spring'] },
    { name: 'David', age: 35, email: 'david@example.com', skills: ['Go', 'Kubernetes'] }
  ]);
  console.log('批量插入:', result.insertedCount, '个文档');

  // 4. 查询文档
  console.log('\n🔍 查询文档...');

  // 查询所有
  const allUsers = await users.find().toArray();
  console.log('所有用户:', allUsers.length);

  // 条件查询
  const youngUsers = await users.find({ age: { $lt: 30 } }).toArray();
  console.log('年龄小于 30 的用户:', youngUsers.map(u => u.name));

  // 逻辑查询
  const orResult = await users.find({
    $or: [
      { age: { $gt: 32 } },
      { name: 'Alice' }
    ]
  }).toArray();
  console.log('年龄大于 32 或名字是 Alice:', orResult.map(u => u.name));

  // 5. 更新文档
  console.log('\n✏️ 更新文档...');
  await users.updateOne(
    { name: 'Alice' },
    { $set: { age: 26 }, $push: { skills: 'TypeScript' } }
  );
  const updatedAlice = await users.findOne({ name: 'Alice' });
  console.log('更新后的 Alice:', updatedAlice);

  // 批量更新
  await users.updateMany(
    {},
    { $set: { status: 'active' } }
  );

  // 6. 排序和分页
  console.log('\n📊 排序和分页...');
  const sorted = await users.find().sort({ age: -1 }).limit(2).toArray();
  console.log('年龄最大的 2 位:', sorted.map(u => `${u.name}(${u.age})`));

  // 7. 字段投影
  console.log('\n🎯 字段投影...');
  const projected = await users.find().project({ name: 1, email: 1, _id: 0 }).toArray();
  console.log('只显示姓名和邮箱:', projected[0]);

  // 8. 聚合查询
  console.log('\n📈 聚合查询...');
  const stats = await users.aggregate([
    { $group: { _id: null, avgAge: { $avg: '$age' }, count: { $count: {} } } }
  ]);
  console.log('统计信息:', stats[0]);

  // 9. 计数
  console.log('\n🔢 计数...');
  console.log('总用户数:', await users.countDocuments());
  console.log('活跃用户数:', await users.countDocuments({ status: 'active' }));

  // 10. 删除文档
  console.log('\n🗑️ 删除文档...');
  await users.deleteOne({ name: 'David' });
  console.log('删除 David 后剩余:', await users.countDocuments());

  // 11. 集合统计
  console.log('\n📋 集合统计...');
  const collectionStats = await users.stats();
  console.log('集合统计:', collectionStats);

  // 12. 数据库统计
  console.log('\n📊 数据库统计...');
  const dbStats = await db.stats();
  console.log('数据库统计:', dbStats);

  // 13. 使用 for await...of 遍历
  console.log('\n🔄 使用 for await...of 遍历...');
  for await (const user of users.find().limit(2)) {
    console.log(`  - ${user.name}: ${user.age}岁`);
  }

  // 14. 使用 async forEach
  console.log('\n🔄 使用 async forEach 遍历...');
  await users.find().forEach(async (user) => {
    console.log(`  - ${user.name}: ${user.email}`);
  });

  // 关闭连接
  await db.close();

  console.log('\n✅ 示例完成！');
}

// 运行主函数
main().catch(console.error);
