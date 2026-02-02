#!/usr/bin/env node

const OpenAI = require("openai");
const { program } = require('commander');
const dotenv = require('dotenv');
const path = require('path');

let env_file = path.resolve(__dirname, '../../', '.env');
// console.log(`加载环境变量文件: ${env_file}`);

// 加载根目录的 .env 文件
dotenv.config({ path: env_file, quiet: true });

// 检查是否设置了 HUNYUAN_API_KEY
if (!process.env['HUNYUAN_API_KEY']) {
  console.error('错误: 未设置 HUNYUAN_API_KEY 环境变量');
  process.exit(1);
}

// 构造 client
const client = new OpenAI({
  apiKey: process.env['HUNYUAN_API_KEY'], // 混元 APIKey
  baseURL: "https://api.hunyuan.cloud.tencent.com/v1", // 混元 endpoint
});

// 定义命令行选项
program
  .version('1.0.0')
  .description('AI 聊天工具 - 向混元大模型发送问题并获取回答')
  .arguments('<question>')
  .action((question) => {
    program.question = question;
  });

async function main(){
  // 解析命令行参数
  program.parse(process.argv);
  
  // 获取用户问题
  const userQuestion = program.question || "上海人口有多少？";
  
  // 获取当前日期
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
  // 创建系统提示词
  const systemPrompt = `你是一个智能助手，今天是 ${formattedDate}。请根据用户的问题提供准确、有用的回答。`;
  
  const completion = await client.chat.completions.create({
    // model: "hunyuan-turbos-latest",// 【最新版本】【效果最优】【官方推荐使用】hunyuan-TurboS 混元旗舰大模型最新版本，具备更强的思考能力，更优的体验效果，已更新至最新版本。
    model: "hunyuan-lite",// 升级为 MOE 结构，上下文窗口为 256k ，在 NLP，代码，数学，行业等多项评测集上领先众多开源模型。 免费
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userQuestion,
      },
    ],
    enable_enhancement: true, // <- 自定义参数
  });
  console.log(completion.choices[0].message.content);
}

// 检查是否安装了 commander
try {
  require('commander');
  // 执行主函数
  main();
} catch (err) {
  console.error('\x1b[31m❌ 错误: 缺少必要的依赖包 "commander"。\x1b[0m');
  console.log('请运行以下命令安装:');
  console.log('npm install commander');
  process.exit(1);
}