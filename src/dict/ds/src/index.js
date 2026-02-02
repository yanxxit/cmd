#!/usr/bin/env node

import Dictionary from './dictionary.js';
import readline from 'readline';

const args = process.argv.slice(2);

// 如果提供了命令行参数，则执行一次查询
if (args.length > 0) {
  const word = args[0];
  const dict = new Dictionary();
  const result = dict.lookupResult(word);
  
  if (result) {
    console.log(result);
  } else {
    console.log(`${word}: Not found`);
  }
} else {
  // 否则启动交互式命令行界面
  import('./cli.js');
}