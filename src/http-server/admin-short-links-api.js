import express from 'express';
import { shortLinkModel } from '../model/jsondb/index.js';
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
    if (!shortLinkModel.collection) {
      await shortLinkModel.connect();
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: '短链接系统初始化失败：' + error.message });
  }
});

router.get('/', requireAdminPermission('shortlinks.view'), async (req, res) => {
  try {
    const items = await shortLinkModel.list(req.query || {});
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', requireAdminPermission('shortlinks.view'), async (req, res) => {
  try {
    const stats = await shortLinkModel.getStats(req.query || {});
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', requireAdminPermission('shortlinks.manage'), async (req, res) => {
  try {
    const item = await shortLinkModel.create(req.body || {});
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', requireAdminPermission('shortlinks.manage'), async (req, res) => {
  try {
    const item = await shortLinkModel.update(req.params.id, req.body || {});
    res.json({ success: true, data: item });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

router.delete('/:id', requireAdminPermission('shortlinks.manage'), async (req, res) => {
  try {
    await shortLinkModel.delete(req.params.id);
    res.json({ success: true, data: true });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

export default router;
