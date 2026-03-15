/**
 * 本地应用扫描模块
 * 扫描并管理系统中已安装的应用程序
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// 应用缓存
let appsCache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 分钟缓存
};

// 扫描锁，防止并发扫描
let scanLock = false;
let scanPromise = null;

// 常用应用分类
const APP_CATEGORIES = {
  browsers: ['chrome', 'firefox', 'safari', 'edge', 'brave', 'chromium'],
  editors: ['vscode', 'sublime', 'atom', 'notion', 'typora', 'obsidian'],
  communication: ['wechat', 'dingtalk', 'slack', 'telegram', 'discord', 'qq', 'teams'],
  media: ['vlc', 'spotify', 'netflix', 'music', 'photos', 'iina'],
  development: ['iterm', 'terminal', 'webstorm', 'pycharm', 'intellij'],
  office: ['word', 'excel', 'powerpoint', 'keynote', 'pages', 'numbers'],
  utilities: ['finder', 'explorer', 'calculator', 'calendar', 'notes', 'mail'],
  social: ['weibo', 'twitter', 'facebook', 'instagram', 'tiktok'],
  cloud: ['dropbox', 'google drive', 'icloud', 'onedrive', 'baidu netdisk'],
  other: []
};

/**
 * 获取操作系统平台
 */
function getPlatform() {
  return os.platform();
}

/**
 * macOS 扫描应用程序
 */
async function scanMacOSApps() {
  const apps = [];
  
  // 常见的应用安装目录
  const appDirs = [
    '/Applications',
    '/System/Applications',
    path.join(os.homedir(), 'Applications')
  ];

  for (const appDir of appDirs) {
    if (!fs.existsSync(appDir)) continue;

    try {
      const entries = fs.readdirSync(appDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.endsWith('.app')) {
          const appPath = path.join(appDir, entry.name);
          const appInfo = await getMacOSAppInfo(appPath);
          if (appInfo) {
            appInfo.category = categorizeApp(appInfo.name);
            appInfo.platform = 'macOS';
            apps.push(appInfo);
          }
        }
      }
    } catch (error) {
      console.error(`扫描目录 ${appDir} 失败:`, error.message);
    }
  }

  return apps;
}

/**
 * 获取 macOS 应用信息
 */
async function getMacOSAppInfo(appPath) {
  try {
    // 使用 mdls 命令获取应用信息
    const { stdout } = await execAsync(`mdls -name kMDItemDisplayName -name kMDItemCFBundleIdentifier -raw "${appPath}" 2>/dev/null`);
    const lines = stdout.trim().split('\n');
    
    return {
      name: path.basename(appPath, '.app'),
      displayName: simplifyAppName(lines[0] || path.basename(appPath, '.app')),
      bundleId: lines[1] || '',
      path: appPath,
      icon: `/api/apps/icon?path=${encodeURIComponent(appPath)}`,
      category: 'other'
    };
  } catch (error) {
    // 如果 mdls 失败，使用基本信息
    return {
      name: path.basename(appPath, '.app'),
      displayName: simplifyAppName(path.basename(appPath, '.app')),
      bundleId: '',
      path: appPath,
      icon: '',
      category: 'other'
    };
  }
}

/**
 * 精简应用名称
 */
