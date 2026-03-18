#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import {
    getProcessList,
    getMemoryInfo,
    getCpuInfo,
    getLoadAverage,
    formatProcessTable,
    formatSystemInfo,
    formatAsJson
} from '../src/command/system-top.js';

// 日志文件路径
const LOG_FILE = 'logs/system-top.log';

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

program
    .version('1.0.0')
    .description('查询系统资源占用前列的进程（类似 top 命令）')
    .option('-n, --number <number>', '显示进程数量', '10')
    .option('-s, --sort <field>', '排序方式：cpu, memory, pid', 'memory')
    .option('-j, --json', '以 JSON 格式输出')
    .option('--no-header', '不显示系统信息头部')
    .option('--no-log', '不记录日志')
    .option('-f, --file <path>', '将结果保存到文件')
    .action((options) => {
        const startTime = Date.now();
        
        // 记录命令执行开始
        if (!options.noLog) {
            writeLogToFile(`========== 命令开始 ==========`);
            writeLogToFile(`执行命令：x-system-top -n ${options.number} -s ${options.sort}`);
        }
        
        // 解析参数
        const limit = parseInt(options.number) || 10;
        const sortBy = options.sort.toLowerCase();
        
        if (!['cpu', 'memory', 'pid'].includes(sortBy)) {
            console.error(chalk.red('❌ 错误：排序方式必须是 cpu, memory 或 pid'));
            process.exit(1);
        }
        
        // 获取系统信息
        const memoryInfo = getMemoryInfo();
        const cpuInfo = getCpuInfo();
        const loadInfo = getLoadAverage();
        
        // 获取进程列表
        const processes = getProcessList(sortBy, limit);
        
        const scanTime = ((Date.now() - startTime) / 1000).toFixed(3);
        
        // 记录执行结果
        if (!options.noLog) {
            writeLogToFile(`查询完成：耗时 ${scanTime}s, 进程数 ${processes.length}`);
            writeLogToFile(`========== 命令结束 ==========\n`);
        }
        
        // 生成输出内容
        let outputContent = '';
        
        if (options.json) {
            // JSON 模式
            const jsonData = {
                timestamp: new Date().toISOString(),
                system: {
                    memory: memoryInfo,
                    cpu: cpuInfo,
                    load: loadInfo
                },
                processes,
                queryTime: scanTime
            };
            outputContent = JSON.stringify(jsonData, null, 2);
            console.log(outputContent);
        } else {
            // 表格模式
            if (options.header !== false) {
                const header = formatSystemInfo(memoryInfo, cpuInfo, loadInfo);
                console.log(header);
                outputContent += header;
            }
            
            const table = formatProcessTable(processes, { 
                showRank: true, 
                colorize: true 
            });
            console.log(table);
            outputContent += table;
            
            console.log(chalk.gray(`⏱️  查询耗时：${scanTime}s\n`));
        }
        
        // 保存到文件
        if (options.file) {
            try {
                fs.writeFileSync(options.file, outputContent, 'utf-8');
                if (!options.json) {
                    console.log(chalk.green(`✅ 结果已保存到：${options.file}`));
                }
            } catch (err) {
                console.error(chalk.red(`❌ 保存文件失败：${err.message}`));
            }
        }
    });

// 解析命令行参数
program.parse(process.argv);
