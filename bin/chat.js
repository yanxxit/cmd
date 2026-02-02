#!/usr/bin/env node
import { program } from 'commander';
import EnhancedHunYuanChat from '../src/ai/chat.js';

program
    .version('1.0.0')
    .description('AI 聊天工具 - 与混元大模型进行多轮对话')
    .option('-i, --interactive', '启动交互式聊天模式')
    .action((options) => {
        if (options.interactive) {
            program.mode = 'interactive';
        } else {
            program.mode = 'interactive'; // 默认进入交互模式
        }
    });

async function main() {
    // 解析命令行参数
    program.parse(process.argv);

    // 根据参数决定运行模式
    if (program.mode === 'interactive') {
        // 启动交互式聊天
        const chat = new EnhancedHunYuanChat();
        await chat.start();
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