function simplifyAppName(name) {
  if (!name) return 'Unknown';
  
  // 移除常见的后缀
  const suffixes = [
    '.app',
    ' 应用',
    ' 版',
    ' 专业版',
    ' 企业版',
    ' 免费版',
    ' App',
    ' Application',
    ' Desktop',
    ' for Mac',
    ' for macOS'
  ];
  
  let simplified = name;
  for (const suffix of suffixes) {
    simplified = simplified.replace(new RegExp(suffix + '$', 'i'), '');
  }
  
  // 移除括号内的内容（版本信息等）
  simplified = simplified.replace(/\s*\([^)]*\)\s*$/g, '');
  simplified = simplified.replace(/\s*\[[^\]]*\]\s*$/g, '');
  
  // 处理常见的长名称映射
  const nameMap = {
    'Visual Studio Code': 'VSCode',
    'Microsoft Edge': 'Edge',
    'Google Chrome': 'Chrome',
    'Sublime Text': 'Sublime',
    'Sublime Merge': 'Merge',
    'System Settings': '设置',
    'QuickTime Player': 'QuickTime',
    'Photo Booth': 'Photo',
    'Microsoft Defender': 'Defender',
    'NoSQLBooster for MongoDB': 'NoSQLBooster',
    'Studio 3T': 'Studio3T',
    'Image Capture': '图像捕捉',
    'Font Book': '字体册',
    'Mission Control': '调度中心',
    'FaceTime': 'FaceTime',
    'FindMy': '查找',
    'Freeform': '无边记',
    'Image Playground': '图乐园',
    'iPhone Mirroring': 'iPhone 镜像',
    'System Preferences': '系统偏好',
    'App Store': 'App Store',
    'Apple Music': '音乐',
    'Apple TV': 'TV',
    'Apple Books': '图书',
    'Apple Podcasts': '播客',
    'Apple News': 'News',
    'Apple Maps': '地图',
    'Apple Photos': '照片',
    'Apple Mail': '邮件',
    'Apple Calendar': '日历',
    'Apple Contacts': '联系人',
    'Apple Reminders': '提醒',
    'Apple Notes': '备忘录',
    'Apple Messages': '信息',
    'Apple FaceTime': 'FaceTime',
    'Apple Safari': 'Safari',
    'Apple iTunes': 'iTunes',
    'Apple iMovie': 'iMovie',
    'Apple GarageBand': 'GarageBand',
    'Apple Xcode': 'Xcode',
    'Apple TestFlight': 'TestFlight',
    'Apple Configurator': 'Configurator',
    'Apple Profile Manager': 'Profile Manager',
    'Apple Server': 'Server',
    'Apple Workgroup Manager': 'Workgroup Manager',
    'Apple Directory Utility': 'Directory Utility',
    'Apple Keychain Access': '钥匙串',
    'Apple Activity Monitor': '活动监视器',
    'Apple Disk Utility': '磁盘工具',
    'Apple Network Utility': '网络工具',
    'Apple System Information': '系统信息',
    'Apple Terminal': '终端',
    'Apple Script Editor': '脚本编辑器',
    'Apple Automator': '自动操作',
    'Apple Dictionary': '词典',
    'Apple Dashboard': 'Dashboard',
    'Apple Launchpad': '启动台',
    'Apple Mission Control': '调度中心',
    'Apple Notification Center': '通知中心',
    'Apple Control Center': '控制中心',
    'Apple Spotlight': '聚焦搜索',
    'Apple Siri': 'Siri',
    'Apple Shortcuts': '快捷指令',
    'Apple Home': '家庭',
    'Apple Weather': '天气',
    'Apple Stocks': '股市',
    'Apple Calculator': '计算器',
    'Apple Chess': '国际象棋',
    'Apple Stickies': '便笺',
    'Apple TextEdit': '文本编辑',
    'Apple Preview': '预览',
    'Apple Quick Look': '快速查看',
    'Apple Time Machine': '时间机器',
    'Apple Backup': '备份',
    'Apple Restore': '恢复',
    'Apple Migration Assistant': '迁移助理',
    'Apple Boot Camp': '启动转换',
    'Apple Remote Desktop': '远程桌面',
    'Apple Screen Sharing': '屏幕共享',
    'Apple Messages for Mac': '信息',
    'Apple Photos for Mac': '照片',
    'Apple Music for Mac': '音乐',
    'Apple TV for Mac': 'TV',
    'Apple Podcasts for Mac': '播客',
    'Apple News for Mac': 'News',
    'Apple Maps for Mac': '地图',
    'Apple Mail for Mac': '邮件',
    'Apple Calendar for Mac': '日历',
    'Apple Contacts for Mac': '联系人',
    'Apple Reminders for Mac': '提醒',
    'Apple Notes for Mac': '备忘录',
    'Apple Messages for Mac': '信息',
    'Apple FaceTime for Mac': 'FaceTime',
    'Apple Safari for Mac': 'Safari',
    'Apple iTunes for Mac': 'iTunes',
    'Apple iMovie for Mac': 'iMovie',
    'Apple GarageBand for Mac': 'GarageBand',
    'Apple Xcode for Mac': 'Xcode',
    'Visual Studio Code': 'VSCode',
    'Google Chrome': 'Chrome',
    'Microsoft Edge': 'Edge',
    'Mozilla Firefox': 'Firefox',
    'Opera Browser': 'Opera',
    'Brave Browser': 'Brave',
    'Tor Browser': 'Tor',
    'Vivaldi Browser': 'Vivaldi',
    'Chromium Browser': 'Chromium',
    'Microsoft Word': 'Word',
    'Microsoft Excel': 'Excel',
    'Microsoft PowerPoint': 'PowerPoint',
    'Microsoft OneNote': 'OneNote',
    'Microsoft Outlook': 'Outlook',
    'Microsoft Teams': 'Teams',
    'Microsoft OneDrive': 'OneDrive',
    'Adobe Photoshop': 'Photoshop',
    'Adobe Illustrator': 'Illustrator',
    'Adobe InDesign': 'InDesign',
    'Adobe Premiere Pro': 'Premiere',
    'Adobe After Effects': 'After Effects',
    'Adobe Lightroom': 'Lightroom',
    'Adobe Acrobat': 'Acrobat',
    'Adobe Reader': 'Reader',
    'Zoom Meetings': 'Zoom',
    'Skype for Mac': 'Skype',
    'Discord App': 'Discord',
    'Slack App': 'Slack',
    'Telegram Desktop': 'Telegram',
    'WhatsApp Desktop': 'WhatsApp',
    'Signal Desktop': 'Signal',
    'Viber Desktop': 'Viber',
    'Line Desktop': 'Line',
    'WeChat for Mac': '微信',
    'QQ for Mac': 'QQ',
    'DingTalk for Mac': '钉钉',
    'Feishu for Mac': '飞书',
    'WeCom for Mac': '企业微信',
    'Tencent Meeting': '腾讯会议',
    'Zoom for Mac': 'Zoom',
    'Cisco Webex': 'Webex',
    'GoToMeeting': 'GoToMeeting',
    'BlueJeans': 'BlueJeans',
    'Zoho Meeting': 'Zoho',
    'Join.me': 'Join.me',
    'AnyDesk': 'AnyDesk',
    'TeamViewer': 'TeamViewer',
    'LogMeIn': 'LogMeIn',
    'Splashtop': 'Splashtop',
    'Chrome Remote Desktop': 'Chrome 远程',
    'Microsoft Remote Desktop': '远程桌面',
    'RealVNC': 'VNC',
    'TightVNC': 'TightVNC',
    'UltraVNC': 'UltraVNC',
    'TigerVNC': 'TigerVNC',
    'x11vnc': 'x11vnc',
    'vncviewer': 'VNC Viewer'
  };
  
  if (nameMap[simplified]) {
    return nameMap[simplified];
  }
  
  // 如果名称仍然过长，进行截断
  if (simplified.length > 20) {
    // 尝试按空格或标点分割，取第一部分
    const parts = simplified.split(/[\s·]+/);
    if (parts.length > 1 && parts[0].length >= 3) {
      return parts[0];
    }
    // 否则截断并添加省略号
    return simplified.substring(0, 18) + '...';
  }
  
  return simplified.trim() || 'Unknown';
}

