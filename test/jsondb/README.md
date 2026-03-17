# JSONDB - 基于 Node.js 的轻量级 JSON 数据库

## 项目概述

**JSONDB** 是一个基于 Node.js 实现的轻量级文档型数据库，使用 JSON 文件作为存储介质，提供类似 MongoDB 的查询语法和操作接口。适合小型项目、原型开发、测试环境和本地应用。

### 核心特点

- 📦 **零依赖部署** - 无需安装数据库服务器，开箱即用
- 📝 **JSON 存储** - 数据以 JSON 格式持久化到本地文件
- 🔧 **MongoDB 风格语法** - 熟悉的查询和操作方式，学习成本低
- 🚀 **轻量快速** - 适合小型项目和本地开发
- 🔍 **丰富查询** - 支持条件查询、排序、分页、聚合等
- 📊 **索引支持** - 可选的索引机制提升查询性能

---

## 快速开始

### 安装

```bash
npm install
```

### 基本使用

```javascript
import { Database } from 'jsondb';

async function main() {
  // 连接数据库（普通模式）
  const db = new Database('./data/mydb');
  await db.open();

  // 连接数据库（JSONB 模式 - 更节省空间）
  const jsonbDb = new Database('./data/mydb-jsonb', { jsonb: true });
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
  await users.deleteOne({ name: 'Alice' });

  // 使用 for await...of 遍历
  for await (const user of users.find().limit(5)) {
    console.log(user.name);
  }

  // 关闭连接
  await db.close();
}

main().catch(console.error);
```

### JSONB 模式

JSONB（JSON Binary）模式使用二进制格式存储数据，适合对存储空间和 I/O 性能敏感的场景：

```javascript
// 启用 JSONB 模式
const db = new Database('./data/mydb', { jsonb: true });

// 查看统计信息
const stats = await db.stats();
console.log(stats.jsonb); // true
```

**JSONB 二进制格式：**
```
[4 字节长度 (uint32 BE)][UTF-8 JSON 数据...]
```

**JSONB 模式特点：**
- ✅ 二进制存储，无格式化和空格
- ✅ 4 字节长度前缀，快速验证完整性
- ✅ 向后兼容普通 JSON 格式
- ✅ 适合大规模数据存储
- ✅ 更小的文件体积（约节省 30-40%）
- ⚠️ 人类不可直接阅读（需要解码）

**使用场景：**
- 生产环境数据存储
- 大规模数据集
- 对存储空间敏感的应用
- 需要快速加载的场景

### 运行示例

```bash
# 运行基础示例
npm run example

# 运行测试
npm test
```

---

## 命令行工具

### 导出工具

```bash
# 导出单个文件（支持 JSON/JSONB）
node bin/cli-export.js export <输入文件> <输出文件> [选项]

# 从数据库导出集合
node bin/cli-export.js db <数据库目录> <集合名> <输出文件> [选项]

# 列出数据库中的所有集合
node bin/cli-export.js list <数据库目录>
```

### 导入工具

```bash
# 从 CSV/XLSX/JSON 导入数据
node bin/cli-import.js import <输入文件> <数据库目录> <集合名> [选项]

# 转换文件格式（JSON ↔ JSONB）
node bin/cli-import.js convert <输入文件> <输出文件> [选项]
```

### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-f, --format <format>` | 输入/输出格式 (json, csv, xlsx) | auto |
| `-p, --pretty` | 格式化 JSON 输出 | false |
| `-d, --delimiter <char>` | CSV 分隔符 | , |
| `--no-header` | 不包含 CSV 表头 | false |
| `--no-flatten` | 不扁平化嵌套对象 | false |
| `--jsonb` | 使用 JSONB 二进制格式存储 | false |
| `--to-jsonb` | 转换为 JSONB 格式 | false |
| `--to-json` | 转换为 JSON 格式 | false |

### 使用示例

