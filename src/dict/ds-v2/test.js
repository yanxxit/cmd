import Dictionary from './src/dictionary.js';

async function testDictionary() {
  console.log('开始测试 Dictionary 类...');
  
  const dict = new Dictionary();
  
  try {
    // 测试单词查询
    console.log('\n测试查询单词 "hello":');
    const result = await dict.lookupResult('hello');
    console.log(result);
    
    // 测试前缀查询
    console.log('\n测试前缀查询 "hel":');
    const prefixResults = await dict.prefixLookup('hel', 5);
    console.log(prefixResults);
    
    // 测试不存在的单词
    console.log('\n测试不存在的单词 "nonexistentword":');
    const notFoundResult = await dict.lookupResult('nonexistentword');
    console.log(notFoundResult || '未找到');
    
    console.log('\n测试完成!');
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  } finally {
    await dict.close();
  }
}

testDictionary();