/**
 * Windows 扫描应用程序
 */
async function scanWindowsApps() {
  const apps = [];
  
  // 常见的应用安装目录
  const appDirs = [
    'C:\\Program Files',
    'C:\\Program Files (x86)',
    path.join(os.homedir(), 'AppData', 'Local', 'Programs')
  ];

  // 从开始菜单扫描
  const startMenuDirs = [
    path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs'
  ];

  // 扫描程序文件目录
  for (const appDir of appDirs) {
    if (!fs.existsSync(appDir)) continue;

    try {
      const entries = fs.readdirSync(appDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const exePath = path.join(appDir, entry.name, `${entry.name}.exe`);
          if (fs.existsSync(exePath)) {
            apps.push({
              name: entry.name,
              displayName: entry.name,
              path: exePath,
              icon: '',
              category: categorizeApp(entry.name),
              platform: 'Windows'
            });
          }
        }
      }
    } catch (error) {
      console.error(`扫描目录 ${appDir} 失败:`, error.message);
    }
  }

  // 扫描开始菜单
  for (const startMenuDir of startMenuDirs) {
    if (!fs.existsSync(startMenuDir)) continue;

    try {
      const entries = fs.readdirSync(startMenuDir, { withFileTypes: true, recursive: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.lnk')) {
          const linkPath = path.join(startMenuDir, entry.path || '', entry.name);
          apps.push({
            name: path.basename(entry.name, '.lnk'),
            displayName: path.basename(entry.name, '.lnk'),
            path: linkPath,
            icon: '',
            category: categorizeApp(entry.name),
            platform: 'Windows',
            type: 'shortcut'
          });
        }
      }
    } catch (error) {
      console.error(`扫描开始菜单失败:`, error.message);
    }
  }

  return apps;
}

