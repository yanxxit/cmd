/**
 * JSONDB - 基于 Node.js 的轻量级 JSON 数据库
 * 支持 MongoDB 风格语法
 * 
 * @example
 * import { Database } from 'jsondb';
 * 
 * const db = new Database('./data/mydb');
 * await db.open();
 * 
 * const users = db.collection('users');
 * await users.insertOne({ name: 'Alice', age: 25 });
 * 
 * await db.close();
 */

export { Database } from './Database.js';
export { Collection } from './Collection.js';
export { Cursor } from './Cursor.js';

// 导出错误类
export {
  JSONDBError,
  DatabaseNotFoundError,
  DatabaseExistsError,
  CollectionNotFoundError,
  CollectionExistsError,
  DocumentNotFoundError,
  IndexError,
  QueryError,
  ValidationError
} from './errors.js';

// 导出工具函数
export {
  generateId,
  deepClone,
  getNestedValue,
  setNestedValue,
  deleteNestedValue
} from './Utils.js';

// 导出查询操作符
export {
  matchQuery,
  applyUpdate,
  comparisonOperators,
  logicalOperators,
  elementOperators,
  arrayOperators
} from './Operators.js';

// 导出 Schema 验证
export {
  Schema,
  createSchema,
  createValidator,
  validators
} from './Schema.js';

// 导出批量操作
export {
  BulkOperation,
  createBulkOp,
  bulkInsert,
  bulkUpdate,
  bulkDelete
} from './BulkOp.js';

// 导出查询缓存
export {
  QueryCache,
  globalQueryCache,
  cacheQuery
} from './QueryCache.js';

// 导出事务
export {
  Transaction,
  TransactionStatus,
  OperationType,
  createTransaction,
  withTransaction
} from './Transaction.js';

/**
 * 默认导出
 */
import { Database } from './Database.js';
export default Database;
