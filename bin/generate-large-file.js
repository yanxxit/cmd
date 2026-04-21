#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { generateFile } from '../src/generate/index.js';

program
  .name('generate-large-file')
  .description('生成大型测试文件工具 - 支持多种格式')
  .version('1.0.0');

// 解析大小的辅助函数
function parseSize(sizeStr) {
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB|TB)?$/i);
  if (!match) {
    throw new Error('无效的大小格式，例如：50MB, 1GB');
  }

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'MB').toUpperCase();

  const multipliers = {
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  };

  return Math.floor(value * multipliers[unit]);
}

// DOCX 文件生成子命令
program
  .command('docx [size]')
  .description('生成大型 DOCX 文档')
  .argument('[size]', '文件大小（MB），默认 50', '50')
  .option('-o, --output <path>', '输出文件路径', './large-document.docx')
  .option('-t, --title <title>', '文档标题', '大型文档生成测试')
  .option('-p, --paragraphs <count>', '基础段落数量', '500')
  .option('-m, --method <method>', '生成方法：padding|content|attachment', 'padding')
  .action(async (size, options) => {
    try {
      const sizeBytes = parseSize(size);
      
      console.log(chalk.cyan('\n📄 开始生成 DOCX 文档...'));
      console.log(chalk.gray(`目标大小：${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`));
      console.log(chalk.gray(`输出路径：${options.output}`));
      console.log(chalk.gray(`生成方法：${options.method}\n`));

      const result = await generateFile('docx', {
        size: sizeBytes,
        outputPath: options.output,
        title: options.title,
        paragraphs: parseInt(options.paragraphs),
        method: options.method
      });

      console.log(chalk.green('\n✅ DOCX 文档生成成功！'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.gray(`保存路径：${chalk.cyan(result.path)}`));
      console.log(chalk.gray(`最终大小：${chalk.cyan((result.size / (1024 * 1024)).toFixed(2) + ' MB')}`));
      console.log(chalk.gray(`压缩比：${chalk.cyan((result.size / result.baseSize).toFixed(2) + 'x')}`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.gray('\n提示：该文档可以正常在 Microsoft Word 或 LibreOffice 中打开\n'));

    } catch (error) {
      console.error(chalk.red('\n❌ 生成失败:', error.message));
      if (error.code === 'MODULE_NOT_FOUND') {
        console.error(chalk.yellow('\n提示：需要安装 docx 模块'));
        console.error(chalk.gray('运行：npm install docx'));
      }
      process.exit(1);
    }
  });

// TXT 文件生成子命令
program
  .command('txt')
  .description('生成大型 TXT 文本文件')
  .option('-s, --size <size>', '文件大小（MB），默认 50', '50')
  .option('-o, --output <path>', '输出文件路径', './large-file.txt')
  .option('-t, --title <title>', '文档标题', '大型文本文件')
  .option('-e, --encoding <encoding>', '文件编码', 'utf-8')
  .option('-l, --line-length <length>', '每行字符数', '120')
  .option('-c, --content <type>', '内容类型：lorem|random|chinese|zeros', 'lorem')
  .action(async (options) => {
    try {
      console.log('DEBUG: options:', options);
      const size = options.size || '50';
      const sizeBytes = parseSize(size);
      const outputPath = options.output || './large-file.txt';
      const title = options.title || '大型文本文件';
      const encoding = options.encoding || 'utf-8';
      const lineLength = parseInt(options.lineLength || '120');
      const content = options.content || 'lorem';
      
      console.log(chalk.cyan('\n📝 开始生成 TXT 文件...'));
      console.log(chalk.gray(`目标大小：${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`));
      console.log(chalk.gray(`输出路径：${outputPath}`));
      console.log(chalk.gray(`编码：${encoding}`));
      console.log(chalk.gray(`内容类型：${content}\n`));

      const result = await generateFile('txt', {
        size: sizeBytes,
        outputPath: outputPath,
        title: title,
        encoding: encoding,
        lineLength: lineLength,
        contentType: content
      });

      console.log(chalk.green('\n✅ TXT 文件生成成功！'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.gray(`保存路径：${chalk.cyan(result.path)}`));
      console.log(chalk.gray(`最终大小：${chalk.cyan((result.size / (1024 * 1024)).toFixed(2) + ' MB')}`));
      console.log(chalk.gray(`总行数：${chalk.cyan(result.lines)}`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log('');

    } catch (error) {
      console.error(chalk.red('\n❌ 生成失败:', error.message));
      process.exit(1);
    }
  });

// LOG 文件生成子命令
program
  .command('log [size]')
  .alias('logs')
  .description('生成大型日志文件')
  .argument('[size]', '文件大小（MB），默认 50', '50')
  .option('-o, --output <path>', '输出文件路径', './large-file.log')
  .option('-l, --level <level>', '日志级别：debug|info|warn|error', 'info')
  .option('-f, --format <format>', '日志格式：json|text', 'text')
  .option('-s, --source <source>', '日志来源', 'app-server')
  .action(async (size, options) => {
    try {
      const sizeBytes = parseSize(size);
      
      console.log(chalk.cyan('\n📋 开始生成 LOG 文件...'));
      console.log(chalk.gray(`目标大小：${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`));
      console.log(chalk.gray(`输出路径：${options.output}`));
      console.log(chalk.gray(`日志级别：${options.level}`));
      console.log(chalk.gray(`格式：${options.format}\n`));

      const result = await generateFile('log', {
        size: sizeBytes,
        outputPath: options.output,
        level: options.level,
        format: options.format,
        source: options.source
      });

      console.log(chalk.green('\n✅ LOG 文件生成成功！'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.gray(`保存路径：${chalk.cyan(result.path)}`));
      console.log(chalk.gray(`最终大小：${chalk.cyan((result.size / (1024 * 1024)).toFixed(2) + ' MB')}`));
      console.log(chalk.gray(`总行数：${chalk.cyan(result.lines)}`));
      console.log(chalk.gray(`生成时间：${chalk.cyan((result.time) + 'ms')}`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log('');

    } catch (error) {
      console.error(chalk.red('\n❌ 生成失败:', error.message));
      process.exit(1);
    }
  });

// CSV 文件生成子命令
program
  .command('csv [size]')
  .description('生成大型 CSV 数据文件')
  .argument('[size]', '文件大小（MB），默认 50', '50')
  .option('-o, --output <path>', '输出文件路径', './large-file.csv')
  .option('-c, --columns <names>', '列名（逗号分隔）', 'id,name,email,age,city,country,phone,created_at')
  .option('-r, --rows <count>', '行数（可选，优先于大小）', '0')
  .option('-d, --delimiter <char>', '分隔符', ',')
  .option('-q, --quotes', '使用引号包裹字符串', false)
  .action(async (size, options) => {
    try {
      const sizeBytes = parseSize(size);
      
      console.log(chalk.cyan('\n📊 开始生成 CSV 文件...'));
      console.log(chalk.gray(`目标大小：${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`));
      console.log(chalk.gray(`输出路径：${options.output}`));
      console.log(chalk.gray(`列数：${options.columns.split(',').length}`));
      console.log(chalk.gray(`分隔符：${options.delimiter}\n`));

      const result = await generateFile('csv', {
        size: sizeBytes,
        outputPath: options.output,
        columns: options.columns,
        rows: parseInt(options.rows),
        delimiter: options.delimiter,
        useQuotes: options.quotes
      });

      console.log(chalk.green('\n✅ CSV 文件生成成功！'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.gray(`保存路径：${chalk.cyan(result.path)}`));
      console.log(chalk.gray(`最终大小：${chalk.cyan((result.size / (1024 * 1024)).toFixed(2) + ' MB')}`));
      console.log(chalk.gray(`总行数：${chalk.cyan(result.rows.toLocaleString())}`));
      console.log(chalk.gray(`生成时间：${chalk.cyan((result.time) + 'ms')}`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log('');

    } catch (error) {
      console.error(chalk.red('\n❌ 生成失败:', error.message));
      process.exit(1);
    }
  });

// JSON 文件生成子命令
program
  .command('json [size]')
  .description('生成大型 JSON 数据文件')
  .argument('[size]', '文件大小（MB），默认 50', '50')
  .option('-o, --output <path>', '输出文件路径', './large-file.json')
  .option('-f, --format <format>', '格式：array|stream|ndjson', 'array')
  .option('-p, --pretty', '格式化输出（会增加文件大小）', false)
  .action(async (size, options) => {
    try {
      const sizeBytes = parseSize(size);
      
      console.log(chalk.cyan('\n📄 开始生成 JSON 文件...'));
      console.log(chalk.gray(`目标大小：${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`));
      console.log(chalk.gray(`输出路径：${options.output}`));
      console.log(chalk.gray(`格式：${options.format}`));
      console.log(chalk.gray(`美化：${options.pretty}\n`));

      const result = await generateFile('json', {
        size: sizeBytes,
        outputPath: options.output,
        format: options.format,
        pretty: options.pretty
      });

      console.log(chalk.green('\n✅ JSON 文件生成成功！'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.gray(`保存路径：${chalk.cyan(result.path)}`));
      console.log(chalk.gray(`最终大小：${chalk.cyan((result.size / (1024 * 1024)).toFixed(2) + ' MB')}`));
      console.log(chalk.gray(`对象数量：${chalk.cyan(result.objects.toLocaleString())}`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log('');

    } catch (error) {
      console.error(chalk.red('\n❌ 生成失败:', error.message));
      process.exit(1);
    }
  });

// 通用文件生成子命令（二进制填充）
program
  .command('binary [size]')
  .alias('bin')
  .description('生成大型二进制文件')
  .argument('[size]', '文件大小，例如：50MB, 1GB', '50MB')
  .option('-o, --output <path>', '输出文件路径', './large-file.bin')
  .option('-p, --pattern <pattern>', '填充模式：zeros|random|pattern', 'zeros')
  .option('--pattern-value <hex>', '自定义填充模式（16 进制）', 'DEADBEEF')
  .action(async (size, options) => {
    try {
      const sizeBytes = parseSize(size);
      
      console.log(chalk.cyan('\n💾 开始生成二进制文件...'));
      console.log(chalk.gray(`目标大小：${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`));
      console.log(chalk.gray(`输出路径：${options.output}`));
      console.log(chalk.gray(`填充模式：${options.pattern}\n`));

      const result = await generateFile('binary', {
        size: sizeBytes,
        outputPath: options.output,
        pattern: options.pattern,
        patternValue: options.patternValue
      });

      console.log(chalk.green('\n✅ 二进制文件生成成功！'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.gray(`保存路径：${chalk.cyan(result.path)}`));
      console.log(chalk.gray(`最终大小：${chalk.cyan((result.size / (1024 * 1024)).toFixed(2) + ' MB')}`));
      console.log(chalk.gray(`生成时间：${chalk.cyan((result.time) + 'ms')}`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log('');

    } catch (error) {
      console.error(chalk.red('\n❌ 生成失败:', error.message));
      process.exit(1);
    }
  });

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}