/**
 * Linux 扫描应用程序
 */
async function scanLinuxApps() {
  const apps = [];
  
  // 扫描 .desktop 文件
  const desktopDirs = [
    '/usr/share/applications',
    '/usr/local/share/applications',
    path.join(os.homedir(), '.local', 'share', 'applications')
  ];

  for (const desktopDir of desktopDirs) {
    if (!fs.existsSync(desktopDir)) continue;

    try {
      const entries = fs.readdirSync(desktopDir);
      
      for (const file of entries) {
        if (file.endsWith('.desktop')) {
          const desktopPath = path.join(desktopDir, file);
          const appInfo = await parseDesktopFile(desktopPath);
          if (appInfo) {
            appInfo.category = categorizeApp(appInfo.name);
            appInfo.platform = 'Linux';
            apps.push(appInfo);
          }
        }
      }
    } catch (error) {
      console.error(`扫描目录 ${desktopDir} 失败:`, error.message);
    }
  }

  return apps;
}

/**
 * 解析 Linux .desktop 文件
 */
async function parseDesktopFile(desktopPath) {
  try {
    const content = fs.readFileSync(desktopPath, 'utf-8');
    const lines = content.split('\n');
    const info = {
      name: '',
      displayName: '',
      exec: '',
      icon: '',
      path: desktopPath
    };

    for (const line of lines) {
      if (line.startsWith('Name=')) {
        info.name = line.substring(5);
        info.displayName = info.name;
      } else if (line.startsWith('Exec=')) {
        info.exec = line.substring(5);
      } else if (line.startsWith('Icon=')) {
        info.icon = line.substring(5);
      }
    }

    if (info.name) {
      return {
        name: info.name,
        displayName: info.displayName,
        path: info.exec,
        icon: info.icon,
        category: 'other'
      };
    }
  } catch (error) {
    console.error(`解析 desktop 文件失败:`, error.message);
  }
  return null;
}

/**
 * 根据应用名称分类
 */
function categorizeApp(appName) {
  const lowerName = appName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(APP_CATEGORIES)) {
    if (category === 'other') continue;
    
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'other';
}

/**
 * 获取应用分类列表
 */
export function getAppCategories() {
  const categoryNames = {
    browsers: '🌐 浏览器',
    editors: '📝 编辑器',
    communication: '💬 通讯工具',
    media: '🎵 媒体播放',
    development: '💻 开发工具',
    office: '📄 办公软件',
    utilities: '🔧 实用工具',
    social: '📱 社交应用',
    cloud: '☁️ 云存储',
    other: '📦 其他应用'
  };
  
  return Object.entries(categoryNames).map(([key, name]) => ({
    key,
    name,
    icon: name.split(' ')[0]
  }));
}

/**
 * 扫描所有应用程序（带缓存和锁机制）
 */
export async function scanAllApps() {
  // 检查缓存是否有效
  const now = Date.now();
  if (appsCache.data && (now - appsCache.timestamp) < appsCache.ttl) {
    return appsCache.data;
  }
  
  // 如果有正在进行的扫描，等待完成
  if (scanLock && scanPromise) {
    return scanPromise;
  }
  
  // 创建新的扫描任务
  scanLock = true;
  scanPromise = (async () => {
    try {
      const platform = getPlatform();
      let apps = [];
      
      if (platform === 'darwin') {
        apps = await scanMacOSApps();
      } else if (platform === 'win32') {
        apps = await scanWindowsApps();
      } else if (platform === 'linux') {
        apps = await scanLinuxApps();
      }

      // 按名称排序
      apps.sort((a, b) => a.displayName.localeCompare(b.displayName));
      
      // 更新缓存
      appsCache.data = apps;
      appsCache.timestamp = now;
      
      return apps;
    } finally {
      scanLock = false;
      scanPromise = null;
    }
  })();
  
  return scanPromise;
}

/**
 * 清除应用缓存
 */
export function clearAppsCache() {
  appsCache.data = null;
  appsCache.timestamp = 0;
}

/**
 * 获取缓存状态
 */
export function getCacheStatus() {
  const now = Date.now();
  const isValid = appsCache.data && (now - appsCache.timestamp) < appsCache.ttl;
  return {
    hasCache: !!appsCache.data,
    isValid,
    age: appsCache.data ? Math.round((now - appsCache.timestamp) / 1000) : 0,
    ttl: appsCache.ttl / 1000
  };
}

