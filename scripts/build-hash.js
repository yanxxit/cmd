#!/usr/bin/env node
/**
 * 构建脚本：为 HTML 文件中的 JS/CSS 引用自动添加 hash
 * 
 * 使用方法：
 * node scripts/build-hash.js [目录]
 * 
 * 示例：
 * node scripts/build-hash.js public/web-ide-lite-v2
 * node scripts/build-hash.js public/web-ide-lite-v2 --output dist
 * node scripts/build-hash.js public/web-ide-lite-v2 --version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// 配置
const config = {
  inputDir: '',
  outputDir: '',
  hashLength: 8,
  version: null,
  patterns: ['**/*.html', '**/*.js', '**/*.css'],
  exclude: ['node_modules', 'dist', 'build', '.git']
};

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  let i = 0;
  
  while (i < args.length) {
    const arg = args[i];
    
    if (arg.startsWith('-')) {
      switch (arg) {
        case '-o':
        case '--output':
          config.outputDir = args[++i];
          break;
        case '-v':
        case '--version':
          config.version = args[++i];
          break;
        case '-l':
        case '--length':
          config.hashLength = parseInt(args[++i]) || 8;
          break;
        case '-h':
        case '--help':
          showHelp();
          process.exit(0);
        default:
          console.error(`未知参数：${arg}`);
          process.exit(1);
      }
    } else if (!config.inputDir) {
      config.inputDir = arg;
    }
    
    i++;
  }
  
  if (!config.inputDir) {
    console.error('请指定输入目录');
    showHelp();
    process.exit(1);
  }
  
  // 如果没有指定输出目录，使用输入目录（原地构建）
  if (!config.outputDir) {
    config.outputDir = config.inputDir;
  }
  
  // 转换为绝对路径
  config.inputDir = path.resolve(ROOT_DIR, config.inputDir);
  config.outputDir = path.resolve(ROOT_DIR, config.outputDir);
}

function showHelp() {
  console.log(`
构建脚本：为 HTML 文件中的 JS/CSS 引用自动添加 hash

使用方法:
  node scripts/build-hash.js [目录] [选项]

选项:
  -o, --output <目录>    输出目录（默认：输入目录）
  -v, --version <版本>   使用版本号代替 hash
  -l, --length <长度>    hash 长度（默认：8）
  -h, --help             显示帮助信息

示例:
  node scripts/build-hash.js public/web-ide-lite-v2
  node scripts/build-hash.js public/web-ide-lite-v2 -o dist
  node scripts/build-hash.js public/web-ide-lite-v2 -v 1.0.0
`);
}

// 计算文件 hash
function computeFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex').slice(0, config.hashLength);
}

// 获取版本号（使用 version 或 hash）
function getVersion(filePath) {
  if (config.version) {
    return config.version;
  }
  return computeFileHash(filePath);
}

