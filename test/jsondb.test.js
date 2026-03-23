import { Database } from 'jsondb';

async function main() {
  // 连接数据库（普通模式）
  const db = new Database('./temp/mydb');
  await db.open();

  // 连接数据库（JSONB 模式 - 更节省空间）
  const jsonbDb = new Database('./temp/mydb-jsonb', { jsonb: true });
  await jsonbDb.open();

  // 获取集合
  const users = db.collection('users');

  // 插入文档
  const user = await users.insertOne({
    name: 'Alice',
    age: 25,
    email: 'alice@example.com'
  });

  // 查询
  const allUsers = await users.find().toArray();
  const youngUsers = await users.find({ age: { $lt: 30 } }).toArray();

  // 更新
  await users.updateOne(
    { name: 'Alice' },
    { $set: { age: 26 } }
  );

  // 删除
  // await users.deleteOne({ name: 'Alice' });

  // 使用 for await...of 遍历
  for await (const user of users.find().limit(5)) {
    console.log(user.name);
  }

  // 关闭连接
  await db.close();
}

main().catch(console.error);