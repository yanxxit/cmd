/**
 * 系统资源占用查询工具 - 类似 top 命令
 * 使用 shelljs 集成 ps、top、htop 等系统工具
 * @module src/command/system-top
 */

import shell from 'shelljs';
import os from 'os';

/**
 * 执行 shell 命令
 * @param {string} command - 命令
 * @returns {string|null} 执行结果
 */
function execCommand(command) {
    try {
        const result = shell.exec(command, { silent: true, encoding: 'utf-8' });
        if (result.code === 0) {
            return result.stdout;
        }
        return null;
    } catch (err) {
        console.error(`执行命令失败：${command}`, err.message);
        return null;
    }
}

/**
 * 获取系统进程信息（增强版）
 * @param {string} sortBy - 排序方式：'cpu' | 'memory' | 'pid' | 'time'
 * @param {number} limit - 返回进程数量
 * @param {boolean} detailed - 是否详细信息
 * @returns {Array} 进程列表
 */
export function getProcessList(sortBy = 'memory', limit = 10, detailed = false) {
    try {
        let psCommand;
        
        if (detailed) {
            // 详细信息模式
            psCommand = `ps -axo pid,ppid,user,%cpu,%mem,vsz,rss,stat,start,time,command | head -n ${limit + 1}`;
        } else {
            // 普通模式
            psCommand = `ps -axo pid,command,%cpu,%mem,rss,vsz,user,state | head -n ${limit + 1}`;
        }
        
        const output = execCommand(psCommand);
        if (!output) return [];

        const lines = output.trim().split('\n');
        const dataLines = lines.slice(1); // 跳过表头

        const processes = dataLines.map(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 6) return null;

            const isDetailed = detailed;
            
            if (isDetailed) {
                // 详细信息解析
                const pid = parseInt(parts[0]);
                const ppid = parseInt(parts[1]);
                const user = parts[2];
                const cpu = parseFloat(parts[3]) || 0;
                const mem = parseFloat(parts[4]) || 0;
                const vsz = parseInt(parts[5]) || 0;
                const rss = parseInt(parts[6]) || 0;
                const stat = parts[7];
                const start = parts[8];
                const time = parts[9];
                const command = parts.slice(10).join(' ') || 'unknown';

                return {
                    pid,
                    ppid,
                    command,
                    cpu,
                    mem,
                    rss,
                    vsz,
                    user,
                    state: stat,
                    start,
                    time,
                    rssMB: (rss / 1024).toFixed(2),
                    vszMB: (vsz / 1024).toFixed(2),
                    ...analyzeProcess(command, pid)
                };
            } else {
                // 普通信息解析
                const pid = parseInt(parts[0]);
                const cpu = parseFloat(parts[2]) || 0;
                const mem = parseFloat(parts[3]) || 0;
                const rss = parseInt(parts[4]) || 0;
                const vsz = parseInt(parts[5]) || 0;
                const user = parts[6];
                const state = parts[7];
                const command = parts.slice(1, 2).join(' ') || 'unknown';

                return {
                    pid,
                    command,
                    cpu,
                    mem,
                    rss,
                    vsz,
                    user,
                    state,
                    rssMB: (rss / 1024).toFixed(2),
                    vszMB: (vsz / 1024).toFixed(2),
                    ...analyzeProcess(command, pid)
                };
            }
        }).filter(Boolean);

        // 排序
        if (sortBy === 'cpu') {
            processes.sort((a, b) => b.cpu - a.cpu);
        } else if (sortBy === 'memory') {
            processes.sort((a, b) => b.mem - b.mem);
        } else if (sortBy === 'pid') {
            processes.sort((a, b) => a.pid - b.pid);
        } else if (sortBy === 'time') {
            processes.sort((a, b) => parseTime(b.time || '0:00') - parseTime(a.time || '0:00'));
        }

        return processes.slice(0, limit);
    } catch (err) {
        console.error('获取进程信息失败:', err.message);
        return [];
    }
}

/**
 * 解析进程运行时间
 * @param {string} timeStr - 时间字符串（格式：[[DD-]hh:]mm:ss）
 * @returns {number} 秒数
 */
