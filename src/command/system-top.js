/**
 * 系统资源占用查询工具 - 类似 top 命令
 * @module src/command/system-top
 */

import { execSync } from 'child_process';

/**
 * 获取系统进程信息
 * @param {string} sortBy - 排序方式：'cpu' | 'memory' | 'pid'
 * @param {number} limit - 返回进程数量
 * @returns {Array} 进程列表
 */
export function getProcessList(sortBy = 'memory', limit = 10) {
    try {
        // 使用 ps 命令获取进程信息
        // -axo: 所有进程，自定义输出格式
        // pid,command,%cpu,%mem,rss,vsz,user,state,start,time
        const output = execSync(
            `ps -axo pid,command,%cpu,%mem,rss,vsz,user,state | head -n ${limit + 1}`,
            { encoding: 'utf-8' }
        );

        const lines = output.trim().split('\n');
        const header = lines[0];
        const dataLines = lines.slice(1);

        const processes = dataLines.map(line => {
            // 解析 ps 输出（注意命令可能包含空格）
            const parts = line.trim().split(/\s+/);
            if (parts.length < 8) return null;

            const pid = parts[0];
            const cpu = parseFloat(parts[2]) || 0;
            const mem = parseFloat(parts[3]) || 0;
            const rss = parseInt(parts[4]) || 0; // KB
            const vsz = parseInt(parts[5]) || 0; // KB
            const user = parts[6];
            const state = parts[7];
            
            // 命令是剩余的所有部分
            const command = parts.slice(1, 2).join(' ') || 'unknown';

            return {
                pid: parseInt(pid),
                command,
                cpu,
                mem,
                rss,
                vsz,
                user,
                state,
                rssMB: (rss / 1024).toFixed(2), // 转换为 MB
                vszMB: (vsz / 1024).toFixed(2)
            };
        }).filter(Boolean);

        // 排序
        if (sortBy === 'cpu') {
            processes.sort((a, b) => b.cpu - a.cpu);
        } else if (sortBy === 'memory') {
            processes.sort((a, b) => b.mem - a.mem);
        } else if (sortBy === 'pid') {
            processes.sort((a, b) => a.pid - b.pid);
        }

        return processes.slice(0, limit);
    } catch (err) {
        console.error('获取进程信息失败:', err.message);
        return [];
    }
}

/**
 * 获取系统内存信息
 * @returns {Object} 内存信息
 */
export function getMemoryInfo() {
    try {
        // macOS 使用 vm_stat
        const isMac = process.platform === 'darwin';
        
        if (isMac) {
            const pageSize = 4096; // 默认页面大小
            const vmStatOutput = execSync('vm_stat', { encoding: 'utf-8' });
            
            const parseValue = (line) => {
                const match = line.match(/:\s*([\d\.]+)/);
                return match ? parseFloat(match[1]) * pageSize : 0;
            };

            const lines = vmStatOutput.split('\n');
            const freeMem = parseValue(lines.find(l => l.includes('free')) || '');
            const activeMem = parseValue(lines.find(l => l.includes('active')) || '');
            const inactiveMem = parseValue(lines.find(l => l.includes('inactive')) || '');
            const wiredMem = parseValue(lines.find(l => l.includes('wired')) || '');
            const compressedMem = parseValue(lines.find(l => l.includes('compressed')) || '');

            const totalMem = activeMem + inactiveMem + wiredMem + compressedMem + freeMem;
            const usedMem = totalMem - freeMem;

            return {
                total: totalMem,
                used: usedMem,
                free: freeMem,
                active: activeMem,
                inactive: inactiveMem,
                wired: wiredMem,
                compressed: compressedMem,
                totalMB: (totalMem / 1024 / 1024).toFixed(2),
                usedMB: (usedMem / 1024 / 1024).toFixed(2),
                freeMB: (freeMem / 1024 / 1024).toFixed(2),
                usagePercent: ((usedMem / totalMem) * 100).toFixed(2)
            };
        } else {
            // Linux 使用 /proc/meminfo
            const meminfoOutput = execSync('cat /proc/meminfo', { encoding: 'utf-8' });
            const lines = meminfoOutput.split('\n');
            
            const parseMemInfo = (name) => {
                const line = lines.find(l => l.includes(name));
                if (line) {
                    const match = line.match(/:\s*(\d+)/);
                    return match ? parseInt(match[1]) * 1024 : 0; // KB to Bytes
                }
                return 0;
            };

            const totalMem = parseMemInfo('MemTotal');
            const freeMem = parseMemInfo('MemFree');
            const availableMem = parseMemInfo('MemAvailable') || freeMem;
            const usedMem = totalMem - availableMem;

            return {
                total: totalMem,
                used: usedMem,
                free: freeMem,
                available: availableMem,
                totalMB: (totalMem / 1024 / 1024).toFixed(2),
                usedMB: (usedMem / 1024 / 1024).toFixed(2),
                freeMB: (freeMem / 1024 / 1024).toFixed(2),
                usagePercent: ((usedMem / totalMem) * 100).toFixed(2)
            };
        }
    } catch (err) {
        return {
            error: err.message,
            totalMB: 'N/A',
            usedMB: 'N/A',
            freeMB: 'N/A',
            usagePercent: 'N/A'
        };
    }
}

