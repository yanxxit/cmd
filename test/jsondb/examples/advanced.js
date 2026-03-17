/**
 * JSONDB 高级查询示例
 * 使用 async/await 异步操作
 */

import { Database } from '../src/index.js';
import { rmSync, existsSync } from 'fs';

const DB_PATH = './data/advanced-db';

// 清理旧数据
if (existsSync(DB_PATH)) {
  rmSync(DB_PATH, { recursive: true, force: true });
}

// 主函数
async function main() {
  const db = new Database(DB_PATH);
  await db.open();

  // ==================== 示例 1: 数组查询 ====================
  console.log('=== 数组查询示例 ===\n');

  const products = db.collection('products');
  await products.insertMany([
    { name: 'Laptop', tags: ['electronics', 'computer', 'portable'], prices: [999, 899, 799] },
    { name: 'Mouse', tags: ['electronics', 'accessory'], prices: [25, 30] },
    { name: 'Desk', tags: ['furniture', 'office'], prices: [300] },
    { name: 'Chair', tags: ['furniture', 'office', 'comfortable'], prices: [150, 200] }
  ]);

  // $all - 匹配包含所有指定元素的数组
  const allTags = await products.find({
    tags: { $all: ['furniture', 'office'] }
  }).toArray();
  console.log('包含 furniture 和 office 标签:', allTags.map(p => p.name));

  // $elemMatch - 数组元素匹配复杂条件
  const elemMatchResult = await products.find({
    prices: { $elemMatch: { $gte: 200 } }
  }).toArray();
  console.log('有价格>=200 的产品:', elemMatchResult.map(p => p.name));

  // $size - 匹配数组大小
  const sizeResult = await products.find({
    tags: { $size: 3 }
  }).toArray();
  console.log('有 3 个标签的产品:', sizeResult.map(p => p.name));

  // ==================== 示例 2: 正则表达式查询 ====================
  console.log('\n=== 正则表达式查询示例 ===\n');

  const articles = db.collection('articles');
  await articles.insertMany([
    { title: 'Introduction to Node.js', author: 'Alice', views: 1000 },
    { title: 'Advanced JavaScript', author: 'Bob', views: 2000 },
    { title: 'Python for Beginners', author: 'Alice', views: 1500 },
    { title: 'React Best Practices', author: 'Charlie', views: 800 }
  ]);

  // $regex - 正则匹配
  const regexResult = await articles.find({
    title: { $regex: 'javascript', $options: 'i' }
  }).toArray();
  console.log('标题包含 JavaScript:', regexResult.map(a => a.title));

  // 以特定字符串开头
  const startsWith = await articles.find({
    title: { $regex: '^I' }
  }).toArray();
  console.log('标题以 I 开头:', startsWith.map(a => a.title));

  // ==================== 示例 3: 嵌套字段查询 ====================
  console.log('\n=== 嵌套字段查询示例 ===\n');

  const employees = db.collection('employees');
  await employees.insertMany([
    { name: 'Alice', address: { city: 'Beijing', zip: '100000' }, contact: { email: 'alice@example.com', phone: '123456' } },
    { name: 'Bob', address: { city: 'Shanghai', zip: '200000' }, contact: { email: 'bob@example.com', phone: '234567' } },
    { name: 'Charlie', address: { city: 'Beijing', zip: '100001' }, contact: { email: 'charlie@example.com', phone: '345678' } }
  ]);

  // 查询嵌套字段
  const beijingEmployees = await employees.find({
    'address.city': 'Beijing'
  }).toArray();
  console.log('北京的员工:', beijingEmployees.map(e => e.name));

  // ==================== 示例 4: 复杂更新操作 ====================
  console.log('\n=== 复杂更新操作示例 ===\n');

  const inventory = db.collection('inventory');
  await inventory.insertOne({
    item: 'Widget',
    quantity: 100,
    price: 9.99,
    tags: ['sale', 'new']
  });

  // $inc - 自增
  await inventory.updateOne(
    { item: 'Widget' },
    { $inc: { quantity: -10, price: 1.00 } }
  );

  // $mul - 自乘
  await inventory.updateOne(
    { item: 'Widget' },
    { $mul: { price: 0.9 } }  // 打 9 折
  );

  // $rename - 重命名字段
  await inventory.updateOne(
    { item: 'Widget' },
    { $rename: { price: 'currentPrice' } }
  );

  // $pull - 从数组中删除
  await inventory.updateOne(
    { item: 'Widget' },
    { $pull: { tags: 'sale' } }
  );

  const updated = await inventory.findOne({ item: 'Widget' });
  console.log('更新后的库存:', updated);

  // ==================== 示例 5: 聚合管道 ====================
  console.log('\n=== 聚合管道示例 ===\n');

  const sales = db.collection('sales');
  await sales.insertMany([
    { date: '2026-01-01', item: 'A', amount: 100, quantity: 2, region: 'North' },
    { date: '2026-01-01', item: 'B', amount: 50, quantity: 5, region: 'South' },
    { date: '2026-01-02', item: 'A', amount: 100, quantity: 3, region: 'North' },
    { date: '2026-01-02', item: 'C', amount: 25, quantity: 10, region: 'East' },
    { date: '2026-01-03', item: 'B', amount: 50, quantity: 2, region: 'South' }
  ]);

  // 按物品分组，计算总销售额
  const byItem = await sales.aggregate([
    { $group: { _id: '$item', totalAmount: { $sum: '$amount' }, totalQuantity: { $sum: '$quantity' } } }
  ]);
  console.log('按物品统计:', byItem);

  // 按地区分组，计算平均销售额
  const byRegion = await sales.aggregate([
    { $group: { _id: '$region', avgAmount: { $avg: '$amount' }, count: { $count: {} } } }
  ]);
  console.log('按地区统计:', byRegion);

  // 多阶段聚合：筛选 + 分组 + 排序
  const complexAgg = await sales.aggregate([
    { $match: { amount: { $gte: 50 } } },
    { $group: { _id: '$item', total: { $sum: '$amount' }, avgQty: { $avg: '$quantity' } } },
    { $sort: { total: -1 } },
    { $limit: 2 }
  ]);
  console.log('复杂聚合（筛选 + 分组 + 排序 + 限制）:', complexAgg);

  // ==================== 示例 6: 索引操作 ====================
  console.log('\n=== 索引操作示例 ===\n');

  const books = db.collection('books');
  await books.insertMany([
    { title: 'Book 1', author: 'Author A', year: 2020 },
    { title: 'Book 2', author: 'Author B', year: 2021 },
    { title: 'Book 3', author: 'Author A', year: 2022 }
  ]);

  // 创建索引
  const index = await books.createIndex({ author: 1 });
  console.log('创建索引:', index);

  // 列出索引
  const indexes = await books.listIndexes();
  console.log('所有索引:', indexes.map(i => i.name));

  // ==================== 示例 7: 并发操作 ====================
  console.log('\n=== 并发操作示例 ===\n');

  const tasks = db.collection('tasks');
  
  // 并发插入
  await Promise.all([
    tasks.insertOne({ name: 'Task 1', status: 'pending' }),
    tasks.insertOne({ name: 'Task 2', status: 'pending' }),
    tasks.insertOne({ name: 'Task 3', status: 'pending' })
  ]);
  
  console.log('并发插入后数量:', await tasks.countDocuments());
  
  // 并发更新
  await Promise.all([
    tasks.updateOne({ name: 'Task 1' }, { $set: { status: 'completed' } }),
    tasks.updateOne({ name: 'Task 2' }, { $set: { status: 'in-progress' } }),
    tasks.updateOne({ name: 'Task 3' }, { $set: { status: 'pending' } })
  ]);
  
  console.log('并发更新后:');
  await tasks.find().forEach(task => {
    console.log(`  - ${task.name}: ${task.status}`);
  });

  // 关闭连接
  await db.close();

  console.log('\n✅ 高级示例完成！');
}

// 运行主函数
main().catch(console.error);
