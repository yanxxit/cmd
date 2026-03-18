#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import {
    scanPortRange,
    getOccupiedPorts,
    formatAsTable,
    formatAsJson,
    formatAsSimple,
    generateSummary,
    printProgress,
    printSummary,
    printSummaryToString
} from '../src/command/scan-ports.js';

// 日志文件路径
const LOG_FILE = 'logs/scan-ports.log';

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
    // 进度信息不输出到控制台，只写入日志
    if (message.includes('扫描进度')) {
        writeLogToFile(message, level);
        return;
    }
    
    const colorMap = {
        'error': chalk.red,
        'warning': chalk.yellow,
        'success': chalk.green,
        'info': chalk.cyan,
        'tip': chalk.gray
    };
    
    const colorFn = colorMap[level] || chalk.white;
    console.log(colorFn(message));
    
    writeLogToFile(message, level);
}

program
    .version('1.0.0')
    .description('扫描指定范围内的端口占用情况')
    .argument('[start]', '起始端口号', '3000')
    .argument('[end]', '结束端口号', '3010')
    .option('-j, --json', '以 JSON 格式输出')
    .option('-s, --simple', '简洁模式输出')
    .option('-o, --only-occupied', '只显示占用端口')
    .option('-q, --quiet', '安静模式，不显示进度')
    .option('--no-log', '不记录日志')
    .option('-f, --file <path>', '将结果保存到文件')
    .action((start, end, options) => {
        const startPort = parseInt(start);
        const endPort = parseInt(end);
        
        // 验证端口号
        if (isNaN(startPort) || isNaN(endPort)) {
            console.error(chalk.red('❌ 错误：端口号必须是数字。'));
            process.exit(1);
        }
        
        if (startPort < 1 || startPort > 65535 || endPort < 1 || endPort > 65535) {
            console.error(chalk.red('❌ 错误：端口号必须在 1-65535 之间。'));
            process.exit(1);
        }
        
        if (startPort > endPort) {
            console.error(chalk.red('❌ 错误：起始端口不能大于结束端口。'));
            process.exit(1);
        }
        
        // 记录命令执行开始
        if (!options.noLog) {
            writeLogToFile(`========== 命令开始 ==========`);
            writeLogToFile(`执行命令：x-scan-ports ${startPort} ${endPort}`);
            writeLogToFile(`参数：start=${startPort}, end=${endPort}, json=${options.json || false}, only-occupied=${options.onlyOccupied || false}`);
        }
        
        // JSON 模式下不输出头部信息
        if (!options.json) {
            console.log(chalk.cyan('\n🔍 开始扫描端口范围：') + chalk.yellow(`${startPort} - ${endPort}`));
            console.log(chalk.cyan('📊 端口总数：') + chalk.yellow(endPort - startPort + 1));
            console.log(chalk.gray('─'.repeat(60)));
        }
        
        const startTime = Date.now();
        
        // 扫描端口
        const results = scanPortRange(
            startPort,
            endPort,
            {},
            options.quiet || options.json ? null : printProgress
        );
        
        const scanTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        if (!options.quiet && !options.json) {
            console.log(); // 换行
        }
        
        // 生成汇总信息
        const summary = generateSummary(results, startPort, endPort);
        
        // 记录执行结果
        if (!options.noLog) {
            writeLogToFile(`扫描完成：耗时 ${scanTime}s, 总端口 ${results.length}, 占用 ${summary.statistics.occupied}`);
            writeLogToFile(`========== 命令结束 ==========\n`);
        }

        // 生成输出内容
        let outputContent = '';
        if (options.json) {
            outputContent = formatAsJson(results, summary);
            console.log(outputContent);
        } else if (options.simple) {
            outputContent = formatAsSimple(results, { onlyOccupied: options.onlyOccupied });
            console.log(outputContent);
        } else {
            outputContent = formatAsTable(results, { onlyOccupied: options.onlyOccupied });
            console.log(outputContent);
            printSummary(summary);
            outputContent += printSummaryToString(summary);
        }

        // 保存到文件
        if (options.file) {
            try {
                fs.writeFileSync(options.file, outputContent, 'utf-8');
                if (!options.json && !options.simple) {
                    console.log(chalk.green(`\n✅ 结果已保存到：${options.file}`));
                }
            } catch (err) {
                console.error(chalk.red(`\n❌ 保存文件失败：${err.message}`));
            }
        }
        
        // 显示耗时（JSON 模式下不显示）
        if (!options.json) {
            console.log(chalk.gray(`⏱️  扫描耗时：${scanTime}s`));
        }
    });

// 解析命令行参数
program.parse(process.argv);
