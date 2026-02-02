#!/usr/bin/env node
import { program } from "commander";
import moment from "dayjs";
import chalk from "chalk";
import path from "path";
import os from "os";
import pinyin from "js-pinyin";
import crypto from "crypto";
import fs from 'fs';
import { fileURLToPath } from 'url';
import calendar from './src/calendar.js';
import initAction from './src/github/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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
  .action(initAction)

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
  .command('json <word>')
  .description("json 数据转换")
  // .option('-f, --file <fileName>', 'a file')
  .action(function (word) {
    let data = jsonlib.stringToJSON(word)
    console.log(JSON.stringify(data, null, 2))
  })

// node index.js json "{a:1,b:true,c:{a:1},e:'hello world'}"  
program
  .command('cal')
  .description("cal")
  .option('-y, --year', '年度日历')
  .option('-m, --month <month>', '指定月份')
  .option('-t, --three', '最近三个月的日历')
  .action(function (options) {
    if (options.year) {
      calendar.getCurrentYearCalendars()
    } else if (options.three) {
      calendar.getCurrentThreeCalendars()
    } else if (options.month) {
      calendar.getCalendarByMonth(options.month)
    } else {
      calendar.getCalendarByMonth()
    }
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


program.parse(process.argv);