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

router.get('/', requireAdminPermission('roles.view'), async (req, res) => {
  try {
    const roles = await adminSystemModel.listRoles();
    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/permissions', requireAdminPermission('roles.view'), async (req, res) => {
  try {
    const permissionCatalog = await adminSystemModel.getPermissionCatalog();
    res.json({
      success: true,
      data: permissionCatalog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:code', requireAdminPermission('roles.manage'), async (req, res) => {
  try {
    const role = await adminSystemModel.updateRole(req.params.code, req.body || {});
    res.json({
      success: true,
      data: role,
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
