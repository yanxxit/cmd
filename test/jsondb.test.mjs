import jsondb from './jsondb/src/index.js'

async function main() {
  const db = await jsondb.open('db')
  const collection = await db.createCollection('users')
  await collection.insertOne({ name: '张三' })
  await collection.insertOne({ name: '李四' })
  await collection.insertOne({ name: '王五' })
  await collection.insertOne({ name: '赵六' })
  await collection.insertOne({ name: '孙七' })

  let users = await collection.find();
  console.log(users);
  await db.close()
  process.exit(0)
}