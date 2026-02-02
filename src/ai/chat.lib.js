import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import chalk from 'chalk';

// 配置marked使用终端渲染器
marked.use(markedTerminal({
  // 自定义样式
  code: chalk.cyan,
  codespan: chalk.cyan.italic,
  blockquote: chalk.gray,
  heading: chalk.green.bold,
  firstHeading: chalk.green.bold.underline,
  strong: chalk.bold,
  em: chalk.italic,
  del: chalk.dim.gray.strikethrough,
  link: chalk.blue.underline,
  href: chalk.blue.underline,
  listitem: chalk.yellow,
  table: chalk.white,
  tab: chalk.white,
}));

// 清空当前行
export function clearLine() {
  process.stdout.write('\r\x1b[K');
}

// 渲染Markdown内容到终端
export function renderMarkdown(content, { isPartial = false } = {}) {
  try {
    if (!content.trim()) return '';

    // 如果是部分内容且不在代码块中，尝试智能换行处理
    if (isPartial) {
      const lines = content.split('\n');
      if (lines.length > 5) {
        // 如果有换行符，渲染完整行
        const completeLines = lines.slice(0, -1);
        const partialLine = lines[lines.length - 1];

        if (completeLines.length > 0) {
          const renderedComplete = marked.parse(completeLines.join('\n'));
          process.stdout.write(renderedComplete);
        }
        return partialLine;
      }
    }

    const rendered = marked.parse(content);
    return rendered;
  } catch (error) {
    console.error(chalk.red('Markdown渲染错误:'), error.message);
    return content;
  }
}

// 确保日志目录存在
export async function ensureLogsDirectory(logsDir) {
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch (error) {
    console.error(chalk.yellow('⚠️ 创建日志目录失败:'), error.message);
  }
}

// 根据当前日期更新日志文件路径
export function updateConversationFile(logsDir) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  return path.join(logsDir, `chat_${formattedDate}.md`);
}

// 检查日期是否发生变化，如变化则更新日志文件
export function checkAndUpdateDate(currentConversationFile, logsDir) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  // 检查当前日志文件名是否包含今天的日期
  const expectedLogFile = path.join(logsDir, `chat_${formattedDate}.md`);
  if (currentConversationFile !== expectedLogFile) {
    return expectedLogFile;
  }
  return currentConversationFile;
}