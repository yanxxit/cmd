import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../.pgdata/pomodoro-data.json');

function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function toDateString(input = '') {
  return String(input || '').slice(0, 10);
}

function sortSessionsDesc(list = []) {
  return [...list].sort((a, b) => new Date(b.startTime || b.completedAt || 0) - new Date(a.startTime || a.completedAt || 0));
}

export function getPomodoroTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export function loadPomodoroData() {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('读取番茄数据失败:', err);
  }
  return {
    sessions: [],
    settings: {
      workDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      sessionsBeforeLongBreak: 4,
    },
    statistics: {
      totalSessions: 0,
      totalFocusTime: 0,
      todaySessions: 0,
      todayFocusTime: 0,
    },
  };
}

export function savePomodoroData(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('保存番茄数据失败:', err);
    return false;
  }
}

export function listPomodoroSessions(filters = {}) {
  const { date = '', startDate = '', endDate = '', keyword = '', limit = 50 } = filters;
  const data = loadPomodoroData();
  let sessions = [...(data.sessions || [])];

  if (date) {
    sessions = sessions.filter((session) => session.date === date);
  }
  if (startDate) {
    sessions = sessions.filter((session) => toDateString(session.date || session.startTime) >= startDate);
  }
  if (endDate) {
    sessions = sessions.filter((session) => toDateString(session.date || session.startTime) <= endDate);
  }
  if (keyword) {
    const lowerKeyword = String(keyword).trim().toLowerCase();
    sessions = sessions.filter((session) => {
      const text = `${session.taskName || ''} ${session.note || ''} ${session.tag || ''}`.toLowerCase();
      return text.includes(lowerKeyword);
    });
  }

  sessions = sortSessionsDesc(sessions);
  const nextLimit = Number(limit) > 0 ? Number(limit) : sessions.length;
  return {
    sessions: sessions.slice(0, nextLimit),
    count: sessions.length,
    settings: data.settings,
    statistics: data.statistics,
  };
}

export function updatePomodoroSettings(updates = {}) {
  const data = loadPomodoroData();
  const nextSettings = { ...(data.settings || {}) };

  ['workDuration', 'shortBreak', 'longBreak', 'sessionsBeforeLongBreak'].forEach((key) => {
    if (typeof updates[key] === 'number' && !Number.isNaN(updates[key])) {
      nextSettings[key] = updates[key];
    }
  });

  data.settings = nextSettings;
  savePomodoroData(data);
  return nextSettings;
}

export function addPomodoroSession(session = {}) {
  if (!session.date || !session.duration || !session.startTime) {
    throw new Error('缺少必填字段');
  }

  const data = loadPomodoroData();
  const nextSession = {
    ...session,
    id: Date.now().toString(),
    completedAt: new Date().toISOString(),
  };

  data.sessions.push(nextSession);
  data.statistics.totalSessions = Number(data.statistics.totalSessions || 0) + 1;
  data.statistics.totalFocusTime = Number(data.statistics.totalFocusTime || 0) + Number(nextSession.duration || 0);

  if (toDateString(nextSession.date) === getPomodoroTodayStr()) {
    data.statistics.todaySessions = Number(data.statistics.todaySessions || 0) + 1;
    data.statistics.todayFocusTime = Number(data.statistics.todayFocusTime || 0) + Number(nextSession.duration || 0);
  }

  savePomodoroData(data);
  return nextSession;
}

export function deletePomodoroSession(sessionId = '') {
  const data = loadPomodoroData();
  const index = (data.sessions || []).findIndex((session) => session.id === sessionId);
  if (index === -1) {
    return null;
  }

  const session = data.sessions[index];
  data.statistics.totalSessions = Math.max(0, Number(data.statistics.totalSessions || 0) - 1);
  data.statistics.totalFocusTime = Math.max(0, Number(data.statistics.totalFocusTime || 0) - Number(session.duration || 0));

  if (toDateString(session.date) === getPomodoroTodayStr()) {
    data.statistics.todaySessions = Math.max(0, Number(data.statistics.todaySessions || 0) - 1);
    data.statistics.todayFocusTime = Math.max(0, Number(data.statistics.todayFocusTime || 0) - Number(session.duration || 0));
  }

  data.sessions.splice(index, 1);
  savePomodoroData(data);
  return session;
}

export function getPomodoroStatistics(options = {}) {
  const data = loadPomodoroData();
  const { date = '' } = options;
  const stats = { ...(data.statistics || {}) };

  const targetDate = date || getPomodoroTodayStr();
  const dateSessions = (data.sessions || []).filter((session) => session.date === targetDate);
  stats.todaySessions = dateSessions.length;
  stats.todayFocusTime = dateSessions.reduce((sum, session) => sum + Number(session.duration || 0), 0);

  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekSessions = (data.sessions || []).filter((session) => new Date(session.startTime || session.completedAt || 0) >= startOfWeek);
  stats.weekSessions = weekSessions.length;
  stats.weekFocusTime = weekSessions.reduce((sum, session) => sum + Number(session.duration || 0), 0);

  return stats;
}

export function getPomodoroHistory(options = {}) {
  const data = loadPomodoroData();
  const days = Number(options.days || 7);
  const history = {};
  const now = new Date();

  for (let i = 0; i < days; i += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const sessions = (data.sessions || []).filter((session) => session.date === dateStr);
    history[dateStr] = {
      date: dateStr,
      sessions: sessions.length,
      focusTime: sessions.reduce((sum, session) => sum + Number(session.duration || 0), 0),
      dayOfWeek: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
    };
  }

  return history;
}

export function resetPomodoroData(type = 'all') {
  const data = loadPomodoroData();

  if (type === 'sessions' || type === 'all') {
    data.sessions = [];
  }
  if (type === 'statistics' || type === 'all') {
    data.statistics = {
      totalSessions: 0,
      totalFocusTime: 0,
      todaySessions: 0,
      todayFocusTime: 0,
    };
  }

  savePomodoroData(data);
  return true;
}
