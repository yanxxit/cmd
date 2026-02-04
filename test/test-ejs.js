import Generators from '../src/dict/lib/generators.js';

async function testEJS() {
  try {
    console.log('测试使用EJS模板引擎生成HTML文件...');
    
    // 创建一个测试历史记录数组
    const testHistory = [
      {
        word: 'test',
        timestamp: Date.now() - 3600000,
        updateTime: Date.now(),
        result: '英 [test] 美 [test] \n\nn. （书面或口头的）测验，考试；（医疗上的）检查，化验，检验；（对机器或武器等的）试验，检验；（对水、土壤、空气等的）检测，检验；（衡量能力或技能等的）测试，考验；医疗检查设备；化验结果；（常指板球、橄榄球的）国际锦标赛（Test）；准则，标准；（冶）烤钵，灰皿；（一些无脊椎动物和原生动物的）甲壳\nv. 试验，测试；测验，考查（熟练程度，知识）；检测，检验（质量或含量）；检查（身体），（用试剂）化验；考验；尝，（触）试\n\nHe failed his driving test.\n他驾驶执照考试不及格。\nShe took her driving test yesterday.\n她昨天参加了驾照考试。\nKevin has just passed his driving test.\n凯文刚刚通过驾驶考试。\n',
        count: 2
      },
      {
        word: 'mongo',
        timestamp: Date.now() - 7200000,
        updateTime: Date.now() - 7200000,
        result: '英 [ˈmɒŋɡəʊ] 美 [ˈmɑːŋɡoʊ] \n\nn. 蒙戈（蒙古货币名，等于1/100图格里克）\nn. （Mongo）人名；（西、几、刚（布））蒙戈\n\nTo make your life easier, rename this folder to mongo.\n为了简便，将这个文件夹重命名为 mongo 。\nBy default, the Mongo shell connects to the "test" database.\n默认情况下，Mongo shell连接到"测试"数据库。\nUltimately I want to be able to query Mongo for the entities I want.\n最终我希望能够查询Mongo并得到我想要的实体。\n',
        count: 1
      }
    ];
    
    // 测试使用默认模板
    console.log('\n1. 测试使用默认模板:');
    const defaultPath = await Generators.generateHTMLWithEJS(testHistory);
    console.log('生成成功:', defaultPath);
    
    // 测试使用指定模板
    console.log('\n2. 测试使用指定模板:');
    const customTemplatePath = './src/dict/templates/dict.ejs';
    const customPath = await Generators.generateHTMLWithEJS(testHistory, undefined, customTemplatePath);
    console.log('生成成功:', customPath);
    
    console.log('\n所有测试通过！EJS模板引擎功能正常工作。');
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testEJS();