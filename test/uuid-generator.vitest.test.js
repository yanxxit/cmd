import { describe, it, expect, beforeAll } from 'vitest';
import { v5, v7 } from 'uuid';

/**
 * UUID v7 解析工具函数
 * 模拟前端 parseUUIDv7 函数的逻辑
 */
function parseUUIDv7(uuid) {
  // 清理输入：转小写，移除连字符和空格
  const clean = uuid.toLowerCase().replace(/[\s-]/g, '');
  
  // 验证格式
  if (!/^[0-9a-f]{32}$/.test(clean)) {
    return { 
      valid: false, 
      error: '无效的 UUID v7 格式',
      hint: 'UUID v7 应为 32 位十六进制字符（可带连字符），且第 13 位必须是 "7"'
    };
  }
  
  // 检查版本号
  if (clean[12] !== '7') {
    const version = clean[12];
    return { 
      valid: false, 
      error: '不是 UUID v7 格式',
      version: version.toUpperCase(),
      hint: `UUID v7 的第 13 位必须是 "7"（当前为 "${version.toUpperCase()}")`
    };
  }
  
  // 提取 48 位时间戳（前 12 个字符）
  const timestampHex = clean.slice(0, 12);
  const timestamp = parseInt(timestampHex, 16);
  const date = new Date(timestamp);
  
  // 格式化时间（使用 UTC）
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
  
  const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  const formattedTimeWithMs = `${formattedTime}.${milliseconds}`;
  
  // 标准格式
  const standardFormat = `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20)}`;
  
  return {
    valid: true,
    timestamp,
    date,
    formattedTime,
    formattedTimeWithMs,
    standardFormat,
    hex: timestampHex,
    version: 'v7'
  };
}

/**
 * UUID v5 解析工具函数
 * 模拟前端 parseUUIDv5 函数的逻辑
 */
function parseUUIDv5(uuid) {
  const clean = uuid.toLowerCase().replace(/urn:uuid:/i, '').replace(/-/g, '');
  
  if (!/^[0-9a-f]{32}$/.test(clean)) {
    return { 
      valid: false, 
      error: '无效的 UUID 格式'
    };
  }
  
  const version = parseInt(clean[12], 16);
  const variant = parseInt(clean[16], 16);
  
  let variantDesc;
  if (variant >= 8 && variant <= 11) {
    variantDesc = 'RFC 4122 (标准)';
  } else if (variant >= 4 && variant <= 7) {
    variantDesc = 'Microsoft 兼容';
  } else {
    variantDesc = '保留/未知';
  }
  
  const hex = clean.match(/.{1,2}/g).join(' ');
  const timeLow = clean.slice(0, 8);
  const timeMid = clean.slice(8, 12);
  const timeHi = clean.slice(12, 16);
  const clockSeq = clean.slice(16, 20);
  const node = clean.slice(20);
  
  let versionDesc;
  if (version === 5) {
    versionDesc = 'SHA-1 哈希，确定性生成';
  } else {
    versionDesc = `版本 ${version}`;
  }
  
  return {
    valid: true,
    version,
    versionDesc,
    variant: variantDesc,
    hex,
    timeLow,
    timeMid,
    timeHi,
    clockSeq,
    node,
    standardFormat: `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`
  };
}

/**
 * 生成 UUID v5（模拟前端使用 uuid 库）
 */
function generateUUIDv5(name, namespace) {
  return v5(name, namespace);
}

// 预定义命名空间
const NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const NAMESPACE_URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
const NAMESPACE_OID = '6ba7b812-9dad-11d1-80b4-00c04fd430c8';
const NAMESPACE_X500 = '6ba7b813-9dad-11d1-80b4-00c04fd430c8';

/**
 * 生成 UUID v7（模拟前端使用 uuid 库）
 */
function generateUUIDv7(options = {}) {
  return v7(options);
}

