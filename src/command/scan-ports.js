/**
 * 端口扫描工具 - 扫描指定范围内的端口占用情况
 * @module src/command/scan-ports
 */

import { execSync } from 'child_process';
import { queryPort } from './who-port.js';

/**
 * 扫描单个端口
 * @param {number} port - 端口号
 * @returns {Object} 端口信息
 */
export function scanSinglePort(port) {
    try {
        // 使用 execSync 直接查询，避免 queryPort 的输出
        const lsofOutput = execSync(`lsof -i :${port} -P -n`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
        });

        if (!lsofOutput.trim()) {
            return {
                port,
                isOccupied: false,
                processCount: 0,
                processes: [],
                queryTime: new Date().toISOString()
            };
        }

        // 解析 lsof 输出
        const lines = lsofOutput.trim().split('\n');
        const dataLines = lines.slice(1);
        
        const processes = dataLines.map(line => {
            const parts = line.split(/\s+/);
            if (parts.length < 9) return null;
            
            return {
                command: parts[0],
                pid: parseInt(parts[1]),
                user: parts[2],
                fd: parts[3],
                type: parts[4],
                device: parts[5],
                name: parts.slice(8).join(' ')
            };
        }).filter(Boolean);

        return {
            port,
            isOccupied: true,
            processCount: processes.length,
            processes,
            queryTime: new Date().toISOString()
        };
    } catch (err) {
        return {
            port,
            isOccupied: false,
            processCount: 0,
            processes: [],
            queryTime: new Date().toISOString()
        };
    }
}

/**
 * 扫描端口范围
 * @param {number} startPort - 起始端口
 * @param {number} endPort - 结束端口
 * @param {Object} options - 选项
 * @param {Function} progressCallback - 进度回调函数
 * @returns {Array} 端口扫描结果列表
 */
export function scanPortRange(startPort, endPort, options = {}, progressCallback = null) {
    const results = [];
    const total = endPort - startPort + 1;
    let scanned = 0;

    for (let port = startPort; port <= endPort; port++) {
        const result = scanSinglePort(port);
        results.push(result);
        scanned++;

        // 调用进度回调
        if (progressCallback) {
            progressCallback({
                current: port,
                total,
                scanned,
                occupied: results.filter(r => r.isOccupied).length,
                percent: ((scanned / total) * 100).toFixed(1)
            });
        }
    }

    return results;
}

/**
 * 获取所有占用的端口
 * @param {Array} results - 扫描结果列表
 * @returns {Array} 占用端口的结果列表
 */
export function getOccupiedPorts(results) {
    return results.filter(r => r.isOccupied);
}

/**
 * 获取空闲端口
 * @param {Array} results - 扫描结果列表
 * @returns {Array} 空闲端口的结果列表
 */
export function getFreePorts(results) {
    return results.filter(r => !r.isOccupied);
}

/**
 * 格式化扫描结果为表格
 * @param {Array} results - 扫描结果列表
 * @param {Object} options - 选项
 * @returns {string} 格式化后的表格字符串
 */
export function formatAsTable(results, options = {}) {
    const { onlyOccupied = false, showDetails = false } = options;
    
    const displayResults = onlyOccupied ? getOccupiedPorts(results) : results;
    
    if (displayResults.length === 0) {
        return '没有找到符合条件的端口。';
    }

    // 表格头部
    let output = '\n';
    output += '┌─────────┬──────────┬─────────────┬─────────────────────────────────────┐\n';
    output += '│ 端口号  │ 状态     │ 进程数      │ 命令                                │\n';
    output += '├─────────┼──────────┼─────────────┼─────────────────────────────────────┤\n';

    // 表格内容
    displayResults.forEach(result => {
        const portStr = result.port.toString().padStart(7);
        const statusStr = result.isOccupied ? '占用' : '空闲';
        const statusColor = result.isOccupied ? '🔴' : '🟢';
        const processCountStr = result.processCount.toString().padStart(10);
        
        let commandStr = '-';
        if (result.isOccupied && result.processes && result.processes.length > 0) {
            commandStr = result.processes[0].command || 'unknown';
            if (commandStr.length > 35) {
                commandStr = commandStr.substring(0, 32) + '...';
            }
        }
        
        output += `│ ${portStr} │ ${statusColor} ${statusStr.padStart(4)}  │${processCountStr} │ ${commandStr.padEnd(35)} │\n`;
    });

    // 表格尾部
    output += '└─────────┴──────────┴─────────────┴─────────────────────────────────────┘\n';

    return output;
}

/**
 * 格式化扫描结果为 JSON
 * @param {Array} results - 扫描结果列表
 * @param {Object} summary - 汇总信息
 * @returns {string} JSON 字符串
 */
export function formatAsJson(results, summary = null) {
    const output = {
        scanTime: new Date().toISOString(),
        summary: summary || {
            total: results.length,
            occupied: getOccupiedPorts(results).length,
            free: getFreePorts(results).length
        },
        results
    };
    
    return JSON.stringify(output, null, 2);
}

/**
 * 格式化扫描结果为简洁模式
 * @param {Array} results - 扫描结果列表
 * @param {Object} options - 选项
 * @returns {string} 简洁格式的字符串
 */
