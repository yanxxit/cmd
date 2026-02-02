
import { program } from 'commander';
import path from 'path';
import server from "../src/http-server/static.js";


program
    .arguments('[dir]')
    .description("本地静态文件")
    .option('-p, --port [port=3000]', '端口号')
    .option('-P, --proxy [proxy]', '代理地址')
    .option('-c, --config [config]', '本地代理配置文件 [{"path":"iapi","redirect":"http://172.16.1.102:7001"}]')
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
        console.log(dir, option)
        option.dir = dir;
        option.port = option.port || 3000;
        program.params = option

    })

async function main() {
    // 解析命令行参数
    program.parse(process.argv);

    // 获取用户问题
    const option = program.params || "";
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