function parseTime(timeStr) {
    if (!timeStr) return 0;
    
    const parts = timeStr.split('-');
    let days = 0;
    let timePart = parts[0];
    
    if (parts.length > 1) {
        days = parseInt(parts[0]) || 0;
        timePart = parts[1];
    }
    
    const timeParts = timePart.split(':').map(p => parseInt(p) || 0);
    
    let seconds = 0;
    if (timeParts.length === 3) {
        seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
    } else if (timeParts.length === 2) {
        seconds = timeParts[0] * 60 + timeParts[1];
    }
    
    return days * 86400 + seconds;
}

/**
 * 分析进程类型和特征
 * @param {string} command - 进程命令
 * @param {number} pid - 进程 ID
 * @returns {Object} 分析结果
 */
export function analyzeProcess(command, pid) {
    const analysis = {
        category: 'unknown',
        type: 'unknown',
        isSystem: false,
        isUser: false,
        isService: false,
        isDevelopment: false,
        riskLevel: 'low'
    };

    if (!command) return analysis;

    const cmd = command.toLowerCase();

    // 系统进程
    const systemPatterns = [
        'kernel', 'init', 'systemd', 'launchd', 'kernel_task', 'WindowServer',
        'loginwindow', 'coreaudiod', 'coreservices', 'configd', 'opendirectoryd'
    ];
    
    // 开发工具
    const devPatterns = [
        'node', 'npm', 'yarn', 'pnpm', 'webpack', 'vite', 'rollup',
        'typescript', 'tsc', 'babel', 'eslint', 'prettier',
        'code', 'sublime', 'atom', 'vim', 'emacs', 'nano',
        'git', 'docker', 'kubectl', 'terraform', 'ansible',
        'python', 'pip', 'ruby', 'gem', 'java', 'gradle', 'maven'
    ];
    
    // 服务进程
    const servicePatterns = [
        'nginx', 'apache', 'httpd', 'mysql', 'postgres', 'mongodb',
        'redis', 'memcached', 'elasticsearch', 'rabbitmq', 'kafka',
        'ssh', 'sshd', 'cron', 'atd', 'dbus'
    ];
    
    // 浏览器
    const browserPatterns = [
        'chrome', 'firefox', 'safari', 'edge', 'opera', 'chromium',
        'electron'
    ];

    // 分类判断
    if (systemPatterns.some(p => cmd.includes(p))) {
        analysis.category = 'system';
        analysis.type = 'system_process';
        analysis.isSystem = true;
        analysis.riskLevel = 'safe';
    } else if (devPatterns.some(p => cmd.includes(p))) {
        analysis.category = 'development';
        analysis.type = 'dev_tool';
        analysis.isDevelopment = true;
        analysis.isUser = true;
    } else if (servicePatterns.some(p => cmd.includes(p))) {
        analysis.category = 'service';
        analysis.type = 'background_service';
        analysis.isService = true;
    } else if (browserPatterns.some(p => cmd.includes(p))) {
        analysis.category = 'browser';
        analysis.type = 'web_browser';
        analysis.isUser = true;
    } else if (cmd.includes('bash') || cmd.includes('zsh') || cmd.includes('sh')) {
        analysis.category = 'shell';
        analysis.type = 'shell_process';
        analysis.isUser = true;
    } else {
        analysis.category = 'application';
        analysis.type = 'user_application';
        analysis.isUser = true;
    }

    // 风险评估（基于资源占用）
    if (cmd.includes('sudo') || cmd.includes('root')) {
        analysis.riskLevel = 'medium';
    }

    return analysis;
}

/**
 * 获取系统内存信息（增强版）
 * @returns {Object} 内存信息
 */
