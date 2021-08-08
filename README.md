# cmd xtools
node.js 命令行工具

### 安装

```sh
npm i
```

### command 添加命令名称

该方法允许使用命令行去执行一段命令，也就是一段：

```js
var program = require('commander');

program
  .version('0.0.1', '-V, --version')
  .command('rm <dir>')
  .action(function (dir, cmd) {    console.log('remove ' + dir + (cmd.recursive ? ' recursively' : ''))
  });

program.parse(process.argv);//  执行命令//  node index rm /aaa -r//  输出结果//  remove /aaa recursively     即：代码中console内容
```

`command`函数接收三个参数：

1. 命令名称`必须`：命令后面可跟用`<>`或`[]`包含的参数；命令的最后一个参数可以是可变的，像实例中那样在数组后面加入`...`标志；在命令后面传入的参数会被传入到`action`的回调函数以及`program.args`数组中。
2. 命令描述`可省略`：如果存在，且没有显示调用`action(fn)`，就会启动子命令程序，否则会报错
3. 配置选项`可省略`：可配置`noHelp、isDefault`等

使执行命令时，将验证该命令的`options`，任何未知的`option`都将报错。但是，如果基于`action`的命令如果没有定义`action`，则不验证`options`。

### 自定义事件侦听器

用于捕获`option`与`command`，当其被使用贼会被触发函数。

```js
var program = require('commander');

program
  .version('0.0.1', '-V, --version')
  .command('rm <dir>',"arg is description")
  .option('-r, --recursive', 'Remove recursively')
  .option('-g, --git [type]', 'Add [marble]', 'Angie')
  .option('-a, --am',"ampm")
  .action(() => {    console.log(123)
  });
program.on('option:am', function () {  
    console.log("on:am")
});
program.on('option:recursive', function () {  
    console.log("option:recursive")
});
program.on('command:rm', function () {  
    console.log("command:rm")
});
program.on('option:git', function () {  
    console.log("option:git")
});
program.on('command:*', function () {  
    console.log(987)  
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
});
program.on('--help', function() {  
    console.log('****************');  
    console.log('Examples:');  
    console.log('****************');  
    console.log('  $ deploy exec sequential');  
    console.log('  $ deploy exec async');
});
program.parse(process.argv);
```

分别执行`command`和`option`，会依次触发对应的函数，但是`command:*`具体是什么时候触发的？

1. `command`和`option`已经定义但是没有进行事件捕获时会触发
2. 规定参数或没有参数时，传入了参数也会触发该函数
3. 没有该命令

以上情况就会触发`command:*`对应的事件，`option:`紧紧跟随的是`option`的长名。才会捕获到该事件。



### 版本选项 option

调用版本会默认将-V和--version选项添加到命令中。当存在这些选项中的任何一个时，该命令将打印版本号并退出。

### helpOption 帮助
提供帮助信息

### description 命令描述
作用：命令的描述性语句

**参数说明**

- 命令的描述

**使用**

```js
// index.js
const program = require('commander');

program
	.version('1.0.0')
	.description('It is my cli')
  .parse(process.argv);
```



### action方法

作用：定义命令的回调函数

**参数说明：**

- 回调函数

### parse方法

作用：用于解析process.argv，设置options以及触发commands

参数说明：

- process.argv



### 本地开发

```js
npm link
```
接下来剩下的就是测试了，对于测试来说不需要把安装包推到`npm`中，`npm`为了方便，提供了`npm link`命令，可以实现`预发布`。在项目根目录中使用`npm link`没有报错的话，就说明推送成功了。现在就可以在全局中使用`q-init`了。

在全局中使用`initP -h`命令，能够输出所编译的`help`信息就说明可以初始化项目了。

