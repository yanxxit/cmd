import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'ds', 'data');
const DICT_REPO = 'https://github.com/fxsjy/diaosi.git';

/**
 * 初始化词典数据
 * 从 GitHub 下载 endict.txt 文件
 */
export async function initDictionary(options = {}) {
  const spinner = ora();
  const verbose = options.verbose || false;
  
  try {
    // 确保数据目录存在
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    const targetPath = path.join(DATA_DIR, 'endict.txt');
    
    // 检查文件是否已存在
    if (fs.existsSync(targetPath)) {
      console.log(chalk.yellow('⚠️  词典文件已存在'));
      console.log(chalk.gray(`路径：${targetPath}`));
      console.log(chalk.gray('如需重新下载，请先删除现有文件'));
      return;
    }
    
    console.log(chalk.cyan('📥 开始下载词典数据...'));
    console.log(chalk.gray(`仓库：${DICT_REPO}`));
    console.log(chalk.gray(`目标：${targetPath}\n`));
    
    // 方法 1: 使用 git sparse-checkout 下载单个文件
    try {
      spinner.text = '正在克隆仓库...';
      spinner.start();
      
      const tempDir = path.join(DATA_DIR, '.temp-diaosi');
      
      // 清理可能存在的旧临时目录
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      
      // 克隆仓库
      if (verbose) {
        console.log(chalk.gray(`执行：git clone --depth 1 ${DICT_REPO} ${tempDir}`));
      }
      
      execSync(`git clone --depth 1 ${DICT_REPO} ${tempDir}`, {
        stdio: verbose ? 'inherit' : 'pipe'
      });
      
      spinner.text = '正在复制词典文件...';
      
      const sourceFile = path.join(tempDir, 'endict.txt');
      if (!fs.existsSync(sourceFile)) {
        throw new Error('未找到 endict.txt 文件');
      }
      
      // 复制文件
      fs.copyFileSync(sourceFile, targetPath);
      
      // 清理临时目录
      spinner.text = '正在清理临时文件...';
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      spinner.succeed('词典数据下载完成');
      
    } catch (cloneError) {
      // 方法 2: 如果 git 克隆失败，尝试直接下载
      spinner.stop();
      console.log(chalk.yellow('⚠️  Git 克隆失败，尝试直接下载...'));
      
      if (verbose) {
        console.log(chalk.gray(`错误：${cloneError.message}`));
      }
      
      // 使用 curl 或 wget 下载
      const downloadUrl = 'https://raw.githubusercontent.com/fxsjy/diaosi/master/endict.txt';
      
      try {
        spinner.text = '正在下载文件...';
        spinner.start();
        
        if (process.platform === 'win32') {
          // Windows: 使用 PowerShell
          execSync(`powershell -Command "Invoke-WebRequest -Uri '${downloadUrl}' -OutFile '${targetPath}'"`, {
            stdio: verbose ? 'inherit' : 'pipe'
          });
        } else {
          // Unix: 使用 curl
          execSync(`curl -L -o ${targetPath} ${downloadUrl}`, {
            stdio: verbose ? 'inherit' : 'pipe'
          });
        }
        
        spinner.succeed('词典数据下载完成');
        
      } catch (downloadError) {
        spinner.fail('下载失败');
        throw new Error(`无法下载词典文件：${downloadError.message}`);
      }
    }
    
    // 显示统计信息
    const stats = fs.statSync(targetPath);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(chalk.green('\n✅ 初始化完成！'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray(`文件路径：${chalk.cyan(targetPath)}`));
    console.log(chalk.gray(`文件大小：${chalk.cyan(sizeInMB + ' MB')}`));
    console.log(chalk.gray(`最后修改：${chalk.cyan(stats.mtime.toLocaleString())}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray('\n使用方法:'));
    console.log(chalk.gray('  ds lookup <word>     - 查询单词'));
    console.log(chalk.gray('  ds cli               - 交互式命令行'));
    console.log(chalk.gray('  ds serve             - 启动 Web 服务器'));
    console.log('');
    
  } catch (error) {
    if (spinner.isSpinning) spinner.fail();
    console.error(chalk.red('\n❌ 初始化失败:'), error.message);
    
    if (verbose) {
      console.error(chalk.gray(error.stack));
    }
    
    console.error(chalk.yellow('\n提示:'));
    console.error(chalk.gray('  1. 确保已安装 Git'));
    console.error(chalk.gray('  2. 检查网络连接'));
    console.error(chalk.gray('  3. 使用 -v 参数查看详细错误信息'));
    console.error(chalk.gray('  4. 或手动下载文件到上述路径'));
    
    process.exit(1);
  }
}

/**
 * 检查词典数据是否存在
 */
export function checkDictionaryExists() {
  const targetPath = path.join(DATA_DIR, 'endict.txt');
  return fs.existsSync(targetPath);
}

/**
 * 获取词典文件信息
 */
export function getDictionaryInfo() {
  const targetPath = path.join(DATA_DIR, 'endict.txt');
  
  if (!fs.existsSync(targetPath)) {
    return null;
  }
  
  const stats = fs.statSync(targetPath);
  return {
    path: targetPath,
    size: stats.size,
    sizeMB: (stats.size / 1024 / 1024).toFixed(2),
    modified: stats.mtime
  };
}

export default {
  initDictionary,
  checkDictionaryExists,
  getDictionaryInfo
};
