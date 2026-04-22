/**
 * Mock 数据模块
 * 提供用户表和订单表的模拟数据生成
 */

export { UserMock } from './user.js';
export { OrderMock } from './order.js';
export { ProductMock } from './product.js';
import { UserMock as UM } from './user.js';
import { OrderMock as OM } from './order.js';
import { ProductMock as PM } from './product.js';

/**
 * Mock 数据管理器
 * 统一管理所有数据生成器
 */
export class MockDataManager {
  static GENERATORS = {
    user: UM,
    order: OM,
    product: PM
  };

  /**
   * 根据类型获取对应的生成器
   * @param {string} type - 数据类型
   * @returns {object} 生成器类
   */
  static getGenerator(type) {
    const generator = this.GENERATORS[type.toLowerCase()];
    if (!generator) {
      throw new Error(`不支持的数据类型: ${type}，支持的类型: ${Object.keys(this.GENERATORS).join(', ')}`);
    }
    return generator;
  }

  /**
   * 生成单个数据
   * @param {string} type - 数据类型
   * @param {number} id - ID
   * @returns {object} 数据对象
   */
  static generateOne(type, id) {
    const Generator = this.getGenerator(type);
    const method = `generate${type.charAt(0).toUpperCase() + type.slice(1)}`;
    if (Generator[method]) {
      return Generator[method](id);
    }
    throw new Error(`生成器 ${type} 没有找到生成单个数据的方法`);
  }

  /**
   * 批量生成数据
   * @param {string} type - 数据类型
   * @param {number} count - 数量
   * @param {number} [startId=1] - 起始 ID
   * @returns {Array<object>} 数据数组
   */
  static generateMany(type, count, startId = 1) {
    const Generator = this.getGenerator(type);
    const method = `generate${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    if (Generator[method]) {
      return Generator[method](count, startId);
    }
    throw new Error(`生成器 ${type} 没有找到批量生成数据的方法`);
  }

  /**
   * 获取列定义
   * @param {string} type - 数据类型
   * @returns {Array<string>} 列名数组
   */
  static getColumns(type) {
    const Generator = this.getGenerator(type);
    if (Generator.getColumns) {
      return Generator.getColumns();
    }
    return [];
  }

  /**
   * 扁平化数据
   * @param {string} type - 数据类型
   * @param {object} data - 数据对象
   * @returns {object} 扁平对象
   */
  static flatten(type, data) {
    const Generator = this.getGenerator(type);
    if (Generator.flatten) {
      return Generator.flatten(data);
    }
    return data;
  }

  /**
   * 估算单行数据大小
   * @param {string} type - 数据类型
   * @returns {number} 估算的字节数
   */
  static estimateRowSize(type) {
    const sample = this.generateOne(type, 1);
    const flattened = this.flatten(type, sample);
    return JSON.stringify(flattened).length;
  }
}

export default {
  UserMock: UM,
  OrderMock: OM,
  ProductMock: PM,
  MockDataManager
};
