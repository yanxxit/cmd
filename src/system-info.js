/**
 * 系统信息收集模块
 * 获取 CPU、内存、磁盘、网络等系统信息
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 获取 CPU 信息
 */
export function getCPUInfo() {
  const cpus = os.cpus();
  const cpuInfo = {
    model: cpus[0]?.model || 'Unknown',
    speed: cpus[0]?.speed || 0,
    cores: cpus.length,
    usage: []
  };

  // 计算每个核心的使用率
  cpus.forEach(cpu => {
    const total = cpu.times.idle + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq;
    const idle = cpu.times.idle;
    const usage = total > 0 ? ((total - idle) / total * 100).toFixed(1) : 0;
    cpuInfo.usage.push({
      core: cpu.model,
      usage: parseFloat(usage)
    });
  });

  // 计算平均使用率
  const avgUsage = cpuInfo.usage.reduce((sum, cpu) => sum + cpu.usage, 0) / cpuInfo.usage.length;
  cpuInfo.avgUsage = parseFloat(avgUsage.toFixed(1));

  return cpuInfo;
}

/**
 * 获取内存信息
 */
export function getMemoryInfo() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  return {
    total: formatBytes(total),
    used: formatBytes(used),
    free: formatBytes(free),
    usage: ((used / total) * 100).toFixed(1)
  };
}

/**
 * 获取磁盘信息
 */
export async function getDiskInfo() {
  const platform = os.platform();
  
  try {
    if (platform === 'darwin' || platform === 'linux') {
      // macOS 和 Linux 使用 df 命令
      const { stdout } = await execAsync('df -h /');
      const lines = stdout.trim().split('\n');
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        return {
          total: parts[1],
          used: parts[2],
          free: parts[3],
          usage: parts[4].replace('%', '')
        };
      }
    } else if (platform === 'win32') {
      // Windows 使用 wmic 命令
      const { stdout } = await execAsync('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:list');
      const lines = stdout.trim().split('\n');
      let size = 0, freeSpace = 0;
      lines.forEach(line => {
        if (line.startsWith('Size=')) size = parseInt(line.split('=')[1]);
        if (line.startsWith('FreeSpace=')) freeSpace = parseInt(line.split('=')[1]);
      });
      const used = size - freeSpace;
      return {
        total: formatBytes(size),
        used: formatBytes(used),
        free: formatBytes(freeSpace),
        usage: ((used / size) * 100).toFixed(1)
      };
    }
  } catch (error) {
    console.error('获取磁盘信息失败:', error.message);
  }

  return {
    total: 'Unknown',
    used: 'Unknown',
    free: 'Unknown',
    usage: '0'
  };
}

/**
 * 获取网络信息
 */
export function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const networkInfo = {
    interfaces: [],
    externalIP: '',
    internalIPs: []
  };

  for (const [name, iface] of Object.entries(interfaces)) {
    const addresses = {
      ipv4: [],
      ipv6: []
    };

    iface.forEach(addr => {
      if (addr.family === 'IPv4') {
        addresses.ipv4.push(addr.address);
        if (!addr.internal) {
          networkInfo.internalIPs.push(addr.address);
        }
      } else if (addr.family === 'IPv6') {
        addresses.ipv6.push(addr.address);
      }
    });

    networkInfo.interfaces.push({
      name,
      ...addresses
    });
  }

  // 获取外网 IP（通过查询第一个非内部 IPv4 地址）
  networkInfo.externalIP = networkInfo.internalIPs[0] || '';

  return networkInfo;
}

/**
 * 获取系统信息
 */
export function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    hostname: os.hostname(),
    uptime: formatUptime(os.uptime()),
    loadavg: os.loadavg(),
    user: os.userInfo().username,
    nodeVersion: process.version
  };
}

/**
 * 获取进程信息
 */
export function getProcessInfo() {
  return {
    pid: process.pid,
    ppid: process.ppid,
    cwd: process.cwd(),
    platform: process.platform,
    nodeVersion: process.version,
    memoryUsage: {
      rss: formatBytes(process.memoryUsage().rss),
      heapTotal: formatBytes(process.memoryUsage().heapTotal),
      heapUsed: formatBytes(process.memoryUsage().heapUsed)
    },
    uptime: formatUptime(process.uptime())
  };
}

/**
 * 获取电池信息（仅笔记本电脑）
 */
