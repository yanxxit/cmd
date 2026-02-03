#!/usr/bin/env node
import { program } from 'commander';
import { viewMarkdown } from '../src/markdown/view.js';

program
  .version('1.0.0')
  .description('Markdown 文件查看器 - 在终端中渲染和显示 Markdown 文件内容')
  .arguments('<file>')
  .option('-f, --file <file>', '要查看的 Markdown 文件路径')
  .option('-p, --paging', '使用分页器显示长文档（需要系统有 less 命令）')
  .action(async (fileArg) => {
    try {
      // 获取文件路径
      const filePath = program.opts().file || fileArg;

      if (!filePath) {
        console.error('\x1b[31m❌ 错误: 请提供 Markdown 文件路径\x1b[0m');
        process.exit(1);
      }

      const paging = program.opts().paging;

      // 调用核心功能
      await viewMarkdown(filePath, paging);
    } catch (error) {
      process.exit(1);
    }
  });

// 如果没有提供参数，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// 解析命令行参数
program.parse(process.argv);