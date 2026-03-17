#!/usr/bin/env node

/**
 * JSONDB 数据导出工具
 * 支持导出为 JSON、CSV、XLSX 格式
 */

import { program } from 'commander';
import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { existsSync, createReadStream, createWriteStream } from 'fs';
import { join, resolve, basename, dirname } from 'path';
import { createInterface } from 'readline';

// 检查是否安装了 xlsx
let XLSX = null;
try {
  XLSX = (await import('xlsx')).default;
} catch (e) {
  // xlsx 未安装
}

/**
 * 读取 JSONB 文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>}
 */
async function readJsonbFile(filePath) {
  const buffer = await readFile(filePath);
  
  try {
    // 尝试 JSONB 格式（带 4 字节长度前缀）
    const length = buffer.readUInt32BE(0);
    
    if (length === buffer.length - 4) {
      const jsonBuffer = buffer.subarray(4);
      const json = jsonBuffer.toString('utf-8');
      return JSON.parse(json);
    } else {
      throw new Error(`JSONB 长度不匹配：${length} !== ${buffer.length - 4}`);
    }
  } catch (e) {
    // 不是 JSONB 格式，尝试普通 JSON
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
}

/**
 * 读取 JSON 文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>}
 */
async function readJsonFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * 读取数据库文件（自动检测 JSONB 或 JSON）
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>}
 */
async function readDatabaseFile(filePath) {
  const buffer = await readFile(filePath);
  
  // 检测是否为二进制文件（JSONB）
  // JSONB 格式：前 4 字节是长度前缀 (uint32 BE)，通常以小值开头
  if (buffer.length > 4) {
    const lengthPrefix = buffer.readUInt32BE(0);
    if (lengthPrefix === buffer.length - 4) {
      return await readJsonbFile(filePath);
    }
  }
  
  // 普通 JSON
  return JSON.parse(buffer.toString('utf-8'));
}

/**
 * 将数据转换为 CSV
 * @param {Array} data - 数据数组
 * @param {Object} options - 选项
 * @returns {string} CSV 字符串
 */
function convertToCsv(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  const {
    delimiter = ',',
    includeHeader = true,
    flatten = true
  } = options;
  
  // 获取所有键
  const keys = new Set();
  data.forEach(item => {
    Object.keys(item).forEach(key => keys.add(key));
  });
  
  const headers = Array.from(keys);
  const lines = [];
  
  // 添加表头
  if (includeHeader) {
    lines.push(headers.map(h => escapeCsvValue(h, delimiter)).join(delimiter));
  }
  
  // 添加数据行
  data.forEach(item => {
    const row = headers.map(header => {
      let value = item[header];
      
      // 扁平化对象和数组
      if (flatten && (typeof value === 'object' && value !== null)) {
        value = JSON.stringify(value);
      }
      
      return escapeCsvValue(value, delimiter);
    });
    lines.push(row.join(delimiter));
  });
  
  return lines.join('\n');
}

/**
 * 转义 CSV 值
 * @param {any} value - 值
 * @param {string} delimiter - 分隔符
 * @returns {string}
 */
function escapeCsvValue(value, delimiter) {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  // 如果包含分隔符、引号或换行，需要转义
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * 将数据转换为 XLSX
 * @param {Array} data - 数据数组
 * @param {string} outputPath - 输出路径
 * @param {Object} options - 选项
 * @returns {Promise<void>}
 */
async function convertToXlsx(data, outputPath, options = {}) {
  if (!XLSX) {
    throw new Error('xlsx 包未安装。请运行：npm install -g xlsx');
  }
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('数据为空');
  }
  
  // 扁平化数据
  const flattened = data.map(item => flattenObject(item));
  
  // 获取所有键
  const keys = new Set();
  flattened.forEach(item => {
    Object.keys(item).forEach(key => keys.add(key));
  });
  
  // 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(flattened, {
    header: Array.from(keys)
  });
  
  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // 写入文件
  XLSX.writeFile(workbook, outputPath);
}

/**
 * 扁平化对象
 * @param {Object} obj - 对象
 * @param {string} prefix - 前缀
 * @returns {Object}
 */
function flattenObject(obj, prefix = '') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  
  return result;
}

/**
 * 导出为 JSON
 * @param {string} inputFile - 输入文件
 * @param {string} outputFile - 输出文件
 * @param {Object} options - 选项
 */
async function exportToJson(inputFile, outputFile, options = {}) {
  try {
    console.log(`📖 读取文件：${inputFile}`);
    
    const data = await readDatabaseFile(inputFile);
    
    // 提取文档
    const documents = data._documents || data.documents || data.data || [];
    
    console.log(`📊 找到 ${documents.length} 条记录`);
    
    // 确保输出目录存在
    await mkdir(dirname(outputFile), { recursive: true });
    
    // 格式化输出
    let output;
    if (options.pretty) {
      output = JSON.stringify(documents, null, 2);
    } else {
      output = JSON.stringify(documents);
    }
    
    await writeFile(outputFile, output, 'utf-8');
    console.log(`✅ 已导出到：${outputFile}`);
  } catch (error) {
    console.error(`导出 JSON 失败：${error.message}`);
    throw error;
  }
}

/**
 * 导出为 CSV
 * @param {string} inputFile - 输入文件
 * @param {string} outputFile - 输出文件
 * @param {Object} options - 选项
 */
