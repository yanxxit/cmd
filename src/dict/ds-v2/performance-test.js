import Dictionary from './src/dictionary.js';
import fs from 'fs';

// 生成测试单词列表
async function generateTestWords(dict, count = 100) {
  const words = [];
  
  // 从数据库中随机选择一些单词
  const samplePrefixes = ['a', 'b', 'c', 'h', 'w', 't', 's', 'm', 'p', 'r'];
  let sampledWords = [];
  
  for (const prefix of samplePrefixes) {
    const prefixWords = await dict.prefixLookup(prefix, 10);
    sampledWords = sampledWords.concat(prefixWords);
  }
  
  // 随机选择单词
  for (let i = 0; i < count; i++) {
    if (sampledWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * sampledWords.length);
      words.push(sampledWords[randomIndex]);
    }
  }
  
  return words;
}

// 异步性能测试函数
async function performanceTest(testName, testFunction, iterations = 100) {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage().heapUsed;
  
  for (let i = 0; i < iterations; i++) {
    await testFunction(i);
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
  console.log('开始 ds-v2 模块性能测试...\n');
  
  // 创建字典实例
  const dict = new Dictionary();
  
  // 生成测试数据
  const testWords = await generateTestWords(dict, 50);
  
  // 测试1: 单词查询性能
  await performanceTest(
    '单词查询性能测试',
    async () => {
      for (const word of testWords) {
        await dict.getDefinition(word);
      }
    },
    10 // 进行10轮测试
  );
  
  // 测试2: 前缀查询性能
  const prefixTestWords = ['a', 'b', 'c', 'hello', 'world', 'test'];
  await performanceTest(
    '前缀查询性能测试',
    async () => {
      for (const prefix of prefixTestWords) {
        await dict.prefixLookup(prefix, 10);
      }
    },
    5 // 进行5轮测试
  );
  
  // 测试3: 拼写纠正性能（涉及多个查询）
  const typoWords = ['helo', 'tezt', 'wrold', 'exaple'];
  await performanceTest(
    '拼写纠正性能测试',
    async () => {
      for (const word of typoWords) {
        await dict.lookupResult(word);
      }
    },
    3 // 进行3轮测试
  );
  
  // 关闭数据库连接
  await dict.close();
  
  console.log('ds-v2 模块性能测试完成!\n');
}

runPerformanceTests();