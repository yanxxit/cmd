#!/usr/bin/env node
import { program } from 'commander';
import { browseMarkdown } from '../src/markdown/browser.js';

program
  .version('1.0.0')
  .description('Markdown 文件浏览器 - 将 Markdown 文件渲染成网页并在浏览器中打开')
  .arguments('<file>')
  .option('-f, --file <file>', '要浏览的 Markdown 文件路径')
  .option('-p, --port <port>', '指定服务器端口，默认为随机可用端口', '0') // 0 表示使用随机端口
  .action(async (fileArg) => {
    try {
      // 获取文件路径
      const filePath = program.opts().file || fileArg;

      if (!filePath) {
        console.error('\x1b[31m❌ 错误: 请提供 Markdown 文件路径\x1b[0m');
        process.exit(1);
      }

      const port = parseInt(program.opts().port) || 0;

      // 调用核心功能
      const server = await browseMarkdown(filePath, port);

      // 处理进程退出事件
      process.on('SIGINT', () => {
        console.log('\n\n\x1b[33m⚠️  正在关闭服务器...\x1b[0m');
        server.close(() => {
          console.log('\x1b[32m✅ 服务器已关闭\x1b[0m');
          process.exit(0);
        });
      });

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