async function exportToCsv(inputFile, outputFile, options = {}) {
  console.log(`📖 读取文件：${inputFile}`);
  
  const data = await readDatabaseFile(inputFile);
  const documents = data._documents || data.documents || data.data || [];
  
  console.log(`📊 找到 ${documents.length} 条记录`);
  
  // 确保输出目录存在
  await mkdir(dirname(outputFile), { recursive: true });
  
  const csv = convertToCsv(documents, {
    delimiter: options.delimiter || ',',
    includeHeader: options.header !== false,
    flatten: options.flatten !== false
  });
  
  await writeFile(outputFile, csv, 'utf-8');
  console.log(`✅ 已导出到：${outputFile}`);
}

/**
 * 导出为 XLSX
 * @param {string} inputFile - 输入文件
 * @param {string} outputFile - 输出文件
 * @param {Object} options - 选项
 */
async function exportToXlsx(inputFile, outputFile, options = {}) {
  console.log(`📖 读取文件：${inputFile}`);
  
  const data = await readDatabaseFile(inputFile);
  const documents = data._documents || data.documents || data.data || [];
  
  console.log(`📊 找到 ${documents.length} 条记录`);
  
  // 确保输出目录存在
  await mkdir(dirname(outputFile), { recursive: true });
  
  await convertToXlsx(documents, outputFile, options);
  console.log(`✅ 已导出到：${outputFile}`);
}

/**
 * 从数据库目录导出
 * @param {string} dbPath - 数据库路径
 * @param {string} collection - 集合名称
 * @param {string} outputFile - 输出文件
 * @param {string} format - 导出格式
 * @param {Object} options - 选项
 */
async function exportFromDatabase(dbPath, collection, outputFile, format, options = {}) {
  const dbFile = join(dbPath, `${collection}.json`);
  
  if (!existsSync(dbFile)) {
    console.error(`❌ 集合文件不存在：${dbFile}`);
    process.exit(1);
  }
  
  console.log(`📖 从数据库导出：${dbPath}`);
  console.log(`📁 集合：${collection}`);
  
  try {
    switch (format) {
      case 'json':
        await exportToJson(dbFile, outputFile, options);
        break;
      case 'csv':
        await exportToCsv(dbFile, outputFile, options);
        break;
      case 'xlsx':
        await exportToXlsx(dbFile, outputFile, options);
        break;
      default:
        console.error(`❌ 不支持的格式：${format}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ 导出失败：${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 命令行程序
program
  .name('jsondb-export')
  .description('JSONDB 数据导出工具 - 支持 JSON、JSONB 导出为 JSON、CSV、XLSX')
  .version('1.0.0');

program
  .command('export <input> <output>')
  .description('导出单个文件')
  .option('-f, --format <format>', '输出格式 (json, csv, xlsx)', 'json')
  .option('-p, --pretty', '格式化 JSON 输出')
  .option('-d, --delimiter <char>', 'CSV 分隔符', ',')
  .option('--no-header', '不包含 CSV 表头')
  .option('--no-flatten', '不扁平化嵌套对象')
  .action(async (input, output, options) => {
    try {
      const inputFile = resolve(input);
      const outputFile = resolve(output);

      if (!existsSync(inputFile)) {
        console.error(`❌ 文件不存在：${inputFile}`);
        process.exit(1);
      }

      // 根据输出文件扩展名确定格式
      const ext = options.format || outputFile.split('.').pop().toLowerCase();

      switch (ext) {
        case 'json':
          await exportToJson(inputFile, outputFile, options);
          break;
        case 'csv':
          await exportToCsv(inputFile, outputFile, options);
          break;
        case 'xlsx':
          await exportToXlsx(inputFile, outputFile, options);
          break;
        default:
          console.error(`❌ 不支持的格式：${ext}`);
          process.exit(1);
      }
    } catch (error) {
      console.error(`❌ 导出失败：${error.message}`);
      process.exit(1);
    }
  });

program
  .command('db <dbPath> <collection> <output>')
  .description('从数据库目录导出集合')
  .option('-f, --format <format>', '输出格式 (json, csv, xlsx)', 'json')
  .option('-p, --pretty', '格式化 JSON 输出')
  .option('-d, --delimiter <char>', 'CSV 分隔符', ',')
  .option('--no-header', '不包含 CSV 表头')
  .option('--no-flatten', '不扁平化嵌套对象')
  .action(async (dbPath, collection, output, options) => {
    try {
      const dbDir = resolve(dbPath);
      const outputFile = resolve(output);
      
      if (!existsSync(dbDir)) {
        console.error(`❌ 数据库目录不存在：${dbDir}`);
        process.exit(1);
      }
      
      await exportFromDatabase(dbDir, collection, outputFile, options.format, options);
    } catch (error) {
      console.error(`❌ 导出失败：${error.message}`);
      process.exit(1);
    }
  });

program
  .command('list <dbPath>')
  .description('列出数据库中的所有集合')
  .action(async (dbPath) => {
    try {
      const dbDir = resolve(dbPath);
      
      if (!existsSync(dbDir)) {
        console.error(`❌ 数据库目录不存在：${dbDir}`);
        process.exit(1);
      }
      
      const { readdir } = await import('fs/promises');
      const files = await readdir(dbDir);
      
      const collections = files
        .filter(f => f.endsWith('.json') && f !== '_meta.json')
        .map(f => f.replace('.json', ''));
      
      if (collections.length === 0) {
        console.log('📭 数据库为空');
      } else {
        console.log(`📁 数据库：${dbDir}`);
        console.log(`📊 集合 (${collections.length}):`);
        collections.forEach(c => console.log(`   - ${c}`));
      }
    } catch (error) {
      console.error(`❌ 列出失败：${error.message}`);
      process.exit(1);
    }
  });

// 只有在直接执行时才解析命令行
if (process.argv[1] && process.argv[1].endsWith('cli-export.js')) {
  program.parse(process.argv);
}
