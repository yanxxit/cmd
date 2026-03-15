/**
 * WiFi 密码获取模块
 * 支持 macOS、Windows、Linux 系统
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

/**
 * 获取当前连接的 WiFi 名称
 */
async function getCurrentWifiSSID() {
  const platform = os.platform();

  if (platform === 'darwin') {
    // macOS
    const { stdout } = await execAsync(
      '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I'
    );
    const match = stdout.match(/SSID: (.+)/);
    return match ? match[1].trim() : null;
  } else if (platform === 'win32') {
    // Windows
    const { stdout } = await execAsync(
      'netsh wlan show interfaces'
    );
    const match = stdout.match(/SSID\s*:\s*(.+)/);
    return match ? match[1].trim() : null;
  } else if (platform === 'linux') {
    // Linux
    try {
      const { stdout } = await execAsync(
        'iwgetid -r 2>/dev/null || nmcli -t -f active,ssid dev wifi | grep "^yes" | cut -d":" -f2'
      );
      return stdout.trim() || null;
    } catch (error) {
      console.error('Linux 系统需要安装 wireless-tools 或 network-manager');
      return null;
    }
  }

  return null;
}

/**
 * 获取指定 WiFi 的密码
 * @param {string} ssid - WiFi 名称
 */
async function getWifiPassword(ssid) {
  const platform = os.platform();

  if (platform === 'darwin') {
    // macOS: 使用 security 命令从钥匙串获取
    try {
      const { stdout } = await execAsync(
        `security find-generic-password -wa "${ssid}" 2>/dev/null`
      );
      return stdout.trim() || null;
    } catch (error) {
      throw new Error(`无法获取 WiFi 密码：${ssid}（可能需要管理员权限）`);
    }
  } else if (platform === 'win32') {
    // Windows: 使用 netsh 命令获取
    try {
      const { stdout } = await execAsync(
        `netsh wlan show profile name="${ssid}" key=clear`
      );
      const match = stdout.match(/Key Content\s*:\s*(.+)/);
      return match ? match[1].trim() : null;
    } catch (error) {
      throw new Error(`无法获取 WiFi 密码：${ssid}（可能需要管理员权限）`);
    }
  } else if (platform === 'linux') {
    // Linux: 从 NetworkManager 配置获取
    try {
      const { stdout } = await execAsync(
        `sudo grep -r "^psk=" /etc/NetworkManager/system-connections/"${ssid}".nmconnection 2>/dev/null | cut -d'=' -f2`
      );
      return stdout.trim() || null;
    } catch (error) {
      try {
        // 尝试旧格式
        const { stdout } = await execAsync(
          `sudo cat /etc/NetworkManager/system-connections/"${ssid}" 2>/dev/null | grep "^psk=" | cut -d'=' -f2`
        );
        return stdout.trim() || null;
      } catch (error2) {
        throw new Error(`无法获取 WiFi 密码：${ssid}（可能需要 sudo 权限）`);
      }
    }
  }

  return null;
}

/**
 * 获取所有已保存的 WiFi 列表
 */
async function getSavedWifiList() {
  const platform = os.platform();

  if (platform === 'darwin') {
    // macOS
    try {
      const { stdout } = await execAsync(
        'security find-generic-password -ga "AirPort" 2>&1 | grep -o "ssid" || /System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s | tail -n +2 | awk \'{print $1}\''
      );
      return stdout.trim().split('\n').filter(line => line.trim());
    } catch (error) {
      // 尝试另一种方法
      try {
        const { stdout } = await execAsync(
          '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s'
        );
        const lines = stdout.trim().split('\n').slice(1);
        return lines.map(line => line.split(/\s+/)[0]).filter(ssid => ssid);
      } catch (error2) {
        return [];
      }
    }
  } else if (platform === 'win32') {
    // Windows
    try {
      const { stdout } = await execAsync(
        'netsh wlan show profiles'
      );
      const matches = stdout.matchAll(/All User Profile\s*:\s*(.+)/g);
      return Array.from(matches, m => m[1].trim());
    } catch (error) {
      return [];
    }
  } else if (platform === 'linux') {
    // Linux
    try {
      const { stdout } = await execAsync(
        'sudo ls /etc/NetworkManager/system-connections/ 2>/dev/null | sed "s/\\.nmconnection$//"'
      );
      return stdout.trim().split('\n').filter(line => line.trim());
    } catch (error) {
      return [];
    }
  }

  return [];
}

/**
 * 获取当前 WiFi 信息（SSID + 密码）
 */
async function getCurrentWifiInfo() {
  const ssid = await getCurrentWifiSSID();
  
  if (!ssid) {
    throw new Error('未连接到任何 WiFi 网络');
  }

  const password = await getWifiPassword(ssid);

  return {
    ssid,
    password,
    platform: os.platform()
  };
}

/**
 * 导出所有功能
 */
export default {
  getCurrentWifiSSID,
  getWifiPassword,
  getSavedWifiList,
  getCurrentWifiInfo,
  getWifiInfo: getCurrentWifiInfo
};
