/**
 * 对比学习数据模块
 * Node.js vs Python 对比学习
 */

// 对比学习主题数据
export const contrastTopics = [
  {
    id: 'hello-world',
    name: 'Hello World',
    category: '基础语法',
    icon: '👋',
    nodejs: {
      code: `console.log('Hello, World!');`,
      explanation: '使用 console.log 输出到控制台',
      tips: 'Node.js 使用分号结束语句（可选但推荐）'
    },
    python: {
      code: `print('Hello, World!')`,
      explanation: '使用 print 函数输出到控制台',
      tips: 'Python 不需要分号结束语句'
    },
    comparison: [
      { aspect: '语法', nodejs: 'console.log()', python: 'print()' },
      { aspect: '结束符', nodejs: '分号（可选）', python: '不需要' },
      { aspect: '括号', nodejs: '需要', python: '需要' }
    ]
  },
  {
    id: 'variables',
    name: '变量声明',
    category: '基础语法',
    icon: '📦',
    nodejs: {
      code: `// 三种声明方式
var oldVar = '旧方式';  // 函数作用域
let letVar = '块级作用域';  // 推荐
const CONST = '常量';  // 只读`,
      explanation: 'var 有变量提升问题，let 和 const 是块级作用域',
      tips: '优先使用 const，需要重新赋值时使用 let'
    },
    python: {
      code: `# 直接赋值
variable = '变量'
CONSTANT = '常量（约定大写）'
# Python 3.5+ 类型提示
name: str = '类型提示'`,
      explanation: 'Python 变量不需要声明，直接赋值即可',
      tips: '常量使用大写字母命名是约定俗成'
    },
    comparison: [
      { aspect: '声明关键字', nodejs: 'var/let/const', python: '无' },
      { aspect: '作用域', nodejs: '块级/函数', python: '函数/模块' },
      { aspect: '常量', nodejs: 'const 强制', python: '约定大写' },
      { aspect: '类型提示', nodejs: 'TypeScript', python: '原生支持' }
    ]
  },
  {
    id: 'data-types',
    name: '数据类型',
    category: '基础语法',
    icon: '🔖',
    nodejs: {
      code: `// 基本类型
const str = '字符串';
const num = 42;
const bool = true;
const nil = null;
const undef = undefined;

// 引用类型
const arr = [1, 2, 3];
const obj = { key: 'value' };
const fn = () => {};

// 特殊类型
const bigInt = 9007199254740991n;
const sym = Symbol('unique');`,
      explanation: 'JavaScript 有 7 种基本类型和引用类型',
      tips: 'undefined 表示未定义，null 表示空值'
    },
    python: {
      code: `# 基本类型
str_var = '字符串'
num = 42
bool_var = True
none_var = None

# 引用类型
arr = [1, 2, 3]  # 列表
obj = {'key': 'value'}  # 字典
def fn(): pass  # 函数

# 特殊类型
big_int = 9007199254740991  # 自动处理大整数
tuple_var = (1, 2, 3)  # 元组`,
      explanation: 'Python 有动态类型系统，支持多种内置类型',
      tips: 'Python 的 None 相当于 JavaScript 的 null'
    },
    comparison: [
      { aspect: '字符串', nodejs: 'string', python: 'str' },
      { aspect: '数字', nodejs: 'number', python: 'int/float' },
      { aspect: '布尔', nodejs: 'boolean', python: 'bool' },
      { aspect: '空值', nodejs: 'null/undefined', python: 'None' },
      { aspect: '数组', nodejs: 'Array', python: 'list' },
      { aspect: '对象', nodejs: 'Object', python: 'dict' },
      { aspect: '元组', nodejs: '无', python: 'tuple' }
    ]
  },
  {
    id: 'functions',
    name: '函数定义',
    category: '函数',
    icon: '⚙️',
    nodejs: {
      code: `// 函数声明
function add(a, b) {
  return a + b;
}

// 箭头函数（推荐）
const add = (a, b) => a + b;

// 默认参数
const greet = (name = 'World') => {
  return \`Hello, \${name}!\`;
};

// 解构参数
const printUser = ({ name, age }) => {
  console.log(name, age);
};`,
      explanation: '箭头函数没有自己的 this，适合回调',
      tips: '单行箭头函数可省略 return 和花括号'
    },
    python: {
      code: `# 函数定义
def add(a, b):
    return a + b

# 默认参数
def greet(name='World'):
    return f'Hello, {name}!'

# 类型提示
def add(a: int, b: int) -> int:
    return a + b

# 解构参数
def print_user(user):
    name, age = user
    print(name, age)`,
      explanation: 'Python 使用 def 关键字定义函数',
      tips: 'Python 使用缩进定义代码块，不是花括号'
    },
    comparison: [
      { aspect: '关键字', nodejs: 'function/=>', python: 'def' },
      { aspect: '参数', nodejs: '小括号', python: '小括号' },
      { aspect: '返回值', nodejs: 'return', python: 'return' },
      { aspect: '默认参数', nodejs: '= 默认值', python: '= 默认值' },
      { aspect: '箭头函数', nodejs: '支持', python: 'lambda' },
      { aspect: '类型提示', nodejs: 'TypeScript', python: '原生支持' }
    ]
  },
  {
    id: 'conditionals',
    name: '条件语句',
    category: '流程控制',
    icon: '🔀',
    nodejs: {
      code: `// if-else
if (age >= 18) {
  console.log('成年');
} else if (age >= 13) {
  console.log('青少年');
} else {
  console.log('儿童');
}

// 三元运算符
const status = age >= 18 ? '成年' : '未成年';

// switch-case
switch (day) {
  case 'Mon': console.log('周一'); break;
  default: console.log('其他');
}`,
      explanation: '条件表达式需要用括号包裹',
      tips: 'switch 语句记得加 break，否则会穿透'
    },
    python: {
      code: `# if-elif-else
if age >= 18:
    print('成年')
elif age >= 13:
    print('青少年')
else:
    print('儿童')

# 三元表达式
status = '成年' if age >= 18 else '未成年'

# match-case (Python 3.10+)
match day:
    case 'Mon': print('周一')
    case _: print('其他')`,
      explanation: 'Python 使用缩进定义代码块',
      tips: 'Python 3.10+ 引入了 match-case 结构'
    },
    comparison: [
      { aspect: 'if 语法', nodejs: 'if () {}', python: 'if:' },
      { aspect: 'else if', nodejs: 'else if', python: 'elif' },
      { aspect: '代码块', nodejs: '{}', python: '缩进' },
      { aspect: '三元', nodejs: 'a ? b : c', python: 'b if a else c' },
      { aspect: 'switch', nodejs: 'switch-case', python: 'match-case' }
    ]
  },
  {
    id: 'loops',
    name: '循环语句',
    category: '流程控制',
    icon: '🔄',
    nodejs: {
      code: `// for 循环
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// for...of (遍历数组)
for (const item of array) {
  console.log(item);
}

// for...in (遍历对象)
for (const key in object) {
  console.log(key);
}

// while 循环
while (condition) {
  // ...
}

// forEach
array.forEach(item => {
  console.log(item);
});`,
      explanation: 'for...of 遍历可迭代对象，for...in 遍历对象属性',
      tips: '优先使用 for...of 和数组方法'
    },
    python: {
      code: `# for 循环
for i in range(5):
    print(i)

# 遍历列表
for item in array:
    print(item)

# 遍历字典
for key, value in dict.items():
    print(key, value)

# while 循环
while condition:
    # ...

# 带索引遍历
for i, item in enumerate(array):
    print(i, item)`,
      explanation: 'Python 的 for 循环更像 foreach',
      tips: '使用 enumerate 获取索引和值'
    },
    comparison: [
      { aspect: 'for 循环', nodejs: 'for(;;)', python: 'for in' },
      { aspect: '范围', nodejs: '手动计数', python: 'range()' },
      { aspect: '遍历数组', nodejs: 'for...of', python: 'for in' },
      { aspect: '遍历对象', nodejs: 'for...in', python: '.items()' },
      { aspect: '索引遍历', nodejs: 'forEach', python: 'enumerate' }
    ]
  },
  {
    id: 'arrays',
    name: '数组/列表',
    category: '数据结构',
    icon: '📚',
    nodejs: {
      code: `const arr = [1, 2, 3, 4, 5];

// 常用方法
arr.map(x => x * 2);           // [2,4,6,8,10]
arr.filter(x => x > 2);        // [3,4,5]
arr.reduce((sum, x) => sum + x, 0);  // 15
arr.find(x => x > 2);          // 3
arr.some(x => x > 4);          // true
arr.every(x => x > 0);         // true
arr.slice(1, 3);               // [2,3]
arr.splice(1, 2, 'a');         // 修改原数组

// 解构
const [first, ...rest] = arr;`,
      explanation: '数组方法返回新数组，不修改原数组（除了 splice）',
      tips: '优先使用不可变方法'
    },
    python: {
      code: `arr = [1, 2, 3, 4, 5]

# 列表推导式
[x * 2 for x in arr]           # [2,4,6,8,10]
[x for x in arr if x > 2]      # [3,4,5]
sum(x for x in arr)            # 15

# 常用方法
arr.append(6)                  # 添加
arr.extend([7, 8])             # 扩展
arr.insert(0, 0)               # 插入
arr.remove(3)                  # 删除
arr.pop()                      # 弹出
arr.index(2)                   # 查找索引
arr.count(2)                   # 计数
arr.sort()                     # 排序
arr[::-1]                      # 反转

# 解包
first, *rest = arr`,
      explanation: 'Python 列表推导式非常强大',
      tips: '列表切片 arr[start:end:step]'
    },
    comparison: [
      { aspect: '声明', nodejs: '[]', python: '[]' },
      { aspect: '映射', nodejs: 'map()', python: '列表推导式' },
      { aspect: '过滤', nodejs: 'filter()', python: '列表推导式' },
      { aspect: '归约', nodejs: 'reduce()', python: 'sum() 等' },
      { aspect: '查找', nodejs: 'find()', python: 'in / index()' },
      { aspect: '解构', nodejs: '[a, ...b]', python: 'a, *b' }
    ]
  },
  {
    id: 'objects',
    name: '对象/字典',
    category: '数据结构',
    icon: '🗂️',
    nodejs: {
      code: `const obj = {
  name: 'John',
  age: 30,
  greet() {
    return \`Hello, I'm \${this.name}\`;
  }
};

// 访问
obj.name;
obj['name'];

// 方法
Object.keys(obj);      // ['name', 'age']
Object.values(obj);    // ['John', 30]
Object.entries(obj);   // [['name','John'],...]

// 解构
const { name, age } = obj;

// 展开
const newObj = { ...obj, city: 'NYC' };`,
      explanation: '对象字面量使用花括号，方法可简写',
      tips: '使用可选链 obj?.prop 避免 undefined 错误'
    },
    python: {
      code: `obj = {
    'name': 'John',
    'age': 30
}

# 访问
obj['name']
obj.get('name')  # 安全访问

# 方法
obj.keys()       # dict_keys(['name', 'age'])
obj.values()     # dict_values(['John', 30])
obj.items()      # dict_items([...])

# 解包
name, age = obj['name'], obj['age']

# 合并
new_obj = {**obj, 'city': 'NYC'}`,
      explanation: 'Python 字典使用花括号，键值对用冒号分隔',
      tips: '使用 get() 方法安全访问不存在的键'
    },
    comparison: [
      { aspect: '声明', nodejs: '{}', python: '{}' },
      { aspect: '访问', nodejs: '. 或 []', python: '[] 或 get()' },
      { aspect: '键类型', nodejs: '字符串/Symbol', python: '任意可哈希' },
      { aspect: '方法', nodejs: 'Object.*', python: '.*()' },
      { aspect: '解构', nodejs: '{a,b}', python: '解包' },
      { aspect: '展开', nodejs: '{...obj}', python: '{**obj}' }
    ]
  },
  {
    id: 'classes',
    name: '类与继承',
    category: '面向对象',
    icon: '🏗️',
    nodejs: {
      code: `// 类定义
class Animal {
  constructor(name) {
    this.name = name;
  }
  
  speak() {
    return \`\${this.name} makes a sound\`;
  }
}

// 继承
class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  
  // 方法重写
  speak() {
    return \`\${this.name} barks\`;
  }
  
  // 静态方法
  static info() {
    return 'Dogs are loyal';
  }
}

const dog = new Dog('Buddy', 'Golden');`,
      explanation: 'ES6 class 是语法糖，基于原型继承',
      tips: '子类必须调用 super() 才能使用 this'
    },
    python: {
      code: `# 类定义
class Animal:
    def __init__(self, name):
        self.name = name
    
    def speak(self):
        return f'{self.name} makes a sound'

# 继承
class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)
        self.breed = breed
    
    # 方法重写
    def speak(self):
        return f'{self.name} barks'
    
    # 类方法
    @classmethod
    def info(cls):
        return 'Dogs are loyal'

dog = Dog('Buddy', 'Golden')`,
      explanation: 'Python 类使用缩进，self 必须显式声明',
      tips: '__init__ 是构造方法，__str__ 是 toString'
    },
    comparison: [
      { aspect: '类定义', nodejs: 'class Name', python: 'class Name:' },
      { aspect: '构造', nodejs: 'constructor', python: '__init__' },
      { aspect: 'this', nodejs: 'this', python: 'self' },
      { aspect: '继承', nodejs: 'extends', python: '(Parent)' },
      { aspect: '父类', nodejs: 'super()', python: 'super()' },
      { aspect: '静态', nodejs: 'static', python: '@classmethod' }
    ]
  },
  {
    id: 'async',
    name: '异步编程',
    category: '异步',
    icon: '⚡',
    nodejs: {
      code: `// Promise
fetch('/api/data')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// async/await (推荐)
async function fetchData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

// Promise.all
const [a, b] = await Promise.all([
  fetch('/api/a'),
  fetch('/api/b')
]);`,
      explanation: 'async/await 让异步代码像同步一样',
      tips: 'await 只能在 async 函数中使用'
    },
    python: {
      code: `import asyncio
import aiohttp

# async/await
async def fetch_data():
    async with aiohttp.ClientSession() as session:
        async with session.get('/api/data') as resp:
            data = await resp.json()
            print(data)

# 运行
asyncio.run(fetch_data())

# 并发执行
async def main():
    results = await asyncio.gather(
        fetch('/api/a'),
        fetch('/api/b')
    )`,
      explanation: 'Python 使用 asyncio 进行异步编程',
      tips: '使用 asyncio.gather 并发执行多个协程'
    },
    comparison: [
      { aspect: 'Promise', nodejs: '原生支持', python: 'asyncio' },
      { aspect: 'async', nodejs: 'async function', python: 'async def' },
      { aspect: 'await', nodejs: 'await', python: 'await' },
      { aspect: '异常', nodejs: 'try/catch', python: 'try/except' },
      { aspect: '并发', nodejs: 'Promise.all', python: 'asyncio.gather' },
      { aspect: '运行', nodejs: '自动', python: 'asyncio.run()' }
    ]
  },
  {
    id: 'modules',
    name: '模块系统',
    category: '模块化',
    icon: '📦',
    nodejs: {
      code: `// ES Modules (推荐)
// 导出
export const name = 'value';
export function fn() {}
export default class MyClass {}

// 导入
import MyClass, { name, fn } from './module.js';
import * as mod from './module.js';

// CommonJS (旧)
const mod = require('./module');
module.exports = { name, fn };`,
      explanation: 'ES Modules 是标准，CommonJS 是 Node.js 传统',
      tips: '一个文件只能有一个 default export'
    },
    python: {
      code: `# 导入
import module
from module import name, fn
from module import *  # 不推荐
import module as m

# 导出（在模块中定义即可）
def public_fn(): pass

# 私有（约定）
def _private_fn(): pass

# __all__ 控制导出
__all__ = ['public_fn']`,
      explanation: 'Python 模块就是 .py 文件',
      tips: '下划线开头表示私有（约定）'
    },
    comparison: [
      { aspect: '导入', nodejs: 'import', python: 'import' },
      { aspect: '导出', nodejs: 'export', python: '自动' },
      { aspect: '默认导出', nodejs: 'export default', python: '无' },
      { aspect: '命名导出', nodejs: 'export {}', python: '__all__' },
      { aspect: '私有', nodejs: '# 开头', python: '_ 开头' },
      { aspect: '文件扩展名', nodejs: '.js/.mjs', python: '.py' }
    ]
  },
  {
    id: 'error-handling',
    name: '错误处理',
    category: '异常处理',
    icon: '⚠️',
    nodejs: {
      code: `// try-catch-finally
try {
  riskyOperation();
} catch (error) {
  console.error('错误:', error.message);
} finally {
  console.log('总是执行');
}

// 抛出错误
throw new Error('Something wrong');

// 自定义错误
class MyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MyError';
  }
}`,
      explanation: 'Error 对象有 message、name、stack 属性',
      tips: '总是捕获具体的错误类型'
    },
    python: {
      code: `# try-except-else-finally
try:
    risky_operation()
except ValueError as e:
    print(f'值错误：{e}')
except Exception as e:
    print(f'其他错误：{e}')
else:
    print('没有错误')
finally:
    print('总是执行')

# 抛出异常
raise ValueError('Something wrong')

# 自定义异常
class MyError(Exception):
    pass`,
      explanation: 'Python 支持多个 except 分支',
      tips: 'else 块在没有异常时执行'
    },
    comparison: [
      { aspect: '尝试', nodejs: 'try', python: 'try' },
      { aspect: '捕获', nodejs: 'catch', python: 'except' },
      { aspect: '无异常', nodejs: '无', python: 'else' },
      { aspect: '总是', nodejs: 'finally', python: 'finally' },
      { aspect: '抛出', nodejs: 'throw', python: 'raise' },
      { aspect: '基类', nodejs: 'Error', python: 'Exception' }
    ]
  },
  {
    id: 'file-io',
    name: '文件操作',
    category: 'IO 操作',
    icon: '📄',
    nodejs: {
      code: `import fs from 'fs/promises';

// 异步读取
const content = await fs.readFile('file.txt', 'utf8');

// 异步写入
await fs.writeFile('file.txt', 'content');

// 追加
await fs.appendFile('file.txt', 'more');

// 检查存在
await fs.access('file.txt');

// 删除
await fs.unlink('file.txt');

// 同步（不推荐）
const sync = fs.readFileSync('file.txt', 'utf8');`,
      explanation: 'Node.js 提供同步和异步两种文件操作',
      tips: '优先使用异步方法避免阻塞'
    },
    python: {
      code: `# 读取
with open('file.txt', 'r') as f:
    content = f.read()

# 写入
with open('file.txt', 'w') as f:
    f.write('content')

# 追加
with open('file.txt', 'a') as f:
    f.write('more')

# 检查存在
import os
os.path.exists('file.txt')

# 删除
os.remove('file.txt')

# pathlib (推荐)
from pathlib import Path
content = Path('file.txt').read_text()`,
      explanation: 'with 语句自动关闭文件，推荐使用',
      tips: 'pathlib 是更现代的文件操作方式'
    },
    comparison: [
      { aspect: '读取', nodejs: 'readFile', python: 'open().read()' },
      { aspect: '写入', nodejs: 'writeFile', python: 'open().write()' },
      { aspect: '资源管理', nodejs: '手动/await', python: 'with 语句' },
      { aspect: '检查存在', nodejs: 'access', python: 'exists' },
      { aspect: '删除', nodejs: 'unlink', python: 'remove' },
      { aspect: '现代 API', nodejs: 'fs/promises', python: 'pathlib' }
    ]
  }
];

// 获取所有分类
export function getCategories() {
  const categories = new Set();
  contrastTopics.forEach(topic => {
    categories.add(topic.category);
  });
  return Array.from(categories);
}

// 获取指定分类的主题
export function getTopicsByCategory(category) {
  if (category === 'all') {
    return contrastTopics;
  }
  return contrastTopics.filter(topic => topic.category === category);
}

// 获取单个主题
export function getTopicById(id) {
  return contrastTopics.find(topic => topic.id === id);
}

// 搜索主题
export function searchTopics(query) {
  const lowerQuery = query.toLowerCase();
  return contrastTopics.filter(topic =>
    topic.name.toLowerCase().includes(lowerQuery) ||
    topic.category.toLowerCase().includes(lowerQuery)
  );
}
