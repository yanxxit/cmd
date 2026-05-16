import express from 'express';
import { environmentVariableModel } from '../model/jsondb/index.js';
import {
  ensureAdminSystemConnected,
  requireAdminAuth,
  requireAdminPermission,
} from './admin-auth-helpers.js';

const router = express.Router();

router.use(ensureAdminSystemConnected);
router.use(requireAdminAuth);

router.get('/', requireAdminPermission('envs.view'), async (req, res) => {
  try {
    const items = await environmentVariableModel.list(req.query || {});
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', requireAdminPermission('envs.view'), async (req, res) => {
  try {
    const stats = await environmentVariableModel.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/groups', requireAdminPermission('envs.view'), async (req, res) => {
  try {
    const groups = await environmentVariableModel.listGroups();
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/runtime', requireAdminPermission('envs.view'), async (req, res) => {
  try {
    const keys = String(req.query.keys || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const runtimeConfig = await environmentVariableModel.getRuntimeConfig(keys);
    res.json({ success: true, data: runtimeConfig });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ref-options', requireAdminPermission('envs.view'), async (req, res) => {
  try {
    const data = await environmentVariableModel.listReferenceOptions(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', requireAdminPermission('envs.manage'), async (req, res) => {
  try {
    const item = await environmentVariableModel.create(req.body || {});
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', requireAdminPermission('envs.manage'), async (req, res) => {
  try {
    const item = await environmentVariableModel.update(req.params.id, req.body || {});
    res.json({ success: true, data: item });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

router.delete('/:id', requireAdminPermission('envs.manage'), async (req, res) => {
  try {
    await environmentVariableModel.delete(req.params.id);
    res.json({ success: true, data: true });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

export default router;
