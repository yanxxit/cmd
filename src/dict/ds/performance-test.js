import Dictionary from './src/dictionary.js';
import fs from 'fs';

// 生成测试单词列表
function generateTestWords(count = 100) {
  const words = [];
  
  // 从字典中随机选择一些单词
  const dict = new Dictionary();
  const dictEntries = Array.from(dict.dictionary.entries());
  
  // 随机选择单词
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * dictEntries.length);
    const [word] = dictEntries[randomIndex];
    words.push(word);
  }
  
  return words;
}

// 性能测试函数
function performanceTest(testName, testFunction, iterations = 100) {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage().heapUsed;
  
  for (let i = 0; i < iterations; i++) {
    testFunction(i);
  }
  
  const endTime = process.hrtime.bigint();
  const endMemory = process.memoryUsage().heapUsed;
  
  const totalTime = Number(endTime - startTime) / 1000000; // 转换为毫秒
  const avgTime = totalTime / iterations;
  const memoryUsed = endMemory - startMemory;
  
  console.log(`${testName}:`);
  console.log(`  总时间: ${totalTime.toFixed(2)} ms`);
  console.log(`  平均每次: ${avgTime.toFixed(4)} ms`);
  console.log(`  内存使用变化: ${(memoryUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  
  return { totalTime, avgTime, memoryUsed };
}

async function runPerformanceTests() {
  console.log('开始 ds 模块性能测试...\n');
  
  // 生成测试数据
  const testWords = generateTestWords(50);
  
  // 创建字典实例
  const dict = new Dictionary();
  
  // 测试1: 单词查询性能
  performanceTest(
    '单词查询性能测试',
    () => {
      for (const word of testWords) {
        dict.getDefinition(word);
      }
    },
    10 // 进行10轮测试
  );
  
  // 测试2: 前缀查询性能
  const prefixTestWords = ['a', 'b', 'c', 'hello', 'world', 'test'];
  performanceTest(
    '前缀查询性能测试',
    () => {
      for (const prefix of prefixTestWords) {
        dict.prefixLookup(prefix, 10);
      }
    },
    5 // 进行5轮测试
  );
  
  // 测试3: 拼写纠正性能
  const typoWords = ['helo', 'tezt', 'wrold', 'exaple'];
  performanceTest(
    '拼写纠正性能测试',
    () => {
      for (const word of typoWords) {
        dict.lookupResult(word);
      }
    },
    3 // 进行3轮测试
  );
  
  console.log('ds 模块性能测试完成!\n');
}

runPerformanceTests();