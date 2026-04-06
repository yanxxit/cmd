import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/**
 * 日志管理器
 */
export class LogManager {
  constructor(logFile) {
    this.logFile = logFile;
  }

  /**
   * 写入日志到文件
   */
  writeLog(message, level = 'info') {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

    fs.appendFileSync(this.logFile, logEntry);
  }

  /**
   * 创建日志回调函数
   */
  createCallback(enabled = true) {
    if (!enabled) return null;

    return (message, level = 'info') => {
      // 控制台输出
      const colorMap = {
        'error': chalk.red,
        'warning': chalk.yellow,
        'success': chalk.green,
        'info': chalk.cyan,
        'tip': chalk.gray
      };

      const colorFn = colorMap[level] || chalk.white;
      console.log(colorFn(message));

      // 写入文件日志
      this.writeLog(message, level);
    };
  }

  /**
   * 记录命令开始
   */
  logCommandStart(command, args, params = {}) {
    this.writeLog('========== 命令开始 ==========');
    this.writeLog(`执行命令：${command} ${args.join(' ')}`);
    this.writeLog(`参数：${JSON.stringify(params)}`);
  }

  /**
   * 记录命令结束
   */
  logCommandEnd(result = {}) {
    this.writeLog(`执行结果：${JSON.stringify(result)}`);
    this.writeLog('========== 命令结束 ==========\n');
  }

  /**
   * 记录错误
   */
  logError(message) {
    this.writeLog(`执行错误：${message}`, 'error');
    this.writeLog('========== 命令结束 (异常) ==========\n');
  }
}

/**
 * 端口验证工具
 */
export function validatePort(port, portName = '端口号') {
  const portNum = parseInt(port);

  if (isNaN(portNum)) {
    throw new Error(`${portName}必须是数字`);
  }

  if (portNum < 1 || portNum > 65535) {
    throw new Error(`${portName}必须在 1-65535 之间`);
  }

  return portNum;
}

/**
 * 端口范围验证
 */
export function validatePortRange(start, end) {
  const startPort = validatePort(start, '起始端口');
  const endPort = validatePort(end, '结束端口');

  if (startPort > endPort) {
    throw new Error('起始端口不能大于结束端口');
  }

  return { startPort, endPort };
}

/**
 * 检查端口是否被占用
 */
export async function isPortOccupied(port) {
  try {
    const { execSync } = await import('child_process');
    const output = execSync(`lsof -ti:${port}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return output.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * 格式化字节数
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 格式化持续时间
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * 获取进程详细信息
 */
export async function getProcessDetails(pid) {
  try {
    const { execSync } = await import('child_process');
    
    // 获取进程信息
    const psOutput = execSync(`ps -p ${pid} -o pid,command,user,etime,lstart`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });

    const lines = psOutput.trim().split('\n');
    if (lines.length < 2) return null;

    const headers = lines[0].trim().split(/\s+/);
    const values = lines[1].trim().split(/\s+/);

    return {
      pid: parseInt(values[0]),
      command: values[1],
      user: values[2],
      elapsed: values[3],
      startTime: values.slice(4).join(' ')
    };
  } catch {
    return null;
  }
}

/**
 * 表格格式化工具
 */
export function createTable(headers, rows) {
  // 计算每列的最大宽度
  const columnWidths = headers.map((header, i) => {
    const maxWidthInColumn = Math.max(
      header.length,
      ...rows.map(row => (row[i] || '').toString().length)
    );
    return Math.min(maxWidthInColumn, 50); // 最大宽度 50
  });

  // 创建分隔线
  const separator = '┌' + columnWidths.map(w => '─'.repeat(w)).join('┬') + '┐';
  const headerSeparator = '├' + columnWidths.map(w => '─'.repeat(w)).join('┼') + '┤';
  const footer = '└' + columnWidths.map(w => '─'.repeat(w)).join('┴') + '┘';

  // 格式化行
  const formatRow = (row, isHeader = false) => {
    const cells = row.map((cell, i) => {
      const str = (cell || '').toString();
      const width = columnWidths[i];
      return str.padEnd(width).substring(0, width);
    });
    return '│' + cells.join('│') + '│';
  };

  let table = '';
  table += separator + '\n';
  table += formatRow(headers, true) + '\n';
  table += headerSeparator + '\n';

  for (const row of rows) {
    table += formatRow(row) + '\n';
  }

  table += footer;

  return table;
}

/**
 * 进度条工具
 */
export class ProgressBar {
  constructor(total, options = {}) {
    this.total = total;
    this.current = 0;
    this.width = options.width || 30;
    this.quiet = options.quiet || false;
  }

  /**
   * 更新进度
   */
  update(current, message = '') {
    this.current = current;
    if (this.quiet) return;

    const percent = Math.floor((current / this.total) * 100);
    const filled = Math.floor((percent / 100) * this.width);
    const empty = this.width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r[${bar}] ${percent}% (${current}/${total}) ${message}`);
  }

  /**
   * 完成进度条
   */
  complete(message = '') {
    if (!this.quiet) {
      console.log();
    }
  }
}

export default {
  LogManager,
  validatePort,
  validatePortRange,
  isPortOccupied,
  formatBytes,
  formatDuration,
  getProcessDetails,
  createTable,
  ProgressBar
};
