#!/usr/bin/env node
import { program } from 'commander';
import ask from '../src/ai/ask.js';

program
    .version('1.0.0')
    .description('AI 聊天工具 - 向混元大模型发送问题并获取回答')
    .arguments('<question>')
    .action((question) => {
        program.question = question;
    });

async function main() {
    // 解析命令行参数
    program.parse(process.argv);

    // 获取用户问题
    const userQuestion = program.question || "上海人口有多少？";
    await ask(userQuestion);
}

// 执行主函数
try {
    main();
} catch (err) {
    console.error('\x1b[31m❌ 错误: 执行失败。\x1b[0m');
    console.error(err);
    process.exit(1);
}
