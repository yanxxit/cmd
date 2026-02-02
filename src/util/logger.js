import log4js from 'log4js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 计算项目根目录路径
const projectRoot = path.resolve(__dirname, '../..');
const logsDir = path.resolve(projectRoot, 'logs');

// 配置 Log4js
log4js.configure({
  appenders: {
    // 控制台输出 appender
    console: {
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: '%d{yyyy-MM-dd hh:mm:ss} [%p] [%c] %m'
      }
    },
    // 文件输出 appender - 所有日志
    fileAppender: {
      type: 'file',
      filename: path.join(logsDir, 'combined.log'),
      layout: {
        type: 'pattern',
        pattern: '%d{yyyy-MM-dd hh:mm:ss} [%p] [%c] %m'
      }
    },
    // 文件输出 appender - 错误日志
    errorFileAppender: {
      type: 'file',
      filename: path.join(logsDir, 'error.log'),
      layout: {
        type: 'pattern',
        pattern: '%d{yyyy-MM-dd hh:mm:ss} [%p] [%c] %m'
      }
    },
    // 错误日志专用 appender
    errorAppender: {
      type: 'logLevelFilter',
      appender: 'errorFileAppender',
      level: 'ERROR',
      maxLevel: 'FATAL'
    }
  },
  categories: {
    default: {
      appenders: ['console', 'fileAppender', 'errorAppender'],
      level: 'DEBUG'
    }
  }
});

// 获取调用者的文件名
function getCallerFile() {
  const originalFunc = Error.prepareStackTrace;
  let callerFile;
  try {
    const err = new Error();
    Error.prepareStackTrace = function (err, stack) {
      return stack;
    };

    const stack = err.stack;
    // 跳过当前文件和 log4js 的内部调用栈
    for (let i = 2; i < stack.length; i++) {
      const fileName = stack[i].getFileName();
      if (fileName && !fileName.includes('log4js') && !fileName.includes('logger.js')) {
        callerFile = path.basename(fileName, path.extname(fileName)); // 去掉扩展名
        break;
      }
    }
  } catch (e) {
    console.error('Error getting caller file:', e);
  }

  Error.prepareStackTrace = originalFunc;
  return callerFile || 'unknown';
}

// 创建一个返回动态 logger 的函数
const getLoggerForCaller = () => {
  const callerFile = getCallerFile();
  return log4js.getLogger(callerFile);
};

// 创建一个动态 logger 对象，每次调用时获取调用者文件名
const DynamicLogger = {
  trace: (message) => getLoggerForCaller().trace(message),
  debug: (message) => getLoggerForCaller().debug(message),
  info: (message) => getLoggerForCaller().info(message),
  warn: (message) => getLoggerForCaller().warn(message),
  error: (message) => getLoggerForCaller().error(message),
  fatal: (message) => getLoggerForCaller().fatal(message)
};

// 导出动态 logger 和创建模块专用 logger 的函数
export default DynamicLogger;

// 创建模块专用 logger 的函数
export const createLogger = (moduleName) => {
  const moduleLogger = log4js.getLogger(moduleName);
  return {
    trace: (message) => moduleLogger.trace(message),
    debug: (message) => moduleLogger.debug(message),
    info: (message) => moduleLogger.info(message),
    warn: (message) => moduleLogger.warn(message),
    error: (message) => moduleLogger.error(message),
    fatal: (message) => moduleLogger.fatal(message)
  };
};