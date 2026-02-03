import fs from 'fs/promises';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';

// 设置 marked 使用 terminal 渲染器
marked.setOptions({
  renderer: new TerminalRenderer()
});

/**
 * 在终端中查看 Markdown 文件
 * @param {string} filePath - Markdown 文件路径
 * @param {boolean} paging - 是否使用分页器
 */
export async function viewMarkdown(filePath, paging = false) {
  try {
    // 检查文件是否存在
    await fs.access(filePath);

    // 读取 Markdown 文件内容
    const markdownContent = await fs.readFile(filePath, 'utf8');

    // 将 Markdown 转换为终端友好的格式
    const renderedContent = marked(markdownContent);

    // 如果指定了分页，则使用分页器显示
    if (paging) {
      // 使用 less 分页器显示内容
      const { spawn } = await import('child_process');
      const pager = spawn('less', ['-R'], { stdio: ['pipe', process.stdout, process.stderr] });

      // 将渲染后的内容写入分页器
      pager.stdin.write(renderedContent);
      pager.stdin.end();
    } else {
      // 直接输出到控制台
      console.log(renderedContent);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`\x1b[31m❌ 错误: 文件不存在 - ${filePath}\x1b[0m`);
    } else {
      console.error('\x1b[31m❌ 错误: 读取文件时发生错误\x1b[0m');
      console.error(error.message);
    }
    throw error;
  }
}