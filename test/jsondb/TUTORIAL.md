# JSONDB 使用教程

> 基于 Node.js 的轻量级 JSON 数据库，支持 MongoDB 风格语法

本教程将从零开始，带你全面了解 JSONDB 的使用方法。

---

## 📑 目录

1. [快速开始](#1-快速开始)
2. [数据库操作](#2-数据库操作)
3. [文档 CRUD](#3-文档-crud)
4. [查询进阶](#4-查询进阶)
5. [索引优化](#5-索引优化)
6. [数据验证](#6-数据验证)
7. [JSONB 模式](#7-jsonb 模式)
8. [数据导入导出](#8-数据导入导出)
9. [最佳实践](#9-最佳实践)

---

## 1. 快速开始

### 1.1 安装

```bash
# 进入项目目录
cd jsondb

# 安装依赖
npm install
```

### 1.2 第一个数据库应用

创建 `examples/hello-world.js`：

```javascript
import { Database } from 'jsondb';

async function main() {
  // 1. 创建并打开数据库
  const db = new Database('./data/hello-db');
  await db.open();
  
  // 2. 获取集合
  const users = db.collection('users');
  
  // 3. 插入数据
  await users.insertOne({
    name: 'Alice',
    age: 25,
    email: 'alice@example.com'
  });
  
  // 4. 查询数据
  const allUsers = await users.find().toArray();
  console.log('所有用户:', allUsers);
  
  // 5. 关闭连接
  await db.close();
}

main().catch(console.error);
```

运行：

```bash
node examples/hello-world.js
```

输出：

```
所有用户: [
  {
    _id: '69b97819b8c51283144d6000',
    createdAt: '2026-03-17T15:00:00.000Z',
    name: 'Alice',
    age: 25,
    email: 'alice@example.com'
  }
]
```

### 1.3 查看生成的文件

```bash
# 查看数据库目录结构
ls -la data/hello-db/

# 查看集合数据
cat data/hello-db/users.json
```

---

## 2. 数据库操作

### 2.1 创建数据库

```javascript
import { Database } from 'jsondb';

// 创建数据库（自动创建目录）
const db = new Database('./data/mydb');
await db.open();
```

### 2.2 集合管理

```javascript
// 获取集合（不存在会自动创建）
const users = db.collection('users');

// 显式创建集合
const posts = await db.createCollection('posts');

// 列出所有集合
const collections = await db.listCollections();
console.log('集合列表:', collections);

// 删除集合
await db.dropCollection('posts');

// 获取数据库统计
const stats = await db.stats();
console.log('数据库统计:', stats);
```

### 2.3 关闭和删除数据库

```javascript
// 关闭连接
await db.close();

// 删除整个数据库
await db.drop();
```

---

## 3. 文档 CRUD

### 3.1 插入（Create）

```javascript
// 插入单个文档
const user = await users.insertOne({
  name: 'Alice',
  age: 25,
  tags: ['developer', 'admin']
});
console.log('插入的文档:', user);
// 输出包含自动生成的 _id 和 createdAt

// 插入多个文档
const result = await users.insertMany([
  { name: 'Bob', age: 30 },
  { name: 'Charlie', age: 28 },
  { name: 'David', age: 35 }
]);
console.log('插入结果:', result);
// { acknowledged: true, insertedCount: 3, insertedIds: {...} }
```

### 3.2 查询（Read）

```javascript
// 查询所有文档
const all = await users.find().toArray();

// 查询单个文档
const first = await users.findOne({ name: 'Alice' });

// 条件查询
const youngUsers = await users.find({ age: { $lt: 30 } }).toArray();

// 查询并排序
const sorted = await users.find().sort({ age: -1 }).toArray();

// 查询并分页
const page = await users.find().skip(10).limit(20).toArray();

// 查询并选择字段
const names = await users.find()
  .project({ name: 1, email: 1, _id: 0 })
  .toArray();
```

### 3.3 更新（Update）

```javascript
// 更新单个文档
await users.updateOne(
  { name: 'Alice' },
  { $set: { age: 26 } }
);

// 更新多个文档
await users.updateMany(
  { age: { $lt: 30 } },
  { $set: { status: 'young' } }
);

// 使用多个更新操作符
await users.updateOne(
  { name: 'Alice' },
  {
    $set: { age: 26 },
    $inc: { viewCount: 1 },
    $push: { tags: 'updated' }
  }
);

// 替换整个文档
await users.replaceOne(
  { name: 'Alice' },
  { name: 'Alice Updated', age: 27 }
);

// 插入或更新（upsert）
await users.updateOne(
  { name: 'Eve' },
  { $set: { age: 22 } },
  { upsert: true }
);
```

### 3.4 删除（Delete）

```javascript
// 删除单个文档
await users.deleteOne({ name: 'Alice' });

// 删除多个文档
await users.deleteMany({ age: { $lt: 18 } });

// 删除所有文档
await users.deleteMany({});
```

---

## 4. 查询进阶

### 4.1 比较操作符

```javascript
// $eq - 等于
await users.find({ age: { $eq: 25 } }).toArray();
await users.find({ age: 25 }).toArray(); // 简写

// $ne - 不等于
await users.find({ status: { $ne: 'deleted' } }).toArray();

// $gt, $gte - 大于/大于等于
await users.find({ age: { $gt: 18 } }).toArray();
await users.find({ age: { $gte: 18 } }).toArray();

// $lt, $lte - 小于/小于等于
await users.find({ age: { $lt: 60 } }).toArray();
await users.find({ age: { $lte: 60 } }).toArray();

// $in - 在数组中
await users.find({
  status: { $in: ['active', 'pending'] }
}).toArray();

// $nin - 不在数组中
await users.find({
  status: { $nin: ['deleted', 'banned'] }
}).toArray();
```

### 4.2 逻辑操作符

```javascript
// $and - 与
await users.find({
  $and: [
    { age: { $gte: 18 } },
    { status: 'active' }
  ]
}).toArray();

// $or - 或
await users.find({
  $or: [
    { age: { $lt: 18 } },
    { status: 'vip' }
  ]
}).toArray();

// 组合使用
await users.find({
  $and: [
    { age: { $gte: 18 } },
    {
      $or: [
        { status: 'vip' },
        { status: 'admin' }
      ]
    }
  ]
}).toArray();
```

### 4.3 数组操作符

```javascript
// $all - 包含所有指定元素
await products.find({
  tags: { $all: ['sale', 'new'] }
}).toArray();

// $elemMatch - 数组元素匹配
await products.find({
  scores: { $elemMatch: { $gte: 80 } }
}).toArray();

// $size - 数组大小
await products.find({
  tags: { $size: 3 }
}).toArray();
```

### 4.4 正则表达式

```javascript
// 模糊匹配
await users.find({
  name: { $regex: 'ali', $options: 'i' }
}).toArray();

// 开头匹配
await users.find({
  email: { $regex: '^admin' }
}).toArray();

// 结尾匹配
await users.find({
  email: { $regex: '@gmail\\.com$' }
}).toArray();
```

### 4.5 嵌套字段查询

```javascript
// 查询嵌套字段
await users.find({
  'address.city': 'Beijing'
}).toArray();

// 嵌套字段更新
await users.updateOne(
  { 'address.city': 'Beijing' },
  { $set: { 'address.zip': '100000' } }
);
```

### 4.6 聚合管道

```javascript
// 分组统计
const stats = await users.aggregate([
  { $group: {
    _id: '$department',
    count: { $count: {} },
    avgAge: { $avg: '$age' },
    totalSalary: { $sum: '$salary' }
  }},
  { $sort: { count: -1 } }
]);

// 多阶段聚合
const report = await orders.aggregate([
  { $match: { status: 'completed' }},
  { $group: {
    _id: '$customerId',
    total: { $sum: '$amount' }
  }},
  { $match: { total: { $gte: 1000 }}},
  { $sort: { total: -1 }},
  { $limit: 10 }
]);
```

---

## 5. 索引优化

### 5.1 创建索引

```javascript
// 创建单字段索引
await users.createIndex({ email: 1 });

// 创建复合索引
await users.createIndex({ department: 1, salary: -1 });

// 创建嵌套字段索引
await orders.createIndex({ 'customer.id': 1 });
```

### 5.2 使用索引

```javascript
// 自动使用索引（默认）
const result = await users.find({ email: 'test@example.com' }).toArray();

// 指定使用哪个索引
const result = await users.find({ email: 'test@example.com' })
  .hint('email_1')
  .toArray();

// 禁用索引（强制全表扫描）
const result = await users.find({ email: 'test@example.com' })
  .noIndex()
  .toArray();
```

### 5.3 索引管理

```javascript
// 列出所有索引
const indexes = await users.listIndexes();

// 删除索引
await users.dropIndex('email_1');
```

### 5.4 性能对比

```javascript
// 无索引查询
const start1 = Date.now();
await users.find({ department: 'Engineering' }).noIndex().toArray();
console.log('无索引:', Date.now() - start1, 'ms');

// 有索引查询
const start2 = Date.now();
await users.find({ department: 'Engineering' }).toArray();
console.log('有索引:', Date.now() - start2, 'ms');

// 输出示例：
// 无索引：10 ms
// 有索引：1 ms
```

---

## 6. 数据验证

### 6.1 创建 Schema

```javascript
import { createSchema } from 'jsondb';

const userSchema = createSchema({
  name: { 
    type: 'string', 
    required: true,
    minLength: 1,
    maxLength: 50
  },
  email: { 
    type: 'string', 
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  age: { 
    type: 'number', 
    min: 0, 
    max: 150 
  },
  status: { 
    type: 'string', 
    enum: ['active', 'inactive', 'pending'] 
  },
  tags: { 
    type: 'array', 
    items: { type: 'string' } 
  },
  address: {
    type: 'object',
    properties: {
      city: { type: 'string' },
      zip: { type: 'string' }
    }
  }
});
```

### 6.2 应用 Schema

```javascript
// 设置 Schema
users.setSchema(userSchema);

// 插入时自动验证
await users.insertOne({
  name: 'Alice',
  email: 'alice@example.com',
  age: 25
}); // ✓ 成功

await users.insertOne({
  name: 'Bob',
  age: 200 // 超过最大值
}); // ✗ ValidationError
```

### 6.3 验证选项

```javascript
// 严格模式（不允许额外字段）
users.setSchema(userSchema, {
  validateOnInsert: true,
  validateOnUpdate: false
});

// 手动验证
const schema = createSchema({
  name: { type: 'string', required: true }
});

const result = schema.validate({ name: 'Alice' });
if (!result.valid) {
  console.error('验证失败:', result.errors);
}
```

### 6.4 自定义验证

```javascript
const userSchema = createSchema({
  password: {
    type: 'custom',
    validate: (value) => {
      if (value.length < 8) {
        return '密码长度至少为 8 位';
      }
      if (!/[A-Z]/.test(value)) {
        return '密码必须包含大写字母';
      }
      return true;
    }
  }
});
```

### 6.5 默认值

```javascript
const userSchema = createSchema({
  name: { type: 'string' },
  status: { type: 'string', default: 'active' },
  role: { type: 'string', default: 'user' }
});

const doc = { name: 'Alice' };
const withDefaults = userSchema.applyDefaults(doc);
// { name: 'Alice', status: 'active', role: 'user' }
```

---

## 7. JSONB 模式

### 7.1 什么是 JSONB

JSONB 是二进制存储格式，相比普通 JSON：
- ✅ 更小的文件体积（无格式化和空格）
- ✅ 更快的读写速度
- ✅ 4 字节长度前缀，快速验证完整性
- ⚠️ 人类不可直接阅读

### 7.2 使用 JSONB 模式

```javascript
// 创建 JSONB 模式数据库
const db = new Database('./data/mydb', { jsonb: true });
await db.open();

// 查看统计信息
const stats = await db.stats();
console.log('JSONB 模式:', stats.jsonb); // true
```

### 7.3 文件格式对比

**普通 JSON:**
```json
{
  "_meta": { "name": "users", "count": 1 },
  "_documents": [{ "name": "Alice" }]
}
```

**JSONB（二进制）:**
```
[4 字节长度][UTF-8 JSON 数据]
0000004a 7b225f6d657461223a7b226e616d65223a227573657273227d7d
```

### 7.4 格式转换

```bash
# JSONB 转 JSON
node bin/cli-import.js convert data/users.json output/users.json --to-json --pretty

# JSON 转 JSONB
node bin/cli-import.js convert data/users.json output/users.jsonb --to-jsonb
```

---

## 8. 数据导入导出

### 8.1 导出数据

```bash
# 导出为 JSON
node bin/cli-export.js export data/users.json output/users.json --pretty

# 导出为 CSV
node bin/cli-export.js export data/users.json output/users.csv --format csv

# 导出为 Excel
node bin/cli-export.js export data/users.json output/users.xlsx --format xlsx

# 从数据库导出集合
node bin/cli-export.js db ./data/mydb users output/users.json --pretty

# 列出所有集合
node bin/cli-export.js list ./data/mydb
```

### 8.2 导入数据

```bash
# 从 CSV 导入
node bin/cli-import.js import users.csv ./data/mydb users

# 从 Excel 导入
node bin/cli-import.js import users.xlsx ./data/mydb users --format xlsx

# 导入为 JSONB 格式
node bin/cli-import.js import users.csv ./data/mydb users --jsonb
```

### 8.3 完整迁移示例

```bash
# 1. 导出旧数据库
node bin/cli-export.js db ./old-db users backup/users.json --pretty

# 2. 修改数据（手动编辑 JSON）
# ... 编辑 backup/users.json ...

# 3. 导入新数据库
node bin/cli-import.js import backup/users.json ./new-db users
```

---

## 9. 最佳实践

### 9.1 连接管理

```javascript
// ✅ 使用 try/finally 确保连接关闭
const db = new Database('./data/mydb');
try {
  await db.open();
  // ... 操作数据库
} finally {
  await db.close();
}

// ✅ 或使用 async/await
async function withDatabase(callback) {
  const db = new Database('./data/mydb');
  try {
    await db.open();
    return await callback(db);
  } finally {
    await db.close();
  }
}
```

### 9.2 批量操作

```javascript
// ✅ 使用 insertMany 而不是循环插入
await users.insertMany([
  { name: 'User 1' },
  { name: 'User 2' },
  { name: 'User 3' }
]);

// ❌ 避免循环插入
for (let i = 1; i <= 3; i++) {
  await users.insertOne({ name: `User ${i}` });
}
```

### 9.3 索引使用

```javascript
// ✅ 为常用查询字段创建索引
await users.createIndex({ email: 1 });
await users.createIndex({ department: 1, status: 1 });

// ✅ 使用 hint 指定索引
await users.find({ email: 'test@example.com' }).hint('email_1').toArray();

// ⚠️ 避免在索引字段上使用函数或表达式
```

### 9.4 数据验证

```javascript
// ✅ 为重要集合设置 Schema
users.setSchema(userSchema);

// ✅ 在应用层也进行验证
function validateUser(user) {
  if (!user.name || user.name.length < 1) {
    throw new Error('姓名不能为空');
  }
  return user;
}

// ✅ 结合使用
validateUser(userData);
await users.insertOne(userData);
```

### 9.5 错误处理

```javascript
import { ValidationError, CollectionNotFoundError } from 'jsondb';

try {
  await users.insertOne(data);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('验证失败:', error.errors);
  } else if (error instanceof CollectionNotFoundError) {
    console.error('集合不存在');
  } else {
    console.error('未知错误:', error.message);
  }
}
```

### 9.6 性能优化

```javascript
// ✅ 使用投影减少数据传输
await users.find()
  .project({ name: 1, email: 1 })
  .toArray();

// ✅ 使用 limit 限制结果数量
await users.find().limit(100).toArray();

// ✅ 使用索引优化查询
await users.createIndex({ status: 1 });
await users.find({ status: 'active' }).toArray();

// ✅ 避免全表扫描
await users.find({ status: 'active' }).noIndex().toArray(); // ❌
```

---

## 📚 附录

### A. API 速查表

| 方法 | 说明 |
|------|------|
| `db.collection(name)` | 获取集合 |
| `collection.insertOne(doc)` | 插入单个文档 |
| `collection.insertMany(docs)` | 插入多个文档 |
| `collection.find(query)` | 查询文档 |
| `collection.findOne(query)` | 查询单个文档 |
| `collection.updateOne(query, update)` | 更新单个文档 |
| `collection.updateMany(query, update)` | 更新多个文档 |
| `collection.deleteOne(query)` | 删除单个文档 |
| `collection.deleteMany(query)` | 删除多个文档 |
| `collection.createIndex(keys)` | 创建索引 |
| `collection.aggregate(pipeline)` | 聚合查询 |

### B. 操作符速查表

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `$eq` | 等于 | `{ age: { $eq: 25 } }` |
| `$ne` | 不等于 | `{ status: { $ne: 'deleted' } }` |
| `$gt` | 大于 | `{ age: { $gt: 18 } }` |
| `$lt` | 小于 | `{ age: { $lt: 60 } }` |
| `$in` | 在...中 | `{ status: { $in: ['A', 'B'] } }` |
| `$and` | 与 | `{ $and: [{a:1}, {b:2}] }` |
| `$or` | 或 | `{ $or: [{a:1}, {b:2}] }` |
| `$regex` | 正则 | `{ name: { $regex: '^A' } }` |
| `$set` | 设置 | `{ $set: { age: 26 } }` |
| `$inc` | 自增 | `{ $inc: { views: 1 } }` |
| `$push` | 推入数组 | `{ $push: { tags: 'new' } }` |

### C. 常见问题

**Q: 数据库文件存储在哪里？**
A: 默认在项目根目录的 `data/` 文件夹下，每个集合一个 JSON 文件。

**Q: 支持事务吗？**
A: 当前版本不支持事务，但提供了简单的锁机制防止并发写入冲突。

**Q: 最大支持多少数据？**
A: 适合小型到中型数据集（建议 < 100MB），大数据集建议使用专业数据库。

**Q: 可以在浏览器中使用吗？**
A: 可以，需要配合打包工具（如 Webpack、Vite）使用。

---

## 🎯 下一步

- 查看 [examples/](./examples/) 目录获取更多示例代码
- 运行 `npm test` 查看测试用例学习用法
- 阅读 [README.md](./README.md) 了解完整 API 文档

祝你使用愉快！🚀
