/**
 * JSONDB SQL 查询使用示例
 * 
 * JSONDB 支持标准 SQL 语法子集，可以直接使用 SQL 进行增删改查操作
 */

import { Database } from 'jsondb';

async function main() {
  const db = new Database('./temp/sql-example-db');
  await db.open();

  const users = db.collection('users');

  // 清空集合
  await users.deleteMany({});

  console.log('========== JSONDB SQL 查询示例 ==========\n');

  // ========== 1. INSERT 插入数据 ==========
  console.log('1️⃣  INSERT - 插入数据');
  
  // 单条插入
  await users.sql("INSERT INTO users (name, age, email, department) VALUES ('Alice', 25, 'alice@example.com', 'Engineering')");
  
  // 多条插入
  await users.sql(`
    INSERT INTO users (name, age, email, department) VALUES 
    ('Bob', 30, 'bob@example.com', 'Sales'),
    ('Charlie', 28, 'charlie@example.com', 'Engineering'),
    ('David', 35, 'david@example.com', 'HR'),
    ('Eve', 22, 'eve@example.com', 'Sales')
  `);
  
  console.log('✅ 已插入 5 条记录\n');

  // ========== 2. SELECT 查询数据 ==========
  console.log('2️⃣  SELECT - 查询数据');

  // 查询所有
  console.log('查询所有用户:');
  const all = await users.sql('SELECT * FROM users');
  console.log(`   共 ${all.data?.length} 条\n`);

  // 指定列查询
  console.log('只查询姓名和年龄:');
  const names = await users.sql('SELECT name, age FROM users');
  console.log(`   ${JSON.stringify(names.data?.map((u) => u.name))}\n`);

  // WHERE 条件查询
  console.log('查询年龄大于 25 岁的用户:');
  const older = await users.sql('SELECT * FROM users WHERE age > 25');
  console.log(`   共 ${older.data?.length} 条\n`);

  // 多条件 AND
  console.log('查询 Engineering 部门且年龄大于 25 的用户:');
  const andResult = await users.sql("SELECT * FROM users WHERE age > 25 AND department = 'Engineering'");
  console.log(`   共 ${andResult.data?.length} 条\n`);

  // OR 条件
  console.log('查询年龄小于 25 或大于 30 的用户:');
  const orResult = await users.sql('SELECT * FROM users WHERE age < 25 OR age > 30');
  console.log(`   共 ${orResult.data?.length} 条\n`);

  // ========== 3. 比较操作符 ==========
  console.log('3️⃣  比较操作符');

  console.log('年龄 >= 30:');
  const gte = await users.sql('SELECT * FROM users WHERE age >= 30');
  console.log(`   共 ${gte.data?.length} 条\n`);

  console.log('部门 != Engineering:');
  const ne = await users.sql("SELECT * FROM users WHERE department != 'Engineering'");
  console.log(`   共 ${ne.data?.length} 条\n`);

  // ========== 4. LIKE 模糊查询 ==========
  console.log('4️⃣  LIKE 模糊查询');

  console.log('邮箱以 @example.com 结尾:');
  const like = await users.sql("SELECT * FROM users WHERE email LIKE '%@example.com'");
  console.log(`   共 ${like.data?.length} 条\n`);

  console.log('姓名以 A 开头:');
  const likeStart = await users.sql("SELECT * FROM users WHERE name LIKE 'A%'");
  console.log(`   共 ${likeStart.data?.length} 条\n`);

  // ========== 5. IN 操作符 ==========
  console.log('5️⃣  IN 操作符');

  console.log('部门在 (Engineering, Sales) 中:');
  const inResult = await users.sql("SELECT * FROM users WHERE department IN ('Engineering', 'Sales')");
  console.log(`   共 ${inResult.data?.length} 条\n`);

  // ========== 6. ORDER BY 排序 ==========
  console.log('6️⃣  ORDER BY 排序');

  console.log('按年龄升序:');
  const asc = await users.sql('SELECT name, age FROM users ORDER BY age ASC');
  console.log(`   ${JSON.stringify(asc.data?.map((u) => u.age))}\n`);

  console.log('按年龄降序:');
  const desc = await users.sql('SELECT name, age FROM users ORDER BY age DESC');
  console.log(`   ${JSON.stringify(desc.data?.map((u) => u.age))}\n`);

  // ========== 7. LIMIT 和 OFFSET ==========
  console.log('7️⃣  LIMIT 和 OFFSET');

  console.log('限制 3 条:');
  const limit = await users.sql('SELECT * FROM users LIMIT 3');
  console.log(`   共 ${limit.data?.length} 条\n`);

  console.log('跳过前 2 条，取 2 条:');
  const offset = await users.sql('SELECT * FROM users LIMIT 2 OFFSET 2');
  console.log(`   共 ${offset.data?.length} 条\n`);

  // ========== 8. DISTINCT 去重 ==========
  console.log('8️⃣  DISTINCT 去重');

  console.log('所有不同的部门:');
  const distinct = await users.sql('SELECT DISTINCT department FROM users');
  console.log(`   ${JSON.stringify(distinct.data?.map((d) => d.department))}\n`);

  // ========== 9. UPDATE 更新数据 ==========
  console.log('9️⃣  UPDATE - 更新数据');

  console.log('将 Alice 的年龄更新为 26:');
  const update = await users.sql("UPDATE users SET age = 26 WHERE name = 'Alice'");
  console.log(`   更新了 ${update.affectedRows} 条记录\n`);

  console.log('将所有用户部门设置为 Unknown:');
  const updateAll = await users.sql("UPDATE users SET department = 'Unknown'");
  console.log(`   更新了 ${updateAll.affectedRows} 条记录\n`);

  // ========== 10. DELETE 删除数据 ==========
  console.log('🔟  DELETE - 删除数据');

  console.log('删除年龄小于 25 的用户:');
  const deleteResult = await users.sql('DELETE FROM users WHERE age < 25');
  console.log(`   删除了 ${deleteResult.affectedRows} 条记录\n`);

  // ========== 11. 复杂查询示例 ==========
  console.log('📊  复杂查询示例');

  console.log('查询 Sales 或 Engineering 部门，年龄 25-30 岁，按年龄降序，取前 2 条:');
  const complex = await users.sql(`
    SELECT name, age, department 
    FROM users 
    WHERE department IN ('Engineering', 'Sales') 
      AND age BETWEEN 25 AND 30
    ORDER BY age DESC
    LIMIT 2
  `);
  console.log(`   ${JSON.stringify(complex.data, null, 2)}\n`);

  // ========== 12. SQL 解析器直接使用 ==========
  // console.log('🔧  SQL 解析器直接使用');
  // const { parseSQL } = await import('../src/SQLParser.js');
  
  // const sql = 'SELECT name, age FROM users WHERE age > 25 ORDER BY age DESC LIMIT 10';
  // const parsed = parseSQL(sql);
  // console.log(`解析 SQL: ${sql}`);
  // console.log(`结果：${JSON.stringify(parsed, null, 2)}\n`);

  await db.close();

  // 清理
  // import('fs').then(({ rmSync }) => {
  //   rmSync('./temp/sql-example-db', { recursive: true, force: true });
  // });

  console.log('========== 示例结束 ==========\n');
}

main().catch(console.error);
