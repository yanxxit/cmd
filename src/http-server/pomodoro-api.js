import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 数据文件路径
const DATA_FILE = path.join(__dirname, '../../.pgdata/pomodoro-data.json');

// 确保数据目录存在
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 读取数据
function loadData() {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('读取番茄数据失败:', err);
  }
  // 返回默认数据结构
  return {
    sessions: [],
    settings: {
      workDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsBeforeLongBreak: 4
    },
    statistics: {
      totalSessions: 0,
      totalFocusTime: 0,
      todaySessions: 0,
      todayFocusTime: 0
    }
  };
}

// 保存数据
function saveData(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('保存番茄数据失败:', err);
    return false;
  }
}

// 获取当天日期字符串
function getTodayStr() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// 判断是否是今天
function isToday(dateStr) {
  return dateStr === getTodayStr();
}

/**
 * GET /api/pomodoro/settings
 * 获取设置
 */
router.get('/settings', (req, res) => {
  try {
    const data = loadData();
    res.json({
      success: true,
      data: data.settings
    });
  } catch (err) {
    console.error('获取设置失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/pomodoro/settings
 * 更新设置
 */
router.post('/settings', (req, res) => {
  try {
    const data = loadData();
    const newSettings = req.body;

    // 验证并更新设置
    if (typeof newSettings.workDuration === 'number') {
      data.settings.workDuration = newSettings.workDuration;
    }
    if (typeof newSettings.shortBreak === 'number') {
      data.settings.shortBreak = newSettings.shortBreak;
    }
    if (typeof newSettings.longBreak === 'number') {
      data.settings.longBreak = newSettings.longBreak;
    }
    if (typeof newSettings.sessionsBeforeLongBreak === 'number') {
      data.settings.sessionsBeforeLongBreak = newSettings.sessionsBeforeLongBreak;
    }

    saveData(data);

    res.json({
      success: true,
      data: data.settings
    });
  } catch (err) {
    console.error('更新设置失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/pomodoro/sessions
 * 获取番茄记录列表
 */
router.get('/sessions', (req, res) => {
  try {
    const data = loadData();
    const { date, limit = 50 } = req.query;
    
    let sessions = data.sessions;

    // 按日期筛选
    if (date) {
      sessions = sessions.filter(s => s.date === date);
    }

    // 按时间倒序排序
    sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    // 限制数量
    sessions = sessions.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        sessions,
        count: sessions.length
      }
    });
  } catch (err) {
    console.error('获取番茄记录失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/pomodoro/sessions
 * 添加番茄记录
 */
router.post('/sessions', (req, res) => {
  try {
    const data = loadData();
    const session = req.body;

    // 验证必填字段
    if (!session.date || !session.duration || !session.startTime) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段'
      });
    }

    // 生成 ID
    session.id = Date.now().toString();
    session.completedAt = new Date().toISOString();

    // 添加到记录列表
    data.sessions.push(session);

    // 更新统计数据
    data.statistics.totalSessions++;
    data.statistics.totalFocusTime += session.duration;

    // 如果是今天，更新今日统计
    if (isToday(session.date)) {
      data.statistics.todaySessions++;
      data.statistics.todayFocusTime += session.duration;
    }

    saveData(data);

    res.json({
      success: true,
      data: session
    });
  } catch (err) {
    console.error('添加番茄记录失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * DELETE /api/pomodoro/sessions/:id
 * 删除番茄记录
 */
router.delete('/sessions/:id', (req, res) => {
  try {
    const data = loadData();
    const sessionId = req.params.id;

    // 找到要删除的记录
    const sessionIndex = data.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '记录不存在'
      });
    }

    const session = data.sessions[sessionIndex];

    // 更新统计数据
    data.statistics.totalSessions--;
    data.statistics.totalFocusTime -= session.duration;

    // 如果是今天，更新今日统计
    if (isToday(session.date)) {
      data.statistics.todaySessions--;
      data.statistics.todayFocusTime -= session.duration;
    }

    // 删除记录
    data.sessions.splice(sessionIndex, 1);

    saveData(data);

    res.json({
      success: true
    });
  } catch (err) {
    console.error('删除番茄记录失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/pomodoro/statistics
 * 获取统计数据
 */
router.get('/statistics', (req, res) => {
  try {
    const data = loadData();
    const { date } = req.query;

    let stats = { ...data.statistics };

    // 如果指定了日期，重新计算该日期的数据
    if (date) {
      const dateSessions = data.sessions.filter(s => s.date === date);
      stats.todaySessions = dateSessions.length;
      stats.todayFocusTime = dateSessions.reduce((sum, s) => sum + s.duration, 0);
    } else {
      // 默认计算今天的数据
      const todayStr = getTodayStr();
      const todaySessions = data.sessions.filter(s => s.date === todayStr);
      stats.todaySessions = todaySessions.length;
      stats.todayFocusTime = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    }

    // 计算本周数据
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 是周日
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekSessions = data.sessions.filter(s => new Date(s.startTime) >= startOfWeek);
    stats.weekSessions = weekSessions.length;
    stats.weekFocusTime = weekSessions.reduce((sum, s) => sum + s.duration, 0);

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/pomodoro/history
 * 获取历史记录（按日期分组）
 */
router.get('/history', (req, res) => {
  try {
    const data = loadData();
    const { days = 7 } = req.query;

    // 获取最近 N 天的数据
    const history = {};
    const now = new Date();

    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dateSessions = data.sessions.filter(s => s.date === dateStr);
      history[dateStr] = {
        date: dateStr,
        sessions: dateSessions.length,
        focusTime: dateSessions.reduce((sum, s) => sum + s.duration, 0),
        dayOfWeek: date.toLocaleDateString('zh-CN', { weekday: 'short' })
      };
    }

    res.json({
      success: true,
      data: history
    });
  } catch (err) {
    console.error('获取历史记录失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/pomodoro/reset
 * 重置统计数据
 */
router.post('/reset', (req, res) => {
  try {
    const data = loadData();
    const { type } = req.body; // 'sessions' | 'statistics' | 'all'

    if (type === 'sessions' || type === 'all') {
      data.sessions = [];
    }

    if (type === 'statistics' || type === 'all') {
      data.statistics = {
        totalSessions: 0,
        totalFocusTime: 0,
        todaySessions: 0,
        todayFocusTime: 0
      };
    }

    saveData(data);

    res.json({
      success: true
    });
  } catch (err) {
    console.error('重置数据失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