export async function getBatteryInfo() {
  const platform = os.platform();
  
  try {
    if (platform === 'darwin') {
      const { stdout } = await execAsync('pmset -g batt');
      const match = stdout.match(/(\d+)%/);
      const charging = stdout.includes('charging');
      if (match) {
        return {
          level: parseInt(match[1]),
          charging,
          status: charging ? '充电中' : '使用电池'
        };
      }
    } else if (platform === 'linux') {
      // 尝试读取电池信息
      try {
        const capacity = fs.readFileSync('/sys/class/power_supply/BAT0/capacity', 'utf8').trim();
        const status = fs.readFileSync('/sys/class/power_supply/BAT0/status', 'utf8').trim();
        return {
          level: parseInt(capacity),
          charging: status === 'Charging',
          status: status === 'Charging' ? '充电中' : '使用电池'
        };
      } catch (e) {
        // 没有电池（台式机）
        return null;
      }
    } else if (platform === 'win32') {
      const { stdout } = await execAsync('wmic path Win32_Battery get BatteryStatus,EstimatedChargeRemaining /format:list');
      const lines = stdout.trim().split('\n');
      let level = 0, status = 0;
      lines.forEach(line => {
        if (line.startsWith('EstimatedChargeRemaining=')) level = parseInt(line.split('=')[1]);
        if (line.startsWith('BatteryStatus=')) status = parseInt(line.split('=')[1]);
      });
      if (level > 0) {
        return {
          level,
          charging: status === 2, // 2 表示充电中
          status: status === 2 ? '充电中' : '使用电池'
        };
      }
    }
  } catch (error) {
    console.error('获取电池信息失败:', error.message);
  }

  return null;
}

/**
 * 获取 WiFi 信息
 */
export async function getWiFiInfo() {
  const platform = os.platform();
  
  try {
    if (platform === 'darwin') {
      // 尝试 airport 命令
      try {
        const { stdout } = await execAsync('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I');
        const ssidMatch = stdout.match(/SSID:\s*(.+)/);
        if (ssidMatch && ssidMatch[1].trim() !== '<redacted>') {
          return {
            ssid: ssidMatch[1].trim(),
            platform: 'macOS'
          };
        }
      } catch (e) {
        // airport 命令不可用
      }

      // 尝试 system_profiler
      try {
        const { stdout } = await execAsync('system_profiler SPAirPortDataType -json');
        const data = JSON.parse(stdout);
        const airportData = data?.SPAirPortDataType?.[0];
        const interfaces = airportData?.spairport_airport_interfaces?.[0];
        
        if (interfaces?.spairport_status_information === 'spairport_status_connected') {
          const currentNetwork = interfaces.spairport_current_network_information;
          if (currentNetwork?._name && currentNetwork._name !== '<redacted>') {
            return {
              ssid: currentNetwork._name,
              platform: 'macOS'
            };
          }
        }
      } catch (e) {
        // system_profiler 不可用
      }

      return {
        ssid: '已连接（SSID 被系统隐藏）',
        platform: 'macOS'
      };
    } else if (platform === 'windows') {
      const { stdout } = await execAsync('netsh wlan show interfaces');
      const ssidMatch = stdout.match(/SSID\s*:\s*(.+)/);
      if (ssidMatch) {
        return {
          ssid: ssidMatch[1].trim(),
          platform: 'Windows'
        };
      }
    } else if (platform === 'linux') {
      try {
        const { stdout } = await execAsync('iwgetid -r');
        if (stdout.trim()) {
          return {
            ssid: stdout.trim(),
            platform: 'Linux'
          };
        }
      } catch (e) {
        // iwgetid 不可用
      }
    }
  } catch (error) {
    console.error('获取 WiFi 信息失败:', error.message);
  }

  return {
    ssid: '未连接',
    platform: platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : 'Linux'
  };
}

/**
 * 获取所有系统信息
 */
export async function getAllSystemInfo() {
  const [
    system,
    cpu,
    memory,
    disk,
    network,
    proc,
    battery,
    wifi
  ] = await Promise.all([
    Promise.resolve(getSystemInfo()),
    Promise.resolve(getCPUInfo()),
    Promise.resolve(getMemoryInfo()),
    getDiskInfo(),
    Promise.resolve(getNetworkInfo()),
    Promise.resolve(getProcessInfo()),
    getBatteryInfo(),
    getWiFiInfo()
  ]);

  return {
    system,
    cpu,
    memory,
    disk,
    network,
    process: proc,
    battery,
    wifi,
    timestamp: new Date().toISOString()
  };
}

// 系统负载历史记录（用于图表）
const loadHistory = [];
const MAX_HISTORY = 60; // 保留 60 条记录

/**
 * 获取带历史数据的系统信息
 */
export async function getAllSystemInfoWithHistory() {
  const info = await getAllSystemInfo();
  
  // 添加负载历史记录
  const loadAvg = info.system.loadavg?.[0] || 0;
  loadHistory.push({
    time: new Date().toLocaleTimeString('zh-CN'),
    load: loadAvg
  });
  
  // 保持历史记录长度
  if (loadHistory.length > MAX_HISTORY) {
    loadHistory.shift();
  }
  
  info.loadHistory = [...loadHistory];
  
  return info;
}

/**
 * 格式化字节数
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化运行时间
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`);
  
  return parts.join(' ');
}
