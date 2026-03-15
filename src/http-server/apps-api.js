/**
 * 应用程序启动 API 路由
 */

import express from 'express';
import { 
  scanAllApps, 
  launchApp, 
  searchApps, 
  getPopularApps,
  getAppCategories,
  clearAppsCache,
  getCacheStatus
} from '../local-apps.js';

const router = express.Router();

// 获取所有应用分类
router.get('/categories', (req, res) => {
  try {
    const categories = getAppCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 扫描所有应用程序
router.get('/scan', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    
    // 强制刷新缓存
    if (forceRefresh) {
      clearAppsCache();
    }
    
    const apps = await scanAllApps();
    const cacheStatus = getCacheStatus();
    
    res.json({
      success: true,
      data: apps,
      count: apps.length,
      cache: cacheStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取缓存状态
router.get('/cache', (req, res) => {
  try {
    const cacheStatus = getCacheStatus();
    res.json({
      success: true,
      data: cacheStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 清除缓存
router.post('/cache/clear', (req, res) => {
  try {
    clearAppsCache();
    res.json({
      success: true,
      message: '缓存已清除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 搜索应用程序
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }
    
    const apps = await searchApps(query);
    res.json({
      success: true,
      data: apps,
      count: apps.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取常用应用（按分类）
router.get('/popular', async (req, res) => {
  try {
    const category = req.query.category;
    const limit = parseInt(req.query.limit) || 20;
    
    const apps = await getPopularApps(category, limit);
    res.json({
      success: true,
      data: apps,
      count: apps.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 启动应用程序
router.post('/launch', async (req, res) => {
  try {
    const { path: appPath } = req.body;
    
    if (!appPath) {
      return res.status(400).json({
        success: false,
        message: '请提供应用路径'
      });
    }
    
    const result = await launchApp(appPath);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取应用图标（macOS）
router.get('/icon', async (req, res) => {
  try {
    const appPath = req.query.path;
    
    if (!appPath) {
      return res.status(400).json({
        success: false,
        message: '请提供应用路径'
      });
    }
    
    // macOS 使用 iconutil 提取图标
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const os = await import('os');
    const platform = os.platform();
    
    if (platform === 'darwin') {
      // 创建临时目录
      const fs = await import('fs');
      const path = await import('path');
      const tmpDir = await import('tmp');
      
      const tempDir = tmpDir.dirSync();
      const iconSetPath = path.join(tempDir.name, 'icon.iconset');
      
      try {
        // 复制图标集
        await execAsync(`cp -R "${appPath}/Contents/Resources/App.icns" "${iconSetPath}" 2>/dev/null || true`);
        
        // 尝试读取应用图标
        const iconPath = path.join(appPath, 'Contents', 'Resources', 'App.icns');
        if (fs.existsSync(iconPath)) {
          res.sendFile(iconPath);
        } else {
          // 返回默认图标
          res.status(404).json({ error: '图标不存在' });
        }
      } catch (error) {
        res.status(404).json({ error: '无法获取图标' });
      } finally {
        tempDir.removeCallback();
      }
    } else {
      res.status(404).json({ error: '仅支持 macOS' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