export function getMemoryInfo() {
    try {
        const isMac = process.platform === 'darwin';
        
        if (isMac) {
            // macOS 使用 vm_stat
            const pageSize = 4096;
            const vmStatOutput = execCommand('vm_stat');
            
            if (!vmStatOutput) {
                // 备用方案：使用 top 命令
                return getMemoryFromTop();
            }
            
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
            const meminfoOutput = execCommand('cat /proc/meminfo');
            if (!meminfoOutput) return getMemoryFromTop();
            
            const lines = meminfoOutput.split('\n');
            
            const parseMemInfo = (name) => {
                const line = lines.find(l => l.includes(name));
                if (line) {
                    const match = line.match(/:\s*(\d+)/);
                    return match ? parseInt(match[1]) * 1024 : 0;
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
        return getMemoryFromTop();
    }
}

/**
 * 从 top 命令获取内存信息（备用方案）
 * @returns {Object} 内存信息
 */
function getMemoryFromTop() {
    try {
        const isMac = process.platform === 'darwin';
        
        if (isMac) {
            const topOutput = execCommand('top -l 1 | grep -i "PhysMem"');
            if (topOutput) {
                // 解析：PhysMem: 8256M used (1024M wired), 1024M unused
                const match = topOutput.match(/(\d+)M\s+used.*?(\d+)M\s+unused/);
                if (match) {
                    const used = parseInt(match[1]) * 1024 * 1024;
                    const free = parseInt(match[2]) * 1024 * 1024;
                    const total = used + free;
                    return {
                        total,
                        used,
                        free,
                        totalMB: (total / 1024 / 1024).toFixed(2),
                        usedMB: (used / 1024 / 1024).toFixed(2),
                        freeMB: (free / 1024 / 1024).toFixed(2),
                        usagePercent: ((used / total) * 100).toFixed(2)
                    };
                }
            }
        }
    } catch (err) {
        // 忽略错误
    }
    
    // 返回系统信息
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    
    return {
        total,
        used,
        free,
        totalMB: (total / 1024 / 1024).toFixed(2),
        usedMB: (used / 1024 / 1024).toFixed(2),
        freeMB: (free / 1024 / 1024).toFixed(2),
        usagePercent: ((used / total) * 100).toFixed(2)
    };
}

/**
 * 获取 CPU 信息（增强版）
 * @returns {Object} CPU 信息
 */
export function getCpuInfo() {
    try {
        const isMac = process.platform === 'darwin';
        
        if (isMac) {
            const coresOutput = execCommand('sysctl -n hw.ncpu');
            const physicalCoresOutput = execCommand('sysctl -n hw.physicalcpu');
            const modelOutput = execCommand('sysctl -n machdep.cpu.brand_string');
            
            return {
                cores: parseInt(coresOutput?.trim()) || os.cpus().length,
                physicalCores: parseInt(physicalCoresOutput?.trim()) || os.cpus().length,
                model: modelOutput?.trim() || 'Apple Silicon / Intel',
                speed: os.cpus()[0]?.speed || 0,
                usage: getCpuUsage()
            };
        } else {
            const nprocOutput = execCommand('nproc');
            
            return {
                cores: parseInt(nprocOutput?.trim()) || os.cpus().length,
                physicalCores: parseInt(nprocOutput?.trim()) || os.cpus().length,
                model: os.cpus()[0]?.model || 'Unknown',
                speed: os.cpus()[0]?.speed || 0,
                usage: getCpuUsage()
            };
        }
    } catch (err) {
        return {
            cores: os.cpus().length,
            physicalCores: os.cpus().length,
            model: os.cpus()[0]?.model || 'Unknown',
            speed: os.cpus()[0]?.speed || 0
        };
    }
}

/**
 * 获取 CPU 使用率（通过 top 命令）
 * @returns {number} CPU 使用率百分比
 */
export function getCpuUsage() {
    try {
        const isMac = process.platform === 'darwin';
        
        if (isMac) {
            const topOutput = execCommand("top -l 1 | grep 'CPU usage'");
            if (topOutput) {
                // 解析：CPU usage: 15.23% user, 8.45% sys, 76.31% idle
                const match = topOutput.match(/user:\s*([\d.]+)%/);
                if (match) {
                    return parseFloat(match[1]);
                }
            }
        } else {
            // Linux 使用 top
            const topOutput = execCommand("top -bn1 | grep 'Cpu(s)'");
            if (topOutput) {
                const match = topOutput.match(/(\d+\.?\d*)\s*us/);
                if (match) {
                    return parseFloat(match[1]);
                }
            }
        }
    } catch (err) {
        // 忽略错误
    }
    
    return 0;
}

/**
 * 获取系统负载信息
 * @returns {Object} 负载信息
 */
export function getLoadAverage() {
    try {
        const isMac = process.platform === 'darwin';
        
        if (isMac) {
            const coresOutput = execCommand('sysctl -n hw.ncpu');
            const uptimeOutput = execCommand('uptime');
            
            if (uptimeOutput) {
                const match = uptimeOutput.match(/load averages?:\s*([\d\.]+),\s*([\d\.]+),\s*([\d\.]+)/);
                
                if (match) {
                    const load1 = parseFloat(match[1]);
                    const load5 = parseFloat(match[2]);
                    const load15 = parseFloat(match[3]);
                    const cores = parseInt(coresOutput?.trim()) || 1;
                    
                    return {
                        load1,
                        load5,
                        load15,
                        cores,
                        loadPercent1: ((load1 / cores) * 100).toFixed(2),
                        loadPercent5: ((load5 / cores) * 100).toFixed(2),
                        loadPercent15: ((load15 / cores) * 100).toFixed(2)
                    };
                }
            }
        } else {
            const loadavgOutput = execCommand('cat /proc/loadavg');
            const nprocOutput = execCommand('nproc');
            
            if (loadavgOutput) {
                const parts = loadavgOutput.trim().split(/\s+/);
                const cores = parseInt(nprocOutput?.trim()) || 1;
                
                return {
                    load1: parseFloat(parts[0]),
                    load5: parseFloat(parts[1]),
                    load15: parseFloat(parts[2]),
                    cores,
                    loadPercent1: ((parseFloat(parts[0]) / cores) * 100).toFixed(2),
                    loadPercent5: ((parseFloat(parts[1]) / cores) * 100).toFixed(2),
                    loadPercent15: ((parseFloat(parts[2]) / cores) * 100).toFixed(2)
                };
            }
        }
    } catch (err) {
        // 返回默认值
    }
    
    return {
        load1: os.loadavg()[0],
        load5: os.loadavg()[1],
        load15: os.loadavg()[2],
        cores: os.cpus().length
    };
}

/**
 * 获取进程树信息
 * @param {number} pid - 进程 ID
 * @returns {Array} 子进程列表
 */
export function getProcessTree(pid) {
    try {
        const output = execCommand(`pgrep -P ${pid}`);
        if (!output) return [];
        
        const children = output.trim().split('\n').map(p => parseInt(p.trim()));
        const result = [];
        
        for (const childPid of children) {
            const psOutput = execCommand(`ps -p ${childPid} -o pid,command,%cpu,%mem --no-headers`);
            if (psOutput) {
                const parts = psOutput.trim().split(/\s+/);
                result.push({
                    pid: childPid,
                    command: parts.slice(1).join(' ') || 'unknown',
                    cpu: parseFloat(parts[2]) || 0,
                    mem: parseFloat(parts[3]) || 0,
                    children: getProcessTree(childPid)
                });
            }
        }
        
        return result;
    } catch (err) {
        return [];
    }
}

/**
 * 获取系统资源统计汇总
 * @param {boolean} enableLogging - 是否启用日志
 * @returns {Object} 统计信息
 */
export function getResourceStats(enableLogging = false) {
    try {
        const allProcesses = getProcessList('memory', 1000, false);
        
        if (enableLogging) {
            console.log('\n[LOGGER] ========== 开始资源统计 ==========' );
            console.log(`[LOGGER] 获取到进程总数：${allProcesses.length}`);
        }
        
        const stats = {
            total: allProcesses.length,
            byCategory: {},
            byUser: {},
            topMemoryUsers: [],
            topCpuUsers: [],
            totalMemory: 0,
            totalCpu: 0
        };
        
        // 详细日志：进程分类统计
        if (enableLogging) {
            console.log('\n[LOGGER] 开始逐个处理进程...');
        }
        
        allProcesses.forEach((proc, index) => {
            // 按分类统计
            const category = proc.category || 'unknown';
            if (!stats.byCategory[category]) {
                stats.byCategory[category] = { count: 0, memory: 0, cpu: 0 };
                if (enableLogging) {
                    console.log(`[LOGGER] [进程 #${index}] 发现新分类：${category}`);
                }
            }
            stats.byCategory[category].count++;
            stats.byCategory[category].memory += parseFloat(proc.mem) || 0;
            stats.byCategory[category].cpu += parseFloat(proc.cpu) || 0;
            
            if (enableLogging && index < 10) {
                console.log(`[LOGGER] [进程 #${index}] PID:${proc.pid} 分类:${category} CPU:${proc.cpu}% MEM:${proc.mem}%`);
            }
            
            // 按用户统计
            const user = proc.user || 'unknown';
            if (!stats.byUser[user]) {
                stats.byUser[user] = { count: 0, memory: 0, cpu: 0 };
                if (enableLogging) {
                    console.log(`[LOGGER] [进程 #${index}] 发现新用户：${user}`);
                }
            }
            stats.byUser[user].count++;
            stats.byUser[user].memory += parseFloat(proc.mem) || 0;
            stats.byUser[user].cpu += parseFloat(proc.cpu) || 0;
            
            stats.totalMemory += parseFloat(proc.mem) || 0;
            stats.totalCpu += parseFloat(proc.cpu) || 0;
        });
        
        if (enableLogging) {
            console.log('\n[LOGGER] ========== 分类统计结果 ==========');
            Object.entries(stats.byCategory).forEach(([cat, data]) => {
                console.log(`[LOGGER] 分类：${cat.padEnd(15)} | 数量：${data.count.toString().padStart(3)} | CPU: ${data.cpu.toFixed(1).padStart(6)}% | MEM: ${data.memory.toFixed(1).padStart(6)}%`);
            });
            
            console.log('\n[LOGGER] ========== 用户统计结果 ==========');
            Object.entries(stats.byUser).forEach(([user, data]) => {
                console.log(`[LOGGER] 用户：${user.padEnd(15)} | 数量：${data.count.toString().padStart(3)} | CPU: ${data.cpu.toFixed(1).padStart(6)}% | MEM: ${data.memory.toFixed(1).padStart(6)}%`);
            });
            
            console.log('\n[LOGGER] ========== 总计 ==========');
            console.log(`[LOGGER] 总进程数：${stats.total}`);
            console.log(`[LOGGER] 总 CPU 使用：${stats.totalCpu.toFixed(1)}%`);
            console.log(`[LOGGER] 总内存使用：${stats.totalMemory.toFixed(1)}%`);
            console.log(`[LOGGER] ====================================\n`);
        }
        
        // 找出资源占用最多的用户
        stats.topMemoryUsers = Object.entries(stats.byUser)
            .map(([user, data]) => ({ user, ...data }))
            .sort((a, b) => b.memory - a.memory)
            .slice(0, 5);
        
        stats.topCpuUsers = Object.entries(stats.byUser)
            .map(([user, data]) => ({ user, ...data }))
            .sort((a, b) => b.cpu - a.cpu)
            .slice(0, 5);
        
        return stats;
    } catch (err) {
        if (enableLogging) {
            console.error('[LOGGER] ❌ 错误:', err.message);
        }
        return { error: err.message };
    }
}

/**
 * 格式化进程列表为表格
 * @param {Array} processes - 进程列表
 * @param {Object} options - 选项
 * @returns {string} 表格字符串
 */
export function formatProcessTable(processes, options = {}) {
    const { showRank = true, colorize = true, showAnalysis = false } = options;
    
    if (processes.length === 0) {
        return '没有找到进程。';
    }

    let output = '\n';
    output += '┌───────┬──────────┬─────────┬──────────┬───────────┬───────────┬────────┬─────────────┐\n';
    output += '│ 排名  │ PID      │ CPU %   │ Memory % │ RSS (MB)  │ VSZ (MB)  │ 用户   │ 命令        │\n';
    output += '├───────┼──────────┼─────────┼──────────┼───────────┼───────────┼────────┼─────────────┤\n';

    processes.forEach((proc, index) => {
        const rank = showRank ? (index + 1).toString().padStart(3) : '   ';
        const pid = proc.pid.toString().padStart(8);
        const cpu = proc.cpu.toFixed(1).padStart(7);
        const mem = proc.mem.toFixed(1).padStart(8);
        const rss = proc.rssMB.padStart(9);
        const vsz = proc.vszMB.padStart(9);
        const user = (proc.user || '-').padStart(6);
        
        let command = proc.command || 'unknown';
        if (command.length > 12) {
            command = command.substring(0, 11) + '…';
        }
        command = command.padEnd(12);

        output += `│ ${rank}  │ ${pid} │ ${cpu} │ ${mem} │ ${rss} │ ${vsz} │ ${user} │ ${command} │\n`;
        
        if (showAnalysis && proc.category) {
            output += `│       │          │         │          │           │           │        │ ↳ ${proc.category} (${proc.type})\n`;
        }
    });

    output += '└───────┴──────────┴─────────┴──────────┴───────────┴───────────┴────────┴─────────────┘\n';

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
    output += '══════════════════════════════════════════════════════════════════\n';
    output += '  📊 系统资源概览\n';
    output += '══════════════════════════════════════════════════════════════════\n';
    
    // CPU 信息
    output += `  🖥️  CPU: ${cpuInfo?.cores || 'N/A'} 核心`;
    if (cpuInfo?.physicalCores && cpuInfo.cores !== cpuInfo.physicalCores) {
        output += ` (物理：${cpuInfo.physicalCores})`;
    }
    if (cpuInfo?.model) {
        output += `\n      型号：${cpuInfo.model}`;
    }
    if (cpuInfo?.usage !== undefined) {
        output += `\n      使用率：${cpuInfo.usage.toFixed(1)}%`;
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
    const barLength = 40;
    const filledLength = Math.round((barLength * usagePercent) / 100);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    output += `      [${bar}] ${usagePercent.toFixed(1)}%\n`;
    
    // 系统负载
    if (loadInfo && loadInfo.load1 !== undefined) {
        output += `  📈  系统负载：${loadInfo.load1} (1 分钟), ${loadInfo.load5} (5 分钟), ${loadInfo.load15} (15 分钟)\n`;
        if (loadInfo.cores) {
            const loadPercent = loadInfo.loadPercent1 || ((loadInfo.load1 / loadInfo.cores) * 100).toFixed(2);
            output += `      负载率：${loadPercent}% (${loadInfo.cores} 核心)\n`;
        }
    }
    
    output += '══════════════════════════════════════════════════════════════════\n';
    
    return output;
}

/**
 * 格式化资源统计信息
 * @param {Object} stats - 统计信息
 * @returns {string} 格式化字符串
 */
export function formatResourceStats(stats) {
    let output = '\n';
    output += '══════════════════════════════════════════════════════════════════\n';
    output += '  📈 进程资源统计分析\n';
    output += '══════════════════════════════════════════════════════════════════\n';
    
    output += `  总进程数：${stats.total}\n`;
    output += `  总 CPU 使用：${stats.totalCpu.toFixed(1)}%\n`;
    output += `  总内存使用：${stats.totalMemory.toFixed(1)}%\n\n`;
    
    // 按分类统计
    output += '  按分类统计:\n';
    output += '  ┌────────────────┬────────┬──────────┬──────────┐\n';
    output += '  │ 分类           │ 数量   │ CPU %    │ Memory % │\n';
    output += '  ├────────────────┼────────┼──────────┼──────────┤\n';
    
    Object.entries(stats.byCategory)
        .sort((a, b) => b[1].memory - a[1].memory)
        .forEach(([category, data]) => {
            const catName = category.padEnd(15);
            const count = data.count.toString().padStart(6);
            const cpu = data.cpu.toFixed(1).padStart(8);
            const mem = data.memory.toFixed(1).padStart(8);
            output += `  │ ${catName} │ ${count} │ ${cpu} │ ${mem} │\n`;
        });
    
    output += '  └────────────────┴────────┴──────────┴──────────┘\n\n';
    
    // 资源占用最多的用户
    output += '  资源占用最多的用户 (Top 5):\n';
    output += '  ┌────────────────┬────────┬──────────┬──────────┐\n';
    output += '  │ 用户           │ 进程数 │ CPU %    │ Memory % │\n';
    output += '  ├────────────────┼────────┼──────────┼──────────┤\n';
    
    stats.topMemoryUsers.forEach(({ user, count, cpu, memory }) => {
        const userName = (user || 'unknown').padEnd(15);
        const countStr = count.toString().padStart(6);
        const cpuStr = cpu.toFixed(1).padStart(8);
        const memStr = memory.toFixed(1).padStart(8);
        output += `  │ ${userName} │ ${countStr} │ ${cpuStr} │ ${memStr} │\n`;
    });
    
    output += '  └────────────────┴────────┴──────────┴──────────┘\n';
    output += '══════════════════════════════════════════════════════════════════\n';
    
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
        processes,
        stats: getResourceStats()
    };
    
    return JSON.stringify(output, null, 2);
}

export default {
    getProcessList,
    getMemoryInfo,
    getCpuInfo,
    getLoadAverage,
    getCpuUsage,
    getProcessTree,
    getResourceStats,
    analyzeProcess,
    formatProcessTable,
    formatSystemInfo,
    formatResourceStats,
    formatAsJson
};
