// import logger, { createLogger } from '../src/util/winston_logger.js';
import logger, { createLogger } from '../src/util/logger.js';

logger.info('test');

let log = createLogger('test');
log.error('test111111111');

logger.info('=== 测试控制台日志输出格式 ===');
logger.info('测试普通日志输出格式');
logger.error('测试错误日志输出格式');

logger.info('\\n=== 测试模块日志输出格式 ===');
const testLogger = createLogger('MyModule');
testLogger.info('测试模块日志输出格式');
testLogger.error('测试模块错误日志输出格式');

logger.info('\\n✅ 格式验证完成');


console.log('Testing logger from a named file...');
logger.info('This is an info message from test-file.js');
logger.error('This is an error message from test-file.js');
logger.warn('This is a warning message from test-file.js');