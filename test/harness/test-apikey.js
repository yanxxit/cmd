#!/usr/bin/env node
/**
 * API Key 读取逻辑测试
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadApiKey() {
  const projectEnvPath = path.resolve(__dirname, '../../', '.env');
  
  try {
    await fs.access(projectEnvPath);
    const envConfig = dotenv.parse(await fs.readFile(projectEnvPath, 'utf-8'));
    
    if (envConfig.HUNYUAN_API_KEY) {
      return { source: 'project .env', key: envConfig.HUNYUAN_API_KEY };
    }
  } catch {
  }
  
  if (process.env.HUNYUAN_API_KEY) {
    return { source: 'environment variable', key: process.env.HUNYUAN_API_KEY };
  }
  
  return { source: 'none', key: null };
}

async function testApiKeyLoading() {
  console.log(chalk.bold.cyan('\n🔑 API Key 读取逻辑测试\n'));
  console.log(chalk.gray('='.repeat(60)) + '\n');

  const result = await loadApiKey();

  console.log(chalk.bold.magenta('📊 测试结果:'));
  console.log();

  if (result.source === 'none') {
    console.log(chalk.yellow('⚠️  未找到 API Key'));
    console.log(chalk.gray('   请在项目根目录创建 .env 文件或设置环境变量'));
  } else {
    console.log(chalk.green(`✅ 成功从 ${result.source} 读取到 API Key`));
    console.log(chalk.gray(`   Key 长度: ${result.key.length} 个字符`));
    console.log(chalk.gray(`   Key 预览: ${result.key.substring(0, 10)}...`));
  }

  console.log();
  console.log(chalk.gray('='.repeat(60)) + '\n');

  console.log(chalk.bold.cyan('💡 使用说明:'));
  console.log(chalk.gray('1. 项目目录 .env 文件优先级高于环境变量'));
  console.log(chalk.gray('2. 项目 .env 文件位置: ' + path.resolve(__dirname, '../../', '.env')));
  console.log();
}

testApiKeyLoading().catch(console.error);
