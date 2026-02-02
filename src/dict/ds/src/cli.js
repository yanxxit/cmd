#!/usr/bin/env node

import readline from 'readline';
import Dictionary from './dictionary.js';

// 创建字典实例
const dict = new Dictionary();

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Diaosi Dictionary - A dictionary made by a diaosi, for the diaosi');
console.log('Enter a word to search (type "quit" or "exit" to quit):');
console.log('');

// 主循环
function startPrompt() {
  rl.question('>> ', (input) => {
    const word = input.trim();
    
    if (word.toLowerCase() === 'quit' || word.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }
    
    if (word) {
      const result = dict.lookupResult(word);
      if (result) {
        console.log(result);
      } else {
        console.log(`${word}: Not found`);
      }
    }
    
    console.log('');
    startPrompt();
  });
}

// 启动提示
startPrompt();