```bash
# ============ 导出 ============

# 导出 JSONB 文件为 JSON
node bin/cli-export.js export data/users.json output/users.json --pretty

# 导出为 CSV
node bin/cli-export.js export data/users.json output/users.csv --format csv

# 导出为 XLSX
node bin/cli-export.js export data/users.json output/users.xlsx --format xlsx

# 从数据库导出集合
node bin/cli-export.js db ./data/mydb users output/users.json --pretty

# ============ 导入 ============

# 从 CSV 导入（自动检测格式）
node bin/cli-import.js import users.csv ./data/mydb users

# 从 CSV 导入到 JSONB 格式
node bin/cli-import.js import users.csv ./data/mydb users --jsonb

# 从 XLSX 导入
node bin/cli-import.js import users.xlsx ./data/mydb users --format xlsx

# 转换 JSONB 为 JSON
node bin/cli-import.js convert data/users.json output/users.json --to-json --pretty

# 转换 JSON 为 JSONB
node bin/cli-import.js convert data/users.json output/users.jsonb --to-jsonb
```

## 功能需求

### 1. 核心功能

#### 1.1 数据库管理

- ✅ 创建/打开数据库
- ✅ 关闭数据库连接
- ✅ 删除数据库
- ✅ 列出所有集合

#### 1.2 集合（Collection）操作

- ✅ 创建集合
- ✅ 删除集合
- ✅ 重命名集合
- ✅ 获取集合统计信息

#### 1.3 文档（Document）操作

**CRUD 操作：**
- ✅ **插入** - `insertOne()`, `insertMany()`
- ✅ **查询** - `find()`, `findOne()`
- ✅ **更新** - `updateOne()`, `updateMany()`, `replaceOne()`
- ✅ **删除** - `deleteOne()`, `deleteMany()`
- ✅ **计数** - `countDocuments()`
- ✅ **去重** - `distinct()`

#### 1.4 查询功能

**比较操作符：**
- `$eq` - 等于
- `$ne` - 不等于
- `$gt` - 大于
- `$gte` - 大于等于
- `$lt` - 小于
- `$lte` - 小于等于

**逻辑操作符：**
- `$and` - 与
- `$or` - 或
- `$not` - 非
- `$nor` - 或非

**元素操作符：**
- `$exists` - 字段存在
- `$type` - 字段类型

**数组操作符：**
- `$in` - 在数组中
- `$nin` - 不在数组中
- `$all` - 包含所有
- `$elemMatch` - 数组元素匹配
- `$size` - 数组大小

**正则表达式：**
- `$regex` - 正则匹配
- `$options` - 正则选项

#### 1.5 更新操作符

**字段操作符：**
- `$set` - 设置字段
- `$unset` - 删除字段
- `$setOnInsert` - 插入时设置
- `$rename` - 重命名字段

**数值操作符：**
- `$inc` - 自增
- `$mul` - 自乘
- `$min` - 最小值
- `$max` - 最大值

**数组操作符：**
- `$push` - 推入数组
- `$pop` - 弹出数组
- `$pull` - 拉出数组
- `$addToSet` - 添加到集合
- `$each` - 批量操作

#### 1.6 查询选项

- ✅ **排序** - `sort()`
- ✅ **跳过** - `skip()`
- ✅ **限制** - `limit()`
- ✅ **投影** - `project()` / 字段选择
- ✅ **批量大小** - `batchSize()`

#### 1.7 聚合管道

- ✅ `$match` - 过滤
- ✅ `$group` - 分组
- ✅ `$project` - 投影
- ✅ `$sort` - 排序
- ✅ `$limit` - 限制
- ✅ `$skip` - 跳过
- ✅ `$count` - 计数
- ✅ `$sum` - 求和
- ✅ `$avg` - 平均值
- ✅ `$min` / `$max` - 最小/最大值
- ✅ `$push` / `$addToSet` - 数组聚合
- ✅ `$lookup` - 关联查询（可选）

---

## 技术架构

### 目录结构

```
jsondb/
├── src/
│   ├── index.js           # 主入口
│   ├── Database.js        # 数据库类
│   ├── Collection.js      # 集合类
│   ├── Cursor.js          # 游标类
│   ├── Query.js           # 查询解析器
│   ├── Operators.js       # 操作符实现
│   ├── Index.js           # 索引管理
│   ├── Utils.js           # 工具函数
│   └── errors.js          # 错误定义
├── data/                  # 数据存储目录
│   └── <database>/
│       ├── _meta.json     # 数据库元数据
│       └── <collection>.json
├── test/                  # 测试文件
│   ├── basic.test.js
│   ├── query.test.js
│   ├── update.test.js
│   └── aggregate.test.js
├── examples/              # 示例代码
├── package.json
└── README.md
```

### 核心类设计

#### Database 类

```javascript
class Database {
  constructor(dbPath)
  open()
  close()
  collection(name)
  createCollection(name, options)
  dropCollection(name)
  listCollections()
  stats()
}
```

