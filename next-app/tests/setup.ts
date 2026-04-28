/**
 * Vitest 测试设置文件
 * 
 * 配置全局测试环境、mock 数据等
 */

import { vi } from 'vitest';

// 全局 mock
global.fetch = vi.fn();
global.Headers = vi.fn();
global.Request = vi.fn();
global.Response = vi.fn();

// 设置全局超时
vi.setConfig({
  testTimeout: 30000,
});

// 清理 mock
beforeEach(() => {
  vi.clearAllMocks();
});

// 测试完成后清理
afterAll(() => {
  vi.restoreAllMocks();
});

export {};
