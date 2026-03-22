/** @type {import("prettier").Config} */
const config = {
  // 每行最大字符数
  printWidth: 100,
  
  // 缩进空格数
  tabWidth: 2,
  
  // 使用空格代替制表符
  useTabs: false,
  
  // 行尾不加分号
  semi: true,
  
  // 使用单引号
  singleQuote: true,
  
  // 对象属性引号（仅在需要时添加）
  quoteProps: 'as-needed',
  
  // JSX 使用双引号
  jsxSingleQuote: false,
  
  // 尾随逗号（ES5 兼容）
  trailingComma: 'all',
  
  // 对象空格
  bracketSpacing: true,
  
  // JSX 标签闭合
  bracketSameLine: false,
  
  // 箭头函数单参数不加括号
  arrowParens: 'avoid',
  
  // 每行只打印一个属性（当超出 printWidth 时）
  singleAttributePerLine: false,
  
  // HTML 空格敏感度
  htmlWhitespaceSensitivity: 'css',
  
  // 插入文件末尾换行
  insertPragma: false,
  
  // 要求 @format 注释
  requirePragma: false,
  
  // 自动换行
  proseWrap: 'preserve',
  
  // Vue 文件脚本缩进
  vueIndentScriptAndStyle: false,
  
  // 换行符
  endOfLine: 'lf',
  
  // 嵌入语言格式化
  embeddedLanguageFormatting: 'auto',
  
  // HTML 自闭合标签空格
  singleAttributePerLine: false,
};

module.exports = config;
