#!/usr/bin/env node
const program = require("commander");
const moment = require("moment");
const chalk = require("chalk");
const path = require("path");
const os = require("os");
const pinyin = require("js-pinyin");


program.name("exec"); // 名字介绍
program.usage("<path file>"); // 使用方式介绍
program.version("1.0.0", "-v --version"); // 版本 node ./index.js -v
// program.version(require('./package')).version;

// 配置选项
// program.option("-p --port <v>", "设置端口号"); // 参数介绍
// program.option("-c --config <v>", "配置文件"); // 参数介绍


/**
 * 捕获命令行初始化名称
 */
program
  .command("init <name>")
  .description("init ank project")
  .action(require('./lib/init'))

// 创建指令 <>表示变量参数
program
  .command("create <item>")
  .description("创建项目的指令")
  .action((item) => {
    // 行为
    console.log(chalk.red("创建项目 --- " + item));
  });


program
  .command('x-tool <path>')
  .option('-a, --add <fileName>', 'add a file')
  .option('-u, --update <fileName>', 'update a file')
  .option('-r, --remove <fileName>', 'remove a file')
  .action(function (path, cmd) {
    console.log(path)
    console.log(cmd.add)
  })

// 必须传入
program
  .command('py <word>')
  .description("拼音转换")
  .option('-a, --add <fileName>', 'add a file')
  .action(function (word) {
    console.log(word, pinyin.getFullChars(word))
  })

// 转换时间
program
  .command('time [word]')
  .description("时间转换！")
  .option('-f, --format [format]', '时间格式')
  .option('-u, --unit', '转换为时间戳')
  .action(function (word = moment(), option) {
    if (option.unit) {
      console.log("获取时间戳：", moment(word).unix())
    } else {
      let format = option.format || "YYYY-MM-DD";
      console.log(moment(word).format(format), option)
    }
  })

// 本地静态文件
program
  .command('static [dir]')
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
    require("./static")(option);
  })


program.parse(process.argv);