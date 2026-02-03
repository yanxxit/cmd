import figlet from 'figlet';
import clear from "clear";
import chalk from "chalk";
import { clone } from "./down.js";
import child_process from 'child_process';
import shell from 'shelljs';

/**
 * 封装打印方法
 */
const log = content => {
  console.log(
    chalk.green(content)
  );
}

/**
 * 子进程监控依赖安装，合并到主进程控制台
 */
const spawn = async (...args) => {

  return new Promise(resolve => {
    const proc = child_process.spawn(...args)
    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)
    proc.on('close', () => {
      resolve()
    })
  })
}

export default async name => {
  log('创建项目' + name);
  clear();
  const data = await figlet.text("welcome cmd");
  log(data);
  // await clone('github:su37josephxia/vue-template', name);
  await clone('direct:https://github.com/shawflying/apidoc-template/archive/refs/heads/master.zip', name);
  // await clone('direct:https://github.com/shawflying/apis-proxy/archive/refs/heads/master.zip', name);
  log('安装依赖');
  // await spawn('npm', ['install'], { cwd: `./${name}` });
  await shell.exec(`cd ./${name} && npm install && node -v`)
  log(chalk.green(`
  👌 安装完成:
To get Start:
===========================
cd ${name}

npm install

npm run serve
===========================
`))
}