/**
 * Markdown 对比编辑器 API 路由
 */

import express from 'express';
import { 
  loadAllContrasts,
  saveContrast,
  deleteContrast,
  getContrastById,
  renderMarkdown
} from '../markdown-contrast.js';

const router = express.Router();

// 获取所有对比内容
router.get('/list', async (req, res) => {
  try {
    const contrasts = await loadAllContrasts();
    res.json({
      success: true,
      data: contrasts,
      count: contrasts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取单个对比内容
router.get('/:id', async (req, res) => {
  try {
    const contrast = await getContrastById(req.params.id);
    if (!contrast) {
      return res.status(404).json({
        success: false,
        message: '对比内容不存在'
      });
    }
    res.json({
      success: true,
      data: contrast
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 保存对比内容
router.post('/save', async (req, res) => {
  try {
    const { id, name, icon, left, right } = req.body;
    
    if (!left || !right) {
      return res.status(400).json({
        success: false,
        message: '请提供左右两边的内容'
      });
    }
    
    const result = await saveContrast({
      id: id || `contrast-${Date.now()}`,
      name: name || '未命名对比',
      icon: icon || '📝',
      left: {
        title: left.title || '左侧',
        markdown: left.markdown || ''
      },
      right: {
        title: right.title || '右侧',
        markdown: right.markdown || ''
      }
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除对比内容
router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteContrast(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 渲染 Markdown
router.post('/render', async (req, res) => {
  try {
    const { markdown } = req.body;
    if (!markdown) {
      return res.status(400).json({
        success: false,
        message: '请提供 Markdown 内容'
      });
    }
    
    const html = renderMarkdown(markdown);
    res.json({
      success: true,
      html
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 批量渲染（左右两边）
router.post('/render-both', async (req, res) => {
  try {
    const { left, right } = req.body;
    
    const leftHtml = left ? renderMarkdown(left) : '';
    const rightHtml = right ? renderMarkdown(right) : '';
    
    res.json({
      success: true,
      leftHtml,
      rightHtml
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
