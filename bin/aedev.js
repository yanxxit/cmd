#!/usr/bin/env node

/**
 * aedev - AE 云函数调试工具
 * 用于执行云函数并记录历史数据
 */

import { program } from 'commander';
import chalk from 'chalk';
import { invokeCloudFunction, generateCacheKey } from '../src/ae/index.js';
import { 
  addHistoryRecord, 
  getHistoryRecords, 
  getHistoryRecordById, 
  updateHistoryRecord, 
  addTags, 
  deleteHistoryRecord, 
  getStats 
} from '../src/ae/history.js';

program
  .name('aedev')
  .description('AE 云函数调试工具')
  .version('1.0.0');

// 调用云函数子命令
program
  .command('invoke <functionName>')
  .alias('run')
  .description('调用云函数')
  .argument('<functionName>', '云函数名称')
  .option('-p, --params <json>', '参数 JSON 字符串', '{}')
  .option('-t, --title <title>', '记录标题')
  .option('--tag <tags>', '标签（逗号分隔）', '')
  .option('-c, --command <cmd>', '执行命令', 'ae')
  .action(async (functionName, options) => {
    try {
      let params;
      try {
        params = JSON.parse(options.params);
      } catch (error) {
        console.error(chalk.red('解析参数 JSON 失败:'), error.message);
        process.exit(1);
      }

      const tags = options.tag ? options.tag.split(',').map(t => t.trim()).filter(t => t) : [];

      console.log(chalk.cyan(`\n🚀 开始调用云函数: ${chalk.bold(functionName)}`));
      console.log(chalk.gray(`参数: ${JSON.stringify(params, null, 2)}`));

      const startTime = Date.now();

      try {
        const result = await invokeCloudFunction(functionName, params, options.command);
        const duration = Date.now() - startTime;

        console.log(chalk.green('\n✅ 云函数执行成功'));
        console.log(chalk.gray(`执行时间: ${duration}ms`));
        console.log(chalk.cyan('\n结果:'));
        console.log(JSON.stringify(result, null, 2));

        // 生成缓存键
        const cacheKey = generateCacheKey(functionName, params);

        // 保存历史记录
        const record = await addHistoryRecord({
          functionName,
          params,
          result,
          duration,
          status: 'success',
          cacheKey,
          title: options.title || `${functionName} - ${new Date().toLocaleString()}`,
          tags: ['success', ...tags]
        });

        console.log(chalk.gray(`\n记录 ID: ${record.id}`));

      } catch (error) {
        const duration = Date.now() - startTime;

        console.error(chalk.red('\n❌ 云函数执行失败'));
        console.error(chalk.gray(`执行时间: ${duration}ms`));
        console.error(chalk.red(`错误: ${error.message}`));

        // 保存失败记录
        const cacheKey = generateCacheKey(functionName, params);
        await addHistoryRecord({
          functionName,
          params,
          result: null,
          duration,
          status: 'failed',
          cacheKey,
          title: options.title || `${functionName} (失败) - ${new Date().toLocaleString()}`,
          tags: ['failed', ...tags]
        });
      }

    } catch (error) {
      console.error(chalk.red('操作失败:'), error.message);
      process.exit(1);
    }
  });

