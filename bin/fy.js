#!/usr/bin/env node

import { program } from 'commander';
import dict from '../src/dict/main.js';

program
    .version('1.0.0')
    .description('翻译工具')
    .arguments('[question]')
    .option('-n, --no-cache', '跳过缓存，重新查询')
    .option('-h, --history [days]', '查询最近几天的历史记录，默认7天')
    .option('-e, --export [path]', '导出历史记录到JSON文件，默认logs/dict/history.json')
    .option('-m, --markdown [path]', '生成学习记录Markdown文件，默认logs/dict/learning-history.md')
    .option('-t, --html [path]', '生成学习记录HTML文件，默认logs/dict/learning-history.html')
    .action((question) => {
        program.question = question;
    });

async function main() {
    // 解析命令行参数
    program.parse(process.argv);

    // 获取用户问题
    const userQuestion = program.question || "";
    const options = program.opts();
    
    if (options.history !== undefined) {
        // 查询历史记录
        const days = options.history === true ? 7 : parseInt(options.history) || 7;
        await dict.getHistory(days);
    } else if (options.export !== undefined) {
        // 导出历史记录
        const exportPath = options.export === true ? undefined : options.export;
        await dict.exportHistory(exportPath);
    } else if (options.markdown !== undefined) {
        // 生成Markdown学习记录
        const markdownPath = options.markdown === true ? undefined : options.markdown;
        await dict.generateLearningHistory(markdownPath);
    } else if (options.html !== undefined) {
        // 生成HTML学习记录
        const htmlPath = options.html === true ? undefined : options.html;
        await dict.generateLearningHTML(htmlPath);
    } else {
        // 执行翻译
        await dict.fanyi(userQuestion, options.noCache);
    }
}

// 执行主函数
try {
    main();
} catch (err) {
    console.error('\x1b[31m❌ 错误: 执行失败。\x1b[0m');
    console.error(err);
    process.exit(1);
}