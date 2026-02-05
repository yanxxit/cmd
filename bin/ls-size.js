#!/usr/bin/env node
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import chalk from 'chalk';

const stat = promisify(fs.stat);
const lstat = promisify(fs.lstat);
const readdir = promisify(fs.readdir);

program
    .version('1.0.0')
    .description('查询指定目录下的一级子目录和文件列表，并返回它们的大小')
    .option('-d, --dir <directory>', '指定要查询的目录，默认是当前目录', process.cwd())
    .option('-n, --number <number>', '指定要展示的前几条数据，默认全部', parseInt)
    .action((options) => {
        program.directory = options.dir;
        program.number = options.number;
    });

// 转换文件大小为人类可读格式
function formatSize(bytes) {
    if (bytes === 0) return '  0.00  B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    const unit = sizes[i].padEnd(2); // 固定单位长度为 2 个字符
    // 确保大小字符串长度一致，格式为 " 123.45 KB"
    return size.toString().padStart(6) + ' ' + unit;
}

// 计算目录大小
async function getDirSize(dir) {
    let totalSize = 0;
    try {
        const files = await readdir(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            try {
                const stats = await stat(filePath);
                if (stats.isDirectory()) {
                    totalSize += await getDirSize(filePath);
                } else {
                    totalSize += stats.size;
                }
            } catch (error) {
                // 忽略文件不存在或无权限的错误
                if (error.code !== 'ENOENT' && error.code !== 'EPERM' && error.code !== 'EACCES') {
                    throw error;
                }
            }
        }
    } catch (error) {
        // 忽略目录无权限的错误
        if (error.code !== 'EPERM' && error.code !== 'EACCES') {
            throw error;
        }
    }
    return totalSize;
}

// 获取文件或目录的大小
async function getSize(path) {
    try {
        const stats = await lstat(path);
        if (stats.isDirectory()) {
            return await getDirSize(path);
        } else {
            return stats.size;
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            return 0;
        } else if (error.code === 'EACCES') {
            // 没有权限
            throw new Error('EACCES');
        }
        throw error;
    }
}

async function main() {
    // 解析命令行参数
    program.parse(process.argv);
    
    const options = program.opts();
    const directory = options.dir || process.cwd();
    
    try {
        // 读取目录下的文件和子目录
        const files = await readdir(directory);
        
        console.log(chalk.blue(`📁 目录: ${directory}`));
        console.log(chalk.blue('='.repeat(80)));
        
        // 处理每个文件和子目录
        for (const file of files) {
            const filePath = path.join(directory, file);
            let fileStartTime = Date.now();
            let updateInterval = null;
            let isProcessing = true;
            
            // 启动定时器，每秒更新处理时间
            updateInterval = setInterval(() => {
                if (isProcessing) {
                    const elapsedTime = Math.floor((Date.now() - fileStartTime) / 1000);
                    process.stdout.clearLine();
                    process.stdout.cursorTo(0);
                    process.stdout.write(`${file} 查询中 ${elapsedTime}s`);
                }
            }, 1000);
            
            // 显示初始状态
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(`${file} 查询中 0s`);
            
            // 计算大小
            try {
                await getSize(filePath);
            } catch (error) {
                // 忽略无权限的错误
                if (error.message !== 'EACCES') {
                    throw error;
                }
            } finally {
                // 停止处理
                isProcessing = false;
                clearInterval(updateInterval);
            }
        }
        
        // 确保最后一行输出完成
        process.stdout.write('\n');
        console.log(chalk.blue('='.repeat(80)));
        console.log(chalk.green('✅ 处理完成'));
        
    } catch (error) {
        console.error(chalk.red('❌ 错误: 执行失败。'));
        console.error(error);
        process.exit(1);
    }
}

// 执行主函数
try {
    main();
} catch (err) {
    console.error(chalk.red('❌ 错误: 执行失败。'));
    console.error(err);
    process.exit(1);
}
