/**
 * 生成器模块
 * 统一导出所有文件生成器
 */

export { Generator } from './base.js';
export { DocxGenerator } from './docx.js';
export { TxtGenerator } from './txt.js';
export { LogGenerator } from './log.js';
export { CsvGenerator } from './csv.js';
export { JsonGenerator } from './json.js';
export { BinaryGenerator } from './binary.js';

// 生成器映射
export const generatorMap = {
  docx: 'DocxGenerator',
  txt: 'TxtGenerator',
  log: 'LogGenerator',
  csv: 'CsvGenerator',
  json: 'JsonGenerator',
  binary: 'BinaryGenerator',
  bin: 'BinaryGenerator' // 别名
};

// 统一导出函数
export async function generateFile(format, options) {
  const generatorName = generatorMap[format.toLowerCase()];
  if (!generatorName) {
    throw new Error(`不支持的格式：${format}`);
  }

  let GeneratorClass;
  switch (generatorName) {
    case 'DocxGenerator':
      GeneratorClass = (await import('./docx.js')).DocxGenerator;
      break;
    case 'TxtGenerator':
      GeneratorClass = (await import('./txt.js')).TxtGenerator;
      break;
    case 'LogGenerator':
      GeneratorClass = (await import('./log.js')).LogGenerator;
      break;
    case 'CsvGenerator':
      GeneratorClass = (await import('./csv.js')).CsvGenerator;
      break;
    case 'JsonGenerator':
      GeneratorClass = (await import('./json.js')).JsonGenerator;
      break;
    case 'BinaryGenerator':
      GeneratorClass = (await import('./binary.js')).BinaryGenerator;
      break;
    default:
      throw new Error(`未知的生成器：${generatorName}`);
  }

  const generator = new GeneratorClass(options);
  generator.startTime = Date.now();
  return await generator.generate();
}

export default {
  generateFile,
  generatorMap
};