export function formatAsSimple(results, options = {}) {
    const { onlyOccupied = false } = options;
    const displayResults = onlyOccupied ? getOccupiedPorts(results) : results;
    
    let output = '';
    displayResults.forEach(result => {
        if (result.isOccupied) {
            const cmd = result.processes && result.processes.length > 0 
                ? result.processes[0].command 
                : 'unknown';
            output += `${result.port}: ${cmd}\n`;
        } else {
            output += `${result.port}: 空闲\n`;
        }
    });
    
    return output;
}

/**
 * 生成扫描汇总信息
 * @param {Array} results - 扫描结果列表
 * @param {number} startPort - 起始端口
 * @param {number} endPort - 结束端口
 * @returns {Object} 汇总信息
 */
export function generateSummary(results, startPort, endPort) {
    const occupied = getOccupiedPorts(results);
    const free = getFreePorts(results);
    
    return {
        scanTime: new Date().toISOString(),
        portRange: {
            start: startPort,
            end: endPort,
            total: endPort - startPort + 1
        },
        statistics: {
            occupied: occupied.length,
            free: free.length,
            occupancyRate: ((occupied.length / results.length) * 100).toFixed(2) + '%'
        },
        occupiedPorts: occupied.map(r => ({
            port: r.port,
            command: r.processes && r.processes.length > 0 ? r.processes[0].command : 'unknown',
            pid: r.processes && r.processes.length > 0 ? r.processes[0].pid : null
        })),
        commonCommands: getCommonCommands(occupied)
    };
}

/**
 * 统计常见的命令
 * @param {Array} occupiedResults - 占用端口的结果列表
 * @returns {Array} 常见命令统计
 */
function getCommonCommands(occupiedResults) {
    const commandCount = {};
    
    occupiedResults.forEach(result => {
        if (result.processes && result.processes.length > 0) {
            const cmd = result.processes[0].command.split(' ')[0]; // 只取命令名
            commandCount[cmd] = (commandCount[cmd] || 0) + 1;
        }
    });
    
    return Object.entries(commandCount)
        .map(([command, count]) => ({ command, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // 前 10 个
}

/**
 * 打印扫描进度
 * @param {Object} progress - 进度信息
 */
export function printProgress(progress) {
    const barLength = 30;
    const filledLength = Math.round((barLength * progress.scanned) / progress.total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    // 清除当前行并写入进度
    process.stdout.write(`\r\x1b[K扫描进度：[${bar}] ${progress.percent}% (${progress.scanned}/${progress.total}) - 已发现 ${progress.occupied} 个占用端口`);
}

/**
 * 打印扫描结果汇总
 * @param {Object} summary - 汇总信息
 */
export function printSummary(summary) {
    console.log('\n\n════════════════════════════════════════════════════════════');
    console.log('  📊 端口扫描汇总');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`  端口范围：${summary.portRange.start} - ${summary.portRange.end} (共 ${summary.portRange.total} 个端口)`);
    console.log(`  🔴 占用端口：${summary.statistics.occupied}`);
    console.log(`  🟢 空闲端口：${summary.statistics.free}`);
    console.log(`  📈 占用率：${summary.statistics.occupancyRate}`);
    console.log('════════════════════════════════════════════════════════════');

    if (summary.occupiedPorts.length > 0) {
        console.log('\n  📋 占用端口列表:\n');
        summary.occupiedPorts.forEach(item => {
            console.log(`    ${item.port}: ${item.command}`);
        });
    }

    if (summary.commonCommands.length > 0) {
        console.log('\n  🔍 常见进程:\n');
        summary.commonCommands.forEach(item => {
            console.log(`    ${item.command}: ${item.count} 个端口`);
        });
    }

    console.log('\n════════════════════════════════════════════════════════════\n');
}

/**
 * 打印扫描结果汇总（返回字符串）
 * @param {Object} summary - 汇总信息
 * @returns {string} 汇总信息字符串
 */
export function printSummaryToString(summary) {
    let output = '\n\n════════════════════════════════════════════════════════════\n';
    output += '  📊 端口扫描汇总\n';
    output += '════════════════════════════════════════════════════════════\n';
    output += `  端口范围：${summary.portRange.start} - ${summary.portRange.end} (共 ${summary.portRange.total} 个端口)\n`;
    output += `  🔴 占用端口：${summary.statistics.occupied}\n`;
    output += `  🟢 空闲端口：${summary.statistics.free}\n`;
    output += `  📈 占用率：${summary.statistics.occupancyRate}\n`;
    output += '════════════════════════════════════════════════════════════\n';

    if (summary.occupiedPorts.length > 0) {
        output += '\n  📋 占用端口列表:\n\n';
        summary.occupiedPorts.forEach(item => {
            output += `    ${item.port}: ${item.command}\n`;
        });
    }

    if (summary.commonCommands.length > 0) {
        output += '\n  🔍 常见进程:\n\n';
        summary.commonCommands.forEach(item => {
            output += `    ${item.command}: ${item.count} 个端口\n`;
        });
    }

    output += '\n════════════════════════════════════════════════════════════\n';
    
    return output;
}

export default {
    scanSinglePort,
    scanPortRange,
    getOccupiedPorts,
    getFreePorts,
    formatAsTable,
    formatAsJson,
    formatAsSimple,
    generateSummary,
    printProgress,
    printSummary,
    printSummaryToString
};