// 查看历史记录子命令
program
  .command('history')
  .alias('list')
  .alias('ls')
  .description('查看历史记录')
  .option('-l, --limit <number>', '显示数量', '20')
  .option('-f, --function <name>', '按函数名称过滤')
  .option('--tag <tag>', '按标签过滤')
  .option('-k, --keyword <keyword>', '关键词搜索')
  .option('--format <format>', '输出格式：table|json', 'table')
  .action(async (options) => {
    try {
      const records = await getHistoryRecords({
        limit: parseInt(options.limit),
        functionName: options.function,
        tag: options.tag,
        keyword: options.keyword
      });

      if (options.format === 'json') {
        console.log(JSON.stringify(records, null, 2));
        return;
      }

      if (records.length === 0) {
        console.log(chalk.yellow('暂无历史记录'));
        return;
      }

      console.log(chalk.cyan('\n📋 历史记录\n'));
      console.log(chalk.gray('─'.repeat(80)));

      records.forEach((record, index) => {
        const statusIcon = record.status === 'success' ? '✅' : '❌';
        const statusColor = record.status === 'success' ? chalk.green : chalk.red;
        
        console.log(`${statusIcon} ${chalk.bold(`#${index + 1}`)} ${chalk.gray(`[${record.id}]`)}`);
        console.log(`  ${chalk.cyan('函数:')} ${record.functionName}`);
        console.log(`  ${chalk.cyan('标题:')} ${record.title || '无标题'}`);
        console.log(`  ${chalk.cyan('状态:')} ${statusColor(record.status)}`);
        console.log(`  ${chalk.cyan('耗时:')} ${record.duration}ms`);
        console.log(`  ${chalk.cyan('时间:')} ${new Date(record.createdAt).toLocaleString()}`);
        if (record.tags && record.tags.length > 0) {
          console.log(`  ${chalk.cyan('标签:')} ${record.tags.map(t => chalk.yellow(`#${t}`)).join(' ')}`);
        }
        console.log(chalk.gray('─'.repeat(80)));
      });

    } catch (error) {
      console.error(chalk.red('获取历史记录失败:'), error.message);
      process.exit(1);
    }
  });

// 查看单条记录
program
  .command('show <id>')
  .description('查看单条历史记录')
  .argument('<id>', '记录 ID')
  .option('--format <format>', '输出格式：detail|json', 'detail')
  .action(async (id, options) => {
    try {
      const record = await getHistoryRecordById(id);

      if (!record) {
        console.error(chalk.red('未找到该记录'));
        process.exit(1);
      }

      if (options.format === 'json') {
        console.log(JSON.stringify(record, null, 2));
        return;
      }

      console.log(chalk.cyan('\n📄 记录详情\n'));
      console.log(chalk.gray('─'.repeat(80)));
      console.log(`${chalk.cyan('ID:')} ${record.id}`);
      console.log(`${chalk.cyan('标题:')} ${record.title || '无标题'}`);
      console.log(`${chalk.cyan('函数:')} ${record.functionName}`);
      console.log(`${chalk.cyan('状态:')} ${record.status === 'success' ? chalk.green('成功') : chalk.red('失败')}`);
      console.log(`${chalk.cyan('耗时:')} ${record.duration}ms`);
      console.log(`${chalk.cyan('创建时间:')} ${new Date(record.createdAt).toLocaleString()}`);
      if (record.tags && record.tags.length > 0) {
        console.log(`${chalk.cyan('标签:')} ${record.tags.map(t => chalk.yellow(`#${t}`)).join(' ')}`);
      }
      console.log(`\n${chalk.cyan('参数:')}`);
      console.log(JSON.stringify(record.params, null, 2));
      console.log(`\n${chalk.cyan('结果:')}`);
      console.log(JSON.stringify(record.result, null, 2));
      console.log(chalk.gray('─'.repeat(80)));

    } catch (error) {
      console.error(chalk.red('获取记录失败:'), error.message);
      process.exit(1);
    }
  });

// 更新记录标题
program
  .command('title <id> <newTitle>')
  .description('更新记录标题')
  .argument('<id>', '记录 ID')
  .argument('<newTitle>', '新标题')
  .action(async (id, newTitle) => {
    try {
      const record = await updateHistoryRecord(id, { title: newTitle });

      if (!record) {
        console.error(chalk.red('未找到该记录'));
        process.exit(1);
      }

      console.log(chalk.green('✅ 标题已更新'));
      console.log(chalk.cyan(`新标题: ${record.title}`));

    } catch (error) {
      console.error(chalk.red('更新失败:'), error.message);
      process.exit(1);
    }
  });

// 添加标签
program
  .command('tag <id> <tags>')
  .description('为记录添加标签')
  .argument('<id>', '记录 ID')
  .argument('<tags>', '标签（逗号分隔）')
  .action(async (id, tagsStr) => {
    try {
      const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
      const record = await addTags(id, tags);

      if (!record) {
        console.error(chalk.red('未找到该记录'));
        process.exit(1);
      }

      console.log(chalk.green('✅ 标签已添加'));
      console.log(chalk.cyan(`当前标签: ${record.tags.map(t => chalk.yellow(`#${t}`)).join(' ')}`));

    } catch (error) {
      console.error(chalk.red('添加标签失败:'), error.message);
      process.exit(1);
    }
  });

// 删除记录
program
  .command('delete <id>')
  .alias('rm')
  .description('删除历史记录')
  .argument('<id>', '记录 ID')
  .action(async (id) => {
    try {
      const success = await deleteHistoryRecord(id);

      if (!success) {
        console.error(chalk.red('未找到该记录'));
        process.exit(1);
      }

      console.log(chalk.green('✅ 记录已删除'));

    } catch (error) {
      console.error(chalk.red('删除失败:'), error.message);
      process.exit(1);
    }
  });

// 统计信息
program
  .command('stats')
  .description('查看统计信息')
  .action(async () => {
    try {
      const stats = await getStats();

      console.log(chalk.cyan('\n📊 统计信息\n'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`${chalk.cyan('总记录数:')} ${stats.total}`);
      console.log(`${chalk.cyan('成功:')} ${chalk.green(stats.successCount)}`);
      console.log(`${chalk.cyan('失败:')} ${chalk.red(stats.failCount)}`);
      console.log(`${chalk.cyan('平均耗时:')} ${stats.avgDuration}ms`);
      console.log(chalk.gray('─'.repeat(50)));

      if (Object.keys(stats.functionNameCount).length > 0) {
        console.log(`\n${chalk.cyan('函数调用次数:')}`);
        Object.entries(stats.functionNameCount)
          .sort((a, b) => b[1] - a[1])
          .forEach(([name, count]) => {
            console.log(`  ${chalk.yellow(name)}: ${count}`);
          });
      }

      if (Object.keys(stats.tagCount).length > 0) {
        console.log(`\n${chalk.cyan('标签统计:')}`);
        Object.entries(stats.tagCount)
          .sort((a, b) => b[1] - a[1])
          .forEach(([tag, count]) => {
            console.log(`  ${chalk.yellow(`#${tag}`)}: ${count}`);
          });
      }

      console.log(chalk.gray('─'.repeat(50)));

    } catch (error) {
      console.error(chalk.red('获取统计信息失败:'), error.message);
      process.exit(1);
    }
  });

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
