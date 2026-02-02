#!/usr/bin/env node

import { program } from 'commander';
import Dictionary from '../src/dict/ds/src/dictionary.js';
import readline from 'readline';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
    .version('1.0.0')
    .description('屌丝字典 - 命令行与Web服务器');

// 定义查询单词的子命令
program
    .command('lookup <word>')
    .alias('l')
    .description('查询单词释义')
    .action(async (word) => {
        const dict = new Dictionary();
        const result = dict.lookupResult(word);

        if (result) {
            console.log(result);
        } else {
            console.log(`${word}: Not found`);
        }
    });

// 定义启动交互式命令行的子命令
program
    .command('cli')
    .description('启动交互式命令行界面')
    .action(() => {
        startInteractiveCLI();
    });

// 定义启动Web服务器的子命令
program
    .command('serve')
    .alias('s')
    .description('启动Web服务器')
    .option('-p, --port <number>', '指定端口号', '5000')
    .action((options) => {
        startWebServer(parseInt(options.port));
    });

// 启动交互式命令行界面
function startInteractiveCLI() {
    const dict = new Dictionary();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('Diaosi Dictionary - A dictionary made by a diaosi, for the diaosi');
    console.log('Enter a word to search (type "quit" or "exit" to quit):');
    console.log('');

    // 主循环
    function startPrompt() {
        rl.question('>> ', (input) => {
            const word = input.trim();

            if (word.toLowerCase() === 'quit' || word.toLowerCase() === 'exit') {
                console.log('Goodbye!');
                rl.close();
                return;
            }

            if (word) {
                const result = dict.lookupResult(word);
                if (result) {
                    console.log(result);
                } else {
                    console.log(`${word}: Not found`);
                }
            }

            console.log('');
            startPrompt();
        });
    }

    // 启动提示
    startPrompt();
}

// 启动Web服务器
function startWebServer(port) {
    const app = express();
    const dict = new Dictionary();

    // 设置静态文件服务
    app.use(express.static(path.join(__dirname, '../src/dict/ds/public')));

    // 解析 JSON 请求体
    app.use(express.json());

    // 主页路由
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../src/dict/ds/public/index.html'));
    });

    // API 路由：查询单词
    app.post('/api/search', (req, res) => {
        const { word } = req.body;

        if (!word) {
            return res.status(400).json({ error: 'Word is required' });
        }

        try {
            const result = dict.lookupResult(word);
            res.json({ word, result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // 启动服务器
    app.listen(port, () => {
        console.log(`Diaosi Dictionary Server running on port ${port}`);
        console.log(`Visit http://localhost:${port} to use the dictionary`);
    });
}

// 如果直接运行此脚本且未指定任何命令，则显示帮助信息
if (!process.argv.slice(2).length) {
    program.outputHelp();
}

// 解析命令行参数
program.parse(process.argv);