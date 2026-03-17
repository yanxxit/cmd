#!/usr/bin/env node

/**
 * JSONDB 数据导入工具
 * 支持从 CSV、XLSX、JSON 导入数据
 */

import { program } from 'commander';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve, dirname } from 'path';

// 检查是否安装了 xlsx
let XLSX = null;
try {
  XLSX = (await import('xlsx')).default;
} catch (e) {
  // xlsx 未安装
}

/**
 * 解析 CSV 为数组
 * @param {string} content - CSV 内容
 * @param {Object} options - 选项
 * @returns {Array<Object>}
 */
function parseCsv(content, options = {}) {
  const {
    delimiter = ',',
    hasHeader = true
  } = options;
  
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }
  
  // 解析 CSV 行
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
  };
  
  const headers = hasHeader ? parseLine(lines[0]) : null;
  const data = [];
  
  const startIndex = hasHeader ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    
    if (hasHeader) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      data.push(obj);
    } else {
      data.push(values);
    }
  }
  
  return data;
}

/**
 * 从 CSV 文件导入
 * @param {string} inputFile - 输入文件
 * @returns {Promise<Array>}
 */
async function importFromCsv(inputFile) {
  const content = await readFile(inputFile, 'utf-8');
  return parseCsv(content);
}

/**
 * 从 XLSX 文件导入
 * @param {string} inputFile - 输入文件
 * @returns {Promise<Array>}
 */
async function importFromXlsx(inputFile) {
  if (!XLSX) {
    throw new Error('xlsx 包未安装。请运行：npm install xlsx');
  }
  
  const workbook = XLSX.readFile(inputFile);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(firstSheet);
  
  return data;
}

/**
 * 从 JSON 文件导入
 * @param {string} inputFile - 输入文件
 * @returns {Promise<Array>}
 */
async function importFromJson(inputFile) {
  const content = await readFile(inputFile, 'utf-8');
  const data = JSON.parse(content);
  
  // 支持数组或包含 documents 的对象
  if (Array.isArray(data)) {
    return data;
  }
  
  return data._documents || data.documents || data.data || [];
}

/**
 * 写入 JSONB 文件
 * @param {string} outputFile - 输出文件
 * @param {Array} documents - 文档数组
 * @param {string} collectionName - 集合名称
 */
async function writeJsonbFile(outputFile, documents, collectionName) {
  const data = {
    _meta: {
      name: collectionName,
      count: documents.length,
      indexes: []
    },
    _documents: documents,
    _indexes: {}
  };
  
  const json = JSON.stringify(data);
  const jsonBuffer = Buffer.from(json, 'utf-8');
  
  // 4 字节长度前缀 + JSON 数据
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(jsonBuffer.length, 0);
  
  const buffer = Buffer.concat([lengthBuffer, jsonBuffer]);
  
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, buffer);
}

/**
 * 写入 JSON 文件
 * @param {string} outputFile - 输出文件
 * @param {Array} documents - 文档数组
 * @param {string} collectionName - 集合名称
 * @param {Object} options - 选项
 */
async function writeJsonFile(outputFile, documents, collectionName, options = {}) {
  const data = {
    _meta: {
      name: collectionName,
      count: documents.length,
      indexes: []
    },
    _documents: documents,
    _indexes: {}
  };
  
  const content = options.pretty 
    ? JSON.stringify(data, null, 2) 
    : JSON.stringify(data);
  
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, content, 'utf-8');
}

/**
 * 导入到数据库目录
 * @param {string} inputFile - 输入文件
 * @param {string} dbPath - 数据库目录
 * @param {string} collection - 集合名称
 * @param {string} format - 输入格式
 * @param {Object} options - 选项
 */
async function importToDatabase(inputFile, dbPath, collection, format, options = {}) {
  const outputFile = join(dbPath, `${collection}.json`);
  
  console.log(`📖 读取文件：${inputFile}`);
  console.log(`📁 格式：${format}`);
  
  let data;
  
  switch (format) {
    case 'csv':
      data = await importFromCsv(inputFile);
      break;
    case 'xlsx':
      data = await importFromXlsx(inputFile);
      break;
    case 'json':
      data = await importFromJson(inputFile);
      break;
    default:
      throw new Error(`不支持的格式：${format}`);
  }
  
  console.log(`📊 读取到 ${data.length} 条记录`);
  
  // 添加 _id 和 createdAt
  const documents = data.map((item, index) => ({
    _id: item._id || generateId(),
    createdAt: item.createdAt || new Date().toISOString(),
    ...item
  }));
  
  // 写入文件
  if (options.jsonb) {
    await writeJsonbFile(outputFile, documents, collection);
    console.log(`✅ 已导入到 JSONB 格式：${outputFile}`);
  } else {
    await writeJsonFile(outputFile, documents, collection, options);
    console.log(`✅ 已导入到 JSON 格式：${outputFile}`);
  }
  
  console.log(`📊 导入完成：${documents.length} 条记录`);
}

