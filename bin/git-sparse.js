#!/usr/bin/env node
import { program } from 'commander';
import sparseClone from '../src/git/sparseClone.js';

program
    .version('1.0.0')
    .description('Git 稀疏检出工具 - 允许从远程仓库拉取特定文件或目录')
    .option('-u, --repo-url <url>', '远程仓库地址', 'https://gitee.com/yanxxit/conf.git')
    .option('-b, --branch <branch>', '分支名称', 'main')
    .option('-t, --target-path <path>', '想要拉取的特定文件或文件夹名', 'vim')
    .option('-d, --local-dir <dir>', '本地文件夹名称')
    .option('-o, --output-dir <dir>', '最终输出目录，默认为当前脚本执行位置', process.cwd())
    .option('-v, --verbose', '显示详细输出');

async function main() {
    // 解析命令行参数
    program.parse(process.argv);
    const options = program.opts();
    
    // 调用核心功能
    await sparseClone(options);
}

// 执行主函数
try {
    main();
} catch (err) {
    console.error('\x1b[31m❌ 错误: 执行失败。\x1b[0m');
    console.error(err);
    process.exit(1);
}
