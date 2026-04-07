#!/usr/bin/env node

import { EngineManager } from './engines/index.js';
import chalk from 'chalk';
import config from './lib/config.js';
import Parser from './lib/parser.js';
import Cache from './lib/cache.js';
import History from './lib/history.js';

// 创建引擎管理器实例
let engineManager = null;

function getEngineManager() {
  if (!engineManager) {
    engineManager = new EngineManager({
      preferredEngine: config.preferredEngine || 'ds',
      fallbackEnabled: true,
      verbose: config.verbose || false,
      ds: {
        dataPath: config.dsDataPath
      },
      youdao: {
        apiKey: config.youdaoApiKey,
        secretKey: config.youdaoSecretKey
      }
    });
  }
  return engineManager;
}

/**
 * 翻译查询（统一接口）
 */
const fanyi = async function(word, noCache = false, options = {}) {
  const manager = getEngineManager();
  
  try {
    // 显示查询提示
    if (config.spinner) {
      console.log(chalk.cyan(`正在查询：${word}...`));
    }

    // 使用引擎翻译
    const result = await manager.translate(word, {
      engine: options.engine,
      fallback: !noCache
    });

    if (result.success) {
      // 格式化输出
      const ColorOutput = chalk.keyword(config.color);
      console.log('\n' + ColorOutput(result.result));
      
      // 记录历史
      await History.addToHistory({
        word,
        result: result.result,
        engine: result.engine,
        timestamp: new Date().toISOString()
      });

      if (result.fallback) {
        console.log(chalk.yellow(`\n⚠️  使用备用引擎：${result.engine}`));
      }
    } else {
      console.log(chalk.red(`\n❌ 查询失败：${result.error}`));
      console.log(chalk.yellow('提示：可以尝试运行 ds init 初始化本地词典'));
    }

  } catch (error) {
    console.log(chalk.red(`\n❌ 错误：${error.message}`));
    if (config.verbose) {
      console.log(chalk.gray(error.stack));
    }
  }
};

/**
 * 查询单词（别名）
 */
const lookup = async function(word, options = {}) {
  return fanyi(word, false, options);
};

/**
 * 获取历史记录
 */
const getHistory = async function(days = 7) {
  return History.getHistory(days);
};

/**
 * 导出历史记录
 */
const exportHistory = async function(exportPath) {
  return History.exportHistory(exportPath);
};

/**
 * 生成学习记录
 */
const generateLearningHistory = async function(markdownPath) {
  return History.generateLearningHistory(markdownPath);
};

/**
 * 生成 HTML 学习记录
 */
const generateLearningHTML = async function(htmlPath) {
  return History.generateLearningHTML(htmlPath);
};

/**
 * 使用 EJS 模板生成 HTML
 */
const generateLearningHTMLWithEJS = async function(templatePath) {
  return History.generateLearningHTMLWithEJS(templatePath);
};

/**
 * 检查引擎状态
 */
const checkEnginesStatus = async function() {
  const manager = getEngineManager();
  const status = await manager.checkEnginesStatus();
  
  console.log(chalk.cyan('\n引擎状态:'));
  console.log(chalk.gray('─'.repeat(50)));
  
  for (const [name, info] of Object.entries(status)) {
    const icon = info.available ? chalk.green('✓') : chalk.red('✗');
    console.log(`${icon} ${name}: ${info.available ? '可用' : '不可用'}`);
    
    if (info.error) {
      console.log(chalk.yellow(`  错误：${info.error}`));
    }
  }
  
  console.log(chalk.gray('─'.repeat(50)));
};

/**
 * 列出所有引擎
 */
const listEngines = function() {
  const manager = getEngineManager();
  const engines = manager.listEngines();
  
  console.log(chalk.cyan('\n可用引擎:'));
  console.log(chalk.gray('─'.repeat(50)));
  
  for (const engine of engines) {
    const icon = engine.isPreferred ? chalk.green('★') : ' ';
    console.log(`${icon} ${engine.name} - ${engine.info.type}`);
  }
  
  console.log(chalk.gray('─'.repeat(50)));
};

/**
 * 设置首选引擎
 */
const setPreferredEngine = function(engineName) {
  const manager = getEngineManager();
  manager.setPreferredEngine(engineName);
  console.log(chalk.green(`✓ 首选引擎已设置为：${engineName}`));
};

/**
 * 搜索（仅 DS 引擎支持）
 */
const search = async function(pattern, options = {}) {
  const manager = getEngineManager();
  const dsEngine = manager.getEngine('ds');
  
  if (!dsEngine) {
    console.log(chalk.red('❌ DS 引擎不可用'));
    return;
  }
  
  try {
    const results = await dsEngine.search(pattern, options);
    
    if (results.length === 0) {
      console.log(chalk.yellow('未找到匹配结果'));
      return;
    }
    
    console.log(chalk.cyan(`找到 ${results.length} 条结果:\n`));
    
    const ColorOutput = chalk.keyword(config.color);
    for (const item of results) {
      console.log(ColorOutput(`${item.word}: ${item.explanation}`));
    }
  } catch (error) {
    console.log(chalk.red(`❌ 搜索失败：${error.message}`));
  }
};

/**
 * 获取统计信息
 */
const getStats = function() {
  const manager = getEngineManager();
  const stats = manager.getStats();
  
  console.log(chalk.cyan('\n引擎统计:'));
  console.log(chalk.gray('─'.repeat(50)));
  
  for (const [name, info] of Object.entries(stats)) {
    console.log(chalk.cyan(`${name}:`));
    if (info.totalWords) {
      console.log(`  词汇总数：${info.totalWords}`);
    }
    if (info.dataPath) {
      console.log(`  数据路径：${info.dataPath}`);
    }
  }
  
  console.log(chalk.gray('─'.repeat(50)));
};

// 导出所有函数
export default {
  fanyi,
  lookup,
  getHistory,
  exportHistory,
  generateLearningHistory,
  generateLearningHTML,
  generateLearningHTMLWithEJS,
  checkEnginesStatus,
  listEngines,
  setPreferredEngine,
  search,
  getStats
};
