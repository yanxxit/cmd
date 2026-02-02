import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 运行 ds 模块性能测试
console.log('=== 开始运行 ds 模块性能测试 ===');
const dsTestPath = path.join(__dirname, 'ds/performance-test.js');
import(dsTestPath).catch(err => {
  console.error('ds 模块性能测试出错:', err);
});

// 等待一小会儿再运行 ds-v2 模块测试
setTimeout(async () => {
  console.log('\n=== 开始运行 ds-v2 模块性能测试 ===');
  const dsV2TestPath = path.join(__dirname, 'ds-v2/performance-test.js');
  import(dsV2TestPath).catch(err => {
    console.error('ds-v2 模块性能测试出错:', err);
  });
}, 2000);