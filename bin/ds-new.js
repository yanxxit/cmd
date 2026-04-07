#!/usr/bin/env node

import { program } from 'commander';
import { EngineManager } from '../src/dict/engines/index.js';
import Dictionary from '../src/dict/ds/src/dictionary.js';
import readline from 'readline';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDictionary, checkDictionaryExists } from '../src/dict/ds-init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
    .version('1.0.0')
    .description('屌丝字典 - 本地词典引擎');

// 初始化命令
program
    .command('init')
    .alias('i')
    .alias('install')
    .description('初始化词典数据（从 GitHub 下载 endict.txt）')
    .option('-v, --verbose', '显示详细输出')
    .action(async (options) => {
        await initDictionary(options);
    });

// 查询命令
program
    .command('lookup <word>')
    .alias('l')
    .alias('query')
    .alias('fy')
    .description('查询单词释义')
    .option('-e, --engine <name>', '使用引擎 (ds/youdao)', 'ds')
    .action(async (word, options) => {
        if (options.engine === 'ds' && !checkDictionaryExists()) {
            console.log('⚠️  词典数据未初始化');
            console.log('请先运行：ds init\n');
            process.exit(1);
        }

        try {
            const manager = new EngineManager({
                preferredEngine: options.engine,
                verbose: true
            });

            const result = await manager.translate(word);
            
            if (result.success) {
                console.log(result.result);
            } else {
                console.log(`❌ 查询失败：${result.error}`);
            }
        } catch (error) {
            console.log(`❌ 错误：${error.message}`);
        }
    });

// 搜索命令
program
    .command('search <pattern>')
    .alias('s')
    .alias('find')
    .description('搜索词典（支持正则）')
    .option('-m, --max <number>', '最大结果数', '50')
    .option('-i, --ignore-case', '忽略大小写', true)
    .action(async (pattern, options) => {
        if (!checkDictionaryExists()) {
            console.log('⚠️  词典数据未初始化');
            console.log('请先运行：ds init\n');
            process.exit(1);
        }

        try {
            const manager = new EngineManager({ preferredEngine: 'ds' });
            const dsEngine = manager.getEngine('ds');
            
            const results = await dsEngine.search(pattern, {
                maxResults: parseInt(options.max),
                flags: options.ignoreCase ? 'i' : ''
            });

            if (results.length === 0) {
                console.log('未找到匹配结果');
                return;
            }

            console.log(`找到 ${results.length} 条结果:\n`);
            for (const item of results) {
                console.log(`${item.word}: ${item.explanation}`);
            }
        } catch (error) {
            console.log(`❌ 搜索失败：${error.message}`);
        }
    });

// 交互式命令行
program
    .command('cli')
    .description('启动交互式命令行界面')
    .action(() => {
        if (!checkDictionaryExists()) {
            console.log('⚠️  词典数据未初始化');
            console.log('请先运行：ds init\n');
            process.exit(1);
        }
        startInteractiveCLI();
    });

// Web 服务器
program
    .command('serve')
    .alias('s')
    .alias('web')
    .description('启动 Web 服务器')
    .option('-p, --port <number>', '指定端口号', '5000')
    .option('-e, --engine <name>', '使用引擎 (ds/youdao)', 'ds')
    .action(async (options) => {
        if (options.engine === 'ds' && !checkDictionaryExists()) {
            console.log('⚠️  词典数据未初始化');
            console.log('请先运行：ds init\n');
            process.exit(1);
        }
        startWebServer(parseInt(options.port), options.engine);
    });