#### Collection 类

```javascript
class Collection {
  constructor(db, name)
  insertOne(doc)
  insertMany(docs)
  find(query, options)
  findOne(query, options)
  updateOne(query, update, options)
  updateMany(query, update, options)
  replaceOne(query, doc, options)
  deleteOne(query)
  deleteMany(query)
  countDocuments(query)
  distinct(key, query)
  aggregate(pipeline)
  createIndex(keys, options)
  dropIndex(name)
  listIndexes()
}
```

#### Cursor 类

```javascript
class Cursor {
  constructor(collection, query, options)
  sort(sortSpec)
  skip(count)
  limit(count)
  project(projection)
  next()
  toArray()
  forEach(callback)
}
```

### 数据存储格式

#### 数据库元数据 (`_meta.json`)

```json
{
  "name": "mydb",
  "version": "1.0.0",
  "createdAt": "2026-03-17T00:00:00.000Z",
  "collections": ["users", "posts", "comments"],
  "options": {}
}
```

#### 集合数据 (`<collection>.json`)

```json
{
  "_meta": {
    "name": "users",
    "count": 3,
    "indexes": [{"key": {"_id": 1}, "name": "_id_"}]
  },
  "_indexes": {
    "_id_": { "type": "btree", "data": {} }
  },
  "_documents": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Alice",
      "age": 25,
      "email": "alice@example.com",
      "createdAt": "2026-03-17T00:00:00.000Z"
    }
  ]
}
```

---

## 使用示例

### 基本使用

```javascript
import { Database } from 'jsondb';

// 连接数据库
const db = new Database('./data/mydb');
await db.open();

// 获取集合
const users = db.collection('users');

// 插入文档
await users.insertOne({
  name: 'Alice',
  age: 25,
  email: 'alice@example.com'
});

await users.insertMany([
  { name: 'Bob', age: 30 },
  { name: 'Charlie', age: 28 }
]);

// 查询
const allUsers = await users.find().toArray();
const youngUsers = await users.find({ age: { $lt: 30 } }).toArray();

// 更新
await users.updateOne(
  { name: 'Alice' },
  { $set: { age: 26 } }
);

// 删除
await users.deleteOne({ name: 'Bob' });

// 聚合
const stats = await users.aggregate([
  { $group: { _id: null, avgAge: { $avg: '$age' } } }
]);

// 关闭连接
await db.close();
```

### 高级查询

```javascript
// 复杂条件查询
const result = await users.find({
  $and: [
    { age: { $gte: 25 } },
    { age: { $lt: 35 } },
    { status: { $in: ['active', 'pending'] } }
  ]
}).sort({ age: -1 }).limit(10).toArray();

// 数组查询
const posts = await db.collection('posts').find({
  tags: { $all: ['nodejs', 'database'] },
  likes: { $gte: 100 }
}).toArray();

// 正则查询
const found = await users.find({
  email: { $regex: /@gmail\.com$/, $options: 'i' }
}).toArray();
```

---

## 开发计划

### Phase 1: 基础框架 (Week 1)

- [ ] 项目初始化
- [ ] Database 类实现
- [ ] Collection 类实现
- [ ] 基本 CRUD 操作
- [ ] 单元测试框架搭建

### Phase 2: 查询引擎 (Week 2)

- [ ] 查询解析器实现
- [ ] 比较操作符
- [ ] 逻辑操作符
- [ ] 数组操作符
- [ ] 正则表达式支持
- [ ] Cursor 类实现

### Phase 3: 更新与索引 (Week 3)

- [ ] 更新操作符实现
- [ ] 索引机制设计
- [ ] 索引创建与查询优化
- [ ] 性能基准测试

### Phase 4: 聚合管道 (Week 4)

- [ ] 聚合框架设计
- [ ] 常用管道阶段实现
- [ ] 表达式系统
- [ ] 完整测试覆盖

### Phase 5: 优化与完善 (Week 5)

- [ ] 事务支持（可选）
- [ ] 并发控制
- [ ] 数据验证
- [ ] 文档完善
- [ ] 示例代码

---

## API 参考

### Database 类

