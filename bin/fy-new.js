#!/usr/bin/env node

import { program } from 'commander';
import dict from '../src/dict/main-new.js';

program
    .version('1.0.0')
    .description('翻译工具 - 支持多引擎')
    .arguments('[question]')
    .option('-e, --engine <name>', '指定翻译引擎 (youdao/ds)', 'ds')
    .option('-n, --no-cache', '跳过缓存，重新查询')
    .option('-d, --day [days]', '查询最近几天的历史记录，默认 7 天')
    .option('-E, --export [path]', '导出历史记录到 JSON 文件')
    .option('-m, --markdown [path]', '生成 Markdown 学习记录')
    .option('-t, --html [path]', '生成 HTML 学习记录')
    .option('-j, --ejs [template]', '使用 EJS 模板生成 HTML')
    .option('-s, --stats', '显示引擎统计信息')
    .option('-l, --list', '列出所有可用引擎')
    .option('-S, --status', '检查引擎状态')
    .option('--search <pattern>', '搜索词典（仅 DS 引擎）')
    .option('--set-engine <name>', '设置首选引擎')
    .option('-v, --verbose', '显示详细输出')
    .action((question) => {
        program.question = question;
    });

async function main() {
    program.parse(process.argv);

    const options = program.opts();
    const userQuestion = (program.question || "").trim();

    // 设置详细模式
    if (options.verbose) {
        process.env.VERBOSE = 'true';
    }

    // 设置首选引擎
    if (options.setEngine) {
        dict.setPreferredEngine(options.setEngine);
        return;
    }

    // 列出引擎
    if (options.list) {
        dict.listEngines();
        return;
    }

    // 检查引擎状态
    if (options.status) {
        await dict.checkEnginesStatus();
        return;
    }

    // 显示统计信息
    if (options.stats) {
        dict.getStats();
        return;
    }

    // 搜索
    if (options.search) {
        await dict.search(options.search, {
            maxResults: 50
        });
        return;
    }

    // 查询历史记录
    if (options.day !== undefined) {
        const days = options.day === true ? 7 : parseInt(options.day) || 7;
        await dict.getHistory(days);
        return;
    }

    // 导出历史记录
    if (options.export !== undefined) {
        const exportPath = options.export === true ? undefined : options.export;
        await dict.exportHistory(exportPath);
        return;
    }

    // 生成 Markdown
    if (options.markdown !== undefined) {
        const markdownPath = options.markdown === true ? undefined : options.markdown;
        await dict.generateLearningHistory(markdownPath);
        return;
    }

    // 生成 HTML
    if (options.html !== undefined) {
        const htmlPath = options.html === true ? undefined : options.html;
        await dict.generateLearningHTML(htmlPath);
        return;
    }

    // 使用 EJS 模板
    if (options.ejs !== undefined) {
        const templatePath = options.ejs === true ? undefined : options.ejs;
        await dict.generateLearningHTMLWithEJS(templatePath);
        return;
    }

    // 翻译查询
    if (userQuestion) {
        await dict.fanyi(userQuestion, !options.cache, {
            engine: options.engine
        });
    } else {
        program.outputHelp();
    }
}

// 执行主函数
try {
    main();
} catch (err) {
    console.error('\x1b[31m❌ 错误：执行失败。\x1b[0m');
    console.error(err);
    process.exit(1);
}