// 添加 hash 到 URL
function addHashToUrl(url, hash) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}hash=${hash}`;
}

// 解析相对路径
function resolvePath(importPath, basePath) {
  if (importPath.startsWith('http://') || importPath.startsWith('https://') || importPath.startsWith('//')) {
    return null; // 外部资源
  }
  
  if (importPath.startsWith('/')) {
    return path.join(config.outputDir, importPath.slice(1));
  }
  
  return path.join(path.dirname(basePath), importPath);
}

// 处理 HTML 文件
function processHtmlFile(filePath, content) {
  let modified = false;
  
  // 处理 <script type="module" src="...">
  content = content.replace(/<script([^>]*)\s+src=["']([^"']+\.js)["']([^>]*)>/g, (match, before, src, after) => {
    const resolvedPath = resolvePath(src, filePath);
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return match;
    }
    
    const hash = getVersion(resolvedPath);
    const newSrc = addHashToUrl(src, hash);
    modified = true;
    console.log(`  [HTML] ${src} -> ${newSrc}`);
    return `<script${before} src="${newSrc}"${after}>`;
  });
  
  // 处理 <script src="..."> (非 module)
  content = content.replace(/<script([^>]*)\s+src=["']([^"']+\.js)["']([^>]*)>/g, (match, before, src, after) => {
    if (match.includes('type="module"')) {
      return match; // 已处理
    }
    
    const resolvedPath = resolvePath(src, filePath);
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return match;
    }
    
    const hash = getVersion(resolvedPath);
    const newSrc = addHashToUrl(src, hash);
    modified = true;
    console.log(`  [HTML] ${src} -> ${newSrc}`);
    return `<script${before} src="${newSrc}"${after}>`;
  });
  
  // 处理 <link rel="stylesheet" href="...">
  content = content.replace(/<link([^>]*)\s+href=["']([^"']+\.css)["']([^>]*)>/g, (match, before, href, after) => {
    const resolvedPath = resolvePath(href, filePath);
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return match;
    }
    
    const hash = getVersion(resolvedPath);
    const newHref = addHashToUrl(href, hash);
    modified = true;
    console.log(`  [HTML] ${href} -> ${newHref}`);
    return `<link${before} href="${newHref}"${after}>`;
  });
  
  // 处理 <img src="...">
  content = content.replace(/<img([^>]*)\s+src=["']([^"']+\.(?:png|jpg|jpeg|gif|svg|webp))["']([^>]*)>/g, (match, before, src, after) => {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//') || src.startsWith('data:')) {
      return match;
    }
    
    const resolvedPath = resolvePath(src, filePath);
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return match;
    }
    
    const hash = getVersion(resolvedPath);
    const newSrc = addHashToUrl(src, hash);
    modified = true;
    console.log(`  [HTML] ${src} -> ${newSrc}`);
    return `<img${before} src="${newSrc}"${after}>`;
  });
  
  return { content, modified };
}

// 处理 JS 文件中的 import 语句
function processJsFile(filePath, content) {
  let modified = false;
  
  // 处理 import ... from "..."
  content = content.replace(/import\s+([\s\S]*?)\s+from\s+(['"])([^'"]+)\2/g, (match, imports, quote, importPath) => {
    const resolvedPath = resolvePath(importPath, filePath);
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return match;
    }
    
    const hash = getVersion(resolvedPath);
    const newImport = addHashToUrl(importPath, hash);
    modified = true;
    console.log(`  [JS] ${importPath} -> ${newImport}`);
    return `import ${imports} from ${quote}${newImport}${quote}`;
  });
  
  // 处理 import("...") 动态导入
  content = content.replace(/import\s*\(\s*(['"])([^'"]+)\1\s*\)/g, (match, quote, importPath) => {
    const resolvedPath = resolvePath(importPath, filePath);
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return match;
    }
    
    const hash = getVersion(resolvedPath);
    const newImport = addHashToUrl(importPath, hash);
    modified = true;
    console.log(`  [JS] ${importPath} -> ${newImport}`);
    return `import('${newImport}')`;
  });
  
  return { content, modified };
}

// 遍历目录
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    if (config.exclude.includes(file)) {
      continue;
    }
    
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      walkDir(filePath, callback);
    } else if (stats.isFile()) {
      callback(filePath);
    }
  }
}

// 主函数
function main() {
  parseArgs();
  
  console.log('\n🔨 开始构建...\n');
  console.log(`输入目录：${config.inputDir}`);
  console.log(`输出目录：${config.outputDir}`);
  console.log(`Hash 长度：${config.hashLength}`);
  console.log(`版本号：${config.version || '(使用文件 hash)'}`);
  console.log();
  
  if (!fs.existsSync(config.inputDir)) {
    console.error(`输入目录不存在：${config.inputDir}`);
    process.exit(1);
  }
  
  // 如果输出目录不同，先复制文件
  if (config.inputDir !== config.outputDir) {
    console.log('复制文件到输出目录...');
    fs.cpSync(config.inputDir, config.outputDir, { recursive: true, force: true });
  }
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  // 处理所有文件
  walkDir(config.outputDir, (filePath) => {
    processedCount++;
    const relativePath = path.relative(config.outputDir, filePath);
    
    try {
      if (filePath.endsWith('.html')) {
        console.log(`[HTML] ${relativePath}`);
        const content = fs.readFileSync(filePath, 'utf8');
        const { content: newContent, modified } = processHtmlFile(filePath, content);
        if (modified) {
          fs.writeFileSync(filePath, newContent, 'utf8');
          modifiedCount++;
        }
      } else if (filePath.endsWith('.js')) {
        console.log(`[JS] ${relativePath}`);
        const content = fs.readFileSync(filePath, 'utf8');
        const { content: newContent, modified } = processJsFile(filePath, content);
        if (modified) {
          fs.writeFileSync(filePath, newContent, 'utf8');
          modifiedCount++;
        }
      }
    } catch (error) {
      console.error(`  处理失败：${error.message}`);
    }
  });
  
  console.log();
  console.log('✅ 构建完成!');
  console.log(`   处理文件：${processedCount}`);
  console.log(`   修改文件：${modifiedCount}`);
  console.log();
}

// 运行
main();