/**
 * 生成唯一 ID
 * @returns {string}
 */
function generateId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomPart = Math.random().toString(16).substring(2).padEnd(16, '0').substring(0, 16);
  return timestamp + randomPart;
}

// 命令行程序
program
  .name('jsondb-import')
  .description('JSONDB 数据导入工具 - 支持从 CSV、XLSX、JSON 导入')
  .version('1.0.0');

program
  .command('import <input> <dbPath> <collection>')
  .description('导入数据到数据库集合')
  .option('-f, --format <format>', '输入格式 (csv, xlsx, json)', 'auto')
  .option('--jsonb', '使用 JSONB 二进制格式存储', false)
  .option('-p, --pretty', '格式化 JSON 输出')
  .option('-d, --delimiter <char>', 'CSV 分隔符', ',')
  .action(async (input, dbPath, collection, options) => {
    try {
      const inputFile = resolve(input);
      const dbDir = resolve(dbPath);
      
      if (!existsSync(inputFile)) {
        console.error(`❌ 文件不存在：${inputFile}`);
        process.exit(1);
      }
      
      // 自动检测格式
      let format = options.format;
      if (format === 'auto') {
        const ext = inputFile.split('.').pop().toLowerCase();
        if (ext === 'csv') format = 'csv';
        else if (ext === 'xlsx' || ext === 'xls') format = 'xlsx';
        else if (ext === 'json') format = 'json';
        else {
          console.error(`❌ 无法自动检测格式，请指定 --format`);
          process.exit(1);
        }
      }
      
      await importToDatabase(inputFile, dbDir, collection, format, options);
    } catch (error) {
      console.error(`❌ 导入失败：${error.message}`);
      process.exit(1);
    }
  });

program
  .command('convert <input> <output>')
  .description('转换文件格式（JSON ↔ JSONB）')
  .option('--to-jsonb', '转换为 JSONB 格式')
  .option('--to-json', '转换为 JSON 格式')
  .option('-p, --pretty', '格式化 JSON 输出')
  .action(async (input, output, options) => {
    try {
      const inputFile = resolve(input);
      const outputFile = resolve(output);
      
      if (!existsSync(inputFile)) {
        console.error(`❌ 文件不存在：${inputFile}`);
        process.exit(1);
      }
      
      // 读取源文件
      const buffer = await readFile(inputFile);
      let data;
      
      // 检测是否为 JSONB
      if (buffer.length > 4) {
        const lengthPrefix = buffer.readUInt32BE(0);
        if (lengthPrefix === buffer.length - 4) {
          // JSONB 格式
          const jsonBuffer = buffer.subarray(4);
          data = JSON.parse(jsonBuffer.toString('utf-8'));
          console.log('📖 读取 JSONB 文件');
        } else {
          data = JSON.parse(buffer.toString('utf-8'));
          console.log('📖 读取 JSON 文件');
        }
      } else {
        data = JSON.parse(buffer.toString('utf-8'));
        console.log('📖 读取 JSON 文件');
      }
      
      // 写入目标格式
      await mkdir(dirname(outputFile), { recursive: true });
      
      if (options.toJsonb || output.endsWith('.jsonb')) {
        const json = JSON.stringify(data);
        const jsonBuffer = Buffer.from(json, 'utf-8');
        const lengthBuffer = Buffer.alloc(4);
        lengthBuffer.writeUInt32BE(jsonBuffer.length, 0);
        const buffer = Buffer.concat([lengthBuffer, jsonBuffer]);
        await writeFile(outputFile, buffer);
        console.log('✅ 已转换为 JSONB 格式');
      } else {
        const content = options.pretty 
          ? JSON.stringify(data, null, 2) 
          : JSON.stringify(data);
        await writeFile(outputFile, content, 'utf-8');
        console.log('✅ 已转换为 JSON 格式');
      }
      
      console.log(`📊 转换完成：${outputFile}`);
    } catch (error) {
      console.error(`❌ 转换失败：${error.message}`);
      process.exit(1);
    }
  });

// 只有在直接执行时才解析命令行
if (process.argv[1] && process.argv[1].endsWith('cli-import.js')) {
  program.parse(process.argv);
}
