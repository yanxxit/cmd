const child_process = require('child_process');
const shell = require('shelljs');


async function main() {
  let name = "public"
  // await child_process.execSync('ls', { cwd: `./${name}` });
  await shell.exec("cd ../public/ && npm -v")
}

main()