#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import OpenAI from 'openai';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 支持的 commit type
const COMMIT_TYPES = [
  { value: 'feat', label: '✨ 新功能', description: '新增功能' },
  { value: 'fix', label: '🐛 Bug 修复', description: '修复问题' },
  { value: 'docs', label: '📝 文档', description: '文档变更' },
  { value: 'style', label: '💄 格式', description: '代码格式调整' },
  { value: 'refactor', label: '♻️ 重构', description: '代码重构' },
  { value: 'perf', label: '🚀 性能', description: '性能优化' },
  { value: 'test', label: '✅ 测试', description: '测试相关' },
  { value: 'build', label: '📦 构建', description: '构建系统/依赖' },
  { value: 'ci', label: '👷 CI', description: 'CI/CD 变更' },
  { value: 'chore', label: '🔧 杂项', description: '其他变更' },
  { value: 'revert', label: '⏪ 回滚', description: '回滚提交' }
];

// 文件路径到 scope 的映射
const SCOPE_MAP = {
  'src/': 'core',
  'lib/': 'core',
  'test/': 'test',
  'tests/': 'test',
  '__tests__/': 'test',
  'docs/': 'docs',
  'bin/': 'cli',
  'public/': 'ui',
  'static/': 'ui',
  'components/': 'ui',
  'pages/': 'ui',
  'views/': 'ui',
  'styles/': 'style',
  'css/': 'style',
  'scss/': 'style',
  '.github/': 'ci',
  'config/': 'config',
  'configs/': 'config',
  'scripts/': 'build',
  'build/': 'build',
  'webpack/': 'build',
  'vite/': 'build'
};

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
    const output = execSync('git diff --name-only', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const modified = output.trim().split('\n').filter(Boolean);

    const stagedOutput = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const staged = stagedOutput.trim().split('\n').filter(Boolean);

    const untrackedOutput = execSync('git ls-files --others --exclude-standard', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const untracked = untrackedOutput.trim().split('\n').filter(Boolean);

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
 * 获取变更统计信息
 */
function getDiffStats(diff) {
  if (!diff) return { additions: 0, deletions: 0, files: 0 };

  const lines = diff.split('\n');
  let additions = 0;
  let deletions = 0;
  let files = 0;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      files++;
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  return { additions, deletions, files: files || diff.split('diff --git').length - 1 };
}

/**
 * 提取文件变更的语义摘要
 * 提取关键的函数名、类名、配置项、API 等实际变更内容
 */
function extractChangeSummary(files, diff) {
  if (!diff || !files.length) return [];

  const summaries = [];
  const lines = diff.split('\n');
  let currentFile = '';
  let fileChanges = {
    additions: [],
    deletions: [],
    functions: [],
    classes: [],
    configKeys: [],
    apiEndpoints: [],
    importantChanges: []
  };

  for (const line of lines) {
    // 检测新文件
    const fileMatch = line.match(/^diff --git a\/.+ b\/(.+)$/);
    if (fileMatch) {
      // 保存上一个文件的摘要
      if (currentFile && (fileChanges.additions.length || fileChanges.deletions.length || fileChanges.importantChanges.length)) {
        summaries.push({
          file: currentFile,
          additions: fileChanges.additions.slice(0, 3),
          deletions: fileChanges.deletions.slice(0, 3),
          functions: fileChanges.functions.slice(0, 5),
          classes: fileChanges.classes.slice(0, 3),
          configKeys: fileChanges.configKeys.slice(0, 5),
          apiEndpoints: fileChanges.apiEndpoints.slice(0, 3),
          importantChanges: fileChanges.importantChanges.slice(0, 5)
        });
      }
      currentFile = fileMatch[1];
      fileChanges = {
        additions: [],
        deletions: [],
        functions: [],
        classes: [],
        configKeys: [],
        apiEndpoints: [],
        importantChanges: []
      };
    }

    // 检测新增的函数定义
    const funcMatch = line.match(/^\+.*(?:function|const|let|var)\s+(\w+)\s*[=\(]/);
    if (funcMatch && line.startsWith('+') && !line.includes('import') && !line.includes('require')) {
      fileChanges.functions.push(funcMatch[1]);
    }

    // 检测新增的类定义
    const classMatch = line.match(/^\+.*class\s+(\w+)/);
    if (classMatch && line.startsWith('+')) {
      fileChanges.classes.push(classMatch[1]);
    }

    // 检测配置项/常量
    const configMatch = line.match(/^\+.*(?:const|let|var)\s+([A-Z_][A-Z0-9_]*)\s*=/);
    if (configMatch && line.startsWith('+')) {
      fileChanges.configKeys.push(configMatch[1]);
    }

    // 检测 API 端点
    const apiMatch = line.match(/^\+.*['"`](\/[a-zA-Z0-9/_-]+)['"`]/);
    if (apiMatch && line.startsWith('+') && (line.includes('get') || line.includes('post') || line.includes('route'))) {
      fileChanges.apiEndpoints.push(apiMatch[1]);
    }

    // 收集有意义的变更（排除 import/export/注释/空白）
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const content = line.substring(1).trim();
      if (content &&
          content.length > 10 &&
          content.length < 150 &&
          !content.startsWith('//') &&
          !content.startsWith('#') &&
          !content.startsWith('import ') &&
          !content.startsWith('export ') &&
          !content.startsWith('from ') &&
          !content.includes('*/') &&
          !content.includes('/*')) {
        fileChanges.importantChanges.push(content);
      }
    }

    // 收集有意义的删除
    if (line.startsWith('-') && !line.startsWith('---')) {
      const content = line.substring(1).trim();
      if (content &&
          content.length > 10 &&
          content.length < 150 &&
          !content.startsWith('//') &&
          !content.startsWith('#') &&
          !content.startsWith('import ') &&
          !content.startsWith('export ') &&
          !content.includes('*/') &&
          !content.includes('/*')) {
        fileChanges.deletions.push(content);
      }
    }
  }

  // 保存最后一个文件
  if (currentFile && (fileChanges.additions.length || fileChanges.deletions.length || fileChanges.importantChanges.length)) {
    summaries.push({
      file: currentFile,
      additions: fileChanges.additions.slice(0, 3),
      deletions: fileChanges.deletions.slice(0, 3),
      functions: fileChanges.functions.slice(0, 5),
      classes: fileChanges.classes.slice(0, 3),
      configKeys: fileChanges.configKeys.slice(0, 5),
      apiEndpoints: fileChanges.apiEndpoints.slice(0, 3),
      importantChanges: fileChanges.importantChanges.slice(0, 5)
    });
  }

  return summaries;
}

/**
 * 生成变更内容摘要文本（用于 AI 提示词）
 */
function generateChangeSummaryText(summaries, maxFiles = 5) {
  if (!summaries || summaries.length === 0) return '';

  const texts = [];
  const shownSummaries = summaries.slice(0, maxFiles);

  for (const summary of shownSummaries) {
    const fileName = summary.file.split('/').pop();
    const parts = [];

    // 新增函数/方法
    if (summary.functions.length > 0) {
      parts.push(`新增函数：${summary.functions.join(', ')}`);
    }

    // 新增类
    if (summary.classes.length > 0) {
      parts.push(`新增类：${summary.classes.join(', ')}`);
    }

    // 新增配置项
    if (summary.configKeys.length > 0) {
      parts.push(`配置：${summary.configKeys.join(', ')}`);
    }

    // 关键变更内容（最有意义的部分）
    if (summary.importantChanges.length > 0) {
      const keyChanges = summary.importantChanges
        .map(s => s.replace(/\s+/g, ' ').substring(0, 60))
        .slice(0, 2);
      if (keyChanges.length > 0) {
        parts.push(`变更：${keyChanges.join('; ')}`);
      }
    }

    // 删除内容（仅显示有意义的）
    if (summary.deletions.length > 0 && summary.deletions[0]) {
      const keyDels = summary.deletions
        .map(s => s.replace(/\s+/g, ' ').substring(0, 40))
        .slice(0, 1);
      if (keyDels.length > 0) {
        parts.push(`删除：${keyDels[0]}...`);
      }
    }

    if (parts.length > 0) {
      texts.push(`${fileName}: ${parts.join(' | ')}`);
    }
  }

  if (summaries.length > maxFiles) {
    texts.push(`... 等共 ${summaries.length} 个文件`);
  }

  return texts.join('\n');
}

/**
 * 根据文件类型推断 scope
 */
function inferScope(files) {
  if (!files || files.length === 0) return '';

  const scopeCount = {};
  for (const file of files) {
    for (const [prefix, scope] of Object.entries(SCOPE_MAP)) {
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
 * 根据变更内容推断 commit type
 */
function inferType(files, diff) {
  const diffLower = diff.toLowerCase();

  // 检查是否有明显的类型特征
  if (diffLower.includes('fix') || diffLower.includes('bug') || diffLower.includes('issue')) {
    return 'fix';
  }
  if (diffLower.includes('test') || diffLower.includes('spec')) {
    return 'test';
  }
  if (diffLower.includes('doc') || diffLower.includes('readme')) {
    return 'docs';
  }
  if (diffLower.includes('style') || diffLower.includes('format')) {
    return 'style';
  }
  if (diffLower.includes('perf') || diffLower.includes('optim')) {
    return 'perf';
  }

  // 根据文件类型推断
  const hasTestFiles = files.some(f => f.includes('test') || f.includes('spec'));
  const hasDocFiles = files.some(f => f.includes('doc') || f.includes('md'));

  if (hasTestFiles && files.length === 1) return 'test';
  if (hasDocFiles && files.length === 1) return 'docs';

  // 默认返回 feat
  return 'feat';
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
 * 获取上次 commit message
 */
function getLastCommitMessage() {
  try {
    return execSync('git log -1 --pretty=%B', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    return '';
  }
}

/**
 * 精简 diff 内容，提取关键信息
 */
function simplifyDiff(diff, maxLines = 60) {
  if (!diff) return '';

  const lines = diff.split('\n');
  const importantLines = [];
  let currentFileLines = 0;
  const maxLinesPerFile = 20;

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
 * 生成优化的提示词（<200 字符）
 * 基于实际变更内容生成有意义的 commit message
 */
function createOptimizedPrompt(files, diff, scope, type, lastCommit) {
  const fileCount = files.length;
  const firstFile = files[0]?.split('/').pop() || 'file';

  // 提取语义摘要
  const summaries = extractChangeSummary(files, diff);
  const changeText = generateChangeSummaryText(summaries, 3);

  // 参考上次 commit 风格
  const refText = lastCommit ? `参考："${lastCommit.substring(0, 25)}"` : '';

  // 构建提示词（<200 字符）
  let prompt = `Conventional Commits，type=${type}。
${fileCount}个文件：${firstFile}${fileCount > 1 ? `等${fileCount}个` : ''}。
${refText}
`;

  if (changeText) {
    // 只取最有价值的变更内容
    const summaryLines = changeText.split('\n');
    const keyInfo = summaryLines.slice(0, 2).join('; ');
    prompt += `变更：${keyInfo.substring(0, 140)}`;
  }

  prompt += '\n中文描述实际变更内容，<60 字，只返回 message';

  return prompt;
}

/**
 * 生成符合 Conventional Commits 规范的提交信息
 */
async function generateCommitMessage(diff, files, lastCommit, options = {}) {
  const apiKey = checkApiKey();
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.hunyuan.cloud.tencent.com/v1"
  });

  const scope = options.scope || inferScope(files);
  const type = options.type || inferType(files, diff);

  const prompt = createOptimizedPrompt(files, diff, scope, type, lastCommit);

  try {
    const response = await client.chat.completions.create({
      model: "hunyuan-lite",
      messages: [
        { role: "system", content: "你是 Git 提交助手。根据实际变更内容生成有意义的中文 commit message，不要编造数字。只返回 message，不要解释。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 100
    });

    let message = response.choices[0].message.content.trim();

    // 清理多余内容
    message = message.replace(/^["']|["']$/g, '')
                     .replace(/^[`*]+\s*|\s*[`*]+$/g, '')
                     .replace(/^(commit|message|提交)[:：]?\s*/i, '');

    // 验证并修复格式
    const commitPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([^)]+\))?:\s*.+/;
    if (!commitPattern.test(message)) {
      const scopePart = scope ? `(${scope})` : '';
      message = `${type}${scopePart}: ${message.replace(/^[^:]+:\s*/, '').substring(0, 80)}`;
    }

    // 确保消息不超过 100 字符
    if (message.length > 100) {
      const prefixMatch = message.match(/^(\w+(\([^)]+\))?:\s*)/);
      if (prefixMatch) {
        const prefix = prefixMatch[1];
        const maxSubjectLength = 100 - prefix.length;
        const subject = message.substring(prefix.length, maxSubjectLength).replace(/[,.!?]$/, '');
        message = prefix + subject;
      }
    }

    return message;
  } catch (error) {
    throw new Error(`AI 调用失败：${error.message}`);
  }
}

/**
 * 交互式选择 type
 */
async function interactiveSelectType() {
  console.log(chalk.cyan('\n选择 commit type:'));
  COMMIT_TYPES.forEach((t, i) => {
    console.log(`  ${chalk.gray(i + 1)}. ${t.label} - ${t.description}`);
  });

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(chalk.yellow('\n请输入序号 (默认 1): '), (answer) => {
      rl.close();
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < COMMIT_TYPES.length) {
        resolve(COMMIT_TYPES[index].value);
      } else {
        resolve('feat');
      }
    });
  });
}

/**
 * 交互式确认 commit message
 */
async function interactiveConfirm(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(chalk.yellow(`\n确认提交？(Y/n/e 编辑): `), (answer) => {
      rl.close();
      const lower = answer.toLowerCase().trim();
      if (lower === 'e' || lower === 'edit') {
        resolve('edit');
      } else if (lower === 'n' || lower === 'no') {
        resolve('no');
      } else {
        resolve('yes');
      }
    });
  });
}

/**
 * 交互式编辑 commit message
 */
async function interactiveEdit(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(chalk.gray('当前:'), chalk.white(message));
    rl.question(chalk.yellow('修改为: '), (answer) => {
      rl.close();
      resolve(answer.trim() || message);
    });
  });
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
  .option('-t, --type <type>', '指定 commit type (feat/fix/docs/style/refactor/test/chore/perf/ci/build/revert)')
  .option('--scope <scope>', '指定 commit scope')
  .option('-i, --interactive', '交互模式（选择 type、确认消息）')
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

      const useStaged = options.staged || !options.all;

      if (useStaged) {
        files = getStagedFiles();
        diff = getStagedDiff();

        if (files.length === 0) {
          spinner.warn('暂存区没有变更');
          console.log(chalk.yellow('提示：使用 git add 添加文件到暂存区，或使用 -a 参数查看所有变更'));
          return;
        }
      } else {
        files = getAllChangedFiles();
        diff = getAllDiff();

        if (files.length === 0) {
          spinner.warn('没有任何变更');
          return;
        }
      }

      // 获取变更统计（仅内部使用，不默认显示）
      const stats = getDiffStats(diff);

      // 不使用 AI 模式
      // 注意：Commander 的 --no-xxx 选项会被解析为 options.xxx = false
      if (options.api === false) {
        if (spinner.isSpinning) spinner.stop();
        console.log(chalk.cyan('\n变更统计:'));
        console.log(chalk.gray(`  文件数：${files.length}`));
        console.log(chalk.gray(`  新增行数：+${stats.additions}`));
        console.log(chalk.gray(`  删除行数：-${stats.deletions}`));
        console.log(chalk.gray(`  提示：使用 -s 或 -a 参数生成 commit message\n`));
        return;
      }

      // 详细模式显示文件列表
      if (options.verbose) {
        spinner.stop();
        console.log(chalk.cyan('\n变更文件:'));
        files.forEach(file => console.log(`  - ${file}`));
        console.log('');
        spinner.start('正在生成提交信息...');
      }

      // 交互模式
      let selectedType = options.type;
      if (options.interactive && !selectedType) {
        spinner.stop();
        selectedType = await interactiveSelectType();
        spinner.start('正在生成提交信息...');
      }

      // 获取上次 commit 作为参考
      const lastCommit = getLastCommitMessage();

      // 生成提交信息
      const commitMessage = await generateCommitMessage(diff, files, lastCommit, {
        type: selectedType,
        scope: options.scope
      });

      spinner.succeed('生成完成');

      // 交互模式确认
      if (options.interactive) {
        console.log('\n' + chalk.green('📝 建议的 commit message:'));
        console.log(chalk.cyan('='.repeat(50)));
        console.log(chalk.white(commitMessage));
        console.log(chalk.cyan('='.repeat(50)));

        let finalMessage = commitMessage;
        let confirm = await interactiveConfirm(finalMessage);

        while (confirm === 'edit') {
          finalMessage = await interactiveEdit(finalMessage);
          confirm = await interactiveConfirm(finalMessage);
        }

        if (confirm === 'no') {
          console.log(chalk.yellow('已取消提交'));
          return;
        }

        // 显示最终消息
        console.log('\n' + chalk.green('✅ 最终 commit message:'));
        console.log(chalk.cyan('='.repeat(50)));
        console.log(chalk.white(finalMessage));
        console.log(chalk.cyan('='.repeat(50)));

        // 复制到剪贴板
        if (options.copy) {
          try {
            if (process.platform === 'darwin') {
              execSync(`echo "${finalMessage}" | pbcopy`);
            } else if (process.platform === 'win32') {
              execSync(`echo ${finalMessage} | clip`);
            } else {
              try {
                execSync(`echo "${finalMessage}" | xclip -selection clipboard`);
              } catch (e) {
                console.log(chalk.yellow('⚠ 无法复制到剪贴板（需要安装 xclip）'));
              }
            }
            console.log(chalk.green('✓ 已复制到剪贴板'));
          } catch (error) {
            console.log(chalk.yellow('⚠ 复制失败，请手动复制'));
          }
        }

        console.log('\n' + chalk.gray('使用方法:'));
        console.log(`  git commit -m "${finalMessage}"\n`);
      } else {
        // 非交互模式
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

        console.log('\n' + chalk.gray('使用方法:'));
        console.log(`  git commit -m "${commitMessage}"`);

        if (options.copy) {
          console.log('  或直接粘贴：git commit -m "<Cmd+V>"');
        }
        console.log('');
      }

    } catch (error) {
      if (spinner.isSpinning) {
        spinner.fail();
      }
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

program.parse();
