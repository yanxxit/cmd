/**
 * 翻译引擎抽象基类
 */
export class TranslationEngine {
  constructor(name) {
    if (new.target === TranslationEngine) {
      throw new Error('TranslationEngine 是抽象类，不能直接实例化');
    }
    this.name = name;
  }

  /**
   * 翻译文本
   * @param {string} text - 待翻译的文本
   * @returns {Promise<string>} - 翻译结果
   */
  async translate(text) {
    throw new Error('子类必须实现 translate 方法');
  }

  /**
   * 查询单词释义
   * @param {string} word - 单词
   * @returns {Promise<string>} - 释义结果
   */
  async lookup(word) {
    throw new Error('子类必须实现 lookup 方法');
  }

  /**
   * 检查引擎是否可用
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    throw new Error('子类必须实现 isAvailable 方法');
  }

  /**
   * 获取引擎信息
   * @returns {Object}
   */
  getInfo() {
    return {
      name: this.name,
      type: this.constructor.name
    };
  }
}

export default TranslationEngine;
