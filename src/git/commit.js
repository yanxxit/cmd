import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import OpenAI from 'openai';
import readline from 'readline';

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

export function checkApiKey() {
  const apiKey = process.env['HUNYUAN_API_KEY'];
  if (!apiKey) {
    console.error(chalk.red('错误：未设置 HUNYUAN_API_KEY 环境变量'));
    console.error(chalk.yellow('提示：请在项目根目录创建 .env 文件并设置 HUNYUAN_API_KEY'));
    console.error(chalk.gray('示例：HUNYUAN_API_KEY=sk-xxxxx'));
    process.exit(1);
  }
  return apiKey;
}

export function getStagedFiles() {
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

export function getUnstagedFiles() {
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

export function getAllChangedFiles() {
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

export function getStagedDiff() {
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

export function getUnstagedDiff() {
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

export function getAllDiff() {
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

export function getDiffStats(diff) {
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

export function extractChangeSummary(files, diff) {
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
    const fileMatch = line.match(/^diff --git a\/.+ b\/(.+)$/);
    if (fileMatch) {
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

    const funcMatch = line.match(/^\+.*(?:function|const|let|var)\s+(\w+)\s*[=\(]/);
    if (funcMatch && line.startsWith('+') && !line.includes('import') && !line.includes('require')) {
      fileChanges.functions.push(funcMatch[1]);
    }

    const classMatch = line.match(/^\+.*class\s+(\w+)/);
    if (classMatch && line.startsWith('+')) {
      fileChanges.classes.push(classMatch[1]);
    }

    const configMatch = line.match(/^\+.*(?:const|let|var)\s+([A-Z_][A-Z0-9_]*)\s*=/);
    if (configMatch && line.startsWith('+')) {
      fileChanges.configKeys.push(configMatch[1]);
    }

    const apiMatch = line.match(/^\+.*['"`](\/[a-zA-Z0-9/_-]+)['"`]/);
    if (apiMatch && line.startsWith('+') && (line.includes('get') || line.includes('post') || line.includes('route'))) {
      fileChanges.apiEndpoints.push(apiMatch[1]);
    }

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

export function generateChangeSummaryText(summaries, maxFiles = 5) {
  if (!summaries || summaries.length === 0) return '';

  const texts = [];
  const shownSummaries = summaries.slice(0, maxFiles);

  for (const summary of shownSummaries) {
    const fileName = summary.file.split('/').pop();
    const parts = [];

    if (summary.functions.length > 0) {
      parts.push(`新增函数：${summary.functions.join(', ')}`);
    }

    if (summary.classes.length > 0) {
      parts.push(`新增类：${summary.classes.join(', ')}`);
    }

    if (summary.configKeys.length > 0) {
      parts.push(`配置：${summary.configKeys.join(', ')}`);
    }

    if (summary.importantChanges.length > 0) {
      const keyChanges = summary.importantChanges
        .map(s => s.replace(/\s+/g, ' ').substring(0, 60))
        .slice(0, 2);
      if (keyChanges.length > 0) {
        parts.push(`变更：${keyChanges.join('; ')}`);
      }
    }

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

export function inferScope(files) {
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

export function inferType(files, diff) {
  const diffLower = diff.toLowerCase();

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

  const hasTestFiles = files.some(f => f.includes('test') || f.includes('spec'));
  const hasDocFiles = files.some(f => f.includes('doc') || f.includes('md'));

  if (hasTestFiles && files.length === 1) return 'test';
  if (hasDocFiles && files.length === 1) return 'docs';

  return 'feat';
}

export function getRecentCommits(limit = 5) {
  try {
    return execSync(`git log -${limit} --oneline --no-merges`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error) {
    return '';
  }
}

export function getLastCommitMessage() {
  try {
    return execSync('git log -1 --pretty=%B', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    return '';
  }
}

export function simplifyDiff(diff, maxLines = 60) {
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

export function createOptimizedPrompt(files, diff, scope, type, lastCommit) {
  const fileCount = files.length;
  const firstFile = files[0]?.split('/').pop() || 'file';

  const summaries = extractChangeSummary(files, diff);
  const changeText = generateChangeSummaryText(summaries, 3);

  const refText = lastCommit ? `参考："${lastCommit.substring(0, 25)}"` : '';

  let prompt = `Conventional Commits，type=${type}。
${fileCount}个文件：${firstFile}${fileCount > 1 ? `等${fileCount}个` : ''}。
${refText}
`;

  if (changeText) {
    const summaryLines = changeText.split('\n');
    const keyInfo = summaryLines.slice(0, 2).join('; ');
    prompt += `变更：${keyInfo.substring(0, 140)}`;
  }

  prompt += '\n中文描述实际变更内容，<60 字，只返回 message';

  return prompt;
}

export async function generateCommitMessage(diff, files, lastCommit, options = {}) {
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

    message = message.replace(/^["']|["']$/g, '')
                     .replace(/^[`*]+\s*|\s*[`*]+$/g, '')
                     .replace(/^(commit|message|提交)[:：]?\s*/i, '');

    const commitPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([^)]+\))?:\s*.+/;
    if (!commitPattern.test(message)) {
      const scopePart = scope ? `(${scope})` : '';
      message = `${type}${scopePart}: ${message.replace(/^[^:]+:\s*/, '').substring(0, 80)}`;
    }

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

export async function interactiveSelectType() {
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

export async function interactiveConfirm(message) {
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

export async function interactiveEdit(message) {
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

export { COMMIT_TYPES };
