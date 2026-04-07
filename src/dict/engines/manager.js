import { YoudaoEngine } from './youdao.js';
import { DSEngine } from './ds.js';
import chalk from 'chalk';

/**
 * 翻译引擎管理器
 * 支持多引擎切换和回退
 */
export class EngineManager {
  constructor(options = {}) {
    this.engines = new Map();
    this.preferredEngine = options.preferredEngine || 'youdao';
    this.fallbackEnabled = options.fallback !== false;
    this.verbose = options.verbose || false;

    // 注册引擎
    this.registerEngine('youdao', new YoudaoEngine(options.youdao));
    this.registerEngine('ds', new DSEngine(options.ds));
  }

  /**
   * 注册引擎
   */
  registerEngine(name, engine) {
    this.engines.set(name, engine);
    if (this.verbose) {
      console.log(chalk.green(`✓ 引擎已注册：${name}`));
    }
  }

  /**
   * 获取引擎
   */
  getEngine(name) {
    const engine = this.engines.get(name);
    if (!engine) {
      throw new Error(`未找到引擎：${name}`);
    }
    return engine;
  }

  /**
   * 设置首选引擎
   */
  setPreferredEngine(name) {
    if (!this.engines.has(name)) {
      throw new Error(`未找到引擎：${name}`);
    }
    this.preferredEngine = name;
    if (this.verbose) {
      console.log(chalk.green(`✓ 首选引擎已设置为：${name}`));
    }
  }

  /**
   * 翻译（自动回退）
   */
  async translate(text, options = {}) {
    const engineName = options.engine || this.preferredEngine;
    
    try {
      const engine = this.getEngine(engineName);
      
      if (this.verbose) {
        console.log(chalk.cyan(`使用引擎：${engineName}`));
      }

      const result = await engine.translate(text);
      
      if (this.verbose) {
        console.log(chalk.green('✓ 翻译成功'));
      }

      return {
        success: true,
        result,
        engine: engineName
      };

    } catch (error) {
      if (this.verbose) {
        console.log(chalk.yellow(`⚠️  引擎 ${engineName} 失败：${error.message}`));
      }

      // 回退到其他引擎
      if (this.fallbackEnabled && options.fallback !== false) {
        for (const [name, engine] of this.engines.entries()) {
          if (name !== engineName) {
            try {
              if (this.verbose) {
                console.log(chalk.cyan(`尝试回退引擎：${name}`));
              }

              const result = await engine.translate(text);
              
              if (this.verbose) {
                console.log(chalk.green(`✓ 回退成功：${name}`));
              }

              return {
                success: true,
                result,
                engine: name,
                fallback: true
              };
            } catch (fallbackError) {
              if (this.verbose) {
                console.log(chalk.yellow(`⚠️  回退引擎 ${name} 失败`));
              }
            }
          }
        }
      }

      return {
        success: false,
        error: error.message,
        engine: engineName
      };
    }
  }

  /**
   * 查询单词
   */
  async lookup(word, options = {}) {
    return this.translate(word, options);
  }

  /**
   * 检查所有引擎状态
   */
  async checkEnginesStatus() {
    const status = {};

    for (const [name, engine] of this.engines.entries()) {
      try {
        const available = await engine.isAvailable();
        status[name] = {
          available,
          info: engine.getInfo()
        };
      } catch (error) {
        status[name] = {
          available: false,
          error: error.message
        };
      }
    }

    return status;
  }

  /**
   * 列出所有引擎
   */
  listEngines() {
    const list = [];
    for (const [name, engine] of this.engines.entries()) {
      list.push({
        name,
        info: engine.getInfo(),
        isPreferred: name === this.preferredEngine
      });
    }
    return list;
  }

  /**
   * 获取引擎统计信息
   */
  getStats() {
    const stats = {};
    for (const [name, engine] of this.engines.entries()) {
      if (engine.getStats) {
        stats[name] = engine.getStats();
      }
    }
    return stats;
  }
}

export default EngineManager;
