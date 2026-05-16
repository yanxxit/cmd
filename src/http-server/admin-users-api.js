import express from 'express';
import { adminSystemModel } from '../model/jsondb/index.js';
import {
  ensureAdminSystemConnected,
  requireAdminAuth,
  requireAdminPermission,
} from './admin-auth-helpers.js';

const router = express.Router();

router.use(ensureAdminSystemConnected);
router.use(requireAdminAuth);

router.get('/', requireAdminPermission('admins.view'), async (req, res) => {
  try {
    const { keyword = '', roleCode = '', status = '' } = req.query;
    const admins = await adminSystemModel.listAdmins({ keyword, roleCode, status });
    res.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/', requireAdminPermission('admins.manage'), async (req, res) => {
  try {
    const admin = await adminSystemModel.createAdmin(req.body || {});
    res.status(201).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id', requireAdminPermission('admins.manage'), async (req, res) => {
  try {
    const admin = await adminSystemModel.updateAdmin(
      req.params.id,
      req.body || {},
      req.currentAdmin._id
    );
    res.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/:id', requireAdminPermission('admins.manage'), async (req, res) => {
  try {
    await adminSystemModel.deleteAdmin(req.params.id, req.currentAdmin._id);
    res.json({
      success: true,
      data: true,
    });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/:id/reset-password', requireAdminPermission('admins.manage'), async (req, res) => {
  try {
    const { newPassword } = req.body || {};
    await adminSystemModel.resetPassword(req.params.id, newPassword);
    res.json({
      success: true,
      data: true,
    });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
