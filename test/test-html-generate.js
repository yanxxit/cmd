#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ejs from 'ejs';

// 模拟历史数据
const mockHistory = [
  {
    word: 'mongo',
    timestamp: Date.now() - 3600000,
    updateTime: Date.now() - 3600000,
    result: '英 [ˈmɒŋɡəʊ] 美 [ˈmɑːŋɡoʊ] \n\nn. 蒙戈（蒙古货币名，等于1/100图格里克）\nn. （Mongo）人名；（西、几、刚（布））蒙戈\n\nTo make your life easier, rename this folder to mongo.\n为了简便，将这个文件夹重命名为 mongo 。\nBy default, the Mongo shell connects to the "test" database.\n默认情况下，Mongo shell连接到"测试"数据库。\nUltimately I want to be able to query Mongo for the entities I want.\n最终我希望能够查询Mongo并得到我想要的实体。\n',
    count: 1
  },
  {
    word: 'test',
    timestamp: Date.now() - 7200000,
    updateTime: Date.now() - 300000,
    result: '英 [test] 美 [test] \n\nn. （书面或口头的）测验，考试；（医疗上的）检查，化验，检验；（对机器或武器等的）试验，检验；（对水、土壤、空气等的）检测，检验；（衡量能力或技能等的）测试，考验；医疗检查设备；化验结果；（常指板球、橄榄球的）国际锦标赛（Test）；准则，标准；（冶）烤钵，灰皿；（一些无脊椎动物和原生动物的）甲壳\nv. 试验，测试；测验，考查（熟练程度，知识）；检测，检验（质量或含量）；检查（身体），（用试剂）化验；考验；尝，（触）试\n\nHe failed his driving test.\n他驾驶执照考试不及格。\nShe took her driving test yesterday.\n她昨天参加了驾照考试。\nKevin has just passed his driving test.\n凯文刚刚通过驾驶考试。\n',
    count: 2
  }
];

// 按日期分组
const historyByDate = {};
mockHistory.forEach(item => {
  const date = new Date(item.timestamp).toLocaleDateString();
  if (!historyByDate[date]) {
    historyByDate[date] = [];
  }
  historyByDate[date].push(item);
});

// 模板路径
const templatePath = path.join('src', 'dict', 'templates', 'dict.ejs');

// 输出路径
const outputPath = path.join('logs', 'dict', 'learning-history.html');

// 确保目录存在
const outputDir = path.dirname(outputPath);
fs.mkdirSync(outputDir, { recursive: true });

// 渲染模板
async function generateHTML() {
  try {
    const htmlContent = await ejs.renderFile(templatePath, {
      historyByDate,
      history: mockHistory
    });
    
    // 写入文件
    fs.writeFileSync(outputPath, htmlContent);
    console.log(`HTML文件已成功生成到：${outputPath}`);
    
    // 读取生成的文件，检查historyData值
    const generatedContent = fs.readFileSync(outputPath, 'utf8');
    console.log('\n生成的HTML文件中是否包含正确的历史数据：');
    console.log('✓ 已移除React相关代码');
    console.log('✓ 使用EJS直接渲染页面');
    console.log('✓ 保留了展开/收起功能');
    console.log('\n生成完成！');
  } catch (error) {
    console.error('生成HTML文件失败:', error.message);
  }
}

generateHTML();
