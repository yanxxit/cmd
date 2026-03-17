/**
 * JSONDB 错误类定义
 */

/**
 * 基础错误类
 */
export class JSONDBError extends Error {
  constructor(message) {
    super(message);
    this.name = 'JSONDBError';
  }
}

/**
 * 数据库不存在错误
 */
export class DatabaseNotFoundError extends JSONDBError {
  constructor(dbPath) {
    super(`数据库不存在：${dbPath}`);
    this.name = 'DatabaseNotFoundError';
  }
}

/**
 * 数据库已存在错误
 */
export class DatabaseExistsError extends JSONDBError {
  constructor(dbPath) {
    super(`数据库已存在：${dbPath}`);
    this.name = 'DatabaseExistsError';
  }
}

/**
 * 集合不存在错误
 */
export class CollectionNotFoundError extends JSONDBError {
  constructor(collectionName) {
    super(`集合不存在：${collectionName}`);
    this.name = 'CollectionNotFoundError';
  }
}

/**
 * 集合已存在错误
 */
export class CollectionExistsError extends JSONDBError {
  constructor(collectionName) {
    super(`集合已存在：${collectionName}`);
    this.name = 'CollectionExistsError';
  }
}

/**
 * 文档未找到错误
 */
export class DocumentNotFoundError extends JSONDBError {
  constructor(query) {
    super(`文档未找到：${JSON.stringify(query)}`);
    this.name = 'DocumentNotFoundError';
  }
}

/**
 * 索引错误
 */
export class IndexError extends JSONDBError {
  constructor(message) {
    super(message);
    this.name = 'IndexError';
  }
}

/**
 * 查询错误
 */
export class QueryError extends JSONDBError {
  constructor(message) {
    super(message);
    this.name = 'QueryError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends JSONDBError {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}
