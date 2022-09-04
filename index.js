#!/usr/bin/env node
const program = require("commander");
const moment = require("moment");
const chalk = require("chalk");
const path = require("path");
const os = require("os");
const pinyin = require("js-pinyin");
const crypto = require("crypto");
const fs = require('fs');
const calendar = require('./lib/calendar');


function createHash(text, hashtype) {
  const hash = crypto.createHash(hashtype).update(text).digest("hex");
  console.log(hashtype, hash, hash.length);
}

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

program
  .command('md5 <word>')
  .description("MD5")
  .option('-s, --string', 'string')
  .action(function (word, options) {
    if (options.string) {
      createHash(word, "md5");
      return
    }

    let stat = "";
    if (path.isAbsolute(word)) {
      stat = fs.existsSync(word)
    } else {
      stat = fs.existsSync(path.join(__dirname, word))
    }

    if (stat) {
      //从文件创建一个可读流
      var stream = fs.createReadStream(word);
      var fsHash = crypto.createHash('md5');

      stream.on('data', function (d) {
        fsHash.update(d);
      });

      stream.on('end', function () {
        var md5 = fsHash.digest('hex');
        console.log("文件的MD5是：%s", md5);
      });
    } else {
      createHash(word, "md5");
    }
  })

program
  .command('sha256 <word>')
  .description("sha256")
  .option('-f, --file <fileName>', 'a file')
  .action(function (word) {
    createHash(word, "sha256");
  })

program
  .command('sha512 <word>')
  .description("sha512")
  .option('-f, --file <fileName>', 'a file')
  .action(function (word) {
    createHash(word, "sha512");
  })

program
  .command('cal')
  .description("cal")
  // .option('-f, --file <fileName>', 'a file')
  .action(function () {
    calendar.showCalendar()
  })


// 转换时间
program
  .command('time [word]')
  .description("时间转换！")
  .option('-f, --format [format]', '时间格式')
  .option('-u, --unix', '转换为时间戳')
  .action(function (word, option) {
    if (!word) {
      console.log("获取时间戳：", moment().format("YYYY-MM-DD HH:mm:ss"))
    } else if (option.unix) {
      console.log("获取时间戳：", moment(word).unix())
    } else if (option.format) {
      let format = option.format || "YYYY-MM-DD";
      console.log(moment(word).format(format), option)
    } else if (word && [10, 13].includes(word.length)) {
      if (word.length === 10) console.log("显示时间：", moment(word * 1000).format("YYYY-MM-DD HH:mm:ss"))
      if (word.length === 13) console.log("显示时间：", moment(word).format("YYYY-MM-DD HH:mm:ss"))
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