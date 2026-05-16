import express from 'express';
import {
  addPomodoroSession,
  deletePomodoroSession,
  getPomodoroHistory,
  getPomodoroStatistics,
  listPomodoroSessions,
  loadPomodoroData,
  resetPomodoroData,
  updatePomodoroSettings,
} from './pomodoro-store.js';

const router = express.Router();

/**
 * GET /api/pomodoro/settings
 * 获取设置
 */
router.get('/settings', (req, res) => {
  try {
    const data = loadPomodoroData();
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
    const settings = updatePomodoroSettings(req.body || {});
    res.json({
      success: true,
      data: settings
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
    const result = listPomodoroSessions(req.query || {});
    res.json({
      success: true,
      data: result
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
    const session = addPomodoroSession(req.body || {});
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
    const session = deletePomodoroSession(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: '记录不存在'
      });
    }
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
    const stats = getPomodoroStatistics(req.query || {});
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
    const history = getPomodoroHistory(req.query || {});
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
    resetPomodoroData(req.body?.type || 'all');
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
