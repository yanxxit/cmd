/**
 * XLSX 文件生成器
 */
import fs from 'fs';
import path from 'path';
import { Generator } from './base.js';
import { MockDataManager } from '../mock/index.js';

/**
 * XLSX 生成器
 */
export class XlsxGenerator extends Generator {
  constructor(options = {}) {
    super(options);
    this.sheetName = options.sheetName || 'Data';
    this.table = options.table || 'user'; // user, order, product
    this.rows = options.rows || 0;
    this.debug = options.debug || false;
  }

  debugLog(message) {
    if (this.debug) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  async generate() {
    const xlsx = await import('xlsx');
    const outputPath = path.resolve(this.outputPath);
    
    this.debugLog(`开始生成 XLSX 文件: ${outputPath}`);
    this.debugLog(`目标大小: ${this.formatSize(this.size)}`);
    this.debugLog(`表格类型: ${this.table}`);
    this.debugLog(`指定行数: ${this.rows || '未指定'}`);

    // 使用 MockDataManager 统一管理数据生成
    const mockName = this.table === 'user' ? '用户' : 
                     this.table === 'order' ? '订单' : 
                     this.table === 'product' ? '产品' : this.table;

    this.debugLog(`使用 ${mockName} 表数据`);

    // 估算每行数据的大小（JSON 序列化后的长度作为参考）
    const estimatedRowSize = MockDataManager.estimateRowSize(this.table);
    this.debugLog(`估算每行数据大小: ${estimatedRowSize} 字节`);

    // 计算需要生成的行数
    let rowCount;
    if (this.rows > 0) {
      rowCount = this.rows;
    } else {
      // 估算需要的行数，加上表头和一些额外空间
      rowCount = Math.max(1, Math.floor(this.size / estimatedRowSize * 0.6));
    }
    this.debugLog(`计划生成行数: ${rowCount}`);

    // 生成数据
    console.log(`正在生成 ${mockName} 数据 (${rowCount} 行)...`);
    const startTime = Date.now();
    
    // 使用 MockDataManager 批量生成数据
    let data = MockDataManager.generateMany(this.table, rowCount);
    // 扁平化数据以便更好地展示在 Excel 中
    data = data.map(item => MockDataManager.flatten(this.table, item));

    this.debugLog(`数据生成完成，耗时: ${Date.now() - startTime}ms`);
    this.debugLog(`数据行数: ${data.length}`);

    // 创建工作簿和工作表
    this.debugLog('正在创建工作簿...');
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, this.sheetName);

    // 写入文件
    this.debugLog('正在写入文件...');
    xlsx.writeFile(workbook, outputPath);

    // 获取实际文件大小
    const stats = fs.statSync(outputPath);
    const actualSize = stats.size;

    console.log(`XLSX 文件生成完成！`);
    console.log(`文件大小: ${this.formatSize(actualSize)}`);
    console.log(`数据行数: ${data.length}`);

    // 如果需要更大的文件，通过追加数据或重复工作簿来实现
    if (actualSize < this.size && !this.rows) {
      this.debugLog('实际大小小于目标，正在扩展文件...');
      
      // 计算需要追加的数据量
      const additionalRows = Math.ceil((this.size - actualSize) / estimatedRowSize * 0.8);
      this.debugLog(`追加数据行数: ${additionalRows}`);
      
      if (additionalRows > 0) {
        // 生成追加数据
        const additionalData = MockDataManager.generateMany(this.table, additionalRows, data.length + 1);
        const additionalDataFlat = additionalData.map(item => MockDataManager.flatten(this.table, item));
        
        // 合并数据
        const allData = [...data, ...additionalDataFlat];
        
        // 重新生成文件
        const newWorksheet = xlsx.utils.json_to_sheet(allData);
        const newWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, this.sheetName);
        xlsx.writeFile(newWorkbook, outputPath);
        
        const newStats = fs.statSync(outputPath);
        this.debugLog(`扩展后文件大小: ${this.formatSize(newStats.size)}`);
        
        return {
          success: true,
          path: outputPath,
          size: newStats.size,
          rows: allData.length,
          originalSize: actualSize,
          time: Date.now() - this.startTime,
          table: this.table
        };
      }
    }

    return {
      success: true,
      path: outputPath,
      size: actualSize,
      rows: data.length,
      time: Date.now() - this.startTime,
      table: this.table
    };
  }
}

export default XlsxGenerator;
