
const { program } = require('commander');
const path = require('path');
const server = require("../src/http-server/static");


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

try {
    require('commander');
    // 执行主函数
    main();
} catch (err) {
    console.error('\x1b[31m❌ 错误: 缺少必要的依赖包 "commander"。\x1b[0m');
    console.log('请运行以下命令安装:');
    console.log('npm install commander');
    process.exit(1);
}

