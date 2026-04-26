import { describe, it, expect } from 'vitest';
import {
  UUID_NAMESPACES,
  isValidUUID,
  getUUIDVersion,
  isUUIDv5,
  isUUIDv4,
  isUUIDv7,
  normalizeUUID,
  removeDashes,
  getUUIDVariant
} from '../src/util/uuid-utils.js';
import { v4, v5, v7 } from 'uuid';

describe('UUID 工具函数测试', () => {
  describe('UUID_NAMESPACES 常量', () => {
    it('应该导出 DNS 命名空间', () => {
      expect(UUID_NAMESPACES.DNS).toBe('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    });

    it('应该导出 URL 命名空间', () => {
      expect(UUID_NAMESPACES.URL).toBe('6ba7b811-9dad-11d1-80b4-00c04fd430c8');
    });

    it('应该导出 OID 命名空间', () => {
      expect(UUID_NAMESPACES.OID).toBe('6ba7b812-9dad-11d1-80b4-00c04fd430c8');
    });

    it('应该导出 X.500 命名空间', () => {
      expect(UUID_NAMESPACES.X500).toBe('6ba7b813-9dad-11d1-80b4-00c04fd430c8');
    });

    it('所有命名空间都应该是有效的 UUID 格式', () => {
      Object.values(UUID_NAMESPACES).forEach(ns => {
        expect(isValidUUID(ns)).toBe(true);
      });
    });
  });

  describe('isValidUUID 函数', () => {
    it('应该验证标准格式的 UUID', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('应该验证不带连字符的 UUID', () => {
      expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(true);
    });

    it('应该验证大写的 UUID', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('应该拒绝无效的 UUID 格式', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
    });

    it('应该拒绝空字符串', () => {
      expect(isValidUUID('')).toBe(false);
    });

    it('应该拒绝 null', () => {
      expect(isValidUUID(null)).toBe(false);
    });

    it('应该拒绝 undefined', () => {
      expect(isValidUUID(undefined)).toBe(false);
    });

    it('应该拒绝非字符串类型', () => {
      expect(isValidUUID(123)).toBe(false);
      expect(isValidUUID({})).toBe(false);
      expect(isValidUUID([])).toBe(false);
    });

    it('应该拒绝过短的字符串', () => {
      expect(isValidUUID('550e8400')).toBe(false);
    });

    it('应该拒绝过长的字符串', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
    });

    it('应该拒绝包含非十六进制字符', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-4466554400xz')).toBe(false);
    });
  });

  describe('getUUIDVersion 函数', () => {
    it('应该正确识别 UUID v1', () => {
      expect(getUUIDVersion('c232ab00-9414-11ec-b3c7-0242ac130004')).toBe(1);
    });

    it('应该正确识别 UUID v4', () => {
      const uuid = v4();
      expect(getUUIDVersion(uuid)).toBe(4);
    });

    it('应该正确识别 UUID v5', () => {
      const uuid = v5('test', UUID_NAMESPACES.DNS);
      expect(getUUIDVersion(uuid)).toBe(5);
    });

    it('应该正确识别 UUID v7', () => {
      const uuid = v7();
      expect(getUUIDVersion(uuid)).toBe(7);
    });

    it('应该支持不带连字符的格式', () => {
      expect(getUUIDVersion('550e8400e29b41d4a716446655440000')).toBe(4);
    });

    it('应该支持大写格式', () => {
      expect(getUUIDVersion('550E8400-E29B-41D4-A716-446655440000')).toBe(4);
    });

    it('应该对无效 UUID 返回 null', () => {
      expect(getUUIDVersion('invalid')).toBe(null);
    });

    it('应该对空字符串返回 null', () => {
      expect(getUUIDVersion('')).toBe(null);
    });
  });

  describe('isUUIDv4 函数', () => {
    it('应该对 UUID v4 返回 true', () => {
      const uuid = v4();
      expect(isUUIDv4(uuid)).toBe(true);
    });

    it('应该对 UUID v5 返回 false', () => {
      const uuid = v5('test', UUID_NAMESPACES.DNS);
      expect(isUUIDv4(uuid)).toBe(false);
    });

    it('应该对 UUID v7 返回 false', () => {
      const uuid = v7();
      expect(isUUIDv4(uuid)).toBe(false);
    });

    it('应该对无效 UUID 返回 false', () => {
      expect(isUUIDv4('invalid')).toBe(false);
    });
  });

  describe('isUUIDv5 函数', () => {
    it('应该对 UUID v5 返回 true', () => {
      const uuid = v5('test', UUID_NAMESPACES.DNS);
      expect(isUUIDv5(uuid)).toBe(true);
    });

    it('应该对 UUID v4 返回 false', () => {
      const uuid = v4();
      expect(isUUIDv5(uuid)).toBe(false);
    });

    it('应该对 UUID v7 返回 false', () => {
      const uuid = v7();
      expect(isUUIDv5(uuid)).toBe(false);
    });

    it('应该对无效 UUID 返回 false', () => {
      expect(isUUIDv5('invalid')).toBe(false);
    });
  });

  describe('isUUIDv7 函数', () => {
    it('应该对 UUID v7 返回 true', () => {
      const uuid = v7();
      expect(isUUIDv7(uuid)).toBe(true);
    });

    it('应该对 UUID v4 返回 false', () => {
      const uuid = v4();
      expect(isUUIDv7(uuid)).toBe(false);
    });

    it('应该对 UUID v5 返回 false', () => {
      const uuid = v5('test', UUID_NAMESPACES.DNS);
      expect(isUUIDv7(uuid)).toBe(false);
    });

    it('应该对无效 UUID 返回 false', () => {
      expect(isUUIDv7('invalid')).toBe(false);
    });
  });

  describe('normalizeUUID 函数', () => {
    it('应该标准化带连字符的 UUID', () => {
      const input = '550E8400-E29B-41D4-A716-446655440000';
      const expected = '550e8400-e29b-41d4-a716-446655440000';
      expect(normalizeUUID(input)).toBe(expected);
    });

    it('应该标准化不带连字符的 UUID', () => {
      const input = '550e8400e29b41d4a716446655440000';
      const expected = '550e8400-e29b-41d4-a716-446655440000';
      expect(normalizeUUID(input)).toBe(expected);
    });

    it('应该保持标准 UUID 不变（除了转小写）', () => {
      const input = '550e8400-e29b-41d4-a716-446655440000';
      expect(normalizeUUID(input)).toBe(input);
    });

    it('应该对无效 UUID 返回 null', () => {
      expect(normalizeUUID('invalid')).toBe(null);
    });

    it('应该对空字符串返回 null', () => {
      expect(normalizeUUID('')).toBe(null);
    });
  });

  describe('removeDashes 函数', () => {
    it('应该移除 UUID 中的连字符', () => {
      const input = '550e8400-e29b-41d4-a716-446655440000';
      const expected = '550e8400e29b41d4a716446655440000';
      expect(removeDashes(input)).toBe(expected);
    });

    it('应该处理已经不带连字符的 UUID', () => {
      const input = '550e8400e29b41d4a716446655440000';
      const expected = '550e8400e29b41d4a716446655440000';
      expect(removeDashes(input)).toBe(expected);
    });

    it('应该转小写', () => {
      const input = '550E8400-E29B-41D4-A716-446655440000';
      const expected = '550e8400e29b41d4a716446655440000';
      expect(removeDashes(input)).toBe(expected);
    });

    it('应该对无效 UUID 返回 null', () => {
      expect(removeDashes('invalid')).toBe(null);
    });

    it('应该对空字符串返回 null', () => {
      expect(removeDashes('')).toBe(null);
    });
  });

  describe('getUUIDVariant 函数', () => {
    it('应该识别 RFC 4122 变体（标准 UUID）', () => {
      const uuid = v4();
      expect(getUUIDVariant(uuid)).toBe('RFC 4122');
    });

    it('应该识别 RFC 4122 变体（UUID v5）', () => {
      const uuid = v5('test', UUID_NAMESPACES.DNS);
      expect(getUUIDVariant(uuid)).toBe('RFC 4122');
    });

    it('应该识别 RFC 4122 变体（UUID v7）', () => {
      const uuid = v7();
      expect(getUUIDVariant(uuid)).toBe('RFC 4122');
    });

    it('应该对无效 UUID 返回 null', () => {
      expect(getUUIDVariant('invalid')).toBe(null);
    });

    it('应该对空字符串返回 null', () => {
      expect(getUUIDVariant('')).toBe(null);
    });
  });

  describe('集成测试', () => {
    it('应该能正确识别和处理 UUID v5', () => {
      const uuid = v5('user@example.com', UUID_NAMESPACES.DNS);
      
      expect(isValidUUID(uuid)).toBe(true);
      expect(getUUIDVersion(uuid)).toBe(5);
      expect(isUUIDv5(uuid)).toBe(true);
      expect(isUUIDv4(uuid)).toBe(false);
      expect(isUUIDv7(uuid)).toBe(false);
      expect(getUUIDVariant(uuid)).toBe('RFC 4122');
      
      const normalized = normalizeUUID(uuid);
      expect(normalized).toBeDefined();
      expect(normalized).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('应该能正确识别和处理 UUID v7', () => {
      const uuid = v7();
      
      expect(isValidUUID(uuid)).toBe(true);
      expect(getUUIDVersion(uuid)).toBe(7);
      expect(isUUIDv7(uuid)).toBe(true);
      expect(isUUIDv4(uuid)).toBe(false);
      expect(isUUIDv5(uuid)).toBe(false);
      expect(getUUIDVariant(uuid)).toBe('RFC 4122');
    });

    it('命名空间常量应该可以用于生成 UUID v5', () => {
      const dnsUUID = v5('example.com', UUID_NAMESPACES.DNS);
      const urlUUID = v5('https://example.com', UUID_NAMESPACES.URL);
      const oidUUID = v5('1.2.3.4.5', UUID_NAMESPACES.OID);
      const x500UUID = v5('CN=User', UUID_NAMESPACES.X500);
      
      expect(isUUIDv5(dnsUUID)).toBe(true);
      expect(isUUIDv5(urlUUID)).toBe(true);
      expect(isUUIDv5(oidUUID)).toBe(true);
      expect(isUUIDv5(x500UUID)).toBe(true);
      
      // 不同的命名空间应该生成不同的 UUID
      expect(dnsUUID).not.toBe(urlUUID);
      expect(dnsUUID).not.toBe(oidUUID);
      expect(dnsUUID).not.toBe(x500UUID);
    });
  });
});
