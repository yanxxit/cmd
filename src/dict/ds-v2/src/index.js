#!/usr/bin/env node

import Dictionary from './dictionary.js';

const args = process.argv.slice(2);

// 如果提供了命令行参数，则执行一次查询
if (args.length > 0) {
  const word = args[0];
  const dict = new Dictionary();
  
  dict.lookupResult(word)
    .then(result => {
      if (result) {
        console.log(result);
      } else {
        console.log(`${word}: Not found`);
      }
    })
    .catch(error => {
      console.error('查询出错:', error.message);
    })
    .finally(async () => {
      await dict.close(); // 确保关闭数据库连接
    });
} else {
  // 否则启动交互式命令行界面
  import('./cli.js').then(({ default: startCLI }) => {
    startCLI();
  });
}