// 统计信息
program
    .command('stats')
    .description('显示词典统计信息')
    .action(() => {
        if (!checkDictionaryExists()) {
            console.log('⚠️  词典数据未初始化');
            console.log('请先运行：ds init\n');
            process.exit(1);
        }

        try {
            const manager = new EngineManager({ preferredEngine: 'ds' });
            const stats = manager.getStats();
            
            console.log('词典统计:');
            console.log('─'.repeat(50));
            for (const [name, info] of Object.entries(stats)) {
                console.log(`${name}:`);
                if (info.totalWords) {
                    console.log(`  词汇总数：${info.totalWords}`);
                }
                if (info.dataPath) {
                    console.log(`  数据路径：${info.dataPath}`);
                }
            }
            console.log('─'.repeat(50));
        } catch (error) {
            console.log(`❌ 错误：${error.message}`);
        }
    });

// 交互式命令行
function startInteractiveCLI() {
    const dict = new Dictionary();
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('Diaosi Dictionary - A dictionary made by a diaosi, for the diaosi');
    console.log('Enter a word to search (type "quit", "exit", or "q" to quit):');
    console.log('Commands: /search <pattern>, /stats, /help');
    console.log('');

    function startPrompt() {
        rl.question('>> ', async (input) => {
            const word = input.trim();

            if (['quit', 'exit', 'q'].includes(word.toLowerCase())) {
                console.log('Goodbye!');
                rl.close();
                return;
            }

            if (word.startsWith('/')) {
                const parts = word.split(' ');
                const command = parts[0].toLowerCase();

                if (command === '/search' && parts[1]) {
                    try {
                        const manager = new EngineManager({ preferredEngine: 'ds' });
                        const dsEngine = manager.getEngine('ds');
                        const results = await dsEngine.search(parts[1], { maxResults: 20 });
                        
                        if (results.length === 0) {
                            console.log('未找到匹配结果');
                        } else {
                            console.log(`找到 ${results.length} 条结果:`);
                            for (const item of results) {
                                console.log(`${item.word}: ${item.explanation}`);
                            }
                        }
                    } catch (error) {
                        console.log(`错误：${error.message}`);
                    }
                } else if (command === '/stats') {
                    try {
                        const manager = new EngineManager({ preferredEngine: 'ds' });
                        const stats = manager.getStats();
                        console.log('统计:', JSON.stringify(stats, null, 2));
                    } catch (error) {
                        console.log(`错误：${error.message}`);
                    }
                } else if (command === '/help') {
                    console.log('可用命令:');
                    console.log('  /search <pattern> - 搜索词典');
                    console.log('  /stats           - 显示统计');
                    console.log('  /help            - 显示帮助');
                    console.log('  quit/exit/q      - 退出');
                } else {
                    console.log('未知命令，输入 /help 查看帮助');
                }
            } else if (word) {
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

    startPrompt();
}

// Web 服务器
function startWebServer(port, engine = 'ds') {
    const app = express();
    let dictEngine = null;

    if (engine === 'ds') {
        dictEngine = new Dictionary();
    } else {
        dictEngine = new EngineManager({ preferredEngine: engine });
    }

    app.use(express.static(path.join(__dirname, '../src/dict/ds/public')));
    app.use(express.json());

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../src/dict/ds/public/index.html'));
    });

    app.post('/api/search', async (req, res) => {
        const { word } = req.body;

        if (!word) {
            return res.status(400).json({ error: 'Word is required' });
        }

        try {
            let result;
            if (engine === 'ds') {
                result = dictEngine.lookupResult(word);
            } else {
                const translation = await dictEngine.translate(word);
                result = translation.success ? translation.result : null;
            }

            if (result) {
                res.json({ word, result });
            } else {
                res.status(404).json({ error: 'Not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/stats', (req, res) => {
        try {
            if (engine === 'ds') {
                const manager = new EngineManager({ preferredEngine: 'ds' });
                const stats = manager.getStats();
                res.json(stats);
            } else {
                res.json({ engine });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.listen(port, () => {
        console.log(`Diaosi Dictionary Server running on port ${port}`);
        console.log(`Visit http://localhost:${port} to use the dictionary`);
        console.log(`Engine: ${engine}`);
    });
}

if (!process.argv.slice(2).length) {
    program.outputHelp();
}

program.parse(process.argv);
