/**
 * 缓存管理模块
 * 负责参数和结果的本地缓存管理
 */
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 缓存目录
export const CACHE_DIR = path.join(__dirname, '../../cache');

/**
 * 确保缓存目录存在
 */
export async function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    await fsPromises.mkdir(CACHE_DIR, { recursive: true });
  }
}

/**
 * 生成缓存键
 * @param {string} functionName - 函数名称
 * @param {object} params - 参数对象
 * @returns {string} 缓存键
 */
export function generateCacheKey(functionName, params) {
  const keyStr = `${functionName}:${JSON.stringify(params)}`;
  const hash = createHash('md5').update(keyStr).digest('hex');
  return `${functionName}_${hash}`;
}

/**
 * 写入参数文件
 * @param {string} functionName - 函数名称
 * @param {object} params - 参数对象
 * @returns {string} 参数文件路径
 */
export async function writeDebugParams(functionName, params) {
  await ensureCacheDir();
  const cacheKey = generateCacheKey(functionName, params);
  const paramFilePath = path.join(CACHE_DIR, `${cacheKey}.params.json`);

  try {
    await fsPromises.writeFile(paramFilePath, JSON.stringify(params, null, 2), 'utf8');
    console.log(`参数已写入：${paramFilePath}`);
    return paramFilePath;
  } catch (error) {
    console.error('写入参数文件失败:', error);
    throw error;
  }
}

/**
 * 写入结果文件
 * @param {string} functionName - 函数名称
 * @param {object} params - 参数对象
 * @param {object} result - 结果对象
 * @returns {string} 结果文件路径
 */
export async function writeResult(functionName, params, result) {
  await ensureCacheDir();
  const cacheKey = generateCacheKey(functionName, params);
  const resultFilePath = path.join(CACHE_DIR, `${cacheKey}.data.json`);

  try {
    await fsPromises.writeFile(resultFilePath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`结果已写入：${resultFilePath}`);
    return resultFilePath;
  } catch (error) {
    console.error('写入结果文件失败:', error);
    throw error;
  }
}

export default {
  CACHE_DIR,
  ensureCacheDir,
  generateCacheKey,
  writeDebugParams,
  writeResult
};
