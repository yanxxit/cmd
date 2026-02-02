import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

// 获取当前文件所在目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保缓存目录存在
const cacheDir = path.resolve(__dirname, '../../../logs/dict');
await fs.mkdir(cacheDir, { recursive: true });

/**
 * 生成 URL 的 MD5 哈希值作为缓存文件名
 * @param {string} url - 要哈希的 URL
 * @returns {string} MD5 哈希值
 */
function generateCacheFilename(url) {
  return createHash('md5').update(url).digest('hex') + '.json';
}

/**
 * 检查缓存是否存在且未过期
 * @param {string} cacheFilePath - 缓存文件路径
 * @param {number} maxAge - 最大缓存时间（毫秒）
 * @returns {boolean} 缓存是否有效
 */
async function isCacheValid(cacheFilePath, maxAge = 365 * 24 * 60 * 60 * 1000) { // 默认一年
  try {
    const stats = await fs.stat(cacheFilePath);
    const now = Date.now();
    return (now - stats.mtime.getTime()) < maxAge;
  } catch (error) {
    // 文件不存在或无法访问
    return false;
  }
}

/**
 * 从缓存中读取数据
 * @param {string} url - 请求的 URL
 * @returns {Promise<Object|null>} 缓存的数据或 null
 */
async function readFromCache(url) {
  const cacheFilePath = path.join(cacheDir, generateCacheFilename(url));

  if (await isCacheValid(cacheFilePath)) {
    try {
      const cacheData = await fs.readFile(cacheFilePath, 'utf8');
      const parsed = JSON.parse(cacheData);
      return parsed;
    } catch (error) {
      console.error('读取缓存失败:', error.message);
      return null;
    }
  }

  return null;
}

/**
 * 将数据写入缓存
 * @param {string} url - 请求的 URL
 * @param {Object} data - 要缓存的数据
 * @param {string} word - 查询的单词
 */
async function writeToCache(url, data, word) {
  const cacheFilePath = path.join(cacheDir, generateCacheFilename(url));

  const cacheObj = {
    word,
    url,
    data,
    timestamp: Date.now()
  };

  try {
    await fs.writeFile(cacheFilePath, JSON.stringify(cacheObj, null, 2));
  } catch (error) {
    console.error('写入缓存失败:', error.message);
  }
}

/**
 * 清理过期的缓存
 * @param {number} maxAge - 最大缓存时间（毫秒）
 */
async function cleanupOldCache(maxAge = 365 * 24 * 60 * 60 * 1000) {
  try {
    const files = await fs.readdir(cacheDir);
    const now = Date.now();

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(cacheDir, file);
      const stats = await fs.stat(filePath);

      if ((now - stats.mtime.getTime()) >= maxAge) {
        await fs.unlink(filePath);
        console.log(`删除过期缓存: ${file}`);
      }
    }
  } catch (error) {
    console.error('清理缓存时出错:', error.message);
  }
}

export default {
  readFromCache,
  writeToCache,
  cleanupOldCache,
  generateCacheFilename
};