#!/usr/bin/env node
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';

const stat = promisify(fs.stat);
const lstat = promisify(fs.lstat);
const unlink = promisify(fs.unlink);

program
    .version('1.0.0')
    .description('清理指定目录下的 node_modules 目录')
    .option('-d, --dir <directory>', '指定要清理的目录，默认是当前目录', process.cwd());

async function removeDir(dir) {
    try {
        await promisify(fs.rm)(dir, { recursive: true, force: true });
    } catch (error) {
        // 忽略文件不存在的错误
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

async function removeNodeModules(directory) {
    const nodeModulesPath = path.join(directory, 'node_modules');
    let removed = false;
    
    try {
        const stats = await lstat(nodeModulesPath);
        
        if (stats.isSymbolicLink()) {
            // 如果是软链接，直接删除
            await unlink(nodeModulesPath);
            removed = true;
        } else if (stats.isDirectory()) {
            // 如果是目录，递归删除
            await removeDir(nodeModulesPath);
            removed = true;
        } else {
            // 如果是文件，直接删除
            await unlink(nodeModulesPath);
            removed = true;
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
    
    return removed;
}

async function recursiveClean(directory) {
    let totalRemoved = false;
    
    // 清理当前目录下的 node_modules
    const currentRemoved = await removeNodeModules(directory);
    if (currentRemoved) {
        totalRemoved = true;
    }
    
    // 递归清理子目录
    try {
        const files = await promisify(fs.readdir)(directory);
        for (const file of files) {
            const filePath = path.join(directory, file);
            const stats = await lstat(filePath);
            if (stats.isDirectory() && file !== 'node_modules') {
                const subDirRemoved = await recursiveClean(filePath);
                if (subDirRemoved) {
                    totalRemoved = true;
                }
            }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
    
    return totalRemoved;
}

async function main() {
    // 解析命令行参数
    program.parse(process.argv);
    
    const options = program.opts();
    const directory = options.dir || process.cwd();
    const spinner = ora('正在清理 node_modules...').start();
    
    try {
        const removed = await recursiveClean(directory);
        
        if (removed) {
            spinner.succeed(chalk.green('✅ 成功清理 node_modules 目录'));
        } else {
            spinner.info(chalk.yellow('ℹ️  node_modules 目录不存在，无需清理'));
        }
    } catch (error) {
        spinner.fail(chalk.red('❌ 清理失败'));
        console.error(chalk.red(`错误: ${error.message}`));
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
