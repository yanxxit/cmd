/**
 * Schema 验证模块
 * 提供数据验证功能
 */

/**
 * 验证器类型
 */
export const validators = {
  /**
   * 字符串验证
   */
  string: (value, options = {}) => {
    if (typeof value !== 'string') {
      return { valid: false, message: '必须是字符串' };
    }
    if (options.minLength && value.length < options.minLength) {
      return { valid: false, message: `最小长度为 ${options.minLength}` };
    }
    if (options.maxLength && value.length > options.maxLength) {
      return { valid: false, message: `最大长度为 ${options.maxLength}` };
    }
    if (options.pattern && !options.pattern.test(value)) {
      return { valid: false, message: '格式不匹配' };
    }
    if (options.enum && !options.enum.includes(value)) {
      return { valid: false, message: '值不在枚举列表中' };
    }
    return { valid: true };
  },
  
  /**
   * 数字验证
   */
  number: (value, options = {}) => {
    if (typeof value !== 'number') {
      return { valid: false, message: '必须是数字' };
    }
    if (options.min !== undefined && value < options.min) {
      return { valid: false, message: `最小值为 ${options.min}` };
    }
    if (options.max !== undefined && value > options.max) {
      return { valid: false, message: `最大值为 ${options.max}` };
    }
    if (options.integer && !Number.isInteger(value)) {
      return { valid: false, message: '必须是整数' };
    }
    return { valid: true };
  },
  
  /**
   * 布尔值验证
   */
  boolean: (value) => {
    if (typeof value !== 'boolean') {
      return { valid: false, message: '必须是布尔值' };
    }
    return { valid: true };
  },
  
  /**
   * 日期验证
   */
  date: (value) => {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return { valid: false, message: '必须是有效的日期' };
    }
    return { valid: true };
  },
  
  /**
   * 数组验证
   */
  array: (value, options = {}) => {
    if (!Array.isArray(value)) {
      return { valid: false, message: '必须是数组' };
    }
    if (options.minLength && value.length < options.minLength) {
      return { valid: false, message: `最小长度为 ${options.minLength}` };
    }
    if (options.maxLength && value.length > options.maxLength) {
      return { valid: false, message: `最大长度为 ${options.maxLength}` };
    }
    if (options.items) {
      for (let i = 0; i < value.length; i++) {
        const result = validateValue(value[i], options.items);
        if (!result.valid) {
          return { valid: false, message: `索引 ${i}: ${result.message}` };
        }
      }
    }
    return { valid: true };
  },
  
  /**
   * 对象验证
   */
  object: (value, options = {}) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { valid: false, message: '必须是对象' };
    }
    if (options.properties) {
      return validateObject(value, options.properties);
    }
    return { valid: true };
  },
  
  /**
   * 枚举验证
   */
  enum: (value, options = {}) => {
    if (!options.values || !options.values.includes(value)) {
      return { valid: false, message: '值不在允许的列表中' };
    }
    return { valid: true };
  },
  
  /**
   * 自定义验证
   */
  custom: (value, options = {}) => {
    if (typeof options.validate !== 'function') {
      return { valid: false, message: '验证函数无效' };
    }
    try {
      const result = options.validate(value);
      return result === true ? { valid: true } : { valid: false, message: result || '验证失败' };
    } catch (e) {
      return { valid: false, message: e.message };
    }
  }
};

/**
 * 验证单个值
 * @param {any} value - 值
 * @param {Object} schema - Schema 定义
 * @returns {Object} 验证结果
 */
function validateValue(value, schema) {
  if (!schema || !schema.type) {
    return { valid: true };
  }
  
  const validator = validators[schema.type];
  if (!validator) {
    return { valid: false, message: `未知的类型：${schema.type}` };
  }
  
  // 检查是否允许 null
  if (value === null || value === undefined) {
    if (schema.required) {
      return { valid: false, message: '此字段不能为空' };
    }
    return { valid: true };
  }
  
  return validator(value, schema);
}

/**
 * 验证对象
 * @param {Object} obj - 对象
 * @param {Object} properties - 属性定义
 * @returns {Object} 验证结果
 */
function validateObject(obj, properties) {
  const errors = [];
  
  // 检查必填字段
  for (const [key, schema] of Object.entries(properties)) {
    if (schema.required && (obj[key] === undefined || obj[key] === null)) {
      errors.push({ field: key, message: '此字段不能为空' });
      continue;
    }
    
    if (obj[key] !== undefined && obj[key] !== null) {
      const result = validateValue(obj[key], schema);
      if (!result.valid) {
        errors.push({ field: key, message: result.message });
      }
    }
  }
  
  // 检查额外字段
  if (properties._additional === false) {
    const allowedKeys = Object.keys(properties);
    for (const key of Object.keys(obj)) {
      if (!allowedKeys.includes(key)) {
        errors.push({ field: key, message: '不允许的字段' });
      }
    }
  }
  
  return errors.length === 0 
    ? { valid: true } 
    : { valid: false, errors };
}

/**
 * Schema 类
 */
export class Schema {
  constructor(properties, options = {}) {
    this.properties = properties;
    this.options = {
      strict: options.strict || false, // 严格模式：不允许额外字段
      ...options
    };
  }
  
  /**
   * 验证对象
   * @param {Object} obj - 对象
   * @returns {Object} 验证结果
   */
  validate(obj) {
    if (this.options.strict) {
      this.properties._additional = false;
    }
    return validateObject(obj, this.properties);
  }
  
  /**
   * 验证并抛出异常
   * @param {Object} obj - 对象
   * @throws {Error} 验证失败时抛出异常
   */
  validateOrThrow(obj) {
    const result = this.validate(obj);
    if (!result.valid) {
      const error = new Error(`验证失败：${result.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
      error.errors = result.errors;
      throw error;
    }
  }
  
  /**
   * 清理对象（移除额外字段）
   * @param {Object} obj - 对象
   * @returns {Object} 清理后的对象
   */
  sanitize(obj) {
    const result = {};
    for (const key of Object.keys(this.properties)) {
      if (obj[key] !== undefined) {
        result[key] = obj[key];
      }
    }
    return result;
  }
  
  /**
   * 应用默认值
   * @param {Object} obj - 对象
   * @returns {Object} 应用默认值后的对象
   */
  applyDefaults(obj) {
    const result = { ...obj };
    for (const [key, schema] of Object.entries(this.properties)) {
      if (result[key] === undefined && schema.default !== undefined) {
        result[key] = schema.default;
      }
    }
    return result;
  }
}

/**
 * 创建 Schema
 * @param {Object} properties - 属性定义
 * @param {Object} options - 选项
 * @returns {Schema}
 */
export function createSchema(properties, options) {
  return new Schema(properties, options);
}

/**
 * 验证中间件工厂
 * @param {Schema} schema - Schema 实例
 * @returns {Function} 中间件函数
 */
export function createValidator(schema) {
  return async (doc) => {
    const result = schema.validate(doc);
    if (!result.valid) {
      throw new Error(`验证失败：${result.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
    }
    return doc;
  };
}
