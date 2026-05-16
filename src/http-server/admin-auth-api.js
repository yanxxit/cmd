import express from 'express';
import { adminDefaultPassword, adminSystemModel } from '../model/jsondb/index.js';
import { ensureAdminSystemConnected, requireAdminAuth } from './admin-auth-helpers.js';

const router = express.Router();

router.use(ensureAdminSystemConnected);

router.post('/login', async (req, res) => {
  try {
    const { username, password, remember } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '请输入用户名和密码',
      });
    }

    const result = await adminSystemModel.authenticate(username, password, !!remember);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message,
      hint: `默认管理员：admin / ${adminDefaultPassword}`,
    });
  }
});

router.post('/logout', requireAdminAuth, async (req, res) => {
  try {
    await adminSystemModel.logout(req.adminToken);
    res.json({
      success: true,
      data: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/me', requireAdminAuth, async (req, res) => {
  res.json({
    success: true,
    data: req.currentAdmin,
  });
});

router.get('/stats', requireAdminAuth, async (req, res) => {
  try {
    const stats = await adminSystemModel.getDashboardStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/change-password', requireAdminAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '请输入旧密码和新密码',
      });
    }
    await adminSystemModel.changePassword(req.currentAdmin._id, oldPassword, newPassword);
    res.json({
      success: true,
      data: true,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