/**
 * 获取 CPU 信息
 * @returns {Object} CPU 信息
 */
export function getCpuInfo() {
    try {
        const isMac = process.platform === 'darwin';
        
        if (isMac) {
            // macOS 获取 CPU 核心数
            const coresOutput = execSync('sysctl -n hw.ncpu', { encoding: 'utf-8' });
            const physicalCoresOutput = execSync('sysctl -n hw.physicalcpu', { encoding: 'utf-8' });
            
            return {
                cores: parseInt(coresOutput.trim()),
                physicalCores: parseInt(physicalCoresOutput.trim()),
                model: 'Apple Silicon / Intel'
            };
        } else {
            // Linux 获取 CPU 信息
            const nprocOutput = execSync('nproc', { encoding: 'utf-8' });
            
            return {
                cores: parseInt(nprocOutput.trim()),
                physicalCores: parseInt(nprocOutput.trim()),
                model: 'Unknown'
            };
        }
    } catch (err) {
        return {
            error: err.message,
            cores: 'N/A',
            physicalCores: 'N/A'
        };
    }
}

/**
 * 获取系统负载信息
 * @returns {Object} 负载信息
 */
export function getLoadAverage() {
    try {
        const isMac = process.platform === 'darwin';
        
        if (isMac) {
            // macOS 获取 CPU 核心数
            const coresOutput = execSync('sysctl -n hw.ncpu', { encoding: 'utf-8' });
            
            // macOS 使用 uptime 获取负载
            const uptimeOutput = execSync('uptime', { encoding: 'utf-8' });
            // 解析输出：... load averages: 1.23, 2.34, 3.45
            const match = uptimeOutput.match(/load averages?:\s*([\d\.]+),\s*([\d\.]+),\s*([\d\.]+)/);
            
            if (match) {
                return {
                    load1: parseFloat(match[1]),
                    load5: parseFloat(match[2]),
                    load15: parseFloat(match[3])
                };
            }
        } else {
            // Linux
            const loadavgOutput = execSync('cat /proc/loadavg', { encoding: 'utf-8' });
            const parts = loadavgOutput.trim().split(/\s+/);
            
            return {
                load1: parseFloat(parts[0]),
                load5: parseFloat(parts[1]),
                load15: parseFloat(parts[2])
            };
        }
    } catch (err) {
        // 返回默认值
        return {
            load1: 0,
            load5: 0,
            load15: 0
        };
    }
}

/**
 * 格式化进程列表为表格
 * @param {Array} processes - 进程列表
 * @param {Object} options - 选项
 * @returns {string} 表格字符串
 */
