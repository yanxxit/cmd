#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { killPort, findProcessByPort } from '../src/command/kill-port.js';

// 日志文件路径
const LOG_FILE = 'logs/kill-port.log';

/**
 * 写入日志到文件
 * @param {string} message - 日志消息
 * @param {string} level - 日志级别
 */
function writeLogToFile(message, level = 'info') {
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    fs.appendFileSync(LOG_FILE, logEntry);
}

/**
 * 日志回调函数
 * @param {string} message - 日志消息
 * @param {string} level - 日志级别
 */
function logCallback(message, level = 'info') {
    // 控制台输出
    switch (level) {
        case 'error':
            console.error(chalk.red(message));
            break;
        case 'warning':
            console.log(chalk.yellow(message));
            break;
        case 'success':
            console.log(chalk.green(message));
            break;
        case 'info':
        default:
            console.log(chalk.blue(message));
            break;
    }
    
    // 写入文件日志
    writeLogToFile(message, level);
}

program
    .version('1.0.0')
    .description('通过端口号关闭占用端口的应用程序')
    .argument('<port>', '要关闭的端口号')
    .option('-f, --force', '强制关闭，不确认提示')
    .option('--no-log', '不记录日志')
    .action(async (port, options) => {
        // 记录命令执行开始
        if (!options.noLog) {
            writeLogToFile(`========== 命令开始 ==========`);
            writeLogToFile(`执行命令：x-kill-port ${port} ${options.force ? '--force' : ''}`);
            writeLogToFile(`参数：port=${port}, force=${options.force || false}`);
        }
        
        const logFn = options.noLog ? null : logCallback;
        
        try {
            // 执行关闭操作
            const result = await killPort(port, options, logFn);
            
            // 记录执行结果
            if (!options.noLog) {
                writeLogToFile(`执行结果：success=${result.success}, found=${result.processesFound.length}, killed=${result.killResult?.successCount || 0}`);
                writeLogToFile(`========== 命令结束 ==========\n`);
            }
            
            // 如果使用了日志回调，已经输出过信息，这里不需要再输出
            if (!logFn && result.processesFound.length > 0 && !options.force) {
                // 非强制模式且没有日志回调时，等待用户输入已在 killPort 中处理
            }
            
            process.exit(result.success ? 0 : 1);
        } catch (err) {
            if (!options.noLog) {
                writeLogToFile(`执行错误：${err.message}`, 'error');
                writeLogToFile(`========== 命令结束 (异常) ==========\n`);
            }
            console.error(chalk.red(`❌ 错误：${err.message}`));
            process.exit(1);
        }
    });

// 解析命令行参数
program.parse(process.argv);
