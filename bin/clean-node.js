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
const rmdir = promisify(fs.rmdir);

program
    .version('1.0.0')
    .description('清理指定目录下的 node_modules 目录')
    .option('-d, --dir <directory>', '指定要清理的目录，默认是当前目录', process.cwd())
    .action((options) => {
        program.directory = options.dir;
    });

async function removeDir(dir) {
    const files = await promisify(fs.readdir)(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        try {
            const stats = await lstat(filePath);
            if (stats.isDirectory()) {
                await removeDir(filePath);
            } else {
                await unlink(filePath);
            }
        } catch (error) {
            // 忽略文件不存在的错误
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    try {
        await rmdir(dir);
    } catch (error) {
        // 忽略目录不存在的错误
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

async function removeNodeModules(directory) {
    const nodeModulesPath = path.join(directory, 'node_modules');
    
    try {
        const stats = await lstat(nodeModulesPath);
        
        if (stats.isSymbolicLink()) {
            // 如果是软链接，直接删除
            await unlink(nodeModulesPath);
            return true;
        } else if (stats.isDirectory()) {
            // 如果是目录，递归删除
            await removeDir(nodeModulesPath);
            return true;
        } else {
            // 如果是文件，直接删除
            await unlink(nodeModulesPath);
            return true;
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            // node_modules 不存在
            return false;
        }
        throw error;
    }
}

async function main() {
    // 解析命令行参数
    program.parse(process.argv);
    
    const directory = program.directory || process.cwd();
    const spinner = ora('正在清理 node_modules...').start();
    
    try {
        const removed = await removeNodeModules(directory);
        
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
