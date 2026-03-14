import express from 'express';
import { getRequests, clearRequests } from './request-logger.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { method, path, limit } = req.query;
    const requests = getRequests({
      method,
      path,
      limit: limit ? parseInt(limit) : 100
    });
    
    res.json({
      success: true,
      data: requests
    });
  } catch (err) {
    console.error('获取请求历史失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

router.delete('/', async (req, res) => {
  try {
    clearRequests();
    res.json({
      success: true,
      message: '请求历史已清空'
    });
  } catch (err) {
    console.error('清空请求历史失败:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
