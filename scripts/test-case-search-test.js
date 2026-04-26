/**
 * 测试案例管理系统 - 搜索和过滤逻辑单元测试
 * 
 * 运行方式：node scripts/test-case-search-test.js
 */

import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:3000/api/test-cases';

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * 执行 HTTP GET 请求
 */
function httpGet(url) {
  try {
    const command = `curl -s "${url}"`;
    const result = execSync(command, { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (err) {
    console.error(`请求失败：${err.message}`);
    return null;
  }
}

/**
 * 断言函数
 */
function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ ${message}`);
    return true;
  } else {
    failedTests++;
    console.log(`  ❌ ${message}`);
    return false;
  }
}

/**
 * 测试 1: 基础列表查询
 */
function testBasicListQuery() {
  console.log('\n📋 测试 1: 基础列表查询');
  
  const result = httpGet(`${BASE_URL}?page=1&limit=20`);
  
  assert(result !== null, 'API 请求成功');
  assert(result.success === true, '返回 success 为 true');
  assert(Array.isArray(result.data), 'data 是数组');
  assert(result.data.length > 0, '数据不为空');
  assert(result.pagination !== undefined, '包含分页信息');
  assert(result.pagination.total === 34, `总记录数为 34 (实际：${result.pagination.total})`);
  assert(result.pagination.page === 1, '当前页码为 1');
  assert(result.pagination.limit === 20, '每页数量为 20');
}

/**
 * 测试 2: 搜索功能 - 关键词"用户"
 */
function testSearchByKeyword() {
  console.log('\n🔍 测试 2: 搜索功能 - 关键词"用户"');
  
  const result = httpGet(`${BASE_URL}?search=用户&page=1&limit=20`);
  
  assert(result !== null, 'API 请求成功');
  assert(result.success === true, '返回 success 为 true');
  
  // 验证所有结果都包含"用户"
  if (result.data.length > 0) {
    const allMatch = result.data.every(item => 
      item.apiName.includes('用户') || 
      item.title.includes('用户')
    );
    assert(allMatch, '所有结果都包含关键词"用户"');
  } else {
    assert(false, '搜索结果应该包含数据');
  }
  
  console.log(`  📊 找到 ${result.data.length} 条包含"用户"的记录`);
}

/**
 * 测试 3: 搜索功能 - 关键词"订单"
 */
function testSearchByKeywordOrders() {
  console.log('\n🔍 测试 3: 搜索功能 - 关键词"订单"');
  
  const result = httpGet(`${BASE_URL}?search=订单&page=1&limit=20`);
  
  assert(result !== null, 'API 请求成功');
  assert(result.success === true, '返回 success 为 true');
  assert(result.data.length === 10, `找到 10 条订单相关记录 (实际：${result.data.length})`);
  
  // 验证所有结果都包含"订单"
  const allMatch = result.data.every(item => 
    item.apiName.includes('订单') || 
    item.title.includes('订单')
  );
  assert(allMatch, '所有结果都包含关键词"订单"');
}

/**
 * 测试 4: 搜索功能 - 关键词"商品"
 */
function testSearchByKeywordProducts() {
  console.log('\n🔍 测试 4: 搜索功能 - 关键词"商品"');
  
  const result = httpGet(`${BASE_URL}?search=商品&page=1&limit=20`);
  
  assert(result !== null, 'API 请求成功');
  assert(result.success === true, '返回 success 为 true');
  assert(result.data.length === 8, `找到 8 条商品相关记录 (实际：${result.data.length})`);
}

/**
 * 测试 5: 接口名分组筛选
 */
function testFilterByApiName() {
  console.log('\n📂 测试 5: 接口名分组筛选');
  
  // 测试用户管理接口
  const userResult = httpGet(`${BASE_URL}?apiName=/api/users&page=1&limit=20`);
  assert(userResult.success === true, '用户管理接口筛选成功');
  assert(userResult.data.length === 5, `用户管理接口有 5 条记录 (实际：${userResult.data.length})`);
  
  // 测试订单管理接口
  const orderResult = httpGet(`${BASE_URL}?apiName=/api/orders&page=1&limit=20`);
  assert(orderResult.success === true, '订单管理接口筛选成功');
  assert(orderResult.data.length === 10, `订单管理接口有 10 条记录 (实际：${orderResult.data.length})`);
  
  // 测试商品管理接口
  const productResult = httpGet(`${BASE_URL}?apiName=/api/products&page=1&limit=20`);
  assert(productResult.success === true, '商品管理接口筛选成功');
  assert(productResult.data.length === 8, `商品管理接口有 8 条记录 (实际：${productResult.data.length})`);
}

/**
 * 测试 6: 标签过滤
 */
function testFilterByTags() {
  console.log('\n🏷️ 测试 6: 标签过滤');
  
  // 测试"查询"标签
  const queryResult = httpGet(`${BASE_URL}?tags=查询&page=1&limit=20`);
  assert(queryResult.success === true, '查询标签过滤成功');
  assert(queryResult.data.length > 0, '查询标签有数据');
  console.log(`  📊 包含"查询"标签的记录：${queryResult.data.length} 条`);
  
  // 测试"创建"标签
  const createResult = httpGet(`${BASE_URL}?tags=创建&page=1&limit=20`);
  assert(createResult.success === true, '创建标签过滤成功');
  assert(createResult.data.length > 0, '创建标签有数据');
  console.log(`  📊 包含"创建"标签的记录：${createResult.data.length} 条`);
  
  // 测试"异常"标签
  const errorResult = httpGet(`${BASE_URL}?tags=异常&page=1&limit=20`);
  assert(errorResult.success === true, '异常标签过滤成功');
  assert(errorResult.data.length === 5, `异常标签有 5 条记录 (实际：${errorResult.data.length})`);
}

/**
 * 测试 7: 组合搜索 - 接口名 + 搜索关键词
 */
function testCombinedSearch() {
  console.log('\n 测试 7: 组合搜索 - 接口名 + 搜索关键词');
  
  const result = httpGet(`${BASE_URL}?apiName=/api/users&search=列表&page=1&limit=20`);
  
  assert(result.success === true, '组合搜索成功');
  assert(result.data.length > 0, '组合搜索有结果');
  
  // 验证结果既属于用户管理接口，又包含"列表"
  const allMatch = result.data.every(item => 
    item.apiName === '/api/users' && 
    (item.title.includes('列表') || item.apiName.includes('列表'))
  );
  assert(allMatch, '所有结果都符合筛选条件');
  
  console.log(`  📊 用户管理接口中包含"列表"的记录：${result.data.length} 条`);
}

/**
 * 测试 8: 组合搜索 - 标签 + 搜索关键词
 */
function testCombinedSearchTagsAndKeyword() {
  console.log('\n🔬 测试 8: 组合搜索 - 标签 + 搜索关键词');
  
  const result = httpGet(`${BASE_URL}?tags=查询&search=列表&page=1&limit=20`);
  
  assert(result.success === true, '组合搜索成功');
  assert(result.data.length > 0, '组合搜索有结果');
  
  console.log(`  📊 包含"查询"标签和"列表"关键词的记录：${result.data.length} 条`);
}

/**
 * 测试 9: 分页功能
 */
function testPagination() {
  console.log('\n📄 测试 9: 分页功能');
  
  // 第一页
  const page1 = httpGet(`${BASE_URL}?page=1&limit=20`);
  assert(page1.success === true, '第 1 页查询成功');
  assert(page1.data.length === 20, `第 1 页有 20 条记录 (实际：${page1.data.length})`);
  assert(page1.pagination.page === 1, '当前页码为 1');
  assert(page1.pagination.pages === 2, `总页数为 2 (实际：${page1.pagination.pages})`);
  
  // 第二页
  const page2 = httpGet(`${BASE_URL}?page=2&limit=20`);
  assert(page2.success === true, '第 2 页查询成功');
  assert(page2.data.length === 14, `第 2 页有 14 条记录 (实际：${page2.data.length})`);
  assert(page2.pagination.page === 2, '当前页码为 2');
  
  // 验证两页数据不重复
  const page1Ids = page1.data.map(item => item._id);
  const page2Ids = page2.data.map(item => item._id);
  const hasDuplicate = page1Ids.some(id => page2Ids.includes(id));
  assert(!hasDuplicate, '两页数据无重复');
  
  console.log('  📊 分页功能正常：第 1 页 20 条，第 2 页 14 条，共 34 条');
}

/**
 * 测试 10: 边界条件 - 不存在的搜索关键词
 */
function testNonExistentSearch() {
  console.log('\n❌ 测试 10: 边界条件 - 不存在的搜索关键词');
  
  const result = httpGet(`${BASE_URL}?search=不存在的关键词&page=1&limit=20`);
  
  assert(result.success === true, '查询成功');
  assert(result.data.length === 0, '结果为空数组');
  assert(result.pagination.total === 0, '总数为 0');
  
  console.log('  📊 正确返回空结果');
}

/**
 * 测试 11: 获取接口名分组列表
 */
function testGetApiNames() {
  console.log('\n📋 测试 11: 获取接口名分组列表');
  
  const result = httpGet(`${BASE_URL}/api-names`);
  
  assert(result.success === true, '获取接口名成功');
  assert(Array.isArray(result.data), '返回数据是数组');
  assert(result.data.length > 0, '接口名列表不为空');
  
  console.log(`  📊 共有 ${result.data.length} 个不同的接口名:`);
  result.data.forEach(name => {
    console.log(`    - ${name}`);
  });
}

/**
 * 测试 12: 获取所有标签列表
 */
function testGetAllTags() {
  console.log('\n🏷️ 测试 12: 获取所有标签列表');
  
  const result = httpGet(`${BASE_URL}/tags`);
  
  assert(result.success === true, '获取标签成功');
  assert(Array.isArray(result.data), '返回数据是数组');
  assert(result.data.length > 0, '标签列表不为空');
  
  console.log(`  📊 共有 ${result.data.length} 个不同的标签:`);
  result.data.slice(0, 10).forEach(tag => {
    console.log(`    - ${tag}`);
  });
  if (result.data.length > 10) {
    console.log(`    ... 还有 ${result.data.length - 10} 个标签`);
  }
}

/**
 * 主函数
 */
function main() {
  console.log('='.repeat(60));
  console.log('🧪 测试案例管理系统 - 搜索和过滤逻辑单元测试');
  console.log('='.repeat(60));
  
  try {
    // 执行所有测试
    testBasicListQuery();
    testSearchByKeyword();
    testSearchByKeywordOrders();
    testSearchByKeywordProducts();
    testFilterByApiName();
    testFilterByTags();
    testCombinedSearch();
    testCombinedSearchTagsAndKeyword();
    testPagination();
    testNonExistentSearch();
    testGetApiNames();
    testGetAllTags();
    
    // 打印测试总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试总结');
    console.log('='.repeat(60));
    console.log(`✅ 通过：${passedTests} 项`);
    console.log(`❌ 失败：${failedTests} 项`);
    console.log(`📝 总计：${totalTests} 项`);
    console.log(`📈 通过率：${((passedTests / totalTests) * 100).toFixed(2)}%`);
    console.log('='.repeat(60));
    
    if (failedTests === 0) {
      console.log('\n🎉 所有测试通过！搜索和过滤功能工作正常！\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  部分测试失败，请检查相关功能。\n');
      process.exit(1);
    }
    
  } catch (err) {
    console.error('\n💥 测试执行出错:', err.message);
    console.error(err);
    process.exit(1);
  }
}

// 执行测试
main();
