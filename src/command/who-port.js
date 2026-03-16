/**
 * 端口查询工具 - 查询占用端口的服务信息
 * @module src/command/who-port
 */

import { execSync } from 'child_process';

/**
 * 获取进程详细信息
 * @param {string} pid - 进程 ID
 * @returns {Object|null} 进程信息
 */
export function getProcessInfo(pid) {
    try {
        const psOutput = execSync(`ps -p ${pid} -o pid,ppid,user,stat,start,time,command`, {
            encoding: 'utf-8'
        });
        
        const lines = psOutput.trim().split('\n');
        if (lines.length < 2) return null;

        const dataLine = lines[1];
        const parts = dataLine.trim().split(/\s+/);
        
        return {
            pid: parts[0],
            ppid: parts[1],
            user: parts[2],
            stat: parts[3],
            start: parts[4],
            time: parts[5],
            command: parts.slice(6).join(' ')
        };
    } catch (err) {
        return null;
    }
}

/**
 * 获取进程启动时间
 * @param {string} pid - 进程 ID
 * @returns {string} 启动时间
 */
export function getProcessStartTime(pid) {
    try {
        const output = execSync(`ps -p ${pid} -o lstart=`, {
            encoding: 'utf-8'
        });
        return output.trim();
    } catch (err) {
        return 'unknown';
    }
}

/**
 * 获取进程工作目录
 * @param {string} pid - 进程 ID
 * @returns {string} 工作目录
 */
export function getProcessCwd(pid) {
    try {
        const output = execSync(`lsof -p ${pid} -d cwd`, {
            encoding: 'utf-8'
        });
        const lines = output.trim().split('\n');
        if (lines.length < 2) return 'unknown';
        
        const parts = lines[1].split(/\s+/);
        return parts[parts.length - 1] || 'unknown';
    } catch (err) {
        return 'unknown';
    }
}

/**
 * 解析 lsof 输出行
 * @param {string} line - lsof 输出行
 * @param {number} portNum - 端口号
 * @returns {Object|null} 解析后的进程信息
 */
export function parseLsofLine(line, portNum) {
    const parts = line.split(/\s+/);
    
    if (parts.length < 9) {
        return null;
    }

    const command = parts[0];
    const pid = parts[1];
    const user = parts[2];
    const fd = parts[3];
    const type = parts[4];
    const device = parts[5];
    const sizeOff = parts[6];
    const node = parts[7];
    const name = parts.slice(8).join(' ');

    const processInfo = getProcessInfo(pid);
    const startTime = getProcessStartTime(pid);
    const cwd = getProcessCwd(pid);

    return {
        command,
        pid: parseInt(pid),
        user,
        fd,
        type,
        device,
        sizeOff,
        node,
        name,
        port: portNum,
        processInfo,
        startTime,
        cwd,
        queryTime: new Date().toISOString()
    };
}

/**
 * 查询占用指定端口的服务信息
 * @param {string} port - 端口号
 * @param {Object} options - 选项
 * @param {Function} logCallback - 日志回调函数
 * @returns {Object} 查询结果
 */
export function queryPort(port, options = {}, logCallback = null) {
    const result = {
        port: parseInt(port),
        isOccupied: false,
        processCount: 0,
        processes: [],
        queryTime: new Date().toISOString(),
        error: null
    };

    // 验证端口号
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        const errorMsg = `❌ 错误：无效的端口号 "${port}"。端口号必须在 1-65535 之间。`;
        if (logCallback) {
            logCallback(errorMsg, 'error');
        } else {
            console.error(errorMsg);
        }
        result.error = errorMsg;
        return result;
    }

    try {
        const lsofOutput = execSync(`lsof -i :${portNum} -P -n`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
        });

        if (!lsofOutput.trim()) {
            const msg = `⚠️  端口 ${portNum} 未被占用。`;
            if (logCallback) {
                logCallback(msg, 'warning');
            } else {
                console.log(msg);
            }
            return result;
        }

        const lines = lsofOutput.trim().split('\n');
        const dataLines = lines.slice(1);

        if (dataLines.length === 0) {
            const msg = `⚠️  端口 ${portNum} 未被占用。`;
            if (logCallback) {
                logCallback(msg, 'warning');
            } else {
                console.log(msg);
            }
            return result;
        }

        const processes = dataLines.map(line => parseLsofLine(line, portNum)).filter(Boolean);
        
        result.isOccupied = true;
        result.processCount = processes.length;
        result.processes = processes;

        return result;

    } catch (err) {
        const msg = `⚠️  端口 ${portNum} 未被占用。`;
        if (logCallback) {
            logCallback(msg, 'warning');
        } else {
            console.log(msg);
        }
        return result;
    }
}

/**
 * 格式化输出查询结果
 * @param {Object} result - 查询结果
 * @param {boolean} verbose - 是否显示详细信息
 * @param {Function} logCallback - 日志回调函数
 */
export function formatOutput(result, verbose = false, logCallback = null) {
    const log = logCallback || ((msg) => console.log(msg));

    if (!result.isOccupied) {
        return;
    }

    log(`\n✅ 端口占用信息查询结果\n`, 'info');
    log(`════════════════════════════════════════════════════════════`, 'info');
    log(`📍 端口号：${result.port}`, 'info');
    log(`📊 占用进程数：${result.processCount}`, 'info');
    log(`🕐 查询时间：${new Date().toLocaleString('zh-CN')}`, 'info');
    log(`════════════════════════════════════════════════════════════`, 'info');

    result.processes.forEach((proc, index) => {
        log(`\n📌 进程 #${index + 1}\n`, 'info');
        
        log(`  ┌ 基本信息`, 'info');
        log(`  ├─ 命令：${proc.command}`, 'info');
        log(`  ├─ PID: ${proc.pid}`, 'info');
        log(`  ├─ 用户：${proc.user}`, 'info');
        log(`  ├─ 文件描述符：${proc.fd}`, 'info');
        log(`  └─ 协议类型：${proc.type}`, 'info');
        
        log(`  ┌ 网络信息`, 'info');
        log(`  ├─ 监听地址：${proc.name}`, 'info');
        log(`  └─ 设备：${proc.device}`, 'info');

        if (proc.processInfo) {
            log(`  ┌ 进程详细信息`, 'info');
            log(`  ├─ 父进程 PID: ${proc.processInfo.ppid}`, 'info');
            log(`  ├─ 进程状态：${proc.processInfo.stat}`, 'info');
            log(`  ├─ 启动时间：${proc.startTime}`, 'info');
            log(`  ├─ CPU 时间：${proc.processInfo.time}`, 'info');
            log(`  └─ 完整命令：${proc.processInfo.command}`, 'info');
        }

        if (verbose) {
            log(`  ┌ 工作目录`, 'info');
            log(`  └─ 当前目录：${proc.cwd}`, 'info');
        }

        log(`────────────────────────────────────────────────────────────`, 'info');
    });

    if (result.processes.length > 0) {
        log(`\n💡 使用提示:\n`, 'info');
        log(`  • 关闭进程：kill -9 ${result.processes[0].pid}`, 'tip');
        log(`  • 查看详情：ps -p ${result.processes[0].pid} -f`, 'tip');
        log(`  • 查看文件：lsof -p ${result.processes[0].pid}`, 'tip');
        log(`  • 强制关闭：x-kill-port ${result.port} --force\n`, 'tip');
    }
}

export default {
    getProcessInfo,
    getProcessStartTime,
    getProcessCwd,
    parseLsofLine,
    queryPort,
    formatOutput
};
