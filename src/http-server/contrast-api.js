/**
 * 对比学习 API 路由
 */

import express from 'express';
import { 
  contrastTopics,
  getCategories,
  getTopicsByCategory,
  getTopicById,
  searchTopics
} from '../contrast-learning.js';

const router = express.Router();

// 获取所有分类
router.get('/categories', (req, res) => {
  try {
    const categories = getCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取所有主题（可带分类过滤）
router.get('/topics', (req, res) => {
  try {
    const category = req.query.category || 'all';
    const topics = getTopicsByCategory(category);
    res.json({
      success: true,
      data: topics,
      count: topics.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取单个主题详情
router.get('/topics/:id', (req, res) => {
  try {
    const topic = getTopicById(req.params.id);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '主题不存在'
      });
    }
    res.json({
      success: true,
      data: topic
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 搜索主题
router.get('/search', (req, res) => {
  try {
    const query = req.query.q || '';
    const results = searchTopics(query);
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取对比数据（用于代码运行）
router.get('/compare/:id', (req, res) => {
  try {
    const topic = getTopicById(req.params.id);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '主题不存在'
      });
    }
    
    // 提取可运行的代码示例
    const runnable = {
      id: topic.id,
      name: topic.name,
      nodejs: {
        code: topic.nodejs.code,
        explanation: topic.nodejs.explanation
      },
      python: {
        code: topic.python.code,
        explanation: topic.python.explanation
      }
    };
    
    res.json({
      success: true,
      data: runnable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
