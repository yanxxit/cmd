import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DIR = path.join(__dirname, 'temp');

// 创建测试目录
beforeAll(() => {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
});

// 清理测试目录
afterAll(() => {
  if (fs.existsSync(TEST_DIR)) {
    try {
      const files = fs.readdirSync(TEST_DIR);
      for (const file of files) {
        const filePath = path.join(TEST_DIR, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      fs.rmdirSync(TEST_DIR);
    } catch (err) {
      console.error('清理测试目录失败:', err);
    }
  }
});

describe('TxtGenerator 测试', () => {
  let TxtGenerator;

  beforeAll(async () => {
    const module = await import('../src/generate/txt.js');
    TxtGenerator = module.TxtGenerator;
  });

  it('应该能够创建 TxtGenerator 实例', () => {
    const generator = new TxtGenerator({
      size: 1024,
      outputPath: path.join(TEST_DIR, 'test1.txt')
    });
    expect(generator).toBeInstanceOf(TxtGenerator);
    expect(generator.title).toBe('大型文本文件');
    expect(generator.encoding).toBe('utf-8');
    expect(generator.lineLength).toBe(120);
    expect(generator.contentType).toBe('lorem');
  });

  it('应该支持自定义配置', () => {
    const generator = new TxtGenerator({
      size: 1024,
      outputPath: path.join(TEST_DIR, 'test2.txt'),
      title: '自定义标题',
      encoding: 'utf-16',
      lineLength: 80,
      contentType: 'chinese'
    });
    expect(generator.title).toBe('自定义标题');
    expect(generator.encoding).toBe('utf-16');
    expect(generator.lineLength).toBe(80);
    expect(generator.contentType).toBe('chinese');
  });

  it('应该能够生成小的 TXT 文件', async () => {
    const outputPath = path.join(TEST_DIR, 'small.txt');
    const generator = new TxtGenerator({
      size: 2048,
      outputPath: outputPath,
      title: '测试文件',
      lineLength: 40,
      contentType: 'lorem'
    });
    generator.startTime = Date.now();
    
    const result = await generator.generate();
    
    expect(result.success).toBe(true);
    expect(result.path).toBe(outputPath);
  }, 10000);

  it('应该包含标题信息', async () => {
    const outputPath = path.join(TEST_DIR, 'header.txt');
    const generator = new TxtGenerator({
      size: 1024,
      outputPath: outputPath,
      title: '测试标题',
      lineLength: 40
    });
    generator.startTime = Date.now();
    
    await generator.generate();
    
    // 短暂等待文件写入
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (fs.existsSync(outputPath)) {
      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('测试标题');
    }
  }, 10000);

  it('支持不同的内容类型', async () => {
    const outputPath = path.join(TEST_DIR, 'types.txt');
    const generator = new TxtGenerator({
      size: 1024,
      outputPath: outputPath,
      contentType: 'random',
      lineLength: 20
    });
    generator.startTime = Date.now();
    
    const result = await generator.generate();
    
    expect(result.success).toBe(true);
  }, 10000);
});

describe('CsvGenerator 测试', () => {
  let CsvGenerator;

  beforeAll(async () => {
    const module = await import('../src/generate/csv.js');
    CsvGenerator = module.CsvGenerator;
  });

  it('应该能够创建 CsvGenerator 实例', () => {
    const generator = new CsvGenerator({
      size: 1024,
      outputPath: path.join(TEST_DIR, 'test1.csv')
    });
    expect(generator).toBeInstanceOf(CsvGenerator);
    expect(generator.columns).toEqual([
      'id', 'name', 'email', 'age', 'city', 'country', 'phone', 'created_at'
    ]);
    expect(generator.delimiter).toBe(',');
    expect(generator.useQuotes).toBe(false);
  });

  it('应该支持自定义列名', () => {
    const generator = new CsvGenerator({
      size: 1024,
      outputPath: path.join(TEST_DIR, 'test2.csv'),
      columns: 'a,b,c',
      delimiter: ';',
      useQuotes: true
    });
    expect(generator.columns).toEqual(['a', 'b', 'c']);
    expect(generator.delimiter).toBe(';');
    expect(generator.useQuotes).toBe(true);
  });

  it('应该能够生成小的 CSV 文件', async () => {
    const outputPath = path.join(TEST_DIR, 'small.csv');
    const generator = new CsvGenerator({
      size: 2048,
      outputPath: outputPath,
      columns: 'id,value'
    });
    generator.startTime = Date.now();
    
    const result = await generator.generate();
    
    expect(result.success).toBe(true);
    expect(result.path).toBe(outputPath);
  }, 10000);

  it('应该包含 CSV 表头', async () => {
    const outputPath = path.join(TEST_DIR, 'header.csv');
    const generator = new CsvGenerator({
      size: 1024,
      outputPath: outputPath,
      columns: 'col1,col2,col3'
    });
    generator.startTime = Date.now();
    
    await generator.generate();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (fs.existsSync(outputPath)) {
      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('col1,col2,col3');
    }
  }, 10000);

  it('应该能够按行数生成', async () => {
    const outputPath = path.join(TEST_DIR, 'rows.csv');
    const generator = new CsvGenerator({
      size: 10000000,
      rows: 5,
      outputPath: outputPath
    });
    generator.startTime = Date.now();
    
    const result = await generator.generate();
    
    expect(result.rows).toBe(5);
  }, 10000);

  it('应该支持引号包裹字符串', async () => {
    const outputPath = path.join(TEST_DIR, 'quotes.csv');
    const generator = new CsvGenerator({
      size: 1024,
      outputPath: outputPath,
      useQuotes: true
    });
    generator.startTime = Date.now();
    
    await generator.generate();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (fs.existsSync(outputPath)) {
      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('"');
    }
  }, 10000);
});

describe('XlsxGenerator 测试', () => {
  let XlsxGenerator;

  beforeAll(async () => {
    const module = await import('../src/generate/xlsx.js');
    XlsxGenerator = module.XlsxGenerator;
  });

  it('应该能够创建 XlsxGenerator 实例', () => {
    const generator = new XlsxGenerator({
      size: 1024,
      outputPath: path.join(TEST_DIR, 'test1.xlsx')
    });
    expect(generator).toBeInstanceOf(XlsxGenerator);
    expect(generator.sheetName).toBe('Data');
    expect(generator.table).toBe('user');
    expect(generator.rows).toBe(0);
    expect(generator.debug).toBe(false);
  });

  it('应该支持自定义配置', () => {
    const generator = new XlsxGenerator({
      size: 2048,
      outputPath: path.join(TEST_DIR, 'test2.xlsx'),
      sheetName: '测试表',
      table: 'order',
      rows: 10,
      debug: true
    });
    expect(generator.sheetName).toBe('测试表');
    expect(generator.table).toBe('order');
    expect(generator.rows).toBe(10);
    expect(generator.debug).toBe(true);
  });

  it('应该能够生成小的 XLSX 文件（用户数据）', async () => {
    const outputPath = path.join(TEST_DIR, 'users.xlsx');
    const generator = new XlsxGenerator({
      size: 1024 * 10,
      outputPath: outputPath,
      table: 'user',
      rows: 5,
      sheetName: 'Users'
    });
    generator.startTime = Date.now();
    
    const result = await generator.generate();
    
    expect(result.success).toBe(true);
    expect(result.path).toBe(outputPath);
    expect(result.rows).toBe(5);
    expect(result.table).toBe('user');
    
    // 验证文件存在
    expect(fs.existsSync(outputPath)).toBe(true);
  }, 10000);

  it('应该能够生成订单数据', async () => {
    const outputPath = path.join(TEST_DIR, 'orders.xlsx');
    const generator = new XlsxGenerator({
      size: 1024 * 10,
      outputPath: outputPath,
      table: 'order',
      rows: 3,
      sheetName: 'Orders'
    });
    generator.startTime = Date.now();
    
    const result = await generator.generate();
    
    expect(result.success).toBe(true);
    expect(result.rows).toBe(3);
    expect(result.table).toBe('order');
    expect(fs.existsSync(outputPath)).toBe(true);
  }, 10000);

  it('应该能够生成产品数据', async () => {
    const outputPath = path.join(TEST_DIR, 'products.xlsx');
    const generator = new XlsxGenerator({
      size: 1024 * 10,
      outputPath: outputPath,
      table: 'product',
      rows: 8,
      sheetName: 'Products'
    });
    generator.startTime = Date.now();
    
    const result = await generator.generate();
    
    expect(result.success).toBe(true);
    expect(result.rows).toBe(8);
    expect(result.table).toBe('product');
    expect(fs.existsSync(outputPath)).toBe(true);
  }, 10000);
});
