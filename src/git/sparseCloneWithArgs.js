#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { program } = require('commander');

// 定义命令行选项
program
  .version('1.0.0')
  .description('Git 稀疏检出工具 - 允许从远程仓库拉取特定文件或目录')
  .option('-u, --repo-url <url>', '远程仓库地址', 'https://gitee.com/yanxxit/conf.git')
  .option('-b, --branch <branch>', '分支名称', 'main')
  .option('-t, --target-path <path>', '想要拉取的特定文件或文件夹名', 'vim')
  .option('-d, --local-dir <dir>', '本地文件夹名称') // 移除默认值，稍后处理
  .option('-o, --output-dir <dir>', '最终输出目录，默认为当前脚本执行位置', process.cwd())
  .option('-v, --verbose', '显示详细输出')
  .parse();

const options = program.opts();

// 处理本地目录默认值 - 如果未指定，则根据仓库URL生成
if (!options.localDir) {
  const repoName = options.repoUrl.split('/').pop().replace(/\.git$/, '');
  options.localDir = path.join(os.tmpdir(), repoName);
}

// 最终输出目录，默认为当前脚本执行位置
if (!options.outputDir || options.outputDir === '.') {
  options.outputDir = process.cwd();
}


/**
 * 执行 Shell 命令的辅助函数
 * @param {string} command
 * @param {Object} execOptions
 */
function runCommand(command, execOptions = {}) {
  try {
    if (options.verbose) {
      console.log(`\x1b[36m$ ${command}\x1b[0m`); // 浅蓝色打印命令
    }
    execSync(command, { stdio: 'inherit', ...execOptions });
  } catch (error) {
    console.error(`\x1b[31m❌ 命令执行失败: ${command}\x1b[0m`);
    process.exit(1);
  }
}

/**
 * 主函数
 */
function main() {
  const { repoUrl, branch, targetPath, localDir, outputDir, verbose } = options;

  if (verbose) {
    console.log('🚀 开始初始化本地仓库...');
    console.log('配置信息:');
    console.log(`  - 仓库URL: ${repoUrl}`);
    console.log(`  - 分支: ${branch}`);
    console.log(`  - 目标路径: ${targetPath}`);
    console.log(`  - 本地目录: ${localDir}`);
    console.log(`  - 输出目录: ${outputDir}`);
  } else {
    console.log(`🚀 开始从 ${repoUrl} 拉取 ${targetPath}，并将结果输出到 ${outputDir} ...`);
  }

  // 1. 检查并处理本地文件夹
  const resolvedLocalDir = path.resolve(localDir); // 获取绝对路径以提高跨平台兼容性
  if (fs.existsSync(resolvedLocalDir)) {
    console.log(`⚠️  目录 ${resolvedLocalDir} 已存在，正在删除...`);
    // 使用 fs.rm 同步删除目录及其内容
    fs.rmSync(resolvedLocalDir, { recursive: true, force: true });
  }

  // 创建新的本地目录
  runCommand(`mkdir -p ${resolvedLocalDir}`);

  // 在 Node.js 中，我们需要显式地更改工作目录，以便后续命令在正确的目录下执行
  process.chdir(resolvedLocalDir);
  if (verbose) {
    console.log(`📁 进入目录: ${path.resolve('.')}`);
  }

  // 2. 初始化 Git 仓库
  runCommand('git init');

  // 删除已有的远程仓库（如果存在）
  try {
    execSync('git remote remove origin', { stdio: 'pipe' });
  } catch (error) {
    // 如果没有远程仓库，忽略错误
  }

  // 3. 添加远程仓库并拉取对象信息
  if (verbose) {
    console.log('\n🔗 添加远程仓库...');
  }
  runCommand(`git remote add origin ${repoUrl}`);
  runCommand('git fetch origin');

  // 4. 开启稀疏检出模式
  if (verbose) {
    console.log('\n⚙️ 配置稀疏检出...');
  }
  runCommand('git config core.sparsecheckout true');

  // 5. 写入 .git/info/sparse-checkout 配置
  // 注意：.git 是隐藏文件夹，需要确保路径正确
  const sparsePath = path.join('.git', 'info', 'sparse-checkout');

  try {
    // 确保 .git/info 目录存在
    if (!fs.existsSync(path.join('.git', 'info'))) {
      fs.mkdirSync(path.join('.git', 'info'), { recursive: true });
    }
    // 写入配置文件
    fs.writeFileSync(sparsePath, targetPath);
    if (verbose) {
      console.log(`📝 已写入配置: ${targetPath} -> ${sparsePath}`);
    }
  } catch (err) {
    console.error('\x1b[31m❌ 写入配置文件失败:\x1b[0m', err);
    process.exit(1);
  }

  // 6. 执行拉取
  if (verbose) {
    console.log(`\n📥 正在拉取 ${targetPath} ...`);
  } else {
    console.log(`📥 正在拉取 ${targetPath} ...`);
  }
  runCommand(`git pull origin ${branch}`);

  // 7. 确保稀疏检出的文件被正确检出
  if (verbose) {
    console.log(`\n🔄 检出稀疏文件...`);
  }
  // 使用 git read-tree 命令来强制应用稀疏检出规则
  runCommand('git read-tree -m -u HEAD');

  // 8. 将拉取的文件移动到指定的输出目录
  const resolvedOutputDir = path.resolve(outputDir);
  if (verbose) {
    console.log(`\n📂 准备将文件从 ${resolvedLocalDir} 移动到 ${resolvedOutputDir} ...`);
  }

  // 确保输出目录存在
  if (!fs.existsSync(resolvedOutputDir)) {
    fs.mkdirSync(resolvedOutputDir, { recursive: true });
    if (verbose) {
      console.log(`📁 创建输出目录: ${resolvedOutputDir}`);
    }
  }

  // 检查目标路径是否为文件还是目录
  const sourcePath = path.join(resolvedLocalDir, targetPath);
  const destPath = path.join(resolvedOutputDir, path.basename(targetPath));

  if (fs.existsSync(sourcePath)) {
    // 如果源路径存在，则复制到目标路径
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // 如果是目录，递归复制整个目录
      copyDirectory(sourcePath, destPath);
      if (verbose) {
        console.log(`📁 目录已复制: ${sourcePath} -> ${destPath}`);
      }
    } else {
      // 如果是文件，直接复制文件
      fs.copyFileSync(sourcePath, destPath);
      if (verbose) {
        console.log(`📄 文件已复制: ${sourcePath} -> ${destPath}`);
      }
    }
  } else {
    console.warn(`⚠️  目标路径 ${sourcePath} 不存在，可能在稀疏检出中未包含该路径`);
  }

  console.log('\n\x1b[32m✅ 完成！指定内容已下载并移动到目标位置。\x1b[0m');
}

/**
 * 递归复制目录的辅助函数
 * @param {string} srcDir 源目录
 * @param {string} destDir 目标目录
 */
function copyDirectory(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const files = fs.readdirSync(srcDir);

  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 检查是否安装了 commander
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