/**
 * AE 云函数调试工具
 * 统一导出所有模块
 */

export { CACHE_DIR, ensureCacheDir, generateCacheKey, writeDebugParams, writeResult } from './cache.js';
export { invokeCloudFunction } from './invoker.js';
export { 
  addHistoryRecord, 
  getHistoryRecords, 
  getHistoryRecordById, 
  updateHistoryRecord, 
  addTags, 
  deleteHistoryRecord, 
  getStats 
} from './history.js';

import cacheModule from './cache.js';
import invokerModule from './invoker.js';
import historyModule from './history.js';

export default {
  ...cacheModule,
  ...invokerModule,
  ...historyModule
};
