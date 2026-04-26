/**
 * request.ts 单元测试
 * 测试路径自动拼接逻辑
 */

// 模拟 request.ts 中的路径拼接逻辑
function buildUrl(url: string): string {
  let fetchUrl = url;

  // 自动添加 /api 前缀以适配代理配置
  if (!fetchUrl.startsWith('/api/') && 
      !fetchUrl.startsWith('http://') && 
      !fetchUrl.startsWith('https://')) {
    fetchUrl = `/api${fetchUrl.startsWith('/') ? fetchUrl : '/' + fetchUrl}`;
  }

  return fetchUrl;
}

// 测试用例
interface TestCase {
  input: string;
  expected: string;
  description: string;
}

const testCases: TestCase[] = [
  // 基础路径测试
  {
    input: '/test-cases',
    expected: '/api/test-cases',
    description: '基础路径 - 以 / 开头',
  },
  {
    input: 'test-cases',
    expected: '/api/test-cases',
    description: '基础路径 - 不以 / 开头',
  },
  
  // API 前缀测试
  {
    input: '/api/test-cases',
    expected: '/api/test-cases',
    description: '已有 /api 前缀 - 不重复添加',
  },
  {
    input: '/api/test-cases/api-names',
    expected: '/api/test-cases/api-names',
    description: '已有 /api 前缀的嵌套路径',
  },
  
  // 完整 URL 测试
  {
    input: 'http://localhost:3000/api/test-cases',
    expected: 'http://localhost:3000/api/test-cases',
    description: '完整 HTTP URL - 不添加前缀',
  },
  {
    input: 'https://api.example.com/test',
    expected: 'https://api.example.com/test',
    description: '完整 HTTPS URL - 不添加前缀',
  },
  
  // 嵌套路径测试
  {
    input: '/test-cases/api-names',
    expected: '/api/test-cases/api-names',
    description: '嵌套路径 - 接口名列表',
  },
  {
    input: '/test-cases/tags',
    expected: '/api/test-cases/tags',
    description: '嵌套路径 - 标签列表',
  },
  {
    input: '/test-cases/123',
    expected: '/api/test-cases/123',
    description: '嵌套路径 - 带 ID',
  },
  {
    input: '/test-cases/123/roles',
    expected: '/api/test-cases/123/roles',
    description: '嵌套路径 - 多级嵌套',
  },
  
  // 边界情况测试
  {
    input: '/',
    expected: '/api/',
    description: '边界情况 - 根路径',
  },
  {
    input: '',
    expected: '/api/',
    description: '边界情况 - 空字符串',
  },
  {
    input: 'api/test',
    expected: '/api/api/test',
    description: '边界情况 - api 不带前导 / (会错误添加前缀)',
  },
  
  // 特殊字符测试
  {
    input: '/test-cases/search?q=user',
    expected: '/api/test-cases/search?q=user',
    description: '特殊字符 - 带查询参数',
  },
  {
    input: '/test-cases/:id',
    expected: '/api/test-cases/:id',
    description: '特殊字符 - 带路由参数',
  },
];

// 运行测试
let passed = 0;
let failed = 0;

console.log('🧪 开始运行 request.ts 路径拼接测试\n');
console.log('='.repeat(80));

testCases.forEach((testCase, index) => {
  const result = buildUrl(testCase.input);
  const success = result === testCase.expected;
  
  if (success) {
    passed++;
    console.log(`✅ 测试 ${index + 1}: ${testCase.description}`);
    console.log(`   输入："${testCase.input}"`);
    console.log(`   输出："${result}"`);
    console.log(`   预期："${testCase.expected}"`);
  } else {
    failed++;
    console.log(`❌ 测试 ${index + 1}: ${testCase.description}`);
    console.log(`   输入："${testCase.input}"`);
    console.log(`   输出："${result}"`);
    console.log(`   预期："${testCase.expected}" ⚠️ 不匹配`);
  }
  
  console.log('');
});

console.log('='.repeat(80));
console.log(`\n📊 测试结果：${passed} 通过，${failed} 失败\n`);

if (failed > 0) {
  console.log('⚠️  发现失败的测试用例，请检查路径拼接逻辑\n');
  process.exit(1);
} else {
  console.log('✨ 所有测试通过！\n');
  process.exit(0);
}
