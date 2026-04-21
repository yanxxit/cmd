import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

/**
 * 加载环境变量，优先从项目根目录的 .env 文件加载，其次从系统环境变量读取
 * @param {string} [projectRoot] - 项目根目录，默认为当前工作目录
 * @returns {object} 加载后的环境变量对象
 */
export function loadEnv(projectRoot = process.cwd()) {
  const envPath = path.resolve(projectRoot, '.env');
  
  // 如果 .env 文件存在，则加载
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath, quiet: true });
    if (result.error) {
      console.warn('警告: 加载 .env 文件失败:', result.error.message);
    }
  }
  
  return process.env;
}

/**
 * 获取 HUNYUAN_API_KEY
 * 优先级: 1. .env 文件中的 HUNYUAN_API_KEY 2. 系统环境变量中的 HUNYUAN_API_KEY
 * @param {string} [projectRoot] - 项目根目录，默认为当前工作目录
 * @returns {string|null} HUNYUAN_API_KEY 的值，如果未找到则返回 null
 */
export function getHunYuanApiKey(projectRoot = process.cwd()) {
  // 先尝试加载 .env 文件
  loadEnv(projectRoot);
  
  // 读取环境变量
  return process.env['HUNYUAN_API_KEY'] || null;
}

/**
 * 获取指定的环境变量
 * 优先级: 1. .env 文件中的变量 2. 系统环境变量中的变量
 * @param {string} key - 环境变量名称
 * @param {string} [projectRoot] - 项目根目录，默认为当前工作目录
 * @returns {string|null} 环境变量的值，如果未找到则返回 null
 */
export function getEnv(key, projectRoot = process.cwd()) {
  loadEnv(projectRoot);
  return process.env[key] || null;
}

export default {
  loadEnv,
  getHunYuanApiKey,
  getEnv
};
