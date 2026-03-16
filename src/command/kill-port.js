/**
 * 端口管理工具 - 关闭占用端口的进程
 * @module src/command/kill-port
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

/**
 * 查找占用指定端口的进程
 * @param {string} port - 端口号
 * @returns {Array} 进程信息列表
 */
export function findProcessByPort(port) {
    try {
        // 使用 lsof 查找占用端口的进程
        const output = execSync(`lsof -ti:${port}`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
        });

        if (!output.trim()) {
            return [];
        }

        const pids = output.trim().split('\n').filter(Boolean);
        
        // 获取每个进程的详细信息
        const processes = pids.map(pid => {
            try {
                const processInfo = execSync(`ps -p ${pid} -o pid,command`, {
                    encoding: 'utf-8'
                });
                const lines = processInfo.trim().split('\n');
                if (lines.length < 2) return null;
                
                const parts = lines[1].trim().split(/\s+/);
                return {
                    pid: pid,
                    command: lines[1].substring(lines[1].indexOf(parts[0]) + parts[0].length).trim()
                };
            } catch (err) {
                return { pid, command: 'unknown' };
            }
        }).filter(Boolean);

        return processes;
    } catch (err) {
        return [];
    }
}

/**
 * 执行关闭进程操作
 * @param {Array} processes - 进程列表
 * @param {number} portNum - 端口号
 * @param {Function} logCallback - 日志回调函数
 * @returns {Object} 执行结果
 */
export function executeKill(processes, portNum, logCallback = null) {
    const result = {
        success: true,
        successCount: 0,
        failCount: 0,
        details: []
    };

    if (logCallback) {
        logCallback('\n💀 正在关闭进程...\n', 'info');
    } else {
        console.log(chalk.blue('\n💀 正在关闭进程...\n'));
    }

    processes.forEach(proc => {
        try {
            execSync(`kill -9 ${proc.pid}`, { stdio: 'ignore' });
            result.successCount++;
            result.details.push({ pid: proc.pid, success: true });
            
            if (logCallback) {
                logCallback(`  ✅ 成功关闭进程 ${proc.pid}`, 'success');
            } else {
                console.log(chalk.green(`  ✅ 成功关闭进程 ${proc.pid}`));
            }
        } catch (err) {
            result.failCount++;
            result.details.push({ pid: proc.pid, success: false, error: err.message });
            
            if (logCallback) {
                logCallback(`  ❌ 关闭进程 ${proc.pid} 失败：${err.message}`, 'error');
            } else {
                console.log(chalk.red(`  ❌ 关闭进程 ${proc.pid} 失败：${err.message}`));
            }
        }
    });

    result.success = result.failCount === 0;

    if (logCallback) {
        logCallback('\n' + '─'.repeat(50), 'info');
        logCallback(`  成功：${result.successCount} 个进程`, 'success');
        if (result.failCount > 0) {
            logCallback(`  失败：${result.failCount} 个进程`, 'error');
        }
        logCallback(`\n✅ 端口 ${portNum} 已释放。`, 'success');
    } else {
        console.log(chalk.blue('\n' + '─'.repeat(50)));
        console.log(chalk.green(`  成功：${result.successCount} 个进程`));
        if (result.failCount > 0) {
            console.log(chalk.red(`  失败：${result.failCount} 个进程`));
        }
        console.log(chalk.green(`\n✅ 端口 ${portNum} 已释放。`));
    }

    return result;
}

/**
 * 关闭占用指定端口的进程
 * @param {string} port - 端口号
 * @param {Object} options - 选项
 * @param {Function} logCallback - 日志回调函数
 * @returns {Promise<Object>} 执行结果
 */
export async function killPort(port, options = {}, logCallback = null) {
    const result = {
        port: parseInt(port),
        success: false,
        processesFound: [],
        killResult: null
    };

    // 验证端口号
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        const errorMsg = `❌ 错误：无效的端口号 "${port}"。端口号必须在 1-65535 之间。`;
        if (logCallback) {
            logCallback(errorMsg, 'error');
        } else {
            console.error(chalk.red(errorMsg));
        }
        result.error = errorMsg;
        return result;
    }

    if (logCallback) {
        logCallback(`🔍 正在查找占用端口 ${portNum} 的进程...`, 'info');
    } else {
        console.log(chalk.blue(`🔍 正在查找占用端口 ${portNum} 的进程...`));
    }

    const processes = findProcessByPort(port);
    result.processesFound = processes;

    if (processes.length === 0) {
        const msg = `⚠️  端口 ${portNum} 未被占用。`;
        if (logCallback) {
            logCallback(msg, 'warning');
        } else {
            console.log(chalk.yellow(msg));
        }
        result.success = true; // 端口未被占用也算成功
        return result;
    }

    // 如果不是强制模式，需要用户确认
    if (!options.force) {
        if (!logCallback) {
            console.log(chalk.yellow(`\n📋 找到 ${processes.length} 个占用端口 ${portNum} 的进程：\n`));
            console.log(chalk.cyan('  PID      命令'));
            console.log(chalk.cyan('  ──────────────────────────────────────'));
            
            processes.forEach(proc => {
                const pidStr = chalk.red(proc.pid.padStart(8));
                const cmdStr = proc.command.length > 40 ? proc.command.substring(0, 37) + '...' : proc.command;
                console.log(`  ${pidStr}  ${cmdStr}`);
            });
        }

        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            if (logCallback) {
                // 如果有日志回调，直接执行关闭
                const killResult = executeKill(processes, portNum, logCallback);
                result.killResult = killResult;
                result.success = killResult.success;
                resolve(result);
            } else {
                rl.question(chalk.yellow('\n❓ 确定要关闭这些进程吗？(y/N): '), (answer) => {
                    rl.close();
                    
                    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                        const killResult = executeKill(processes, portNum);
                        result.killResult = killResult;
                        result.success = killResult.success;
                        resolve(result);
                    } else {
                        console.log(chalk.gray('❌ 操作已取消。'));
                        resolve(result);
                    }
                });
            }
        });
    }

    // 强制模式
    const killResult = executeKill(processes, portNum, logCallback);
    result.killResult = killResult;
    result.success = killResult.success;
    return result;
}

export default {
    findProcessByPort,
    executeKill,
    killPort
};
