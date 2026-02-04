import History from './src/dict/lib/history.js';

async function testGenerators() {
  try {
    console.log('测试生成Markdown文件...');
    const markdownPath = await History.generateMarkdown();
    console.log('Markdown文件生成成功:', markdownPath);
    
    console.log('\n测试生成HTML文件...');
    const htmlPath = await History.generateHTML();
    console.log('HTML文件生成成功:', htmlPath);
    
    console.log('\n所有测试通过！重构后的代码工作正常。');
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testGenerators();