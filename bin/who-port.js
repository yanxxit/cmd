#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { queryPort, formatOutput } from '../src/command/who-port.js';

// 日志文件路径
const LOG_FILE = 'logs/who-port.log';

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
    // 控制台输出（去掉 chalk 颜色，因为 formatOutput 已经处理了格式）
    const colorMap = {
        'error': chalk.red,
        'warning': chalk.yellow,
        'success': chalk.green,
        'info': chalk.cyan,
        'tip': chalk.gray
    };
    
    const colorFn = colorMap[level] || chalk.white;
    console.log(colorFn(message));
    
    // 写入文件日志（去掉颜色代码）
    writeLogToFile(message, level);
}

program
    .version('1.0.0')
    .description('查询占用指定端口的服务详细信息')
    .argument('<port>', '要查询的端口号')
    .option('-j, --json', '以 JSON 格式输出')
    .option('-v, --verbose', '显示更详细的信息')
    .option('--no-log', '不记录日志')
    .action((port, options) => {
        // 记录命令执行开始
        if (!options.noLog) {
            writeLogToFile(`========== 命令开始 ==========`);
            writeLogToFile(`执行命令：x-who-port ${port} ${options.json ? '--json' : ''}${options.verbose ? '--verbose' : ''}`);
            writeLogToFile(`参数：port=${port}, json=${options.json || false}, verbose=${options.verbose || false}`);
        }
        
        const logFn = options.noLog ? null : logCallback;
        
        try {
            // 执行查询操作
            const result = queryPort(port, options, logFn);
            
            // 记录执行结果
            if (!options.noLog) {
                writeLogToFile(`查询结果：isOccupied=${result.isOccupied}, processCount=${result.processCount}`);
                writeLogToFile(`========== 命令结束 ==========\n`);
            }
            
            // 输出结果
            if (options.json) {
                console.log(JSON.stringify(result, null, 2));
            } else {
                formatOutput(result, options.verbose, logFn);
            }
            
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