export function formatProcessTable(processes, options = {}) {
    const { showRank = true, colorize = true } = options;
    
    if (processes.length === 0) {
        return '没有找到进程。';
    }

    // 表格头部
    let output = '\n';
    output += '┌───────┬──────────┬─────────┬──────────┬───────────┬───────────┬────────┬─────────┐\n';
    output += '│ 排名  │ PID      │ CPU %   │ Memory % │ RSS (MB)  │ VSZ (MB)  │ 用户   │ 命令    │\n';
    output += '├───────┼──────────┼─────────┼──────────┼───────────┼───────────┼────────┼─────────┤\n';

    // 表格内容
    processes.forEach((proc, index) => {
        const rank = showRank ? (index + 1).toString().padStart(3) : '   ';
        const pid = proc.pid.toString().padStart(8);
        const cpu = proc.cpu.toFixed(1).padStart(7);
        const mem = proc.mem.toFixed(1).padStart(8);
        const rss = proc.rssMB.padStart(9);
        const vsz = proc.vszMB.padStart(9);
        const user = (proc.user || '-').padStart(6);
        
        // 截断命令
        let command = proc.command || 'unknown';
        if (command.length > 8) {
            command = command.substring(0, 7) + '…';
        }
        command = command.padEnd(8);

        output += `│ ${rank}  │ ${pid} │ ${cpu} │ ${mem} │ ${rss} │ ${vsz} │ ${user} │ ${command} │\n`;
    });

    // 表格尾部
    output += '└───────┴──────────┴─────────┴──────────┴───────────┴───────────┴────────┴─────────┘\n';

    return output;
}

/**
 * 格式化系统信息
 * @param {Object} memoryInfo - 内存信息
 * @param {Object} cpuInfo - CPU 信息
 * @param {Object} loadInfo - 负载信息
 * @returns {string} 格式化的系统信息
 */
export function formatSystemInfo(memoryInfo, cpuInfo, loadInfo) {
    let output = '\n';
    output += '════════════════════════════════════════════════════════════\n';
    output += '  📊 系统资源概览\n';
    output += '════════════════════════════════════════════════════════════\n';
    
    // CPU 信息
    output += `  🖥️  CPU: ${cpuInfo?.cores || 'N/A'} 核心`;
    if (cpuInfo?.physicalCores && cpuInfo.cores !== cpuInfo.physicalCores) {
        output += ` (物理：${cpuInfo.physicalCores})`;
    }
    output += '\n';
    
    // 内存信息
    output += `  💾  内存：${memoryInfo?.usedMB || 'N/A'} MB / ${memoryInfo?.totalMB || 'N/A'} MB`;
    if (memoryInfo?.usagePercent && memoryInfo.usagePercent !== 'N/A') {
        output += ` (${memoryInfo.usagePercent}%)`;
    }
    output += '\n';
    
    // 内存使用进度条
    const usagePercent = memoryInfo?.usagePercent ? parseFloat(memoryInfo.usagePercent) : 0;
    const barLength = 30;
    const filledLength = Math.round((barLength * usagePercent) / 100);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    output += `      [${bar}] ${usagePercent.toFixed(1)}%\n`;
    
    // 系统负载
    if (loadInfo && loadInfo.load1 !== undefined && loadInfo.load1 !== 0) {
        output += `  📈  系统负载：${loadInfo.load1} (1 分钟), ${loadInfo.load5} (5 分钟), ${loadInfo.load15} (15 分钟)\n`;
    }
    
    output += '════════════════════════════════════════════════════════════\n';
    
    return output;
}

/**
 * 格式化为 JSON
 * @param {Array} processes - 进程列表
 * @param {Object} systemInfo - 系统信息
 * @returns {string} JSON 字符串
 */
export function formatAsJson(processes, systemInfo = null) {
    const output = {
        timestamp: new Date().toISOString(),
        system: systemInfo,
        processes
    };
    
    return JSON.stringify(output, null, 2);
}

export default {
    getProcessList,
    getMemoryInfo,
    getCpuInfo,
    getLoadAverage,
    formatProcessTable,
    formatSystemInfo,
    formatAsJson
};
