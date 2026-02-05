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
    .description('快速查询指定目录下的一级子目录和文件列表，并返回它们的大小（支持并行处理）')
    .option('-d, --dir <directory>', '指定要查询的目录，默认是当前目录', process.cwd())
    .option('-n, --number <number>', '指定要展示的前几条数据，默认全部', parseInt)
    .option('-c, --concurrency <number>', '指定并发处理的文件数，默认为 5', parseInt, 5)
    .action((options) => {
        program.directory = options.dir;
        program.number = options.number;
        program.concurrency = options.concurrency;
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
            return 0; // 返回0避免错误中断流程
        }
        throw error;
    }
}

// 并行处理函数，限制并发数
async function processInParallel(items, concurrency) {
    const results = [];
    const processing = [];
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // 创建处理任务
        const promise = getSize(item.path)
            .then(size => ({
                name: item.name,
                size: size,
                formattedSize: formatSize(size)
            }))
            .catch(error => {
                console.error(chalk.yellow(`⚠️  处理 ${item.name} 时出错: ${error.message}`));
                return {
                    name: item.name,
                    size: 0,
                    formattedSize: formatSize(0)
                };
            });
            
        processing.push(promise);
        
        // 如果达到并发限制，等待至少一个完成
        if (processing.length >= concurrency) {
            const completed = await Promise.race(processing.map((p, idx) => 
                p.then(result => ({result, idx}))
            ));
            
            results.push(completed.result);
            processing.splice(completed.idx, 1);
        }
    }
    
    // 等待所有剩余的任务完成
    const remainingResults = await Promise.allSettled(processing);
    for (const result of remainingResults) {
        if (result.status === 'fulfilled') {
            results.push(result.value);
        } else {
            console.error(chalk.yellow(`⚠️  处理项目时出错: ${result.reason.message}`));
        }
    }
    
    return results;
}

// 更高效的并行处理器，真正的并发控制
async function processInParallelWithSemaphore(items, concurrency) {
    const results = new Array(items.length); // 预分配数组以保持正确顺序
    const activeTasks = new Set(); // 跟踪活跃任务

    // 为每个项目创建处理任务的函数
    async function processItem(index) {
        const item = items[index];
        try {
            const size = await getSize(item.path);
            return {
                index, // 保存原始索引位置
                result: {
                    name: item.name,
                    size: size,
                    formattedSize: formatSize(size)
                }
            };
        } catch (error) {
            console.error(chalk.yellow(`⚠️  处理 ${item.name} 时出错: ${error.message}`));
            return {
                index,
                result: {
                    name: item.name,
                    size: 0,
                    formattedSize: formatSize(0)
                }
            };
        }
    }

    let currentIndex = 0;
    const totalItems = items.length;

    // 启动前concurrency个任务
    while (currentIndex < Math.min(concurrency, totalItems)) {
        const task = processItem(currentIndex).then(res => {
            results[res.index] = res.result; // 根据原始索引存储结果
            activeTasks.delete(task);
            return res;
        });
        activeTasks.add(task);
        currentIndex++;
    }

    // 当有任务完成时，立即启动下一个任务，直到所有任务完成
    while (activeTasks.size > 0) {
        // 等待任意一个任务完成
        await Promise.race(activeTasks);

        // 如果还有未启动的任务，则启动下一个任务
        if (currentIndex < totalItems) {
            const task = processItem(currentIndex).then(res => {
                results[res.index] = res.result;
                activeTasks.delete(task);
                return res;
            });
            activeTasks.add(task);
            currentIndex++;
        }
    }

    return results;
}

// 实际的并发控制函数
async function processItemsWithConcurrencyLimit(items, concurrency) {
    const results = [];
    const promises = [];

    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);
        const batchPromises = batch.map(async (item) => {
            try {
                const size = await getSize(item.path);
                return {
                    name: item.name,
                    size: size,
                    formattedSize: formatSize(size)
                };
            } catch (error) {
                console.error(chalk.yellow(`⚠️  处理 ${item.name} 时出错: ${error.message}`));
                return {
                    name: item.name,
                    size: 0,
                    formattedSize: formatSize(0)
                };
            }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // 显示进度
        const processedCount = Math.min(i + concurrency, items.length);
        if (process.stdout.clearLine) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
        }
        process.stdout.write(`进度: ${processedCount}/${items.length} 项目`);
    }

    if (process.stdout.clearLine) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
    }

    return results;
}

async function main() {
    // 解析命令行参数
    program.parse(process.argv);

    const options = program.opts();
    const directory = options.dir || process.cwd();
    const number = options.number;
    const concurrency = options.concurrency;

    try {
        // 读取目录下的文件和子目录
        const files = await readdir(directory);
        const items = files.map(file => ({
            name: file,
            path: path.join(directory, file)
        }));

        console.log(chalk.blue(`📁 目录: ${directory}`));
        console.log(chalk.blue('='.repeat(80)));
        console.log(chalk.blue(`🚀 使用并行处理，最大并发数: ${options.concurrency}`));
        console.log(chalk.blue(`📊 总计 ${items.length} 个项目待处理`));
        console.log('');

        // 使用并行处理计算大小
        const startTime = Date.now();
        const processedItems = await processInParallelWithSemaphore(items, options.concurrency);
        const endTime = Date.now();

        // 按大小倒序排序
        processedItems.sort((a, b) => b.size - a.size);

        // 限制展示数量
        const displayItems = number ? processedItems.slice(0, number) : processedItems;

        // 显示最终结果
        console.log('');
        console.log(chalk.blue('='.repeat(80)));
        console.log(chalk.blue('排序后的结果:'));
        console.log(chalk.blue('='.repeat(80)));

        for (const item of displayItems) {
            console.log(`${item.formattedSize}    ${item.name}`);
        }

        console.log(chalk.blue('='.repeat(80)));
        console.log(chalk.green(`✅ 处理完成，共 ${processedItems.length} 项，耗时 ${(endTime - startTime)/1000}s`));

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