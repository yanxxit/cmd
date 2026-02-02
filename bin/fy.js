const { program } = require('commander');
const dict = require('../dict/main');

program
    .version('1.0.0')
    .description('翻译工具')
    .arguments('<question>')
    .action((question) => {
        program.question = question;
    });

async function main() {
    // 解析命令行参数
    program.parse(process.argv);

    // 获取用户问题
    const userQuestion = program.question || "";
    await dict.fanyi(userQuestion)
}

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