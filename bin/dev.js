#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import server from "../src/http-server/static.js";
import { openURL } from "../src/open.js";


program
    .arguments('[dir]')
    .description("本地静态文件查看器")
    .option('-p, --port [port=3000]', '端口号')
    .option('-P, --proxy [proxy]', '代理地址')
    .option('-c, --config [config]', '本地代理配置文件 [{"path":"iapi","redirect":"http://172.16.1.102:7001"}]')
    .option('-o, --open', '启动后自动打开浏览器')
    .action(function (dir, option) {
        if (!dir) dir = process.cwd();

        if (!path.isAbsolute(dir)) {
            dir = path.join(process.cwd(), dir)
        }
        if (option?.config) {
            if (!path.isAbsolute(option.config)) {
                option.config = path.join(process.cwd(), option.config)
            }
        }
        option.dir = dir;
        option.port = option.port || 3000;
        program.params = option

    })

/**
 * 打印服务器启动信息
 * @param {number} port - 端口号
 * @param {boolean} autoOpen - 是否自动打开浏览器
 */
function printServerInfo(port, autoOpen = false) {
    const baseUrl = `http://127.0.0.1:${port}`;
    
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              🚀 静态文件服务器已启动                    ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║                                                          ║');
    console.log(`║  📁 服务目录: ${program.params.dir.padEnd(38)}║`);
    console.log(`║  🔗 访问地址: ${baseUrl.padEnd(38)}║`);
    console.log('║                                                          ║');
    console.log('║  📌 常用页面:                                             ║');
    console.log(`║    • 工具箱首页: ${`${baseUrl}/`.padEnd(35)}║`);
    console.log(`║    • 文件查看器: ${`${baseUrl}/file-viewer/`.padEnd(33)}║`);
    console.log(`║    • String转JSON: ${`${baseUrl}/string-to-json/`.padEnd(31)}║`);
    console.log(`║    • CSV转JSON: ${`${baseUrl}/csv-to-json/`.padEnd(33)}║`);
    console.log(`║    • TODO应用: ${`${baseUrl}/todo-v7/`.padEnd(34)}║`);
    console.log(`║    • 日历管理: ${`${baseUrl}/calendar/`.padEnd(34)}║`);
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    // 自动打开浏览器
    if (autoOpen) {
        console.log('🌐 正在打开浏览器...');
        openURL(baseUrl).catch(err => {
            console.error('❌ 打开浏览器失败:', err.message);
        });
    } else {
        console.log('💡 提示: 使用 -o 或 --open 参数可自动打开浏览器');
    }
    
    console.log('');
    console.log('按 Ctrl+C 停止服务器');
    console.log('');
}

async function main() {
    // 解析命令行参数
    program.parse(process.argv);

    // 获取用户问题
    const option = program.params || "";
    
    // 打印服务器信息（延迟一点，等服务器启动完成）
    setTimeout(() => {
        printServerInfo(option.port, option.open);
    }, 500);
    
    server(option);
}

// 执行主函数
try {
    main();
} catch (err) {
    console.error('\x1b[31m❌ 错误: 执行失败。\x1b[0m');
    console.error(err);
    process.exit(1);
}

