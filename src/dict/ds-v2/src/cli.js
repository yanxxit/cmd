import Dictionary from './dictionary.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function startCLI() {
  console.log('屌丝词典 v2 - 交互模式');
  console.log('输入单词查询释义，输入 "quit" 或 "exit" 退出\n');
  
  const dict = new Dictionary();

  rl.setPrompt('> ');
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
      console.log('再见！');
      rl.close();
      await dict.close(); // 确保关闭数据库连接
      return;
    }

    if (input) {
      try {
        const result = await dict.lookupResult(input);
        if (result) {
          console.log(result);
        } else {
          console.log(`${input}: 未找到`);
        }
      } catch (error) {
        console.error('查询出错:', error.message);
      }
    }

    console.log(); // 添加空行
    rl.prompt();
  }).on('close', async () => {
    await dict.close(); // 确保关闭数据库连接
    process.exit(0);
  });
}

export default startCLI;