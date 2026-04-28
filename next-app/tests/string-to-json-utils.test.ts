import { describe, it, expect } from 'vitest';
import { parseEscapedJson, stringifyAndEscapeJson } from '../app/string-to-json/utils';

describe('String to JSON Utils', () => {
  describe('parseEscapedJson', () => {
    it('should parse a valid normal JSON string', () => {
      const input = '{"name":"John", "age":30}';
      const result = parseEscapedJson(input);
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should throw an error for empty input', () => {
      expect(() => parseEscapedJson('')).toThrow('Empty input');
      expect(() => parseEscapedJson('   ')).toThrow('Empty input');
    });

    it('should parse a JSON string wrapped in quotes', () => {
      const input = '"{\\"name\\":\\"John\\"}"';
      const result = parseEscapedJson(input);
      expect(result).toEqual({ name: 'John' });
    });

    it('should parse a JSON string wrapped in single quotes', () => {
      const input = "'{\"name\":\"John\"}'";
      const result = parseEscapedJson(input);
      expect(result).toEqual({ name: 'John' });
    });

    it('should parse a multi-level escaped JSON string', () => {
      // 模拟类似 "{\\\"a\\\":1}" 这样双重转义的字符串
      const nestedObj = { a: 1 };
      const level1 = JSON.stringify(nestedObj);
      const level2 = JSON.stringify(level1);
      const level3 = JSON.stringify(level2);
      
      const result = parseEscapedJson(level3);
      expect(result).toEqual(nestedObj);
    });

    it('should handle unescaped quotes by trying to fix them', () => {
      // 很多日志系统直接打出来带有多余反斜杠但不带外层双引号的 JSON
      const input = '{\\"name\\": \\"John\\"}';
      const result = parseEscapedJson(input);
      expect(result).toEqual({ name: 'John' });
    });

    it('should handle double backslashes', () => {
      const input = '{\\\\"name\\\\": \\\\"John\\\\"}';
      const result = parseEscapedJson(input);
      expect(result).toEqual({ name: 'John' });
    });

    it('should throw error when the result is still a string after multiple parse attempts', () => {
      // 解析到底仍然是一个字符串字面量
      const input = '"just a simple string"';
      expect(() => parseEscapedJson(input)).toThrow('Parsed result is still a string');
    });

    it('should throw error for completely invalid JSON', () => {
      const input = '{name: John}'; // 缺少引号
      expect(() => parseEscapedJson(input)).toThrow(SyntaxError);
    });
  });

  describe('stringifyAndEscapeJson', () => {
    it('should stringify and escape a valid JSON object', () => {
      const input = { name: "John", age: 30 };
      const result = stringifyAndEscapeJson(input);
      expect(result).toBe('"{\\"name\\":\\"John\\",\\"age\\":30}"');
    });

    it('should parse and then stringify if input is a valid JSON string', () => {
      const input = '{"name":"John"}';
      const result = stringifyAndEscapeJson(input);
      expect(result).toBe('"{\\"name\\":\\"John\\"}"');
    });

    it('should throw an error if input is an empty string', () => {
      expect(() => stringifyAndEscapeJson('')).toThrow('Empty input');
      expect(() => stringifyAndEscapeJson('   ')).toThrow('Empty input');
    });

    it('should throw an error if input string is invalid JSON', () => {
      const input = '{name: "John"}';
      expect(() => stringifyAndEscapeJson(input)).toThrow(SyntaxError);
    });
  });
});
