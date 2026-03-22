#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import OpenAI from 'openai';
import path from 'path';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * 检查 API Key 是否设置
 */
function checkApiKey() {
  const apiKey = process.env['HUNYUAN_API_KEY'];
  if (!apiKey) {
    console.error(chalk.red('错误：未设置 HUNYUAN_API_KEY 环境变量'));
    console.error(chalk.yellow('提示：请在项目根目录创建 .env 文件并设置 HUNYUAN_API_KEY'));
    console.error(chalk.gray('示例：HUNYUAN_API_KEY=sk-xxxxx'));
    process.exit(1);
  }
  return apiKey;
}

/**
 * 获取暂存区的变更文件
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

/**
 * 获取工作区的变更文件
 */
function getUnstagedFiles() {
  try {
    const output = execSync('git diff --name-only', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    return [];
  }
}

/**
 * 获取所有变更文件（包括暂存区和工作区）
 */
function getAllChangedFiles() {
  try {
    // 获取已跟踪文件的变更
    const output = execSync('git diff --name-only', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const modified = output.trim().split('\n').filter(Boolean);

    // 获取暂存区文件
    const stagedOutput = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const staged = stagedOutput.trim().split('\n').filter(Boolean);

    // 获取未跟踪的文件（新文件）
    const untrackedOutput = execSync('git ls-files --others --exclude-standard', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const untracked = untrackedOutput.trim().split('\n').filter(Boolean);

    // 合并并去重
    return [...new Set([...modified, ...staged, ...untracked])];
  } catch (error) {
    return [];
  }
}

/**
 * 获取暂存区的变更内容
 */
function getStagedDiff() {
  try {
    return execSync('git diff --cached', {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error) {
    return '';
  }
}

/**
 * 获取工作区的变更内容
 */
function getUnstagedDiff() {
  try {
    return execSync('git diff', {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error) {
    return '';
  }
}

/**
 * 获取所有变更内容（暂存区 + 工作区 + 新文件）
 */
function getAllDiff() {
  try {
    const staged = getStagedDiff();
    const unstaged = getUnstagedDiff();
    
    // 获取新文件内容
    let newFilesContent = '';
    try {
      const newFiles = execSync('git ls-files --others --exclude-standard', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim().split('\n').filter(Boolean);
      
      for (const file of newFiles) {
        try {
          const content = execSync(`cat "${file}"`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
          });
          newFilesContent += `diff --git a/${file} b/${file}\nnew file mode 100644\n+++ b/${file}\n@@ -0,0 +1 @@\n${content}\n\n`;
        } catch (e) {
          // 忽略读取错误
        }
      }
    } catch (e) {
      // 忽略错误
    }
    
    return staged + (unstaged ? '\n' + unstaged : '') + (newFilesContent ? '\n' + newFilesContent : '');
  } catch (error) {
    return '';
  }
}

/**
 * 根据文件类型推断 scope
 */
function inferScope(files) {
  if (!files || files.length === 0) return '';
  
  const scopeMap = {
    'src/': 'core',
    'test/': 'test',
    'tests/': 'test',
    'docs/': 'docs',
    'bin/': 'cli',
    'public/': 'ui',
    'components/': 'ui',
    'pages/': 'ui',
    'styles/': 'style',
    'css/': 'style',
    '.github/': 'ci',
    'config/': 'config',
    'scripts/': 'build'
  };
  
  const scopeCount = {};
  for (const file of files) {
    for (const [prefix, scope] of Object.entries(scopeMap)) {
      if (file.startsWith(prefix)) {
        scopeCount[scope] = (scopeCount[scope] || 0) + 1;
      }
    }
  }
  
  let maxScope = '';
  let maxCount = 0;
  for (const [scope, count] of Object.entries(scopeCount)) {
    if (count > maxCount) {
      maxCount = count;
      maxScope = scope;
    }
  }
  
  return maxScope;
}

/**
 * 获取最近的提交历史
 */
function getRecentCommits(limit = 5) {
  try {
    return execSync(`git log -${limit} --oneline --no-merges`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error) {
    return '';
  }
}

/**
 * 精简 diff 内容，提取关键信息
 */
function simplifyDiff(diff, maxLines = 80) {
  if (!diff) return '';
  
  const lines = diff.split('\n');
  const importantLines = [];
  let currentFileLines = 0;
  const maxLinesPerFile = 30;
  
  for (const line of lines) {
    if (line.startsWith('diff --git') || 
        line.startsWith('+++') || 
        line.startsWith('---') ||
        line.startsWith('+') || 
        line.startsWith('-')) {
      
      if (line.startsWith('diff --git')) {
        currentFileLines = 0;
      }
      
      if (currentFileLines < maxLinesPerFile) {
        importantLines.push(line);
        currentFileLines++;
      }
    }
  }
  
  return importantLines.slice(0, maxLines).join('\n');
}

/**
 * 生成符合 Conventional Commits 规范的提交信息
 */
async function generateCommitMessage(diff, files, recentCommits) {
  const apiKey = checkApiKey();
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.hunyuan.cloud.tencent.com/v1"
  });

  const fileList = files.slice(0, 8).join('\n');
  const moreFiles = files.length > 8 ? `\n... 等共 ${files.length} 个文件` : '';
  
  const scope = inferScope(files);
  const scopeText = scope ? `(scope 可选：${scope})` : '';

  const simplifiedDiff = simplifyDiff(diff);

  const prompt = `根据 Git 变更生成 commit message，符合 Conventional Commits 规范。
要求：
- 格式：<type>(<scope>): <subject>，${scopeText}
- type: feat/fix/docs/style/refactor/test/chore/perf/ci/build
- 中文描述，简洁直观，不超过 50 字符
- 只返回 commit message，不要其他内容

变更文件 (${files.length}个):
${fileList}${moreFiles}

变更内容:
${simplifiedDiff}

只返回一行 commit message。`;

  try {
    const response = await client.chat.completions.create({
      model: "hunyuan-lite",
      messages: [
        { role: "system", content: "你是 Git 提交助手，生成符合 Conventional Commits 规范的 commit message。只返回结果，不要解释。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 80
    });

    let message = response.choices[0].message.content.trim();
    
    // 清理可能的多余内容
    message = message.replace(/^["']|["']$/g, '')
                     .replace(/^[`*]+\s*|\s*[`*]+$/g, '')
                     .replace(/^(commit|message|提交)[:：]?\s*/i, '');
    
    // 验证格式
    const commitPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\([^)]+\))?:\s*.+/;
    if (!commitPattern.test(message)) {
      message = `feat: ${message.replace(/^[^:]+:\s*/, '')}`;
    }
    
    return message;
  } catch (error) {
    throw new Error(`AI 调用失败：${error.message}`);
  }
}

// 配置 Commander.js
program
  .name('x-git-commit')
  .description('根据当前变更生成符合规范的 git commit 总结')
  .version('1.0.0')
  .option('-s, --staged', '仅使用暂存区的变更（默认）')
  .option('-a, --all', '使用所有工作区的变更（暂存区 + 工作区）')
  .option('-c, --copy', '生成后自动复制到剪贴板')
  .option('-v, --verbose', '显示详细信息')
  .option('--no-api', '不使用 AI，仅显示变更文件列表')
  .action(async (options) => {
    const spinner = ora();

    try {
      // 检查是否在 Git 仓库中
      try {
        execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      } catch (error) {
        console.error(chalk.red('错误：当前目录不是 Git 仓库'));
        process.exit(1);
      }

      spinner.text = '正在分析变更...';
      spinner.start();

      // 获取变更信息
      let files = [];
      let diff = '';

      // 默认使用暂存区，除非明确指定了 --all
      const useStaged = options.staged || !options.all;

      if (useStaged) {
        // 暂存区变更
        files = getStagedFiles();
        diff = getStagedDiff();

        if (files.length === 0) {
          spinner.warn('暂存区没有变更');
          console.log(chalk.yellow('提示：使用 git add 添加文件到暂存区，或使用 -a 参数查看所有变更'));
          return;
        }
      } else {
        // 所有变更（暂存区 + 工作区）
        files = getAllChangedFiles();
        diff = getAllDiff();

        if (files.length === 0) {
          spinner.warn('没有任何变更');
          return;
        }
      }

      if (options.verbose) {
        spinner.stop();
        console.log(chalk.cyan('\n变更文件:'));
        files.forEach(file => console.log(`  - ${file}`));
        console.log('');
        spinner.start('正在生成提交信息...');
      }

      // 不使用 AI 模式
      if (options.noApi) {
        spinner.stop();
        console.log(chalk.cyan('\n变更统计:'));
        console.log(chalk.gray(`  文件数：${files.length}`));
        console.log(chalk.gray(`  提示：使用 -s 或 -a 参数生成 commit message\n`));
        return;
      }

      // 获取最近提交历史
      const recentCommits = getRecentCommits(3);

      // 生成提交信息
      const commitMessage = await generateCommitMessage(diff, files, recentCommits);

      spinner.succeed('生成完成');

      // 显示结果
      console.log('\n' + chalk.green('📝 建议的 commit message:'));
      console.log(chalk.cyan('='.repeat(50)));
      console.log(chalk.white(commitMessage));
      console.log(chalk.cyan('='.repeat(50)));

      // 复制到剪贴板
      if (options.copy) {
        try {
          if (process.platform === 'darwin') {
            execSync(`echo "${commitMessage}" | pbcopy`);
          } else if (process.platform === 'win32') {
            execSync(`echo ${commitMessage} | clip`);
          } else {
            try {
              execSync(`echo "${commitMessage}" | xclip -selection clipboard`);
            } catch (e) {
              console.log(chalk.yellow('⚠ 无法复制到剪贴板（需要安装 xclip）'));
            }
          }
          console.log(chalk.green('✓ 已复制到剪贴板'));
        } catch (error) {
          console.log(chalk.yellow('⚠ 复制失败，请手动复制'));
        }
      }

      // 提示如何使用
      console.log('\n' + chalk.gray('使用方法:'));
      console.log(`  git commit -m "${commitMessage}"`);

      if (options.copy) {
        console.log('  或直接粘贴：git commit -m "<Cmd+V>"');
      }
      console.log('');

    } catch (error) {
      if (spinner.isSpinning) {
        spinner.fail();
      }
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

program.parse();