```javascript
const db = new Database('./data/mydb');

await db.open();              // 打开数据库
await db.close();             // 关闭数据库
await db.drop();              // 删除数据库

db.collection(name);          // 获取集合（同步）
await db.createCollection(name);  // 创建集合
await db.dropCollection(name);    // 删除集合
await db.listCollections();       // 列出所有集合
await db.stats();                 // 获取统计信息
```

### Collection 类

```javascript
const collection = db.collection('users');

// 插入
await collection.insertOne(doc);
await collection.insertMany([docs]);

// 查询
const cursor = collection.find(query);  // 返回 Cursor
const doc = await collection.findOne(query);

// 更新
await collection.updateOne(query, update);
await collection.updateMany(query, update);
await collection.replaceOne(query, doc);

// 删除
await collection.deleteOne(query);
await collection.deleteMany(query);

// 统计
await collection.countDocuments(query);
await collection.distinct(key, query);
await collection.aggregate(pipeline);

// 索引
await collection.createIndex(keys);
await collection.dropIndex(name);
await collection.listIndexes();
await collection.stats();
```

### Cursor 类

```javascript
const cursor = collection.find(query)
  .sort({ age: -1 })
  .skip(10)
  .limit(20)
  .project({ name: 1, email: 1 });

const results = await cursor.toArray();   // 获取所有结果
const first = await cursor.first();       // 获取第一个
const next = await cursor.next();         // 获取下一个
const count = await cursor.count();       // 获取数量

// 遍历
await cursor.forEach(doc => {
  console.log(doc);
});

// for await...of
for await (const doc of cursor) {
  console.log(doc.name);
}
```

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `$eq` | 等于 | `{ age: { $eq: 25 } }` |
| `$ne` | 不等于 | `{ status: { $ne: 'deleted' } }` |
| `$gt` | 大于 | `{ price: { $gt: 100 } }` |
| `$gte` | 大于等于 | `{ score: { $gte: 60 } }` |
| `$lt` | 小于 | `{ age: { $lt: 18 } }` |
| `$lte` | 小于等于 | `{ level: { $lte: 5 } }` |
| `$in` | 在...中 | `{ status: { $in: ['A', 'B'] } }` |
| `$nin` | 不在...中 | `{ type: { $nin: ['test'] } }` |
| `$and` | 与 | `{ $and: [{ a: 1 }, { b: 2 }] }` |
| `$or` | 或 | `{ $or: [{ a: 1 }, { b: 2 }] }` |
| `$not` | 非 | `{ price: { $not: { $gte: 100 } } }` |
| `$exists` | 字段存在 | `{ phone: { $exists: true } }` |
| `$regex` | 正则 | `{ name: { $regex: /^A/ } }` |
| `$all` | 数组包含所有 | `{ tags: { $all: ['a', 'b'] } }` |
| `$size` | 数组大小 | `{ comments: { $size: 5 } }` |
| `$elemMatch` | 数组元素匹配 | `{ scores: { $elemMatch: { $gte: 80 } } }` |

### 更新操作符

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `$set` | 设置字段 | `{ $set: { status: 'active' } }` |
| `$unset` | 删除字段 | `{ $unset: { temp: '' } }` |
| `$inc` | 自增 | `{ $inc: { views: 1 } }` |
| `$mul` | 自乘 | `{ $mul: { price: 0.8 } }` |
| `$push` | 推入数组 | `{ $push: { tags: 'new' } }` |
| `$pull` | 拉出数组 | `{ $pull: { tags: 'old' } }` |
| `$addToSet` | 添加到集合 | `{ $addToSet: { colors: 'red' } }` |
| `$pop` | 弹出数组 | `{ $pop: { items: 1 } }` |

### 聚合管道

| 阶段 | 说明 |
|------|------|
| `$match` | 过滤文档 |
| `$group` | 分组聚合 |
| `$project` | 重塑文档 |
| `$sort` | 排序 |
| `$limit` | 限制数量 |
| `$skip` | 跳过数量 |
| `$count` | 计数 |
| `$lookup` | 关联查询 |
| `$unwind` | 展开数组 |

---

## 技术栈

- **运行时**: Node.js >= 18
- **语言**: JavaScript (ES Modules)
- **测试**: Vitest / Jest
- **代码质量**: ESLint + Prettier
- **文档**: Markdown
- **包管理**: npm / pnpm

---

## 许可证

MIT License

---

## 相关链接

- [MongoDB 查询文档](https://docs.mongodb.com/manual/reference/operator/query/)
- [Node.js 官方文档](https://nodejs.org/)
