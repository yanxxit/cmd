import express from 'express';
import { memberSystemModel } from '../model/jsondb/index.js';
import {
  ensureAdminSystemConnected,
  requireAdminAuth,
  requireAdminPermission,
} from './admin-auth-helpers.js';

const router = express.Router();

router.use(ensureAdminSystemConnected);
router.use(requireAdminAuth);
router.use(async (req, res, next) => {
  try {
    if (!memberSystemModel.users) {
      await memberSystemModel.connect();
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: '用户系统初始化失败：' + error.message });
  }
});

router.get('/', requireAdminPermission('users.view'), async (req, res) => {
  try {
    const users = await memberSystemModel.listUsers(req.query || {});
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', requireAdminPermission('users.view'), async (req, res) => {
  try {
    const stats = await memberSystemModel.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sign-ins', requireAdminPermission('users.view'), async (req, res) => {
  try {
    const records = await memberSystemModel.listSignIns(req.query || {});
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', requireAdminPermission('users.manage'), async (req, res) => {
  try {
    const user = await memberSystemModel.createUser(req.body || {});
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', requireAdminPermission('users.manage'), async (req, res) => {
  try {
    const user = await memberSystemModel.updateUser(req.params.id, req.body || {});
    res.json({ success: true, data: user });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

router.post('/:id/reset-password', requireAdminPermission('users.manage'), async (req, res) => {
  try {
    await memberSystemModel.resetPassword(req.params.id, req.body?.newPassword || '');
    res.json({ success: true, data: true });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

router.delete('/:id', requireAdminPermission('users.manage'), async (req, res) => {
  try {
    await memberSystemModel.deleteUser(req.params.id);
    res.json({ success: true, data: true });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

export default router;
