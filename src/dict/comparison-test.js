import DictionaryV1 from './ds/src/dictionary.js';
import DictionaryV2 from './ds-v2/src/dictionary.js';

// 生成测试单词列表
function generateTestWordsV1(count = 50) {
  const dict = new DictionaryV1();
  const dictEntries = Array.from(dict.dictionary.entries());
  const words = [];
  
  // 随机选择单词
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * dictEntries.length);
    const [word] = dictEntries[randomIndex];
    words.push(word);
  }
  
  return { words, dict };
}

// 异步生成测试单词列表
async function generateTestWordsV2(dict, count = 50) {
  const words = [];
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

// 性能测试函数 (同步版本用于 v1)
function performanceTestV1(testName, testFunction, iterations = 10) {
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
  
  return { totalTime, avgTime, memoryUsed };
}

// 异步性能测试函数 (用于 v2)
async function performanceTestV2(testName, testFunction, iterations = 10) {
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
  
  return { totalTime, avgTime, memoryUsed };
}

async function runComparisonTest() {
  console.log('=== 屌丝词典 V1 vs V2 性能对比测试 ===\n');
  
  // 测试单词查询性能
  console.log('1. 单词查询性能对比测试...');
  
  // V1 测试
  const v1Data = generateTestWordsV1(30);
  const v1QueryResult = performanceTestV1(
    'V1 (内存Map)',
    () => {
      for (const word of v1Data.words) {
        v1Data.dict.getDefinition(word);
      }
    },
    5
  );
  
  // V2 测试
  const v2Dict = new DictionaryV2();
  const v2Words = await generateTestWordsV2(v2Dict, 30);
  const v2QueryResult = await performanceTestV2(
    'V2 (LevelDB)',
    async () => {
      for (const word of v2Words) {
        await v2Dict.getDefinition(word);
      }
    },
    5
  );
  
  console.log(`V1 单词查询 - 总时间: ${v1QueryResult.totalTime.toFixed(2)}ms, 平均: ${v1QueryResult.avgTime.toFixed(4)}ms`);
  console.log(`V2 单词查询 - 总时间: ${v2QueryResult.totalTime.toFixed(2)}ms, 平均: ${v2QueryResult.avgTime.toFixed(4)}ms`);
  console.log('');
  
  // 测试前缀查询性能
  console.log('2. 前缀查询性能对比测试...');
  const prefixes = ['a', 'b', 'c', 'h', 'w'];
  
  // V1 测试
  const v1PrefixResult = performanceTestV1(
    'V1 (内存Map)',
    () => {
      for (const prefix of prefixes) {
        v1Data.dict.prefixLookup(prefix, 10);
      }
    },
    3
  );
  
  // V2 测试
  const v2PrefixResult = await performanceTestV2(
    'V2 (LevelDB)',
    async () => {
      for (const prefix of prefixes) {
        await v2Dict.prefixLookup(prefix, 10);
      }
    },
    3
  );
  
  console.log(`V1 前缀查询 - 总时间: ${v1PrefixResult.totalTime.toFixed(2)}ms, 平均: ${v1PrefixResult.avgTime.toFixed(4)}ms`);
  console.log(`V2 前缀查询 - 总时间: ${v2PrefixResult.totalTime.toFixed(2)}ms, 平均: ${v2PrefixResult.avgTime.toFixed(4)}ms`);
  console.log('');
  
  // 清理资源
  await v2Dict.close();
  
  console.log('=== 测试完成 ===');
  console.log('注意: 这些测试结果会因系统性能、数据量等因素而有所差异');
  console.log('V1 (ds): 加载全部数据到内存，查询速度快，但内存占用高');
  console.log('V2 (ds-v2): 使用 LevelDB 存储，内存占用低，数据持久化，适合大数据量场景');
}

runComparisonTest();