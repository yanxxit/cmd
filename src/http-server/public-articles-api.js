import express from 'express';
import { articleModel } from '../model/jsondb/index.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const article = await articleModel.getById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, error: '文章不存在' });
    }
    if (article.status !== 'published') {
      return res.status(403).json({ success: false, error: '当前文章未公开发布' });
    }

    const shouldTrack = req.query.track !== 'false';
    const nextArticle = shouldTrack
      ? await articleModel.incrementView(req.params.id)
      : article;

    res.json({ success: true, data: nextArticle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
