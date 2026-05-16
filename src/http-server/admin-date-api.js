import express from 'express';
import {
  ensureAdminSystemConnected,
  requireAdminAuth,
  requireAdminPermission,
} from './admin-auth-helpers.js';
import {
  createTodo,
  deleteTodo,
  getTodoById,
  getTodoStats,
  getTodos,
  getTodosForDateRange,
  initDatabase,
  updateTodo,
} from '../model/index.js';
import {
  addPomodoroSession,
  deletePomodoroSession,
  getPomodoroHistory,
  getPomodoroStatistics,
  listPomodoroSessions,
  loadPomodoroData,
  updatePomodoroSettings,
} from './pomodoro-store.js';

const router = express.Router();

function toDateOnly(value = '') {
  return String(value || '').slice(0, 10);
}

function formatMonth(input = '') {
  if (/^\d{4}-\d{2}$/.test(String(input || ''))) {
    return String(input);
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthRange(monthText = '') {
  const month = formatMonth(monthText);
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(year, monthNumber - 1, 1);
  const end = new Date(year, monthNumber, 0);
  return {
    month,
    startDate: `${year}-${String(monthNumber).padStart(2, '0')}-01`,
    endDate: `${year}-${String(monthNumber).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
    start,
    end,
  };
}

function enumerateDates(startDate = '', endDate = '') {
  const list = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  while (cursor <= end) {
    list.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return list;
}

function overlaps(todo, day) {
  const start = toDateOnly(todo.start_at || todo.due_date || todo.created_at);
  const end = toDateOnly(todo.end_at || todo.start_at || todo.due_date || todo.created_at);
  return (!start || start <= day) && (!end || end >= day);
}

function formatTimeLabel(value = '', fallback = '全天') {
  if (!value) return fallback;
  const time = String(value).match(/T(\d{2}:\d{2})/);
  if (time) return time[1];
  const direct = String(value).match(/(\d{2}:\d{2})/);
  return direct ? direct[1] : fallback;
}

function getTodoTimeLabel(todo, day) {
  const startDate = toDateOnly(todo.start_at || todo.due_date);
  const endDate = toDateOnly(todo.end_at || todo.start_at || todo.due_date);
  const isCrossDay = !!(startDate && endDate && startDate !== endDate);
  if (!isCrossDay) {
    return formatTimeLabel(todo.start_at || todo.end_at || todo.due_date, '全天');
  }
  if (day === startDate) {
    return `${formatTimeLabel(todo.start_at, '开始')}`;
  }
  if (day === endDate) {
    return `${formatTimeLabel(todo.end_at, '结束')}`;
  }
  return '跨天';
}

function sortCalendarItems(items = []) {
  return [...items].sort((a, b) => {
    const timeA = a.sortValue || '';
    const timeB = b.sortValue || '';
    if (timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }
    return String(a.title || '').localeCompare(String(b.title || ''));
  });
}

function buildCalendarBuckets(startDate = '', endDate = '') {
  return enumerateDates(startDate, endDate).reduce((acc, date) => {
    acc[date] = { date, items: [], todos: [], pomodoros: [] };
    return acc;
  }, {});
}

function buildTodoPayload(body = {}) {
  const startAt = body.start_at || '';
  const endAt = body.end_at || '';
  const dueDate = body.due_date || toDateOnly(endAt || startAt);
  return {
    content: body.content,
    completed: body.completed,
    priority: Number(body.priority || 2),
    due_date: dueDate || null,
    start_at: startAt || null,
    end_at: endAt || null,
    note: body.note || '',
    tags: body.tags || '[]',
    category: body.category || '',
  };
}

router.use(ensureAdminSystemConnected);
router.use(requireAdminAuth);
router.use(async (req, res, next) => {
  try {
    await initDatabase();
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: '日期管理数据库初始化失败：' + error.message });
  }
});

router.get('/calendar', requireAdminPermission('calendar.view'), async (req, res) => {
  try {
    const { month, keyword = '' } = req.query || {};
    const { month: targetMonth, startDate, endDate } = getMonthRange(month);
    const [todos, pomodoroResult] = await Promise.all([
      getTodosForDateRange({ startDate, endDate, search: keyword, filter: '' }),
      listPomodoroSessions({ startDate, endDate, keyword, limit: 2000 }),
    ]);

    const buckets = buildCalendarBuckets(startDate, endDate);

    todos.forEach((todo) => {
      Object.keys(buckets).forEach((day) => {
        if (!overlaps(todo, day)) return;
        const item = {
          id: `todo-${todo.id}-${day}`,
          entityId: todo.id,
          type: 'todo',
          title: todo.content,
          timeLabel: getTodoTimeLabel(todo, day),
          sortValue: `${day}T${getTodoTimeLabel(todo, day) === '全天' || getTodoTimeLabel(todo, day) === '跨天' ? '00:00' : getTodoTimeLabel(todo, day)}`,
          priority: todo.priority,
          completed: !!todo.completed,
          isCrossDay: toDateOnly(todo.start_at) && toDateOnly(todo.end_at) && toDateOnly(todo.start_at) !== toDateOnly(todo.end_at),
          category: todo.category || '',
          note: todo.note || '',
        };
        buckets[day].todos.push(item);
        buckets[day].items.push(item);
      });
    });

    (pomodoroResult.sessions || []).forEach((session) => {
      const day = session.date || toDateOnly(session.startTime);
      if (!buckets[day]) return;
      const item = {
        id: `pomodoro-${session.id}`,
        entityId: session.id,
        type: 'pomodoro',
        title: session.taskName || '番茄专注',
        timeLabel: formatTimeLabel(session.startTime, '专注'),
        sortValue: session.startTime || `${day}T00:00:00`,
        duration: Number(session.duration || 0),
        note: session.note || '',
        tag: session.tag || '',
      };
      buckets[day].pomodoros.push(item);
      buckets[day].items.push(item);
    });

    const days = Object.values(buckets).map((bucket) => ({
      ...bucket,
      items: sortCalendarItems(bucket.items),
      todos: sortCalendarItems(bucket.todos),
      pomodoros: sortCalendarItems(bucket.pomodoros),
    }));

    res.json({
      success: true,
      data: {
        month: targetMonth,
        startDate,
        endDate,
        days,
        summary: {
          todoCount: todos.length,
          pomodoroCount: pomodoroResult.count || 0,
          crossDayTodoCount: todos.filter((todo) => toDateOnly(todo.start_at) && toDateOnly(todo.end_at) && toDateOnly(todo.start_at) !== toDateOnly(todo.end_at)).length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/todos', requireAdminPermission('todos.view'), async (req, res) => {
  try {
    const {
      keyword = '',
      status = '',
      sort = 'schedule_asc',
      priority = '',
      startDate = '',
      endDate = '',
    } = req.query || {};
    let todos = await getTodos({
      filter: status === 'completed' ? 'completed' : status === 'pending' ? 'pending' : '',
      sort,
      search: keyword,
      startDate,
      endDate,
    });
    if (priority) {
      todos = todos.filter((todo) => String(todo.priority) === String(priority));
    }
    res.json({ success: true, data: todos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/todos/stats', requireAdminPermission('todos.view'), async (req, res) => {
  try {
    const [stats, todos] = await Promise.all([getTodoStats(), getTodos({ sort: 'schedule_asc' })]);
    res.json({
      success: true,
      data: {
        ...stats,
        crossDay: todos.filter((todo) => toDateOnly(todo.start_at) && toDateOnly(todo.end_at) && toDateOnly(todo.start_at) !== toDateOnly(todo.end_at)).length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/todos', requireAdminPermission('todos.manage'), async (req, res) => {
  try {
    if (!req.body?.content?.trim()) {
      return res.status(400).json({ success: false, error: '任务内容不能为空' });
    }
    const todo = await createTodo(buildTodoPayload(req.body || {}));
    res.status(201).json({ success: true, data: todo });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/todos/:id', requireAdminPermission('todos.manage'), async (req, res) => {
  try {
    const todo = await updateTodo(req.params.id, buildTodoPayload(req.body || {}));
    if (!todo) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    res.json({ success: true, data: todo });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

router.delete('/todos/:id', requireAdminPermission('todos.manage'), async (req, res) => {
  try {
    const result = await deleteTodo(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    res.json({ success: true, data: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/todos/:id', requireAdminPermission('todos.view'), async (req, res) => {
  try {
    const todo = await getTodoById(req.params.id);
    if (!todo) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    res.json({ success: true, data: todo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/pomodoro/sessions', requireAdminPermission('pomodoro.view'), async (req, res) => {
  try {
    res.json({ success: true, data: listPomodoroSessions(req.query || {}) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/pomodoro/statistics', requireAdminPermission('pomodoro.view'), async (req, res) => {
  try {
    res.json({ success: true, data: getPomodoroStatistics(req.query || {}) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/pomodoro/history', requireAdminPermission('pomodoro.view'), async (req, res) => {
  try {
    res.json({ success: true, data: getPomodoroHistory(req.query || {}) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/pomodoro/settings', requireAdminPermission('pomodoro.view'), async (req, res) => {
  try {
    res.json({ success: true, data: loadPomodoroData().settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/pomodoro/settings', requireAdminPermission('pomodoro.manage'), async (req, res) => {
  try {
    res.json({ success: true, data: updatePomodoroSettings(req.body || {}) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/pomodoro/sessions', requireAdminPermission('pomodoro.manage'), async (req, res) => {
  try {
    res.status(201).json({ success: true, data: addPomodoroSession(req.body || {}) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/pomodoro/sessions/:id', requireAdminPermission('pomodoro.manage'), async (req, res) => {
  try {
    const result = deletePomodoroSession(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, error: '记录不存在' });
    }
    res.json({ success: true, data: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