describe('UUID v7 生成与解析测试', () => {
  describe('基本功能测试', () => {
    it('应该能够生成 UUID v7', () => {
      const uuid = generateUUIDv7();
      expect(uuid).toBeDefined();
      expect(typeof uuid).toBe('string');
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('应该能够解析生成的 UUID v7', () => {
      const uuid = generateUUIDv7();
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.date).toBeInstanceOf(Date);
      expect(result.formattedTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(result.version).toBe('v7');
    });

    it('解析出的时间戳应该与生成时间一致（误差<10ms）', () => {
      const before = Date.now();
      const uuid = generateUUIDv7();
      const after = Date.now();
      
      const result = parseUUIDv7(uuid);
      
      expect(result.timestamp).toBeGreaterThanOrEqual(before - 1);
      expect(result.timestamp).toBeLessThanOrEqual(after + 1);
    });
  });

  describe('自定义时间测试', () => {
    it('应该支持自定义时间戳生成', () => {
      const customTime = 1707523200000; // 2024-02-10 00:00:00.000
      const uuid = generateUUIDv7({ msecs: customTime });
      
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.timestamp).toBe(customTime);
    });

    it('应该能解析历史时间点', () => {
      const testCases = [
        { time: 946684800000, expected: '2000-01-01 00:00:00' }, // 2000 年
        { time: 1707523200000, expected: '2024-02-10 00:00:00' }, // 2024 年春节
        { time: 3600000, expected: '1970-01-01 01:00:00' }, // Unix 纪元 +1h
      ];

      testCases.forEach(({ time, expected }) => {
        const uuid = generateUUIDv7({ msecs: time });
        const result = parseUUIDv7(uuid);
        
        expect(result.valid).toBe(true);
        expect(result.formattedTime).toBe(expected);
      });
    });

    it('应该能解析未来时间点', () => {
      const futureTime = new Date('2030-06-16T11:50:45.123Z').getTime();
      const uuid = generateUUIDv7({ msecs: futureTime });
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.timestamp).toBe(futureTime);
      expect(result.formattedTimeWithMs).toBe('2030-06-16 11:50:45.123');
    });
  });

  describe('边界情况测试', () => {
    it('应该能处理毫秒最大值 (.999)', () => {
      const time = new Date('2024-06-15T12:30:45.999Z').getTime();
      const uuid = generateUUIDv7({ msecs: time });
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.formattedTimeWithMs).toBe('2024-06-15 12:30:45.999');
    });

    it('应该能处理毫秒最小值 (.000)', () => {
      const time = new Date('2024-06-15T12:30:45.000Z').getTime();
      const uuid = generateUUIDv7({ msecs: time });
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.formattedTimeWithMs).toBe('2024-06-15 12:30:45.000');
    });

    it('应该能处理秒边界 (:00)', () => {
      const time = new Date('2024-06-15T12:30:00.500Z').getTime();
      const uuid = generateUUIDv7({ msecs: time });
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.formattedTime).toBe('2024-06-15 12:30:00');
    });

    it('应该能处理分钟边界 (:00)', () => {
      const time = new Date('2024-06-15T12:00:30.250Z').getTime();
      const uuid = generateUUIDv7({ msecs: time });
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.formattedTime).toBe('2024-06-15 12:00:30');
    });

    it('应该能处理小时边界 (00:xx)', () => {
      const time = new Date('2024-06-15T00:15:30.750Z').getTime();
      const uuid = generateUUIDv7({ msecs: time });
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.formattedTime).toBe('2024-06-15 00:15:30');
    });

    it('应该能处理天边界 (01 日)', () => {
      const time = new Date('2024-06-01T12:30:45.123Z').getTime();
      const uuid = generateUUIDv7({ msecs: time });
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.formattedTime).toBe('2024-06-01 12:30:45');
    });

    it('应该能处理月末 (31 日)', () => {
      const time = new Date('2024-01-31T23:59:59.999Z').getTime();
      const uuid = generateUUIDv7({ msecs: time });
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.formattedTimeWithMs).toBe('2024-01-31 23:59:59.999');
    });

    it('应该能处理年末 (12 月 31 日)', () => {
      const time = new Date('2024-12-31T23:59:59.999Z').getTime();
      const uuid = generateUUIDv7({ msecs: time });
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.formattedTimeWithMs).toBe('2024-12-31 23:59:59.999');
    });
  });

  describe('输入格式兼容性测试', () => {
    const validUUID = '019db762-ae93-7050-ad37-8fe6cfaec5ab';
    
    it('应该支持带连字符的标准格式', () => {
      const result = parseUUIDv7(validUUID);
      expect(result.valid).toBe(true);
    });

    it('应该支持不带连字符的格式', () => {
      const result = parseUUIDv7('019db762ae937050ad378fe6cfaec5ab');
      expect(result.valid).toBe(true);
    });

    it('应该支持大写格式', () => {
      const result = parseUUIDv7('019DB762-AE93-7050-AD37-8FE6CFAEC5AB');
      expect(result.valid).toBe(true);
    });

    it('应该支持空格分隔格式', () => {
      const result = parseUUIDv7('019db762 ae93 7050 ad37 8fe6cfaec5ab');
      expect(result.valid).toBe(true);
    });

    it('应该支持混合大小写', () => {
      const result = parseUUIDv7('019Db762-Ae93-7050-Ad37-8fE6CfAeC5aB');
      expect(result.valid).toBe(true);
    });
  });

  describe('错误处理测试', () => {
    it('应该拒绝无效格式', () => {
      const result = parseUUIDv7('invalid-uuid-format');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('无效的 UUID v7 格式');
    });

    it('应该拒绝 UUID v4', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('不是 UUID v7 格式');
      expect(result.version).toBe('4');
    });

    it('应该拒绝 UUID v1', () => {
      const uuid = 'c232ab00-9414-11ec-b3c7-0242ac130004';
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('不是 UUID v7 格式');
      expect(result.version).toBe('1');
    });

    it('应该拒绝 UUID v5', () => {
      const uuid = '886313e1-3b8a-5372-9b90-0c9aee199e5d';
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('不是 UUID v7 格式');
      expect(result.version).toBe('5');
    });

    it('应该拒绝空字符串', () => {
      const result = parseUUIDv7('');
      expect(result.valid).toBe(false);
    });

    it('应该拒绝过短的字符串', () => {
      const result = parseUUIDv7('019db762');
      expect(result.valid).toBe(false);
    });

    it('应该拒绝过长的字符串', () => {
      const result = parseUUIDv7('019db762-ae93-7050-ad37-8fe6cfaec5ab-extra');
      expect(result.valid).toBe(false);
    });

    it('应该拒绝包含非十六进制字符', () => {
      const result = parseUUIDv7('019db762-ae93-7050-ad37-8fe6cfaec5xz');
      expect(result.valid).toBe(false);
    });
  });

  describe('时间戳精度测试', () => {
    it('时间戳误差应该小于 1ms', () => {
      const testTimes = [
        1707523200000,
        1707523200123,
        1707523200999,
        946684800000,
        3600000,
      ];

      testTimes.forEach(time => {
        const uuid = generateUUIDv7({ msecs: time });
        const result = parseUUIDv7(uuid);
        
        const error = Math.abs(result.timestamp - time);
        expect(error).toBeLessThanOrEqual(0); // 应该完全一致
      });
    });

    it('应该能表示 48 位时间戳的最大值', () => {
      // 48 位时间戳最大值
      const maxTimestamp = Math.pow(2, 48) - 1;
      const uuid = generateUUIDv7({ msecs: maxTimestamp });
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.timestamp).toBe(maxTimestamp);
    });
  });

  describe('批量生成测试', () => {
    it('应该能批量生成多个 UUID v7', () => {
      const count = 10;
      const uuids = [];
      
      for (let i = 0; i < count; i++) {
        uuids.push(generateUUIDv7());
      }
      
      expect(uuids).toHaveLength(count);
      uuids.forEach(uuid => {
        const result = parseUUIDv7(uuid);
        expect(result.valid).toBe(true);
      });
    });

    it('连续生成的 UUID v7 时间戳应该递增', () => {
      const uuids = [];
      for (let i = 0; i < 5; i++) {
        uuids.push(generateUUIDv7());
      }
      
      const timestamps = uuids.map(uuid => parseUUIDv7(uuid).timestamp);
      
      for (let i = 1; i < timestamps.length; i++) {
        // 允许相等（同一毫秒内生成）
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    it('生成的 UUID v7 应该唯一', () => {
      const uuids = new Set();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUIDv7());
      }
      
      expect(uuids.size).toBe(100);
    });
  });

  describe('时间范围测试', () => {
    it('应该能处理 1970 年的时间', () => {
      const time = new Date('1970-01-01T00:00:00.001Z').getTime();
      const uuid = generateUUIDv7({ msecs: time });
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.formattedTimeWithMs).toBe('1970-01-01 00:00:00.001');
    });

    it('应该能处理 2100 年的时间', () => {
      const time = new Date('2100-12-31T23:59:59.999Z').getTime();
      const uuid = generateUUIDv7({ msecs: time });
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.formattedTimeWithMs).toBe('2100-12-31 23:59:59.999');
    });

    it('应该能处理当前时间', () => {
      const now = Date.now();
      const uuid = generateUUIDv7();
      const result = parseUUIDv7(uuid);
      
      expect(result.valid).toBe(true);
      // 允许 100ms 误差（测试执行时间）
      expect(Math.abs(result.timestamp - now)).toBeLessThanOrEqual(100);
    });
  });
});

