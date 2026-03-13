/**
 * 认证 API Router
 * 提供登录、登出、令牌验证等功能
 */

import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// 模拟用户数据库（实际项目应使用数据库）
const users = new Map([
  ['admin', { 
    id: 1, 
    username: 'admin', 
    password: hashPassword('admin123'), 
    nickname: '管理员',
    avatar: '👨‍💼',
    role: 'admin'
  }],
  ['user', { 
    id: 2, 
    username: 'user', 
    password: hashPassword('user123'), 
    nickname: '普通用户',
    avatar: '👤',
    role: 'user'
  }]
]);

// 令牌存储（实际项目应使用 Redis）
const tokens = new Map();

/**
 * 密码哈希
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * 生成令牌
 */
function generateToken(userId) {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password, remember } = req.body;
    
    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '请输入用户名和密码'
      });
    }
    
    // 查找用户
    const user = users.get(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    // 生成令牌
    const token = generateToken(user.id);
    const expiresAt = remember 
      ? Date.now() + 30 * 24 * 60 * 60 * 1000  // 30 天
      : Date.now() + 24 * 60 * 60 * 1000;       // 1 天
    
    // 存储令牌
    tokens.set(token, {
      userId: user.id,
      expiresAt,
      remember
    });
    
    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;
    
    res.json({
      success: true,
      data: {
        token,
        expiresAt,
        user: userInfo
      }
    });
    
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      tokens.delete(token);
    }
    
    res.json({
      success: true,
      message: '登出成功'
    });
    
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }
    
    const tokenData = tokens.get(token);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      return res.status(401).json({
        success: false,
        error: '令牌已过期'
      });
    }
    
    // 查找用户
    let user = null;
    for (const [_, userData] of users.entries()) {
      if (userData.id === tokenData.userId) {
        const { password: _, ...userInfo } = userData;
        user = userInfo;
        break;
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

/**
 * POST /api/auth/refresh
 * 刷新令牌
 */
router.post('/refresh', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '未授权'
      });
    }
    
    const tokenData = tokens.get(token);
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        error: '令牌无效'
      });
    }
    
    // 生成新令牌
    const newToken = generateToken(tokenData.userId);
    const newExpiresAt = tokenData.remember
      ? Date.now() + 30 * 24 * 60 * 60 * 1000
      : Date.now() + 24 * 60 * 60 * 1000;
    
    // 存储新令牌
    tokens.set(newToken, {
      userId: tokenData.userId,
      expiresAt: newExpiresAt,
      remember: tokenData.remember
    });
    
    // 删除旧令牌
    tokens.delete(token);
    
    res.json({
      success: true,
      data: {
        token: newToken,
        expiresAt: newExpiresAt
      }
    });
    
  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

export default router;
