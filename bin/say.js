import { program } from 'commander';
import voice from '../src/say.js';

program
    .version('1.0.0')
    .description('语音工具')
    .arguments('<question>')
    .action((question) => {
        program.question = question;
    });

async function main() {
    // 解析命令行参数
    program.parse(process.argv);

    // 获取用户问题
    const userQuestion = program.question || "";
    await voice.say(userQuestion)
}

// 执行主函数
try {
    main();
} catch (err) {
    console.error('\x1b[31m❌ 错误: 执行失败。\x1b[0m');
    console.error(err);
    process.exit(1);
}