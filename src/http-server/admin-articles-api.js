import express from 'express';
import { articleModel } from '../model/jsondb/index.js';
import {
  ensureAdminSystemConnected,
  requireAdminAuth,
  requireAdminPermission,
} from './admin-auth-helpers.js';

const router = express.Router();

router.use(ensureAdminSystemConnected);
router.use(requireAdminAuth);

router.get('/', requireAdminPermission('articles.view'), async (req, res) => {
  try {
    const articles = await articleModel.list(req.query || {});
    res.json({ success: true, data: articles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', requireAdminPermission('articles.view'), async (req, res) => {
  try {
    const stats = await articleModel.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/categories', requireAdminPermission('articles.view'), async (req, res) => {
  try {
    const categories = await articleModel.listCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', requireAdminPermission('articles.view'), async (req, res) => {
  try {
    const article = await articleModel.getById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, error: '文章不存在' });
    }
    res.json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', requireAdminPermission('articles.manage'), async (req, res) => {
  try {
    const article = await articleModel.create(req.body || {});
    res.status(201).json({ success: true, data: article });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', requireAdminPermission('articles.manage'), async (req, res) => {
  try {
    const article = await articleModel.update(req.params.id, req.body || {});
    res.json({ success: true, data: article });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

router.post('/:id/read', requireAdminPermission('articles.view'), async (req, res) => {
  try {
    const article = await articleModel.incrementView(req.params.id);
    res.json({ success: true, data: article });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

router.delete('/:id', requireAdminPermission('articles.manage'), async (req, res) => {
  try {
    await articleModel.delete(req.params.id);
    res.json({ success: true, data: true });
  } catch (error) {
    const statusCode = /不存在/.test(error.message) ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
});

export default router;
