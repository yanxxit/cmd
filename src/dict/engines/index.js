/**
 * 翻译引擎模块
 * 提供多种翻译引擎支持
 */

export { TranslationEngine } from './base.js';
export { YoudaoEngine } from './youdao.js';
export { DSEngine } from './ds.js';
export { EngineManager } from './manager.js';

// 默认导出管理器
import { EngineManager } from './manager.js';
export default EngineManager;
