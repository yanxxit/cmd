#!/usr/bin/env node

import Main from '../src/dict/main.js';

// 测试翻译功能和缓存
console.log('第一次查询 "hello"');
await Main.fanyi('hello');

// 稍等一下再查询，确保显示效果
setTimeout(async () => {
  console.log('\n第二次查询 "hello"');
  await Main.fanyi('hello');
  
  console.log('\n查询新词 "world"');
  await Main.fanyi('world');
}, 2000);