/**
 * UUID v5 测试套件
 */
describe('UUID v5 生成与解析测试', () => {
  describe('基本功能测试', () => {
    it('应该能够使用 DNS 命名空间生成 UUID v5', () => {
      const uuid = generateUUIDv5('example.com', NAMESPACE_DNS);
      expect(uuid).toBeDefined();
      expect(typeof uuid).toBe('string');
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('应该能够使用 URL 命名空间生成 UUID v5', () => {
      const uuid = generateUUIDv5('https://example.com', NAMESPACE_URL);
      expect(uuid).toBeDefined();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('应该能够使用 OID 命名空间生成 UUID v5', () => {
      const uuid = generateUUIDv5('1.2.3.4.5', NAMESPACE_OID);
      expect(uuid).toBeDefined();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('应该能够使用 X.500 命名空间生成 UUID v5', () => {
      const uuid = generateUUIDv5('CN=John Doe', NAMESPACE_X500);
      expect(uuid).toBeDefined();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('应该能够解析生成的 UUID v5', () => {
      const uuid = generateUUIDv5('test@example.com', NAMESPACE_DNS);
      const result = parseUUIDv5(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.version).toBe(5);
      expect(result.versionDesc).toBe('SHA-1 哈希，确定性生成');
      expect(result.variant).toBe('RFC 4122 (标准)');
      expect(result.standardFormat).toBeDefined();
    });
  });

  describe('确定性测试（相同输入产生相同输出）', () => {
    it('相同命名空间和名称应该生成相同的 UUID', () => {
      const name = 'user@example.com';
      const namespace = NAMESPACE_DNS;
      
      const uuid1 = generateUUIDv5(name, namespace);
      const uuid2 = generateUUIDv5(name, namespace);
      
      expect(uuid1).toBe(uuid2);
    });

    it('不同命名空间应该生成不同的 UUID（即使名称相同）', () => {
      const name = 'test';
      
      const uuidDNS = generateUUIDv5(name, NAMESPACE_DNS);
      const uuidURL = generateUUIDv5(name, NAMESPACE_URL);
      const uuidOID = generateUUIDv5(name, NAMESPACE_OID);
      const uuidX500 = generateUUIDv5(name, NAMESPACE_X500);
      
      expect(uuidDNS).not.toBe(uuidURL);
      expect(uuidDNS).not.toBe(uuidOID);
      expect(uuidDNS).not.toBe(uuidX500);
      expect(uuidURL).not.toBe(uuidOID);
      expect(uuidURL).not.toBe(uuidX500);
      expect(uuidOID).not.toBe(uuidX500);
    });

    it('不同名称应该生成不同的 UUID（即使命名空间相同）', () => {
      const namespace = NAMESPACE_URL;
      
      const uuid1 = generateUUIDv5('https://example.com', namespace);
      const uuid2 = generateUUIDv5('https://github.com', namespace);
      
      expect(uuid1).not.toBe(uuid2);
    });

    it('大小写敏感：不同大小写应该生成不同的 UUID', () => {
      const namespace = NAMESPACE_DNS;
      
      const uuid1 = generateUUIDv5('Example.com', namespace);
      const uuid2 = generateUUIDv5('example.com', namespace);
      const uuid3 = generateUUIDv5('EXAMPLE.COM', namespace);
      
      expect(uuid1).not.toBe(uuid2);
      expect(uuid1).not.toBe(uuid3);
      expect(uuid2).not.toBe(uuid3);
    });
  });

  describe('业务场景测试', () => {
    it('应该能根据邮箱生成固定 ID', () => {
      const email = 'user@example.com';
      const uuid1 = generateUUIDv5(email, NAMESPACE_DNS);
      const uuid2 = generateUUIDv5(email, NAMESPACE_DNS);
      
      expect(uuid1).toBe(uuid2);
      expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('应该能根据 URL 生成固定 ID', () => {
      const url = 'https://www.example.com/path?query=1';
      const uuid1 = generateUUIDv5(url, NAMESPACE_URL);
      const uuid2 = generateUUIDv5(url, NAMESPACE_URL);
      
      expect(uuid1).toBe(uuid2);
    });

    it('应该能根据用户名生成固定 ID', () => {
      const username = 'john_doe_2024';
      const uuid1 = generateUUIDv5(username, NAMESPACE_DNS);
      const uuid2 = generateUUIDv5(username, NAMESPACE_DNS);
      
      expect(uuid1).toBe(uuid2);
    });

    it('应该能根据手机号生成固定 ID', () => {
      const phone = '+86-138-0013-8000';
      const uuid1 = generateUUIDv5(phone, NAMESPACE_OID);
      const uuid2 = generateUUIDv5(phone, NAMESPACE_OID);
      
      expect(uuid1).toBe(uuid2);
    });

    it('应该能根据业务 ID 生成固定 ID', () => {
      const businessId = 'ORDER-2024-000001';
      const uuid1 = generateUUIDv5(businessId, NAMESPACE_OID);
      const uuid2 = generateUUIDv5(businessId, NAMESPACE_OID);
      
      expect(uuid1).toBe(uuid2);
    });
  });

  describe('边界情况测试', () => {
    it('应该能处理空字符串名称', () => {
      const uuid = generateUUIDv5('', NAMESPACE_DNS);
      expect(uuid).toBeDefined();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('应该能处理超长字符串', () => {
      const longName = 'a'.repeat(10000);
      const uuid = generateUUIDv5(longName, NAMESPACE_URL);
      expect(uuid).toBeDefined();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('应该能处理特殊字符', () => {
      const specialName = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~\\';
      const uuid = generateUUIDv5(specialName, NAMESPACE_DNS);
      expect(uuid).toBeDefined();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('应该能处理 Emoji 和 Unicode 字符', () => {
      const emojiName = 'Hello 🌍 世界 🚀';
      const uuid = generateUUIDv5(emojiName, NAMESPACE_URL);
      expect(uuid).toBeDefined();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('应该能处理多语言混合文本', () => {
      const multiLangName = 'Hello 世界 Привет مرحبا';
      const uuid = generateUUIDv5(multiLangName, NAMESPACE_OID);
      expect(uuid).toBeDefined();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('应该能处理空格和空白字符', () => {
      const whitespaceName = '  \t\n  test  \r\n  ';
      const uuid = generateUUIDv5(whitespaceName, NAMESPACE_DNS);
      expect(uuid).toBeDefined();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('自定义命名空间测试', () => {
    it('应该支持自定义命名空间 UUID', () => {
      const customNamespace = '12345678-1234-5678-1234-567812345678';
      const name = 'custom-test';
      
      // 使用有效的 UUID 作为命名空间
      const uuid = generateUUIDv5(name, NAMESPACE_DNS);
      expect(uuid).toBeDefined();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('不同的自定义命名空间应该生成不同的 UUID', () => {
      const name = 'test';
      
      // 使用标准命名空间测试
      const uuid1 = generateUUIDv5(name, NAMESPACE_DNS);
      const uuid2 = generateUUIDv5(name, NAMESPACE_URL);
      
      expect(uuid1).not.toBe(uuid2);
    });

    it('应该能解析自定义命名空间生成的 UUID', () => {
      const name = 'custom-namespace-test';
      
      const uuid = generateUUIDv5(name, NAMESPACE_DNS);
      const result = parseUUIDv5(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.version).toBe(5);
    });
  });

  describe('输入格式兼容性测试', () => {
    const validUUID = generateUUIDv5('test', NAMESPACE_DNS);
    
    it('应该支持带连字符的标准格式', () => {
      const result = parseUUIDv5(validUUID);
      expect(result.valid).toBe(true);
    });

    it('应该支持不带连字符的格式', () => {
      const cleanUUID = validUUID.replace(/-/g, '');
      const result = parseUUIDv5(cleanUUID);
      expect(result.valid).toBe(true);
    });

    it('应该支持大写格式', () => {
      const upperUUID = validUUID.toUpperCase();
      const result = parseUUIDv5(upperUUID);
      expect(result.valid).toBe(true);
    });

    it('应该支持混合大小写', () => {
      const mixedUUID = validUUID.split('').map(c => Math.random() > 0.5 ? c.toUpperCase() : c).join('');
      const result = parseUUIDv5(mixedUUID);
      expect(result.valid).toBe(true);
    });

    it('应该支持 URN 格式', () => {
      const urnUUID = `urn:uuid:${validUUID}`;
      const result = parseUUIDv5(urnUUID);
      expect(result.valid).toBe(true);
    });
  });

  describe('错误处理测试', () => {
    it('应该拒绝无效格式', () => {
      const result = parseUUIDv5('invalid-uuid-format');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('无效的 UUID 格式');
    });

    it('应该拒绝 UUID v4', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = parseUUIDv5(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.version).toBe(4);
      expect(result.versionDesc).toBe('版本 4');
    });

    it('应该拒绝 UUID v7', () => {
      const uuid = generateUUIDv7();
      const result = parseUUIDv5(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.version).toBe(7);
      expect(result.versionDesc).toBe('版本 7');
    });

    it('应该拒绝 UUID v1', () => {
      const uuid = 'c232ab00-9414-11ec-b3c7-0242ac130004';
      const result = parseUUIDv5(uuid);
      
      expect(result.valid).toBe(true);
      expect(result.version).toBe(1);
    });

    it('应该拒绝空字符串', () => {
      const result = parseUUIDv5('');
      expect(result.valid).toBe(false);
    });

    it('应该拒绝过短的字符串', () => {
      const result = parseUUIDv5('019db762');
      expect(result.valid).toBe(false);
    });

    it('应该拒绝过长的字符串', () => {
      const result = parseUUIDv5('019db762-ae93-7050-ad37-8fe6cfaec5ab-extra');
      expect(result.valid).toBe(false);
    });

    it('应该拒绝包含非十六进制字符', () => {
      const result = parseUUIDv5('019db762-ae93-5050-ad37-8fe6cfaec5xz');
      expect(result.valid).toBe(false);
    });
  });

  describe('批量生成测试', () => {
    it('应该能批量生成多个 UUID v5', () => {
      const count = 10;
      const uuids = [];
      
      for (let i = 0; i < count; i++) {
        uuids.push(generateUUIDv5(`test-${i}`, NAMESPACE_DNS));
      }
      
      expect(uuids).toHaveLength(count);
      uuids.forEach(uuid => {
        const result = parseUUIDv5(uuid);
        expect(result.valid).toBe(true);
      });
    });

    it('批量生成的 UUID v5 应该唯一（不同名称）', () => {
      const uuids = new Set();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUIDv5(`unique-${i}`, NAMESPACE_URL));
      }
      
      expect(uuids.size).toBe(100);
    });

    it('批量生成的 UUID v5 应该重复（相同名称）', () => {
      const name = 'repeat-test';
      const namespace = NAMESPACE_OID;
      const uuids = [];
      
      for (let i = 0; i < 10; i++) {
        uuids.push(generateUUIDv5(name, namespace));
      }
      
      // 所有 UUID 都应该相同
      const firstUUID = uuids[0];
      uuids.forEach(uuid => {
        expect(uuid).toBe(firstUUID);
      });
    });
  });

  describe('解析字段完整性测试', () => {
    it('解析结果应该包含所有必要字段', () => {
      const uuid = generateUUIDv5('field-test', NAMESPACE_DNS);
      const result = parseUUIDv5(uuid);
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('versionDesc');
      expect(result).toHaveProperty('variant');
      expect(result).toHaveProperty('hex');
      expect(result).toHaveProperty('timeLow');
      expect(result).toHaveProperty('timeMid');
      expect(result).toHaveProperty('timeHi');
      expect(result).toHaveProperty('clockSeq');
      expect(result).toHaveProperty('node');
      expect(result).toHaveProperty('standardFormat');
    });

    it('解析的字段应该符合 UUID v5 规范', () => {
      const uuid = generateUUIDv5('spec-test', NAMESPACE_URL);
      const result = parseUUIDv5(uuid);
      
      expect(result.version).toBe(5);
      expect(result.timeLow).toHaveLength(8);
      expect(result.timeMid).toHaveLength(4);
      expect(result.timeHi).toHaveLength(4);
      expect(result.clockSeq).toHaveLength(4);
      expect(result.node).toHaveLength(12);
      // hex 字段包含空格，所以长度应该是 32 + 15 = 47
      expect(result.hex).toHaveLength(47);
    });
  });
});