/**
 * 启动应用程序
 */
export async function launchApp(appPath) {
  const platform = getPlatform();
  
  try {
    if (platform === 'darwin') {
      await execAsync(`open "${appPath}"`);
    } else if (platform === 'win32') {
      if (appPath.endsWith('.lnk')) {
        await execAsync(`start "" "${appPath}"`);
      } else {
        await execAsync(`start "" "${appPath}"`);
      }
    } else if (platform === 'linux') {
      await execAsync(`"${appPath}" &`);
    }
    
    return { success: true, message: '应用已启动' };
  } catch (error) {
    return { 
      success: false, 
      message: `启动失败：${error.message}` 
    };
  }
}

/**
 * 搜索应用程序（支持拼音首字母和模糊搜索）
 */
export async function searchApps(query) {
  const allApps = await scanAllApps();
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    return [];
  }
  
  // 生成拼音首字母（简单版）
  const pinyinMap = {
    'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g',
    'h': 'h', 'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n',
    'o': 'o', 'p': 'p', 'q': 'q', 'r': 'r', 's': 's', 't': 't', 'u': 'u',
    'v': 'v', 'w': 'w', 'x': 'x', 'y': 'y', 'z': 'z',
    'α': 'a', 'Α': 'a', // 希腊字母
    'β': 'b', 'Β': 'b',
    'χ': 'c', 'Χ': 'c',
    'δ': 'd', 'Δ': 'd',
    'ε': 'e', 'Ε': 'e',
    'φ': 'f', 'Φ': 'f',
    'γ': 'g', 'Γ': 'g',
    'η': 'h', 'Η': 'h',
    'ι': 'i', 'Ι': 'i',
    'κ': 'k', 'Κ': 'k',
    'λ': 'l', 'Λ': 'l',
    'μ': 'm', 'Μ': 'm',
    'ν': 'n', 'Ν': 'n',
    'ο': 'o', 'Ο': 'o',
    'π': 'p', 'Π': 'p',
    'θ': 'q', 'Θ': 'q',
    'ρ': 'r', 'Ρ': 'r',
    'σ': 's', 'Σ': 's',
    'τ': 't', 'Τ': 't',
    'υ': 'u', 'Υ': 'u',
    'ω': 'w', 'Ω': 'w',
    'ξ': 'x', 'Ξ': 'x',
    'ψ': 'y', 'Ψ': 'y',
    'ζ': 'z', 'Ζ': 'z'
  };
  
  // 生成拼音首字母缩写
  function getPinyinInitials(str) {
    return str
      .split('')
      .map(char => pinyinMap[char.toLowerCase()] || char)
      .filter(char => /[a-z]/.test(char))
      .join('')
      .toLowerCase();
  }
  
  // 计算相似度得分
  function calculateScore(appName, query) {
    const lowerName = appName.toLowerCase();
    let score = 0;
    
    // 完全匹配
    if (lowerName === query) return 100;
    
    // 开头匹配
    if (lowerName.startsWith(query)) score += 50;
    
    // 包含匹配
    if (lowerName.includes(query)) score += 30;
    
    // 单词边界匹配
    const words = lowerName.split(/[\s_-]+/);
    for (const word of words) {
      if (word.startsWith(query)) score += 20;
      if (word.includes(query)) score += 10;
    }
    
    // 拼音首字母匹配
    const initials = getPinyinInitials(lowerName);
    if (initials.includes(query)) score += 40;
    
    // 驼峰匹配
    const camelMatch = lowerName.replace(/[^a-z]/g, '');
    if (camelMatch.includes(query)) score += 15;
    
    // 距离惩罚（越短越好）
    score -= Math.abs(appName.length - query.length) * 0.5;
    
    return Math.max(0, score);
  }
  
  // 搜索并评分
  const results = allApps
    .map(app => {
      const searchName = `${app.displayName} ${app.name}`;
      const score = calculateScore(searchName, lowerQuery);
      return { ...app, score };
    })
    .filter(app => app.score > 10)
    .sort((a, b) => b.score - a.score);
  
  return results;
}

/**
 * 获取常用应用（按分类）
 */
export async function getPopularApps(category = null, limit = 20) {
  const allApps = await scanAllApps();
  
  let filtered = allApps;
  if (category) {
    filtered = allApps.filter(app => app.category === category);
  }
  
  return filtered.slice(0, limit);
}
